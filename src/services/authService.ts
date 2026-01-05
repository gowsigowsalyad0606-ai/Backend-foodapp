import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import BlacklistedToken from '../models/BlacklistedToken';

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

class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = '7d';

  /**
   * Unified login for both users and admins
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user by email (include password for comparison)
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token with role
      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
          role: user.role 
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      return {
        success: true,
        message: `${user.role === 'admin' ? 'Admin' : 'User'} login successful`,
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate token for user (useful for testing)
   */
  static generateToken(user: IUser): string {
    return jwt.sign(
      { 
        userId: user._id.toString(), 
        role: user.role 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Check if user has admin role
   */
  static isAdmin(role: string): boolean {
    return role === 'admin';
  }

  /**
   * Check if user has user role
   */
  static isUser(role: string): boolean {
    return role === 'user';
  }

  /**
   * Logout user - add token to blacklist
   */
  static async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decode token to get expiration time
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.exp) {
        return {
          success: false,
          message: 'Invalid token format'
        };
      }

      // Add token to blacklist
      const blacklistedToken = new BlacklistedToken({
        token,
        expiresAt: new Date(decoded.exp * 1000) // Convert to milliseconds
      });

      await blacklistedToken.save();

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklisted = await BlacklistedToken.findOne({ token });
      return !!blacklisted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired tokens (optional - handled by MongoDB TTL)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      await BlacklistedToken.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }
}

export default AuthService;
