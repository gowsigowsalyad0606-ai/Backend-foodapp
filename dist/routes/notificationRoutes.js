"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const Notification_1 = __importDefault(require("../models/Notification"));
const router = express_1.default.Router();
// Get unread notifications for the current user
router.get('/', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const notifications = await Notification_1.default.find({
            recipient: req.user._id,
        })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Mark notification as read
router.patch('/:id/read', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, data: notification });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Mark all as read
router.patch('/read-all', authMiddleware_1.authenticate, async (req, res) => {
    try {
        await Notification_1.default.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map