import mongoose, { Document, Schema } from 'mongoose';

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

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: '🍽️'
  },
  color: {
    type: String,
    default: '#FF7A00',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false
  },
  isGlobal: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ restaurantId: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
