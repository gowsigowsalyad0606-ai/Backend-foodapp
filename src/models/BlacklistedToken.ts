import mongoose, { Document, Schema } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const blacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL index to automatically remove expired documents
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IBlacklistedToken>('BlacklistedToken', blacklistedTokenSchema);
