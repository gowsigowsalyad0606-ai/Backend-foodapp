"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Update user profile
router.put('/profile', authMiddleware_1.authenticate, [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Please provide a valid phone number')
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
        const { name, phone } = req.body;
        const updatedUser = await User_1.default.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select('-password');
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
});
// Add address
router.post('/addresses', authMiddleware_1.authenticate, [
    (0, express_validator_1.body)('street').notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('zipCode').notEmpty().withMessage('Zip code is required'),
    (0, express_validator_1.body)('isDefault').optional().isBoolean().withMessage('isDefault must be boolean')
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
        const { street, city, state, zipCode, isDefault } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // If this is set as default, remove default from other addresses
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        user.addresses.push({ street, city, state, zipCode, isDefault: isDefault || false });
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: user.addresses
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add address'
        });
    }
});
// Update address
router.put('/addresses/:addressId', authMiddleware_1.authenticate, [
    (0, express_validator_1.body)('street').optional().notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('city').optional().notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').optional().notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('zipCode').optional().notEmpty().withMessage('Zip code is required'),
    (0, express_validator_1.body)('isDefault').optional().isBoolean().withMessage('isDefault must be boolean')
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
        const { addressId } = req.params;
        const updates = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        // If this is set as default, remove default from other addresses
        if (updates.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        // Update the address
        Object.assign(user.addresses[addressIndex], updates);
        await user.save();
        res.json({
            success: true,
            message: 'Address updated successfully',
            data: user.addresses
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update address'
        });
    }
});
// Delete address
router.delete('/addresses/:addressId', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        user.addresses.splice(addressIndex, 1);
        await user.save();
        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: user.addresses
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete address'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map