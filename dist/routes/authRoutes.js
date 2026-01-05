"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const authController_1 = __importDefault(require("../controllers/authController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Unified login endpoint for both users and admins
router.post('/login', [
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
], authController_1.default.login);
// User registration (defaults to user role)
router.post('/register', [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number')
], authController_1.default.register);
// Create admin account (admin only)
router.post('/create-admin', authMiddleware_1.authenticate, authMiddleware_1.adminOnly, [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number')
], authController_1.default.createAdmin);
// Get current user
router.get('/me', authMiddleware_1.authenticate, authController_1.default.getCurrentUser);
// Logout
router.post('/logout', authController_1.default.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map