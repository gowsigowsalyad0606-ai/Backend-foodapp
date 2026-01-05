import mongoose, { Document } from 'mongoose';
export interface IMenuItem extends Document {
    restaurantId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isVeg: boolean;
    isBestseller: boolean;
    isAvailable: boolean;
    preparationTime: string;
    ingredients?: string[];
    allergens?: string[];
    nutritionInfo?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    customizations?: {
        name: string;
        options: {
            name: string;
            price: number;
        }[];
        required: boolean;
        maxSelections?: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMenuItem, {}, {}, {}, mongoose.Document<unknown, {}, IMenuItem, {}, {}> & IMenuItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=MenuItem.d.ts.map