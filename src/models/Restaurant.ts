import mongoose, { Document, Schema } from 'mongoose';

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
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  ownerId?: mongoose.Types.ObjectId;
  fssaiNumber?: string;
  gstin?: string;
  onboardingStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  deliveryFee: number;
  minOrderAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Restaurant image is required']
  },
  coverImage: {
    type: String
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  deliveryTime: {
    type: String,
    default: '25-30 mins'
  },
  cuisines: [{
    type: String,
    trim: true
  }],
  priceRange: {
    type: String,
    default: '$$'
  },
  discount: {
    type: String,
    match: [/^\d+% OFF$/, 'Discount format should be "50% OFF"']
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  address: {
    street: {
      type: String,
      default: 'Not provided'
    },
    city: {
      type: String,
      default: 'Unknown'
    },
    state: {
      type: String,
      default: 'Unknown'
    },
    zipCode: {
      type: String,
      default: '00000'
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  contact: {
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String
    }
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fssaiNumber: {
    type: String,
    trim: true
  },
  gstin: {
    type: String,
    trim: true
  },
  onboardingStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  deliveryFee: {
    type: Number,
    min: [0, 'Delivery fee cannot be negative'],
    default: 2.99
  },
  minOrderAmount: {
    type: Number,
    min: [0, 'Minimum order amount cannot be negative'],
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
