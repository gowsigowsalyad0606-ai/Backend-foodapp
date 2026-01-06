import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant';
import Order from '../models/Order';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/restaurants');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all restaurants (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, cuisine, search } = req.query;

    if (!mongoose.connection.readyState) {
      return res.status(503).json({
        success: false,
        message: 'Database connection required'
      });
    }

    const query: any = { isActive: { $ne: false } };

    if (cuisine) {
      query.cuisines = { $in: [cuisine] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisines: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .select('name description image rating deliveryTime cuisines priceRange discount isOpen')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ rating: -1 });

    const total = await Restaurant.countDocuments(query);

    res.json({
      success: true,
      data: {
        restaurants,
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
      message: error.message || 'Failed to fetch restaurants'
    });
  }
});

// Get restaurant by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurant'
    });
  }
});

// Get menu items for a restaurant (public)
router.get('/:id/menu-items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    if (mongoose.Types.ObjectId.isValid(id)) {
      const restaurant = await Restaurant.findById(id);
      if (!restaurant && process.env.NODE_ENV !== 'development') {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }
    }

    const MenuItem = require('../models/MenuItem').default;

    const query: any = { restaurantId: id, isAvailable: true };
    if (category && category !== 'All') {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      data: menuItems
    });
  } catch (error: any) {
    console.error('❌ Fetch menu items error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch menu items'
    });
  }
});

// Create restaurant (admin only)
router.post('/', authenticate, authorize(['admin']), upload.single('image'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 3, max: 500 }).withMessage('Description must be at least 3 characters'),
  body('deliveryTime').matches(/^\d{2}-\d{2}\s(mins|hours)$/).withMessage('Delivery time format should be "25-30 mins"'),
  body('cuisines').isArray().withMessage('Cuisines must be an array'),
  body('priceRange').isIn(['$', '$$', '$$$', '$$$$']).withMessage('Invalid price range'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('contact.phone').notEmpty().withMessage('Phone number is required'),
  body('contact.email').isEmail().withMessage('Valid email is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Restaurant Creation Validation Failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const restaurantData = {
      ...req.body,
      image: req.file ? `/uploads/restaurants/${req.file.filename}` : req.body.image,
      cuisines: Array.isArray(req.body.cuisines) ? req.body.cuisines : [req.body.cuisines]
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create restaurant'
    });
  }
});

// Update restaurant (admin only)
router.put('/:id', authenticate, authorize(['admin']), upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/restaurants/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    if (req.body.cuisines) {
      updateData.cuisines = Array.isArray(req.body.cuisines) ? req.body.cuisines : [req.body.cuisines];
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updatedRestaurant
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update restaurant'
    });
  }
});

// --- Restaurant Partner Routes ---

/**
 * Register as a restaurant partner
 * This creates a restaurant in 'pending' status and links it to the authenticated user
 */
router.post('/register-partner', authenticate, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Restaurant name is required'),
  body('description').trim().isLength({ min: 3 }).withMessage('Description must be at least 3 characters'),
  body('fssaiNumber').notEmpty().withMessage('FSSAI Number is required'),
  body('gstin').notEmpty().withMessage('GSTIN is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('contact.phone').notEmpty().withMessage('Contact phone is required'),
  body('contact.email').isEmail().withMessage('Valid contact email is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Partner Registration Validation Failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerId: req.user?._id });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'You already have a restaurant registered or pending'
      });
    }

    const restaurant = new Restaurant({
      ...req.body,
      image: req.body.image || 'https://via.placeholder.com/300?text=Restaurant+Image', // Default placeholder
      ownerId: req.user?._id,
      onboardingStatus: 'pending',
      isActive: false // Keep inactive until admin approval
    });

    await restaurant.save();

    // Update user role to 'restaurant' (or we can wait until approval)
    await req.user!.updateOne({ restaurantId: restaurant._id });

    res.status(201).json({
      success: true,
      message: 'Restaurant partner application submitted successfully. Pending admin approval.',
      data: restaurant
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application'
    });
  }
});

/**
 * Get own restaurant details (Restaurant Owner only)
 */
router.get('/my-restaurant/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user?._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant found for this account'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your restaurant'
    });
  }
});

/**
 * Toggle restaurant open/closed status (Restaurant Owner only)
 */
router.patch('/my-restaurant/toggle-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user?._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.onboardingStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your restaurant must be approved by admin before you can toggle status'
      });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    res.json({
      success: true,
      message: `Restaurant is now ${restaurant.isOpen ? 'OPEN' : 'CLOSED'}`,
      isOpen: restaurant.isOpen
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle status'
    });
  }
});

/**
 * Get restaurant stats (Restaurant Owner only)
 */
router.get('/my-restaurant/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user?._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Today's stats
    const todayOrders = await Order.find({
      restaurantId: restaurant._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const todayEarnings = todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Lifetime stats
    const allCompletedOrders = await Order.find({
      restaurantId: restaurant._id,
      status: 'delivered'
    });
    const totalEarnings = allCompletedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = await Order.countDocuments({ restaurantId: restaurant._id });
    const avgOrderValue = allCompletedOrders.length > 0 ? totalEarnings / allCompletedOrders.length : 0;

    // Count pending orders (not delivered or cancelled)
    const pendingOrders = await Order.countDocuments({
      restaurantId: restaurant._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] }
    });

    // Get recent orders for history display
    const recentOrders = await Order.find({
      restaurantId: restaurant._id
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id total status createdAt');

    res.json({
      success: true,
      data: {
        todayOrders: todayOrders.length,
        todayEarnings: Math.round(todayEarnings),
        totalOrders,
        totalEarnings: Math.round(totalEarnings),
        avgOrderValue,
        pendingOrders,
        recentOrders
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurant stats'
    });
  }
});

/**
 * Get orders for own restaurant
 */
router.get('/my-restaurant/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user?._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const { status } = req.query;
    const query: any = { restaurantId: restaurant._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurant orders'
    });
  }
});

/**
 * Update order status for own restaurant
 */
router.patch('/my-restaurant/orders/:orderId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user?._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: restaurant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this restaurant'
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

// Delete restaurant (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete restaurant'
    });
  }
});

export default router;
