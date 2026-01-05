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
const CategorySchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Category', CategorySchema);
//# sourceMappingURL=Category.js.map