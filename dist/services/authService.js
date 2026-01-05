"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const BlacklistedToken_1 = __importDefault(require("../models/BlacklistedToken"));
class AuthService {
    /**
     * Unified login for both users and admins
     */
    static async login(email, password) {
        try {
            // Find user by email (include password for comparison)
            const user = await User_1.default.findOne({ email }).select('+password');
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            // Generate JWT token with role
            const token = jsonwebtoken_1.default.sign({
                userId: user._id.toString(),
                role: user.role
            }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
            return {
                success: true,
                message: `${user.role === 'admin' ? 'Admin' : 'User'} login successful`,
                data: {
                    token,
                    user: {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone
                    }
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Login failed. Please try again.'
            };
        }
    }
    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate token for user (useful for testing)
     */
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            role: user.role
        }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    /**
     * Check if user has admin role
     */
    static isAdmin(role) {
        return role === 'admin';
    }
    /**
     * Check if user has user role
     */
    static isUser(role) {
        return role === 'user';
    }
    /**
     * Logout user - add token to blacklist
     */
    static async logout(token) {
        try {
            // Decode token to get expiration time
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return {
                    success: false,
                    message: 'Invalid token format'
                };
            }
            // Add token to blacklist
            const blacklistedToken = new BlacklistedToken_1.default({
                token,
                expiresAt: new Date(decoded.exp * 1000) // Convert to milliseconds
            });
            await blacklistedToken.save();
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Logout failed'
            };
        }
    }
    /**
     * Check if token is blacklisted
     */
    static async isTokenBlacklisted(token) {
        try {
            const blacklisted = await BlacklistedToken_1.default.findOne({ token });
            return !!blacklisted;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Clean up expired tokens (optional - handled by MongoDB TTL)
     */
    static async cleanupExpiredTokens() {
        try {
            await BlacklistedToken_1.default.deleteMany({
                expiresAt: { $lt: new Date() }
            });
        }
        catch (error) {
            console.error('Failed to cleanup expired tokens:', error);
        }
    }
}
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
AuthService.JWT_EXPIRES_IN = '7d';
exports.default = AuthService;
//# sourceMappingURL=authService.js.map