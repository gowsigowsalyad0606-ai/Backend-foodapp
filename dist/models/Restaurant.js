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
const restaurantSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model('Restaurant', restaurantSchema);
//# sourceMappingURL=Restaurant.js.map