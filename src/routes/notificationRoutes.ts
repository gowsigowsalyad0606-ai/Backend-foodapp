import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import Notification from '../models/Notification';
import User from '../models/User';

const router = express.Router();

// Register FCM token for push notifications
router.post('/register-token', authenticate, async (req: any, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        await User.findByIdAndUpdate(req.user._id, {
            fcmToken: token,
            notificationsEnabled: true
        });

        res.json({ success: true, message: 'FCM token registered successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Unregister FCM token (logout/disable)
router.post('/unregister-token', authenticate, async (req: any, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { fcmToken: null });
        res.json({ success: true, message: 'FCM token unregistered' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle notification settings
router.patch('/settings', authenticate, async (req: any, res) => {
    try {
        const { enabled } = req.body;
        await User.findByIdAndUpdate(req.user._id, { notificationsEnabled: enabled });
        res.json({ success: true, message: `Notifications ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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
