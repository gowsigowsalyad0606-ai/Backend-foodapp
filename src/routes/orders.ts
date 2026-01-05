import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Order from '../models/Order';
import MenuItem from '../models/MenuItem';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Cart storage (in production, use Redis or database)
const cartStorage = new Map<string, any>();

// Get user's orders
router.get('/my-orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { userId: req.user!._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'name image')
      .populate('items.menuItemId', 'name image')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
});

// --- MOVING STATIC ROUTES ABOVE DYNAMIC PARAM ROUTES ---

// Get cart
router.get('/cart', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const cart = cartStorage.get(userId) || { items: [], total: 0 };

    // Enrich cart items safely
    const enrichedItems = [];
    for (const item of (cart.items || [])) {
      try {
        if (mongoose.Types.ObjectId.isValid(item.menuItemId)) {
          const menuItem = await MenuItem.findById(item.menuItemId).select('name image price');
          if (menuItem) {
            enrichedItems.push({
              ...item,
              menuItem
            });
          } else {
            enrichedItems.push(item);
          }
        } else {
          enrichedItems.push(item);
        }
      } catch (e) {
        enrichedItems.push(item);
      }
    }

    res.json({
      success: true,
      data: {
        items: enrichedItems,
        total: cart.total || 0,
        subtotal: cart.subtotal || 0,
        deliveryFee: cart.deliveryFee || 2.99,
        tax: cart.tax || 0
      }
    });
  } catch (error: any) {
    console.error('❌ Get cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cart'
    });
  }
});

// Update cart item quantity (PUT /cart)
router.put('/cart', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const { menuItemId, quantity } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ success: false, message: 'Menu item ID is required' });
    }

    let cart = cartStorage.get(userId) || { items: [], total: 0 };

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter((item: any) => item.menuItemId !== menuItemId);
    } else {
      // Update quantity
      const itemIndex = cart.items.findIndex((item: any) => item.menuItemId === menuItemId);
      if (itemIndex !== -1) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Add new item
        cart.items.push({ menuItemId, quantity });
      }
    }

    // Recalculate total
    let total = 0;
    for (const item of cart.items) {
      if (mongoose.Types.ObjectId.isValid(item.menuItemId)) {
        const menuItem = await MenuItem.findById(item.menuItemId).select('price');
        if (menuItem) {
          total += menuItem.price * item.quantity;
        }
      }
    }
    cart.total = total;
    cartStorage.set(userId, cart);

    res.json({ success: true, message: 'Cart updated', data: cart });
  } catch (error: any) {
    console.error('❌ Update cart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update cart' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Safety check: if id is 'cart', this is a routing error that should have been caught above
    if (id === 'cart') {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(id)
      .populate('restaurantId', 'name image address contact')
      .populate('items.menuItemId', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('❌ Fetch order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order'
    });
  }
});

// Create new order
router.post('/', authenticate, [
  body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('paymentMethod.type').optional().isIn(['card', 'cash', 'wallet', 'upi']).withMessage('Invalid payment method')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let { restaurantId, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    // Structure deliveryAddress if it's a string
    if (typeof deliveryAddress === 'string') {
      deliveryAddress = {
        street: deliveryAddress,
        city: 'Unknown',
        state: 'Unknown',
        zipCode: '00000'
      };
    } else if (!deliveryAddress) {
      deliveryAddress = {
        street: 'No address provided',
        city: 'Unknown',
        state: 'Unknown',
        zipCode: '00000'
      };
    }

    // Default payment method
    if (!paymentMethod) {
      paymentMethod = { type: 'cash', status: 'pending' };
    }

    // Strictly enforce database connection
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ success: false, message: 'Database disconnected' });
    }

    // Fetch menu items to get current prices
    const menuItemIds = items.map((item: any) => item.menuItemId).filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    // Calculate totals with actual menu item prices
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      const price = menuItem ? menuItem.price : (item.price || item.menuItem?.price || 0);
      const name = menuItem ? menuItem.name : (item.name || item.menuItem?.name || 'Unknown');
      const image = menuItem ? menuItem.image : (item.image || item.menuItem?.image || '');

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      return {
        menuItemId: item.menuItemId,
        name,
        price,
        quantity: item.quantity,
        image,
        customizations: item.customizations || []
      };
    });

    const deliveryFee = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + deliveryFee + tax;

    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);

    const order = new Order({
      userId: req.user!._id,
      restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      estimatedDeliveryTime,
      paymentStatus: paymentMethod.type === 'cash' ? 'pending' : 'paid'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error: any) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order'
    });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled (only if it's pending or confirmed)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
});

// Add review to completed order
router.patch('/:id/review', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 1000 }).withMessage('Review cannot exceed 1000 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Review can only be added to delivered orders'
      });
    }

    const { rating, review } = req.body;

    order.rating = rating;
    order.review = review;
    await order.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      data: order
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add review'
    });
  }
});

// DELETED REDUNDANT CART GETTER AS IT WAS MOVED UP

// Add to cart
router.post('/cart/add', authenticate, [
  body('menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  body('specialInstructions').optional().isLength({ max: 200 }).withMessage('Special instructions cannot exceed 200 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { menuItemId, quantity, specialInstructions } = req.body;
    const userId = req.user!._id.toString();

    // Strictly enforce database connection
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ success: false, message: 'Database disconnected' });
    }

    // Get menu item details
    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem || !menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Menu item not available'
      });
    }

    const cart = cartStorage.get(userId) || { items: [], total: 0 };

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item: any) => item.menuItemId.toString() === menuItemId);

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        menuItemId,
        quantity,
        specialInstructions,
        menuItem: {
          _id: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image
        }
      });
    }

    // Recalculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.menuItem.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + deliveryFee + tax;

    cart.subtotal = subtotal;
    cart.deliveryFee = deliveryFee;
    cart.tax = tax;
    cart.total = total;

    cartStorage.set(userId, cart);

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add item to cart'
    });
  }
});

// Update cart item
router.put('/cart/:itemId', authenticate, [
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user!._id.toString();

    const cart = cartStorage.get(userId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex((item: any) => item.menuItemId === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;

    // Recalculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.menuItem.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + deliveryFee + tax;

    cart.subtotal = subtotal;
    cart.deliveryFee = deliveryFee;
    cart.tax = tax;
    cart.total = total;

    cartStorage.set(userId, cart);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart item'
    });
  }
});

// Remove from cart
router.delete('/cart/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!._id.toString();

    const cart = cartStorage.get(userId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter((item: any) => item.menuItemId !== itemId);

    // Recalculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.menuItem.price * item.quantity), 0);
    const deliveryFee = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + deliveryFee + tax;

    cart.subtotal = subtotal;
    cart.deliveryFee = deliveryFee;
    cart.tax = tax;
    cart.total = total;

    cartStorage.set(userId, cart);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove item from cart'
    });
  }
});

// Clear cart
router.delete('/cart', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();

    cartStorage.delete(userId);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: { items: [], total: 0 }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear cart'
    });
  }
});

export default router;
