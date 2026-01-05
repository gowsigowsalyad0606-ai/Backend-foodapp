import { Request, Response, NextFunction } from 'express';
import AuthService, { JWTPayload } from '../services/authService';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: JWTPayload;
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const tokenPayload = AuthService.verifyToken(token);
    if (!tokenPayload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: 'TOKEN_INVALID'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated.',
        error: 'TOKEN_BLACKLISTED'
      });
    }

    // Get user from database
    const user = await User.findById(tokenPayload.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach user and token payload to request
    req.user = user;
    req.tokenPayload = tokenPayload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Authorization middleware - restricts access based on user roles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user || !req.tokenPayload) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.tokenPayload.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        currentRole: req.tokenPayload.role
      });
    }

    next();
  };
};

/**
 * Convenience middleware for admin-only routes
 */
export const adminOnly = authorize(['admin']);

/**
 * Convenience middleware for restaurant-only routes
 */
export const restaurantOnly = authorize(['restaurant']);

/**
 * Convenience middleware for user-only routes
 */
export const userOnly = authorize(['user']);

/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const tokenPayload = AuthService.verifyToken(token);
      if (tokenPayload) {
        const user = await User.findById(tokenPayload.userId).select('-password');
        if (user) {
          req.user = user;
          req.tokenPayload = tokenPayload;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};
