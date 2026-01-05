import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare class PaymentController {
    /**
     * Create a PaymentIntent for an order
     */
    static createPaymentIntent(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Confirm payment status and update order
     */
    static confirmPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Process refund for an order
     */
    static processRefund(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default PaymentController;
//# sourceMappingURL=paymentController.d.ts.map