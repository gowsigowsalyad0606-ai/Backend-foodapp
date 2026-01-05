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
const menuItemSchema = new mongoose_1.Schema({
    restaurantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('MenuItem', menuItemSchema);
//# sourceMappingURL=MenuItem.js.map