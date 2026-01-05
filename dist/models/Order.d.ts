import mongoose, { Document } from 'mongoose';
export interface IOrderItem {
    menuItemId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image: string;
    customizations?: {
        name: string;
        option: string;
        price: number;
    }[];
}
export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    restaurantId: mongoose.Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
    deliveryAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        instructions?: string;
    };
    paymentMethod: {
        type: 'card' | 'cash' | 'wallet' | 'upi';
        lastFour?: string;
        status: 'pending' | 'completed' | 'failed';
    };
    estimatedDeliveryTime: Date;
    actualDeliveryTime?: Date;
    specialInstructions?: string;
    paymentIntentId?: string;
    refundId?: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    rating?: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map