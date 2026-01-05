"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
// Load environment variables immediately after imports
dotenv_1.default.config();
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const menuItems_1 = __importDefault(require("./routes/menuItems"));
const orders_1 = __importDefault(require("./routes/orders"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Middleware
// Relax security headers in development to debug connectivity
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? undefined : { policy: "cross-origin" }
}));
// Add a simple request logger to verify if traffic is reaching the server
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
});
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Database connection (skip for development without MongoDB)
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('YOUR_PASSWORD')) {
    mongoose_1.default.connect(process.env.MONGODB_URI)
        .then(() => {
        console.log('✅ Connected to MongoDB');
    })
        .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        console.log('⚠️  Running without database - some features may not work');
    });
}
else {
    console.log('⚠️  Running without database - configure MONGODB_URI in .env for full functionality');
}
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/restaurants', restaurants_1.default);
app.use('/api/menu-items', menuItems_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/users', users_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});
// Start server
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📱 For Emulator, use: http://10.0.2.2:${PORT}/api`);
});
//# sourceMappingURL=index.js.map