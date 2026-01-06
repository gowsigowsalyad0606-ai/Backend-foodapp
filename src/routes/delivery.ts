import express, { Response } from 'express';
import Order from '../models/Order';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';
import pushNotificationService from '../services/pushNotificationService';

const router = express.Router();

// Middleware to ensure user is a delivery partner
const deliveryOnly = authorize(['delivery']);

/**
 * Get available orders (Status: ready)
 */
router.get('/available', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        // Show orders that are confirmed, preparing, or ready and not yet assigned to a rider
        const orders = await Order.find({
            status: { $in: ['confirmed', 'preparing', 'ready'] },
            deliveryPartnerId: { $exists: false }
        })
            .populate('restaurantId', 'name address contact')
            .populate('userId', 'name address phone')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch available orders'
        });
    }
});

/**
 * Get delivery partner's current tasks
 */
router.get('/my-tasks', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const orders = await Order.find({
            deliveryPartnerId: req.user?._id,
            status: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] }
        })
            .populate('restaurantId', 'name address contact')
            .populate('userId', 'name address phone')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch your tasks'
        });
    }
});

/**
 * Get delivery partner's stats
 */
router.get('/stats', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayDeliveries = await Order.find({
            deliveryPartnerId: req.user?._id,
            status: 'delivered',
            actualDeliveryTime: { $gte: startOfDay }
        });

        const totalDeliveries = await Order.countDocuments({
            deliveryPartnerId: req.user?._id,
            status: 'delivered'
        });

        const todayEarnings = todayDeliveries.length * 40; // Flat 40 per delivery for now

        res.json({
            success: true,
            data: {
                todayOrders: todayDeliveries.length,
                todayEarnings,
                totalOrders: totalDeliveries
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch stats'
        });
    }
});

/**
 * Get delivery partner's trip history (Status: delivered)
 */
router.get('/history', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const orders = await Order.find({
            deliveryPartnerId: req.user?._id,
            status: 'delivered'
        })
            .populate('restaurantId', 'name address')
            .populate('userId', 'name')
            .sort({ actualDeliveryTime: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch history'
        });
    }
});

/**
 * Accept an order
 */
router.patch('/:id/accept', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryPartnerId) {
            return res.status(400).json({ success: false, message: 'Order already assigned to another partner' });
        }

        if (!['confirmed', 'preparing', 'ready'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order is not in a state to be accepted' });
        }

        order.deliveryPartnerId = req.user?._id;
        await order.save();

        res.json({
            success: true,
            message: 'Order accepted successfully',
            data: order
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to accept order'
        });
    }
});

/**
 * Mark order as picked up
 */
router.patch('/:id/pickup', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            deliveryPartnerId: req.user?._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Active order not found' });
        }

        if (order.status !== 'ready') {
            return res.status(400).json({ success: false, message: 'Order must be marked as Ready by restaurant first' });
        }

        order.status = 'out_for_delivery';
        await order.save();

        // Send push notification to customer
        const populatedOrder = await Order.findById(order._id)
            .populate('restaurantId', 'name ownerId');
        if (populatedOrder) {
            const restaurant = populatedOrder.restaurantId as any;
            await pushNotificationService.notifyOrderStatusChange(
                order._id.toString(),
                order.userId.toString(),
                restaurant?.ownerId?.toString() || null,
                req.user?._id.toString() || null,
                'out_for_delivery',
                restaurant?.name || 'Restaurant'
            );
        }

        res.json({
            success: true,
            message: 'Order picked up and out for delivery',
            data: order
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update order status'
        });
    }
});

/**
 * Mark order as delivered
 */
router.patch('/:id/deliver', authenticate, deliveryOnly, async (req: AuthRequest, res: Response) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            deliveryPartnerId: req.user?._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Active order not found' });
        }

        if (order.status !== 'out_for_delivery') {
            return res.status(400).json({ success: false, message: 'Order must be picked up before delivery' });
        }

        order.status = 'delivered';
        order.actualDeliveryTime = new Date();
        await order.save();

        // Send push notifications for delivered order
        const populatedOrder = await Order.findById(order._id)
            .populate('restaurantId', 'name ownerId');
        if (populatedOrder) {
            const restaurant = populatedOrder.restaurantId as any;
            await pushNotificationService.notifyOrderStatusChange(
                order._id.toString(),
                order.userId.toString(),
                restaurant?.ownerId?.toString() || null,
                req.user?._id.toString() || null,
                'delivered',
                restaurant?.name || 'Restaurant'
            );
        }

        res.json({
            success: true,
            message: 'Order delivered successfully',
            data: order
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete delivery'
        });
    }
});

export default router;
