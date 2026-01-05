import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/menu-items');
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

// Get menu items by restaurant (public)
router.get('/restaurant/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { category, page = 1, limit = 20 } = req.query;

    // Mock mode for testing without MongoDB
    if (process.env.NODE_ENV === 'development' && !mongoose.connection.readyState) {
      console.log('🔧 Using mock menu items mode (MongoDB not connected)');

      const mockMenuItems = [
        {
          _id: '1',
          restaurantId: '1',
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, tomato sauce, basil leaves on thin crust',
          price: 12.99,
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=400&fit=crop&crop=center',
          category: 'Pizza',
          isVeg: true,
          isBestseller: true,
          preparationTime: '15 mins',
          isAvailable: true
        },
        {
          _id: '2',
          restaurantId: '1',
          name: 'Pepperoni Pizza',
          description: 'Spicy pepperoni, mozzarella, tomato sauce',
          price: 14.99,
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop&crop=center',
          category: 'Pizza',
          isVeg: false,
          preparationTime: '15 mins',
          isAvailable: true
        },
        {
          _id: '3',
          restaurantId: '1',
          name: 'Caesar Salad',
          description: 'Romaine lettuce, parmesan, croutons, caesar dressing',
          price: 8.99,
          image: 'https://images.unsplash.com/photo-1550309784-5a3356d84a4c?w=600&h=400&fit=crop&crop=center',
          category: 'Salads',
          isVeg: true,
          preparationTime: '10 mins',
          isAvailable: true
        },
        {
          _id: '4',
          restaurantId: '2',
          name: 'Classic Burger',
          description: 'Beef patty, lettuce, tomato, onion, pickles, special sauce',
          price: 10.99,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop&crop=center',
          category: 'Burgers',
          isVeg: false,
          isBestseller: true,
          preparationTime: '12 mins',
          isAvailable: true
        },
        {
          _id: '5',
          restaurantId: '2',
          name: 'Cheeseburger',
          description: 'Beef patty, cheese, lettuce, tomato, onion',
          price: 9.99,
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=400&fit=crop&crop=center',
          category: 'Burgers',
          isVeg: false,
          preparationTime: '12 mins',
          isAvailable: true
        }
      ];

      let filteredItems = mockMenuItems.filter(item => item.restaurantId === restaurantId);

      if (category && category !== 'All') {
        filteredItems = filteredItems.filter(item => item.category === category);
      }

      return res.json({
        success: true,
        data: filteredItems,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: filteredItems.length
        }
      });
    }

    const query: any = {
      restaurantId,
      isAvailable: true
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query)
      .select('name description price image category isVeg isBestseller preparationTime')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ category: 1, name: 1 });

    const categories = await MenuItem.distinct('category', { restaurantId, isAvailable: true });

    res.json({
      success: true,
      data: {
        menuItems,
        categories,
        pagination: {
          current: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch menu items'
    });
  }
});

// Get single menu item (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurantId', 'name');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch menu item'
    });
  }
});

// Create menu item (admin or restaurant partner)
router.post('/', authenticate, authorize(['admin', 'restaurant']), upload.single('image'), [
  body('restaurantId').isMongoId().withMessage('Valid restaurant ID is required'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 3, max: 500 }).withMessage('Description must be at least 3 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('isVeg').optional().isBoolean().withMessage('Vegetarian status must be boolean'),
  body('preparationTime').optional().matches(/^\d+\s*(mins|hours)$/).withMessage('Preparation time format should be "15 mins"')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Menu Item Validation Failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const menuItemData = {
      ...req.body,
      image: req.file ? `/uploads/menu-items/${req.file.filename}` : req.body.image
    };

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create menu item'
    });
  }
});

// Update menu item (admin or restaurant partner)
router.put('/:id', authenticate, authorize(['admin', 'restaurant']), upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/menu-items/${req.file.filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update menu item'
    });
  }
});

// Delete menu item (admin or restaurant partner)
router.delete('/:id', authenticate, authorize(['admin', 'restaurant']), async (req: AuthRequest, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete menu item'
    });
  }
});

// Toggle menu item availability (admin or restaurant partner)
router.patch('/:id/toggle-availability', authenticate, authorize(['admin', 'restaurant']), async (req: AuthRequest, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: menuItem
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle menu item availability'
    });
  }
});

export default router;
