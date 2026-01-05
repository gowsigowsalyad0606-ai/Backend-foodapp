import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  bulkCreateCategories,
  getRestaurantCategories
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(authorize(['admin']));

// Admin routes
router.route('/')
  .post(createCategory)
  .get(getCategories);

router.route('/bulk')
  .post(bulkCreateCategories);

router.route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

router.patch('/:id/toggle', toggleCategoryStatus);

// Public route for restaurant menu categories
router.get('/restaurant/:restaurantId', getRestaurantCategories);

export default router;
