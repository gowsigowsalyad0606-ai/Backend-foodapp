import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId; // User ID
    recipientRole: 'user' | 'admin';
    type: 'order_update' | 'payment_success' | 'payment_failed' | 'refund_processed' | 'cancellation';
    title: string;
    message: string;
    relatedOrderId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientRole: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
    },
    type: {
        type: String,
        enum: ['order_update', 'payment_success', 'payment_failed', 'refund_processed', 'cancellation'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    relatedOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
