import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare class AuthController {
    /**
     * Unified login for both users and admins
     */
    static login(req: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * User registration
     */
    static register(req: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Create admin account (Admin only)
     */
    static createAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get current user profile
     */
    static getCurrentUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Logout user
     */
    static logout(req: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default AuthController;
//# sourceMappingURL=authController.d.ts.map