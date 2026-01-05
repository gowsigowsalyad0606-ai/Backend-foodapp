import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import Notification from '../models/Notification';

const router = express.Router();

// Get unread notifications for the current user
router.get('/', authenticate, async (req: any, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: notifications });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: any, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req: any, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
