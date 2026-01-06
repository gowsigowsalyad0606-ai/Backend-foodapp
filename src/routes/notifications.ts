import express, { Response } from 'express';
import User from '../models/User';
import Notification from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();



router.post('/register-token', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        await User.findByIdAndUpdate(req.user?._id, {
            fcmToken: token,
            notificationsEnabled: true
        });

        res.json({
            success: true,
            message: 'FCM token registered successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register token'
        });
    }
});

/**
 * Unregister FCM token (logout/disable)
 */
router.post('/unregister-token', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await User.findByIdAndUpdate(req.user?._id, {
            fcmToken: null
        });

        res.json({
            success: true,
            message: 'FCM token unregistered successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to unregister token'
        });
    }
});

/**
 * Toggle notification settings
 */
router.patch('/settings', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { enabled } = req.body;

        await User.findByIdAndUpdate(req.user?._id, {
            notificationsEnabled: enabled
        });

        res.json({
            success: true,
            message: `Notifications ${enabled ? 'enabled' : 'disabled'}`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update settings'
        });
    }
});

/**
 * Get user's notifications
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await Notification.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notifications'
        });
    }
});

/**
 * Mark notification as read
 */
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark as read'
        });
    }
});

export default router;
