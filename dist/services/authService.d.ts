import { IUser } from '../models/User';
export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            phone?: string;
        };
    };
}
export interface JWTPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
}
declare class AuthService {
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    /**
     * Unified login for both users and admins
     */
    static login(email: string, password: string): Promise<LoginResponse>;
    /**
     * Verify JWT token
     */
    static verifyToken(token: string): JWTPayload | null;
    /**
     * Generate token for user (useful for testing)
     */
    static generateToken(user: IUser): string;
    /**
     * Check if user has admin role
     */
    static isAdmin(role: string): boolean;
    /**
     * Check if user has user role
     */
    static isUser(role: string): boolean;
    /**
     * Logout user - add token to blacklist
     */
    static logout(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Check if token is blacklisted
     */
    static isTokenBlacklisted(token: string): Promise<boolean>;
    /**
     * Clean up expired tokens (optional - handled by MongoDB TTL)
     */
    static cleanupExpiredTokens(): Promise<void>;
}
export default AuthService;
//# sourceMappingURL=authService.d.ts.map