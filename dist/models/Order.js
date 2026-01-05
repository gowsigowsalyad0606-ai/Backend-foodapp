"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const orderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    restaurantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Restaurant ID is required']
    },
    items: [{
            menuItemId: {
                type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Order', orderSchema);
//# sourceMappingURL=Order.js.map