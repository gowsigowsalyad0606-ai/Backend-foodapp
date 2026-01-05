"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantCategories = exports.bulkCreateCategories = exports.toggleCategoryStatus = exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getCategories = exports.createCategory = void 0;
const Category_1 = __importDefault(require("../models/Category"));
// Create a new category
const createCategory = async (req, res) => {
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
        const existingCategory = await Category_1.default.findOne({
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
        const category = new Category_1.default({
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
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
};
exports.createCategory = createCategory;
// Get all categories
const getCategories = async (req, res) => {
    try {
        const { restaurantId, isActive, page = 1, limit = 50 } = req.query;
        // Build filter
        const filter = {};
        if (restaurantId) {
            filter.$or = [
                { restaurantId: restaurantId, isGlobal: false },
                { isGlobal: true }
            ];
        }
        else {
            filter.isGlobal = true;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        const categories = await Category_1.default.find(filter)
            .sort({ sortOrder: 1, name: 1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('restaurantId', 'name');
        const total = await Category_1.default.countDocuments(filter);
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
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};
exports.getCategories = getCategories;
// Get single category
const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id).populate('restaurantId', 'name');
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
    }
    catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            error: error.message
        });
    }
};
exports.getCategory = getCategory;
// Update a category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const category = await Category_1.default.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        // Check if new name conflicts with existing category
        if (updateData.name && updateData.name !== category.name) {
            const existingCategory = await Category_1.default.findOne({
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
        if (updateData.name)
            category.name = updateData.name.trim();
        if (updateData.description)
            category.description = updateData.description.trim();
        if (updateData.icon !== undefined)
            category.icon = updateData.icon;
        if (updateData.color !== undefined)
            category.color = updateData.color;
        if (updateData.isActive !== undefined)
            category.isActive = updateData.isActive;
        if (updateData.sortOrder !== undefined)
            category.sortOrder = updateData.sortOrder;
        await category.save();
        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
};
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id);
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
        await Category_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
};
exports.deleteCategory = deleteCategory;
// Toggle category status
const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id);
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
    }
    catch (error) {
        console.error('Toggle category status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle category status',
            error: error.message
        });
    }
};
exports.toggleCategoryStatus = toggleCategoryStatus;
// Bulk create categories
const bulkCreateCategories = async (req, res) => {
    try {
        const { categories } = req.body;
        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Categories array is required'
            });
        }
        const createdCategories = [];
        const errors = [];
        for (const categoryData of categories) {
            try {
                // Check if category already exists
                const existingCategory = await Category_1.default.findOne({
                    name: categoryData.name.trim(),
                    restaurantId: categoryData.restaurantId || null,
                    isGlobal: categoryData.isGlobal !== undefined ? categoryData.isGlobal : true
                });
                if (existingCategory) {
                    errors.push(`Category "${categoryData.name}" already exists`);
                    continue;
                }
                const category = new Category_1.default({
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
            }
            catch (error) {
                errors.push(`Failed to create category "${categoryData.name}": ${error.message}`);
            }
        }
        res.status(201).json({
            success: true,
            message: `Successfully created ${createdCategories.length} categories`,
            data: createdCategories,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Bulk create categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create categories',
            error: error.message
        });
    }
};
exports.bulkCreateCategories = bulkCreateCategories;
// Get categories for a specific restaurant
const getRestaurantCategories = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        // Get both global categories and restaurant-specific categories
        const categories = await Category_1.default.find({
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
    }
    catch (error) {
        console.error('Get restaurant categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurant categories',
            error: error.message
        });
    }
};
exports.getRestaurantCategories = getRestaurantCategories;
//# sourceMappingURL=categoryController.js.map