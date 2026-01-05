import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare class AdminController {
    /**
     * Create new menu item (Admin only)
     */
    static createMenuItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update menu item (Admin only)
     */
    static updateMenuItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update menu item price (Admin only)
     */
    static updateItemPrice(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Toggle menu item availability (Admin only)
     */
    static toggleItemAvailability(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Delete menu item (Admin only)
     */
    static deleteMenuItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Create discount/offer (Admin only)
     */
    static createDiscount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update discount/offer (Admin only)
     */
    static updateDiscount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete discount/offer (Admin only)
     */
    static deleteDiscount(req: AuthRequest, res: Response): Promise<void>;
}
export default AdminController;
//# sourceMappingURL=adminController.d.ts.map