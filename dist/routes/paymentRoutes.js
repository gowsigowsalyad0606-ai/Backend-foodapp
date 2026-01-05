"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = __importDefault(require("../controllers/paymentController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create payment intent
router.post('/create-intent', authMiddleware_1.authenticate, paymentController_1.default.createPaymentIntent);
// Confirm payment (client-side calls this after Stripe SDK success)
router.post('/confirm', authMiddleware_1.authenticate, paymentController_1.default.confirmPayment);
// Process refund (Admin or User depending on logic - here we allow both for cancellation)
router.post('/refund', authMiddleware_1.authenticate, paymentController_1.default.processRefund);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map