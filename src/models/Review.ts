import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    userId: mongoose.Types.ObjectId;
    restaurantId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
    foodRating?: number;
    deliveryRating?: number;
    isVerifiedPurchase: boolean;
    likes: number;
    response?: {
        text: string;
        respondedAt: Date;
    };
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters'],
        trim: true
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        maxlength: [500, 'Comment cannot exceed 500 characters'],
        trim: true
    },
    images: [{
        type: String
    }],
    foodRating: {
        type: Number,
        min: 1,
        max: 5
    },
    deliveryRating: {
        type: Number,
        min: 1,
        max: 5
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    likes: {
        type: Number,
        default: 0
    },
    response: {
        text: String,
        respondedAt: Date
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate reviews for same order
reviewSchema.index({ userId: 1, orderId: 1 }, { unique: true });

// Index for fetching restaurant reviews
reviewSchema.index({ restaurantId: 1, createdAt: -1 });

// Static method to calculate average rating for a restaurant
reviewSchema.statics.calculateAverageRating = async function (restaurantId: mongoose.Types.ObjectId) {
    const result = await this.aggregate([
        { $match: { restaurantId, isVisible: true } },
        { $group: { _id: '$restaurantId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (result.length > 0) {
        await mongoose.model('Restaurant').findByIdAndUpdate(restaurantId, {
            rating: Math.round(result[0].avgRating * 10) / 10, // Round to 1 decimal
            reviewCount: result[0].count
        });
    }
};

// Update restaurant rating after save
reviewSchema.post('save', async function () {
    await (this.constructor as any).calculateAverageRating(this.restaurantId);
});

// Update restaurant rating after remove
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    await (this.constructor as any).calculateAverageRating(this.restaurantId);
});

export default mongoose.model<IReview>('Review', reviewSchema);
