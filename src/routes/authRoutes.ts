import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/authController';
import { authenticate, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Unified login endpoint for both users and admins
router.post('/login', [
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], AuthController.login);

// User registration (defaults to user role)
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number'),
  body('role').optional().isIn(['user', 'delivery']).withMessage('Invalid role specified')
], AuthController.register);

// Create admin account (admin only)
router.post('/create-admin',
  authenticate,
  adminOnly,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').optional().trim().isMobilePhone('any').withMessage('Please provide a valid phone number')
  ],
  AuthController.createAdmin
);

// Get current user
router.get('/me', authenticate, AuthController.getCurrentUser);

// Logout
router.post('/logout', AuthController.logout);

export default router;
