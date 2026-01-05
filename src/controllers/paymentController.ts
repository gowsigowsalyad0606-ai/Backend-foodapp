import { Request, Response } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Notification from '../models/Notification';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

export class PaymentController {
    /**
     * Create a PaymentIntent for an order
     */
    static async createPaymentIntent(req: AuthRequest, res: Response) {
        try {
            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({ success: false, message: 'Order ID is required' });
            }

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Stripe expects amount in paise for INR (100 paise = 1 rupee)
            // Minimum for INR is 50 paise, but we enforce ₹50 minimum for practical purposes
            let amount = Math.round(order.total * 100);
            const MIN_AMOUNT_PAISE = 5000; // ₹50 minimum
            if (amount < MIN_AMOUNT_PAISE) {
                amount = MIN_AMOUNT_PAISE;
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'inr', // Changed to INR for India
                description: `FoodBuddy Order #${order._id.toString().slice(-8)} - Food delivery payment`,
                metadata: {
                    orderId: order._id.toString(),
                    userId: req.user?._id.toString() || '',
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            // Update order with payment intent ID
            order.paymentIntentId = paymentIntent.id;
            await order.save();

            res.status(200).json({
                success: true,
                clientSecret: paymentIntent.client_secret,
            });
        } catch (error: any) {
            console.error('Stripe PaymentIntent error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
        }
    }

    /**
     * Confirm payment status and update order
     */
    static async confirmPayment(req: AuthRequest, res: Response) {
        try {
            const { orderId, paymentIntentId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'succeeded') {
                order.paymentStatus = 'paid';
                order.status = 'confirmed';
                await order.save();

                // Notify User
                await Notification.create({
                    recipient: order.userId,
                    recipientRole: 'user',
                    type: 'payment_success',
                    title: 'Payment Successful',
                    message: `Payment for order #${order._id.toString().slice(-6)} was successful!`,
                    relatedOrderId: order._id
                });

                // Notify Admins
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    await Notification.create({
                        recipient: admin._id,
                        recipientRole: 'admin',
                        type: 'payment_success',
                        title: 'New Paid Order',
                        message: `A new order #${order._id.toString().slice(-6)} has been paid.`,
                        relatedOrderId: order._id
                    });
                }

                return res.json({ success: true, message: 'Payment confirmed and order updated' });
            }

            res.status(400).json({ success: false, message: `Payment not succeeded: ${paymentIntent.status}` });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || 'Failed to confirm payment' });
        }
    }

    /**
     * Process refund for an order
     */
    static async processRefund(req: AuthRequest, res: Response) {
        try {
            const { orderId, reason } = req.body;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            if (order.paymentStatus === 'refunded') {
                return res.status(400).json({ success: false, message: 'Order already refunded' });
            }

            if (order.paymentStatus !== 'paid' || !order.paymentIntentId) {
                return res.status(400).json({ success: false, message: 'Order is not paid or lacks payment intent' });
            }

            // Idempotent refund using orderId as idempotency key
            const refund = await stripe.refunds.create(
                {
                    payment_intent: order.paymentIntentId,
                    reason: reason || 'requested_by_customer',
                    metadata: { orderId: order._id.toString() },
                },
                { idempotencyKey: `refund_${order._id}` }
            );

            order.paymentStatus = 'refunded';
            order.status = 'cancelled'; // Cancel order on full refund
            order.refundId = refund.id;
            await order.save();

            // Notify User
            await Notification.create({
                recipient: order.userId,
                recipientRole: 'user',
                type: 'refund_processed',
                title: 'Refund Processed',
                message: `Your refund for order #${order._id.toString().slice(-6)} has been processed.`,
                relatedOrderId: order._id
            });

            // Notify Admins
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientRole: 'admin',
                    type: 'refund_processed',
                    title: 'Refund Issued',
                    message: `Refund for order #${order._id.toString().slice(-6)} has been issued.`,
                    relatedOrderId: order._id
                });
            }

            res.json({ success: true, message: 'Refund processed successfully', refundId: refund.id });
        } catch (error: any) {
            console.error('Stripe Refund error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to process refund' });
        }
    }
}

export default PaymentController;
