import mongoose, { Document, Schema } from 'mongoose';

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

const menuItemSchema = new Schema<IMenuItem>({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Item image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  isVeg: {
    type: Boolean,
    required: [true, 'Vegetarian status is required'],
    default: true
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: String,
    required: [true, 'Preparation time is required'],
    match: [/^\d+\s(mins|hours)$/, 'Preparation time format should be "15 mins"']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true
  }],
  nutritionInfo: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    }
  },
  customizations: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        min: 0,
        default: 0
      }
    }],
    required: {
      type: Boolean,
      default: false
    },
    maxSelections: {
      type: Number,
      min: 1
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
