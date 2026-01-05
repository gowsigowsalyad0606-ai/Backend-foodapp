import express from 'express';
import PaymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Create payment intent
router.post('/create-intent', authenticate, PaymentController.createPaymentIntent);

// Confirm payment (client-side calls this after Stripe SDK success)
router.post('/confirm', authenticate, PaymentController.confirmPayment);

// Process refund (Admin or User depending on logic - here we allow both for cancellation)
router.post('/refund', authenticate, PaymentController.processRefund);

export default router;
