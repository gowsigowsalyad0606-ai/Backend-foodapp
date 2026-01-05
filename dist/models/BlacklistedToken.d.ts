import mongoose, { Document } from 'mongoose';
export interface IBlacklistedToken extends Document {
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
declare const _default: mongoose.Model<IBlacklistedToken, {}, {}, {}, mongoose.Document<unknown, {}, IBlacklistedToken, {}, {}> & IBlacklistedToken & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=BlacklistedToken.d.ts.map