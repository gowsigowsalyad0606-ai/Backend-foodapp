"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(['admin']));
// Admin routes
router.route('/')
    .post(categoryController_1.createCategory)
    .get(categoryController_1.getCategories);
router.route('/bulk')
    .post(categoryController_1.bulkCreateCategories);
router.route('/:id')
    .get(categoryController_1.getCategory)
    .put(categoryController_1.updateCategory)
    .delete(categoryController_1.deleteCategory);
router.patch('/:id/toggle', categoryController_1.toggleCategoryStatus);
// Public route for restaurant menu categories
router.get('/restaurant/:restaurantId', categoryController_1.getRestaurantCategories);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map