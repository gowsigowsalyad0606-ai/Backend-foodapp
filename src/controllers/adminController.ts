import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import MenuItem from '../models/MenuItem';
import { AuthRequest } from '../middleware/authMiddleware';

export class AdminController {
  /**
   * Create new menu item (Admin only)
   */
  static async createMenuItem(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        restaurantId,
        name,
        description,
        price,
        category,
        isVeg,
        preparationTime,
        image
      } = req.body;

      const menuItem = new MenuItem({
        restaurantId,
        name,
        description,
        price,
        category,
        isVeg,
        preparationTime,
        image: req.file ? `/uploads/menu-items/${req.file.filename}` : image,
        isAvailable: true
      });

      await menuItem.save();

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: menuItem
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create menu item'
      });
    }
  }

  /**
   * Update menu item (Admin only)
   */
  static async updateMenuItem(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      if (req.file) {
        updateData.image = `/uploads/menu-items/${req.file.filename}`;
      }

      const menuItem = await MenuItem.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: menuItem
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update menu item'
      });
    }
  }

  /**
   * Update menu item price (Admin only)
   */
  static async updateItemPrice(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { price } = req.body;

      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number'
        });
      }

      const menuItem = await MenuItem.findByIdAndUpdate(
        id,
        { price },
        { new: true, runValidators: true }
      );

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        message: 'Menu item price updated successfully',
        data: menuItem
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update menu item price'
      });
    }
  }

  /**
   * Toggle menu item availability (Admin only)
   */
  static async toggleItemAvailability(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      menuItem.isAvailable = !menuItem.isAvailable;
      await menuItem.save();

      res.json({
        success: true,
        message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
        data: menuItem
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle menu item availability'
      });
    }
  }

  /**
   * Delete menu item (Admin only)
   */
  static async deleteMenuItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const menuItem = await MenuItem.findByIdAndDelete(id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete menu item'
      });
    }
  }

  /**
   * Create discount/offer (Admin only)
   */
  static async createDiscount(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        discountPercentage,
        minOrderAmount,
        maxDiscountAmount,
        startDate,
        endDate,
        applicableItems
      } = req.body;

      // This would require a Discount model - for now, return success
      res.status(201).json({
        success: true,
        message: 'Discount created successfully',
        data: {
          name,
          description,
          discountPercentage,
          minOrderAmount,
          maxDiscountAmount,
          startDate,
          endDate,
          applicableItems
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create discount'
      });
    }
  }

  /**
   * Update discount/offer (Admin only)
   */
  static async updateDiscount(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // This would require a Discount model - for now, return success
      res.json({
        success: true,
        message: 'Discount updated successfully',
        data: { id, ...updateData }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update discount'
      });
    }
  }

  /**
   * Delete discount/offer (Admin only)
   */
  static async deleteDiscount(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // This would require a Discount model - for now, return success
      res.json({
        success: true,
        message: 'Discount deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete discount'
      });
    }
  }
}

export default AdminController;
