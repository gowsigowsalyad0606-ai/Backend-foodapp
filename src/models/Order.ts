import mongoose, { Document, Schema } from 'mongoose';

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
  deliveryPartnerId?: mongoose.Types.ObjectId;
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
  commissionRate: number;
  commissionAmount: number;
  netPayout: number;
  merchantPayoutStatus: 'pending' | 'processed';
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  deliveryPartnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      required: true
    },
    customizations: [{
      name: String,
      option: String,
      price: {
        type: Number,
        min: 0
      }
    }]
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      maxlength: [200, 'Instructions cannot exceed 200 characters']
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'cash', 'wallet', 'upi'],
      required: true
    },
    lastFour: {
      type: String,
      match: [/^\d{4}$/, 'Last four digits must be exactly 4 digits']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: {
    type: Date
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  paymentIntentId: {
    type: String
  },
  refundId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 10 // 10% default commission
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  netPayout: {
    type: Number,
    default: 0
  },
  merchantPayoutStatus: {
    type: String,
    enum: ['pending', 'processed'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);
