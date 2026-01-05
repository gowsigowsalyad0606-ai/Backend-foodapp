import { Request, Response } from 'express';
import Category, { ICategory } from '../models/Category';
import Restaurant from '../models/Restaurant';

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon, color, isActive, sortOrder, restaurantId, isGlobal } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    // Check if category already exists for this restaurant (if not global)
    const existingCategory = await Category.findOne({
      name: name.trim(),
      restaurantId: restaurantId || null,
      isGlobal: isGlobal || false
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      icon: icon || '🍽️',
      color: color || '#FF7A00',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      restaurantId: restaurantId || null,
      isGlobal: isGlobal !== undefined ? isGlobal : true
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { restaurantId, isActive, page = 1, limit = 50 } = req.query;
    
    // Build filter
    const filter: any = {};
    
    if (restaurantId) {
      filter.$or = [
        { restaurantId: restaurantId, isGlobal: false },
        { isGlobal: true }
      ];
    } else {
      filter.isGlobal = true;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('restaurantId', 'name');

    const total = await Category.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get single category
export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id).populate('restaurantId', 'name');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name conflicts with existing category
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: updateData.name.trim(),
        restaurantId: category.restaurantId,
        isGlobal: category.isGlobal,
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    if (updateData.name) category.name = updateData.name.trim();
    if (updateData.description) category.description = updateData.description.trim();
    if (updateData.icon !== undefined) category.icon = updateData.icon;
    if (updateData.color !== undefined) category.color = updateData.color;
    if (updateData.isActive !== undefined) category.isActive = updateData.isActive;
    if (updateData.sortOrder !== undefined) category.sortOrder = updateData.sortOrder;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used by menu items
    const MenuItem = require('../models/MenuItem').default;
    const menuItemsCount = await MenuItem.countDocuments({ category: category.name });
    
    if (menuItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. It is being used by menu items.'
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Toggle category status
export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error: any) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle category status',
      error: error.message
    });
  }
};

// Bulk create categories
export const bulkCreateCategories = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required'
      });
    }

    const createdCategories: ICategory[] = [];
    const errors: string[] = [];

    for (const categoryData of categories) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({
          name: categoryData.name.trim(),
          restaurantId: categoryData.restaurantId || null,
          isGlobal: categoryData.isGlobal !== undefined ? categoryData.isGlobal : true
        });

        if (existingCategory) {
          errors.push(`Category "${categoryData.name}" already exists`);
          continue;
        }

        const category = new Category({
          name: categoryData.name.trim(),
          description: categoryData.description.trim(),
          icon: categoryData.icon || '🍽️',
          color: categoryData.color || '#FF7A00',
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
          sortOrder: categoryData.sortOrder || 0,
          restaurantId: categoryData.restaurantId || null,
          isGlobal: categoryData.isGlobal !== undefined ? categoryData.isGlobal : true
        });

        await category.save();
        createdCategories.push(category);
      } catch (error: any) {
        errors.push(`Failed to create category "${categoryData.name}": ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdCategories.length} categories`,
      data: createdCategories,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Bulk create categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create categories',
      error: error.message
    });
  }
};

// Get categories for a specific restaurant
export const getRestaurantCategories = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    
    // Get both global categories and restaurant-specific categories
    const categories = await Category.find({
      $or: [
        { isGlobal: true, isActive: true },
        { restaurantId, isActive: true }
      ]
    })
    .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Get restaurant categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant categories',
      error: error.message
    });
  }
};
