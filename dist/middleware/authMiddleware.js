"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.userOnly = exports.adminOnly = exports.authorize = exports.authenticate = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const User_1 = __importDefault(require("../models/User"));
/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                error: 'TOKEN_MISSING'
            });
        }
        // Verify token
        const tokenPayload = authService_1.default.verifyToken(token);
        if (!tokenPayload) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.',
                error: 'TOKEN_INVALID'
            });
        }
        // Check if token is blacklisted
        const isBlacklisted = await authService_1.default.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(401).json({
                success: false,
                message: 'Token has been invalidated.',
                error: 'TOKEN_BLACKLISTED'
            });
        }
        // Get user from database
        const user = await User_1.default.findById(tokenPayload.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
                error: 'USER_NOT_FOUND'
            });
        }
        // Attach user and token payload to request
        req.user = user;
        req.tokenPayload = tokenPayload;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
            error: 'INTERNAL_ERROR'
        });
    }
};
exports.authenticate = authenticate;
/**
 * Authorization middleware - restricts access based on user roles
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user || !req.tokenPayload) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.',
                error: 'AUTHENTICATION_REQUIRED'
            });
        }
        // Check if user has required role
        if (!allowedRoles.includes(req.tokenPayload.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                error: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: allowedRoles,
                currentRole: req.tokenPayload.role
            });
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Convenience middleware for admin-only routes
 */
exports.adminOnly = (0, exports.authorize)(['admin']);
/**
 * Convenience middleware for user-only routes
 */
exports.userOnly = (0, exports.authorize)(['user']);
/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (token) {
            const tokenPayload = authService_1.default.verifyToken(token);
            if (tokenPayload) {
                const user = await User_1.default.findById(tokenPayload.userId).select('-password');
                if (user) {
                    req.user = user;
                    req.tokenPayload = tokenPayload;
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('Optional authentication error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authMiddleware.js.map