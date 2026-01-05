import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../services/authService';
import { IUser } from '../models/User';
export interface AuthRequest extends Request {
    user?: IUser;
    tokenPayload?: JWTPayload;
}
/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Authorization middleware - restricts access based on user roles
 */
export declare const authorize: (allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Convenience middleware for admin-only routes
 */
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Convenience middleware for user-only routes
 */
export declare const userOnly: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map