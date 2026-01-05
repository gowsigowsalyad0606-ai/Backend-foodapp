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
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads/restaurants');
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
// Get all restaurants (public)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, cuisine, search } = req.query;
        // Require database connection - no more mock data
        if (!mongoose_1.default.connection.readyState) {
            return res.status(503).json({
                success: false,
                message: 'Database connection required'
            });
        }
        // Show restaurants that are active OR where isActive is not explicitly false
        const query = { isActive: { $ne: false } };
        if (cuisine) {
            query.cuisines = { $in: [cuisine] };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { cuisines: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        const restaurants = await Restaurant_1.default.find(query)
            .select('name description image rating deliveryTime cuisines priceRange discount isOpen')
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .sort({ rating: -1 });
        const total = await Restaurant_1.default.countDocuments(query);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch restaurants'
        });
    }
});
// Get restaurant by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch restaurant'
        });
    }
});
// Get menu items for a restaurant (public)
router.get('/:id/menu-items', async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;
        // Check if restaurant exists (or is mock)
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            const restaurant = await Restaurant_1.default.findById(id);
            if (!restaurant && process.env.NODE_ENV !== 'development') {
                return res.status(404).json({
                    success: false,
                    message: 'Restaurant not found'
                });
            }
        }
        // Import MenuItem model dynamically to avoid circular dependencies if any
        const MenuItem = require('../models/MenuItem').default;
        const query = { restaurantId: id, isAvailable: true };
        if (category && category !== 'All') {
            query.category = category;
        }
        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
        res.json({
            success: true,
            data: menuItems
        });
    }
    catch (error) {
        console.error('❌ Fetch menu items error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch menu items'
        });
    }
});
// Create restaurant (admin only)
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), upload.single('image'), [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
    (0, express_validator_1.body)('deliveryTime').matches(/^\d{2}-\d{2}\s(mins|hours)$/).withMessage('Delivery time format should be "25-30 mins"'),
    (0, express_validator_1.body)('cuisines').isArray().withMessage('Cuisines must be an array'),
    (0, express_validator_1.body)('priceRange').isIn(['$', '$$', '$$$', '$$$$']).withMessage('Invalid price range'),
    (0, express_validator_1.body)('address.street').notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('address.city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('address.state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('address.zipCode').notEmpty().withMessage('Zip code is required'),
    (0, express_validator_1.body)('contact.phone').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('contact.email').isEmail().withMessage('Valid email is required')
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
        const restaurantData = {
            ...req.body,
            image: req.file ? `/uploads/restaurants/${req.file.filename}` : null,
            cuisines: Array.isArray(req.body.cuisines) ? req.body.cuisines : [req.body.cuisines]
        };
        const restaurant = new Restaurant_1.default(restaurantData);
        await restaurant.save();
        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: restaurant
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create restaurant'
        });
    }
});
// Update restaurant (admin only)
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), upload.single('image'), async (req, res) => {
    try {
        const restaurant = await Restaurant_1.default.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `/uploads/restaurants/${req.file.filename}`;
        }
        if (req.body.cuisines) {
            updateData.cuisines = Array.isArray(req.body.cuisines) ? req.body.cuisines : [req.body.cuisines];
        }
        const updatedRestaurant = await Restaurant_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({
            success: true,
            message: 'Restaurant updated successfully',
            data: updatedRestaurant
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update restaurant'
        });
    }
});
// Delete restaurant (admin only)
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['admin']), async (req, res) => {
    try {
        const restaurant = await Restaurant_1.default.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        await Restaurant_1.default.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'Restaurant deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete restaurant'
        });
    }
});
exports.default = router;
//# sourceMappingURL=restaurants.js.map