"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const MenuItem_1 = __importDefault(require("../models/MenuItem"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/menu-items');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Get menu items by restaurant (public)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { category, page = 1, limit = 20 } = req.query;
        // Mock mode for testing without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
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
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredItems.length
                }
            });
        }
        const query = {
            restaurantId,
            isAvailable: true
        };
        if (category && category !== 'All') {
            query.category = category;
        }
        const menuItems = await MenuItem_1.default.find(query)
            .select('name description price image category isVeg isBestseller preparationTime')
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .sort({ category: 1, name: 1 });
        const categories = await MenuItem_1.default.distinct('category', { restaurantId, isAvailable: true });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch menu items'
        });
    }
});
// Get single menu item (public)
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem_1.default.findById(req.params.id).populate('restaurantId', 'name');
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch menu item'
        });
    }
});
// Create menu item (admin only)
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), upload.single('image'), [
    (0, express_validator_1.body)('restaurantId').isMongoId().withMessage('Valid restaurant ID is required'),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10, max: 300 }).withMessage('Description must be between 10 and 300 characters'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('category').isIn(['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Pizza', 'Burgers', 'Salads', 'Sides', 'Soups', 'Pasta', 'Seafood', 'Vegetarian', 'Non-Vegetarian']).withMessage('Invalid category'),
    (0, express_validator_1.body)('isVeg').isBoolean().withMessage('Vegetarian status must be boolean'),
    (0, express_validator_1.body)('preparationTime').matches(/^\d+\s(mins|hours)$/).withMessage('Preparation time format should be "15 mins"')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const menuItemData = {
            ...req.body,
            image: req.file ? `/uploads/menu-items/${req.file.filename}` : null
        };
        const menuItem = new MenuItem_1.default(menuItemData);
        await menuItem.save();
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: menuItem
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create menu item'
        });
    }
});
// Update menu item (admin only)
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), upload.single('image'), async (req, res) => {
    try {
        const menuItem = await MenuItem_1.default.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `/uploads/menu-items/${req.file.filename}`;
        }
        const updatedMenuItem = await MenuItem_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: updatedMenuItem
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update menu item'
        });
    }
});
// Delete menu item (admin only)
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), async (req, res) => {
    try {
        const menuItem = await MenuItem_1.default.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        await MenuItem_1.default.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete menu item'
        });
    }
});
// Toggle menu item availability (admin only)
router.patch('/:id/toggle-availability', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), async (req, res) => {
    try {
        const menuItem = await MenuItem_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle menu item availability'
        });
    }
});
exports.default = router;
//# sourceMappingURL=menuItems.js.map