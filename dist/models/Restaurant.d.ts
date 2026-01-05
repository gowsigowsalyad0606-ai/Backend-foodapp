import mongoose, { Document } from 'mongoose';
export interface IRestaurant extends Document {
    name: string;
    description: string;
    image: string;
    coverImage?: string;
    rating: number;
    deliveryTime: string;
    cuisines: string[];
    priceRange: string;
    discount?: string;
    isOpen: boolean;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    contact: {
        phone: string;
        email: string;
        website?: string;
    };
    operatingHours: {
        monday: {
            open: string;
            close: string;
        };
        tuesday: {
            open: string;
            close: string;
        };
        wednesday: {
            open: string;
            close: string;
        };
        thursday: {
            open: string;
            close: string;
        };
        friday: {
            open: string;
            close: string;
        };
        saturday: {
            open: string;
            close: string;
        };
        sunday: {
            open: string;
            close: string;
        };
    };
    deliveryFee: number;
    minOrderAmount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IRestaurant, {}, {}, {}, mongoose.Document<unknown, {}, IRestaurant, {}, {}> & IRestaurant & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Restaurant.d.ts.map