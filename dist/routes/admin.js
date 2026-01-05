"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const MenuItem_1 = __importDefault(require("../models/MenuItem"));
const Order_1 = __importDefault(require("../models/Order"));
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
// ===================== RESTAURANT MANAGEMENT =====================
// Get all restaurants (Admin)
router.get('/restaurants', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        // Mock mode for development without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                data: [
                    { _id: '1', name: 'Burger Palace', description: 'Best burgers in town', cuisine: 'American', address: '123 Main St', phone: '555-0101', email: 'info@burgerpalace.com', image: '', rating: 4.5, isActive: true },
                    { _id: '2', name: 'Pizza Paradise', description: 'Authentic Italian pizzas', cuisine: 'Italian', address: '456 Oak Ave', phone: '555-0102', email: 'info@pizzaparadise.com', image: '', rating: 4.8, isActive: true },
                    { _id: '3', name: 'Sushi Master', description: 'Fresh Japanese cuisine', cuisine: 'Japanese', address: '789 Elm St', phone: '555-0103', email: 'info@sushimaster.com', image: '', rating: 4.7, isActive: true },
                ]
            });
        }
        const restaurants = await Restaurant_1.default.find().sort({ createdAt: -1 });
        res.json({ success: true, data: restaurants });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch restaurants' });
    }
});
// Create restaurant (Admin)
router.post('/restaurants', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { name, description, cuisine, address, phone, email, image, isActive, deliveryTime, priceRange, cuisines } = req.body;
        // Structure data for Mongoose schema
        const structuredAddress = typeof address === 'string' ? {
            street: address,
            city: 'Unknown',
            state: 'Unknown',
            zipCode: '00000'
        } : address;
        const structuredContact = {
            phone: phone || '000-000-0000',
            email: email || 'restaurant@example.com'
        };
        const restaurantData = {
            name: name || 'Unnamed Restaurant',
            description: description || 'No description provided.',
            image: image || 'https://via.placeholder.com/400x300/FF7A00/FFFFFF?text=Restaurant',
            cuisine: cuisine || 'General', // Still keep for compatibility
            cuisines: cuisines || (cuisine ? [cuisine] : ['General']),
            address: structuredAddress,
            contact: structuredContact,
            deliveryTime: deliveryTime || '25-30 mins',
            priceRange: priceRange || '$$',
            isActive: isActive ?? true
        };
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.status(201).json({
                success: true,
                message: 'Restaurant created successfully (mock mode)',
                data: { _id: Date.now().toString(), ...restaurantData, createdAt: new Date() }
            });
        }
        const restaurant = new Restaurant_1.default(restaurantData);
        await restaurant.save();
        res.status(201).json({ success: true, message: 'Restaurant created successfully', data: restaurant });
    }
    catch (error) {
        console.error('❌ Create restaurant error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create restaurant' });
    }
});
// Update restaurant (Admin)
router.put('/restaurants/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, cuisine, address, phone, email, image, isActive, deliveryTime, priceRange, cuisines } = req.body;
        // Structure data for Mongoose schema (same as POST)
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        if (image)
            updateData.image = image;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (deliveryTime)
            updateData.deliveryTime = deliveryTime;
        if (priceRange)
            updateData.priceRange = priceRange;
        // Handle cuisines - can be array or single cuisine string
        if (cuisines && Array.isArray(cuisines)) {
            updateData.cuisines = cuisines;
        }
        else if (cuisine) {
            updateData.cuisines = [cuisine];
        }
        // Handle address - can be string or object
        if (address) {
            if (typeof address === 'string') {
                updateData.address = {
                    street: address,
                    city: 'Unknown',
                    state: 'Unknown',
                    zipCode: '00000'
                };
            }
            else {
                updateData.address = address;
            }
        }
        // Handle contact
        if (phone || email) {
            updateData.contact = {
                phone: phone || '',
                email: email || ''
            };
        }
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                message: 'Restaurant updated successfully (mock mode)',
                data: { _id: id, ...updateData, updatedAt: new Date() }
            });
        }
        const restaurant = await Restaurant_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: false });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        res.json({ success: true, message: 'Restaurant updated successfully', data: restaurant });
    }
    catch (error) {
        console.error('❌ Update restaurant error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update restaurant' });
    }
});
// Delete restaurant (Admin)
router.delete('/restaurants/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({ success: true, message: 'Restaurant deleted successfully (mock mode)' });
        }
        const restaurant = await Restaurant_1.default.findByIdAndDelete(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        res.json({ success: true, message: 'Restaurant deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete restaurant' });
    }
});
// Toggle restaurant status
router.patch('/restaurants/:id/toggle-status', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({ success: true, message: 'Restaurant status toggled (mock mode)' });
        }
        const restaurant = await Restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        restaurant.isActive = !restaurant.isActive;
        await restaurant.save();
        res.json({ success: true, message: 'Restaurant status toggled', data: restaurant });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to toggle restaurant status' });
    }
});
// ===================== FOOD ITEMS MANAGEMENT =====================
// Get all food items (Admin)
router.get('/food-items', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                data: [
                    { _id: '1', name: 'Classic Burger', description: 'Juicy beef patty with vegetables', price: 12.99, category: 'Burgers', image: '', available: true, restaurantId: '1', restaurantName: 'Burger Palace', isVeg: false, isBestseller: true },
                    { _id: '2', name: 'Margherita Pizza', description: 'Fresh mozzarella and basil', price: 14.99, category: 'Pizza', image: '', available: true, restaurantId: '2', restaurantName: 'Pizza Paradise', isVeg: true, isBestseller: true },
                    { _id: '3', name: 'Caesar Salad', description: 'Romaine lettuce with parmesan', price: 9.99, category: 'Salads', image: '', available: true, restaurantId: '3', restaurantName: 'Green Garden', isVeg: true, isBestseller: false },
                ]
            });
        }
        const items = await MenuItem_1.default.find().populate('restaurantId', 'name').sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch food items' });
    }
});
// Create food item (Admin)
router.post('/food-items', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { name, description, price, discountPrice, category, available, restaurantId, isVeg, preparationTime, image } = req.body;
        const itemData = {
            name,
            description: description || 'No description provided.',
            price: parseFloat(price) || 0,
            discountPrice: discountPrice ? parseFloat(discountPrice) : null,
            category: category || 'General',
            image: image || 'https://via.placeholder.com/400x300/2ECC71/FFFFFF?text=Food',
            isAvailable: available ?? true,
            restaurantId: restaurantId || null,
            restaurant: restaurantId || null, // For population compatibility
            isVeg: isVeg === 'true' || isVeg === true,
            preparationTime: preparationTime || '15 mins'
        };
        // Ensure preparationTime matches regex in model
        if (!/^\d+\s(mins|hours)$/.test(itemData.preparationTime)) {
            itemData.preparationTime = '15 mins';
        }
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.status(201).json({
                success: true,
                message: 'Food item created successfully (mock mode)',
                data: { _id: Date.now().toString(), ...itemData }
            });
        }
        const item = new MenuItem_1.default(itemData);
        await item.save();
        res.status(201).json({ success: true, message: 'Food item created successfully', data: item });
    }
    catch (error) {
        console.error('❌ Create food item error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create food item' });
    }
});
// Update food item (Admin)
router.put('/food-items/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        // Map 'available' from frontend to 'isAvailable' in model
        if (updateData.available !== undefined) {
            updateData.isAvailable = updateData.available;
            delete updateData.available;
        }
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                message: 'Food item updated successfully (mock mode)',
                data: { _id: id, ...updateData }
            });
        }
        const item = await MenuItem_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Food item not found' });
        }
        res.json({ success: true, message: 'Food item updated successfully', data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update food item' });
    }
});
// Delete food item (Admin)
router.delete('/food-items/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({ success: true, message: 'Food item deleted successfully (mock mode)' });
        }
        const item = await MenuItem_1.default.findByIdAndDelete(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Food item not found' });
        }
        res.json({ success: true, message: 'Food item deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete food item' });
    }
});
// Toggle food item availability
router.patch('/food-items/:id/toggle-availability', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({ success: true, message: 'Food item availability toggled (mock mode)' });
        }
        const item = await MenuItem_1.default.findById(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Food item not found' });
        }
        item.isAvailable = !item.isAvailable;
        await item.save();
        res.json({ success: true, message: 'Food item availability toggled', data: item });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to toggle food item availability' });
    }
});
// ===================== OFFERS MANAGEMENT =====================
// Get all offers (Admin)
router.get('/offers', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                data: [
                    { _id: '1', name: 'Weekend Special', description: '20% off on all orders', type: 'PERCENTAGE', discountValue: 20, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true },
                    { _id: '2', name: 'Flat ₹50 Off', description: 'Flat ₹50 off on orders above ₹300', type: 'FLAT', discountValue: 50, startDate: '2026-01-01', endDate: '2026-06-30', isActive: true },
                ]
            });
        }
        // Add actual database query when model is available
        res.json({ success: true, data: [] });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch offers' });
    }
});
// Create offer (Admin)
router.post('/offers', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const offerData = req.body;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.status(201).json({
                success: true,
                message: 'Offer created successfully (mock mode)',
                data: { _id: Date.now().toString(), ...offerData, createdAt: new Date() }
            });
        }
        // Add actual database logic when model is available
        res.status(201).json({ success: true, message: 'Offer created successfully', data: { _id: Date.now().toString(), ...offerData } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to create offer' });
    }
});
// Update offer (Admin)
router.put('/offers/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                message: 'Offer updated successfully (mock mode)',
                data: { _id: id, ...updateData }
            });
        }
        res.json({ success: true, message: 'Offer updated successfully', data: { _id: id, ...updateData } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update offer' });
    }
});
// Delete offer (Admin)
router.delete('/offers/:id', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock mode - just return success
        return res.json({ success: true, message: 'Offer deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete offer' });
    }
});
// Toggle offer status
router.patch('/offers/:id/toggle-status', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        return res.json({ success: true, message: 'Offer status toggled' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to toggle offer status' });
    }
});
// ===================== ORDERS MANAGEMENT =====================
// Get all orders (Admin)
router.get('/orders', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                data: [
                    { _id: '1', orderNumber: 'ORD-001', customer: { name: 'John Doe', email: 'john@example.com' }, items: [], totalAmount: 45.99, status: 'pending', createdAt: new Date() },
                    { _id: '2', orderNumber: 'ORD-002', customer: { name: 'Jane Smith', email: 'jane@example.com' }, items: [], totalAmount: 32.50, status: 'preparing', createdAt: new Date() },
                    { _id: '3', orderNumber: 'ORD-003', customer: { name: 'Bob Wilson', email: 'bob@example.com' }, items: [], totalAmount: 28.99, status: 'delivered', createdAt: new Date() },
                ]
            });
        }
        const query = {};
        if (status)
            query.status = status;
        const orders = await Order_1.default.find(query)
            .populate('userId', 'name email phone')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Order_1.default.countDocuments(query);
        res.json({
            success: true,
            data: orders,
            pagination: { page: Number(page), limit: Number(limit), total }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch orders' });
    }
});
// Update order status (Admin)
router.patch('/orders/:id/status', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                message: 'Order status updated successfully (mock mode)',
                data: { _id: id, status }
            });
        }
        const order = await Order_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Notify User about status update
        await Notification_1.default.create({
            recipient: order.userId,
            recipientRole: 'user',
            type: 'order_update',
            title: 'Order Updated',
            message: `Your order #${order._id.toString().slice(-6)} status has been updated to: ${status}.`,
            relatedOrderId: order._id
        });
        res.json({ success: true, message: 'Order status updated successfully', data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update order status' });
    }
});
// ===================== DASHBOARD STATS =====================
// Get dashboard statistics
router.get('/stats', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        // Mock mode
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            return res.json({
                success: true,
                data: {
                    totalRestaurants: 6,
                    totalMenuItems: 45,
                    totalOrders: 128,
                    activeOrders: 12,
                    totalRevenue: 5420.50,
                    todayOrders: 8,
                    todayRevenue: 345.99
                }
            });
        }
        const [restaurantCount, menuItemCount, orderStats] = await Promise.all([
            Restaurant_1.default.countDocuments(),
            MenuItem_1.default.countDocuments(),
            Order_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$totalAmount' },
                        activeOrders: {
                            $sum: { $cond: [{ $in: ['$status', ['pending', 'preparing', 'ready']] }, 1, 0] }
                        }
                    }
                }
            ])
        ]);
        res.json({
            success: true,
            data: {
                totalRestaurants: restaurantCount,
                totalMenuItems: menuItemCount,
                totalOrders: orderStats[0]?.totalOrders || 0,
                activeOrders: orderStats[0]?.activeOrders || 0,
                totalRevenue: orderStats[0]?.totalRevenue || 0
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch stats' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map