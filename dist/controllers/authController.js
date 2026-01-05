"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const authService_1 = __importDefault(require("../services/authService"));
const User_1 = __importDefault(require("../models/User"));
class AuthController {
    /**
     * Unified login for both users and admins
     */
    static async login(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email, password } = req.body;
            // Use unified login service
            const result = await authService_1.default.login(email, password);
            if (result.success) {
                return res.json(result);
            }
            else {
                return res.status(401).json(result);
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Login failed'
            });
        }
    }
    /**
     * User registration
     */
    static async register(req, res) {
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
            // Create new user (defaults to 'user' role)
            const user = new User_1.default({
                name,
                email,
                password,
                phone
                // role is not included - defaults to 'user'
            });
            await user.save();
            // Generate token using service
            const token = authService_1.default.generateToken(user);
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
    }
    /**
     * Create admin account (Admin only)
     */
    static async createAdmin(req, res) {
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
            // Generate token using service
            const token = authService_1.default.generateToken(admin);
            res.status(201).json({
                success: true,
                message: 'Admin account created successfully',
                data: {
                    token,
                    user: {
                        id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        phone: admin.phone,
                        role: admin.role
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create admin account'
            });
        }
    }
    /**
     * Get current user profile
     */
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
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
    }
    /**
     * Logout user
     */
    static async logout(req, res) {
        try {
            const authHeader = req.header('Authorization');
            const token = authHeader?.replace('Bearer ', '');
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'No token provided'
                });
            }
            const result = await authService_1.default.logout(token);
            if (result.success) {
                res.json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Logout failed'
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
//# sourceMappingURL=authController.js.map