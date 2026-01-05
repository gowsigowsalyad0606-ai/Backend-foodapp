"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register user
router.post('/register', [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('Registration validation errors:', errors.array()); // Debug log
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { name, email, password, phone } = req.body;
        console.log('Registration attempt:', { name, email, phone, password: '***' }); // Debug log
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Create new user
        const user = new User_1.default({
            name,
            email,
            password,
            phone
        });
        await user.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});
// Login user
router.post('/login', [
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        console.log('Request body received:', req.body); // Debug log
        // TEMPORARY: Bypass validation for testing
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Bypassing validation in development mode');
        }
        else {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', errors.array()); // Debug log
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
        }
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password: '***' }); // Debug log
        // Mock mode for testing without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            console.log('🔧 Using mock login mode (MongoDB not connected)');
            // Mock user validation
            const mockUsers = [
                { email: 'admin@foodbuddy.com', password: 'admin123', name: 'Admin User', role: 'admin' },
                { email: 'john@example.com', password: 'user123', name: 'John Doe', role: 'user' }
            ];
            const mockUser = mockUsers.find(u => u.email === email && u.password === password);
            if (!mockUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            // Generate mock JWT token
            const token = jsonwebtoken_1.default.sign({ userId: mockUser.email, role: mockUser.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
            return res.json({
                success: true,
                message: 'Login successful (mock mode)',
                data: {
                    token,
                    user: {
                        id: mockUser.email,
                        name: mockUser.name,
                        email: mockUser.email,
                        role: mockUser.role
                    }
                }
            });
        }
        // Original MongoDB logic (when connected)
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
});
// Get current user
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone,
                    role: req.user.role,
                    addresses: req.user.addresses
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get user data'
        });
    }
});
// Forgot password
router.post('/forgot-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
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
        const { email } = req.body;
        // Mock mode for testing without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            console.log('🔧 Using mock forgot password mode (MongoDB not connected)');
            // Generate mock reset token
            const resetToken = 'mock-reset-token-' + Date.now();
            return res.json({
                success: true,
                message: 'Password reset instructions sent to your email (mock mode)',
                data: { resetToken }
            });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'Password reset instructions sent to your email'
            });
        }
        // Generate reset token (in production, you'd send this via email)
        const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            message: 'Password reset instructions sent to your email',
            data: { resetToken }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process forgot password request'
        });
    }
});
// Reset password
router.post('/reset-password', [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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
        const { token, newPassword } = req.body;
        // Mock mode for testing without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            console.log('🔧 Using mock reset password mode (MongoDB not connected)');
            if (token.startsWith('mock-reset-token')) {
                return res.json({
                    success: true,
                    message: 'Password reset successful (mock mode)'
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }
        }
        // Verify reset token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
        user.password = newPassword;
        await user.save();
        res.json({
            success: true,
            message: 'Password reset successful'
        });
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reset password'
        });
    }
});
// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        // Mock mode for testing without MongoDB
        if (process.env.NODE_ENV === 'development' && !mongoose_1.default.connection.readyState) {
            console.log('🔧 Using mock verify token mode (MongoDB not connected)');
            if (token.startsWith('mock-reset-token')) {
                return res.json({
                    success: true,
                    message: 'Token is valid'
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }
        }
        try {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            res.json({
                success: true,
                message: 'Token is valid'
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify token'
        });
    }
});
// Create admin account (admin only)
router.post('/create-admin', auth_1.authenticate, (0, auth_1.authorize)(['admin']), [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number')
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
        const { name, email, password, phone } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Create new admin user
        const admin = new User_1.default({
            name,
            email,
            password,
            phone,
            role: 'admin' // Explicitly set role to admin
        });
        await admin.save();
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                role: admin.role
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create admin account'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map