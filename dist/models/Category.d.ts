import mongoose, { Document } from 'mongoose';
export interface ICategory extends Document {
    name: string;
    description: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    sortOrder: number;
    restaurantId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Category.d.ts.map