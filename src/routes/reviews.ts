import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import Review from '../models/Review';
import Order from '../models/Order';
import Restaurant from '../models/Restaurant';

const router = express.Router();

/**
 * Submit a review for an order
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, rating, title, comment, foodRating, deliveryRating, images } = req.body;

        // Validate required fields
        if (!orderId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, rating, and comment are required'
            });
        }

        // Check if order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            userId: req.user?._id,
            status: 'delivered'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not eligible for review'
            });
        }

        // Check if review already exists for this order
        const existingReview = await Review.findOne({ orderId, userId: req.user?._id });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this order'
            });
        }

        // Create review
        const review = new Review({
            userId: req.user?._id,
            restaurantId: order.restaurantId,
            orderId,
            rating,
            title,
            comment,
            foodRating,
            deliveryRating,
            images,
            isVerifiedPurchase: true
        });

        await review.save();

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this order'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit review'
        });
    }
});

/**
 * Get reviews for a restaurant
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({
            restaurantId,
            isVisible: true
        })
            .populate('userId', 'name profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ restaurantId, isVisible: true });

        // Calculate rating breakdown
        const ratingBreakdown = await Review.aggregate([
            { $match: { restaurantId: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), isVisible: true } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                ratingBreakdown: ratingBreakdown.reduce((acc, rb) => {
                    acc[rb._id] = rb.count;
                    return acc;
                }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch reviews'
        });
    }
});

/**
 * Get user's reviews
 */
router.get('/my-reviews', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await Review.find({ userId: req.user?._id })
            .populate('restaurantId', 'name image')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch reviews'
        });
    }
});

/**
 * Check if order is reviewable
 */
router.get('/can-review/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            userId: req.user?._id,
            status: 'delivered'
        });

        if (!order) {
            return res.json({ success: true, canReview: false, reason: 'Order not found or not delivered' });
        }

        const existingReview = await Review.findOne({ orderId, userId: req.user?._id });
        if (existingReview) {
            return res.json({ success: true, canReview: false, reason: 'Already reviewed', review: existingReview });
        }

        res.json({
            success: true,
            canReview: true,
            order: {
                _id: order._id,
                restaurantId: order.restaurantId,
                total: order.total,
                createdAt: order.createdAt
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to check review eligibility'
        });
    }
});

/**
 * Update a review (within 7 days)
 */
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            userId: req.user?._id
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if within 7 days
        const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > 7) {
            return res.status(400).json({ success: false, message: 'Reviews can only be edited within 7 days' });
        }

        const { rating, title, comment, foodRating, deliveryRating } = req.body;

        if (rating) review.rating = rating;
        if (title !== undefined) review.title = title;
        if (comment) review.comment = comment;
        if (foodRating) review.foodRating = foodRating;
        if (deliveryRating) review.deliveryRating = deliveryRating;

        await review.save();

        res.json({ success: true, message: 'Review updated', data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update review' });
    }
});

/**
 * Restaurant owner responds to a review
 */
router.post('/:id/respond', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        const review = await Review.findById(req.params.id).populate('restaurantId');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Check if user is restaurant owner
        const restaurant = await Restaurant.findOne({ _id: review.restaurantId, ownerId: req.user?._id });
        if (!restaurant) {
            return res.status(403).json({ success: false, message: 'Not authorized to respond' });
        }

        review.response = { text, respondedAt: new Date() };
        await review.save();

        res.json({ success: true, message: 'Response added', data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to add response' });
    }
});

/**
 * Delete a review
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.id,
            userId: req.user?._id
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete review' });
    }
});

export default router;
