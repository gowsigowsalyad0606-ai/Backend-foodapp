import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import AuthService, { LoginResponse } from '../services/authService';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  /**
   * Unified login for both users and admins
   */
  static async login(req: any, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Use unified login service
      const result: LoginResponse = await AuthService.login(email, password);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(401).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  /**
   * User registration
   */
  static async register(req: any, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, password, phone, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Restrict role selection during open signup
      const assignedRole = (role === 'delivery') ? 'delivery' : 'user';

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role: assignedRole
      });

      await user.save();

      // Generate token using service
      const token = AuthService.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  /**
   * Create admin account (Admin only)
   */
  static async createAdmin(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new admin user
      const admin = new User({
        name,
        email,
        password,
        phone,
        role: 'admin' // Explicitly set role to admin
      });

      await admin.save();

      // Generate token using service
      const token = AuthService.generateToken(admin);

      res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        data: {
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            role: admin.role
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create admin account'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
            addresses: req.user.addresses
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user data'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: any, res: Response) {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }

      const result = await AuthService.logout(token);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }
}

export default AuthController;
