import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    recipientRole: 'user' | 'admin';
    type: 'order_update' | 'payment_success' | 'payment_failed' | 'refund_processed' | 'cancellation';
    title: string;
    message: string;
    relatedOrderId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map