import mongoose, { Document, Types } from 'mongoose';
interface IAddress {
    _id: Types.ObjectId;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
}
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'user' | 'admin';
    addresses: IAddress[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map