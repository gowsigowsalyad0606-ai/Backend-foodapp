"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const MenuItem_1 = __importDefault(require("../models/MenuItem"));
const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodbuddy');
        console.log('✅ Connected to MongoDB');
        // Clear existing data
        await User_1.default.deleteMany({});
        await Restaurant_1.default.deleteMany({});
        await MenuItem_1.default.deleteMany({});
        console.log('🗑️ Cleared existing data');
        // Create admin user
        const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
        const admin = new User_1.default({
            name: 'Admin User',
            email: 'admin@foodbuddy.com',
            password: adminPassword,
            role: 'admin'
        });
        await admin.save();
        console.log('👤 Created admin user');
        // Create regular user
        const userPassword = await bcryptjs_1.default.hash('user123', 10);
        const regularUser = new User_1.default({
            name: 'John Doe',
            email: 'john@example.com',
            password: userPassword,
            phone: '5551234567',
            role: 'user',
            addresses: [{
                    street: '123 Food Street',
                    city: 'Downtown City',
                    state: 'CA',
                    zipCode: '12345',
                    isDefault: true
                }]
        });
        await regularUser.save();
        console.log('👤 Created regular user');
        // Create restaurants
        const restaurants = [
            {
                name: 'Pizza Palace',
                description: 'Authentic Italian pizza with fresh ingredients and traditional recipes',
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&crop=center',
                rating: 4.5,
                deliveryTime: '25-30 mins',
                cuisines: ['Italian', 'Pizza', 'Pasta'],
                priceRange: '$$',
                discount: '50% OFF',
                isOpen: true,
                address: {
                    street: '123 Pizza Lane',
                    city: 'Food City',
                    state: 'CA',
                    zipCode: '12345',
                    coordinates: { lat: 34.0522, lng: -118.2437 }
                },
                contact: {
                    phone: '555-0101',
                    email: 'info@pizzapalace.com'
                },
                operatingHours: {
                    monday: { open: '11:00', close: '22:00' },
                    tuesday: { open: '11:00', close: '22:00' },
                    wednesday: { open: '11:00', close: '22:00' },
                    thursday: { open: '11:00', close: '22:00' },
                    friday: { open: '11:00', close: '23:00' },
                    saturday: { open: '11:00', close: '23:00' },
                    sunday: { open: '12:00', close: '21:00' }
                },
                deliveryFee: 2.99,
                minOrderAmount: 15
            },
            {
                name: 'Burger Barn',
                description: 'Juicy burgers and American comfort food classics',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&crop=center',
                rating: 4.2,
                deliveryTime: '20-25 mins',
                cuisines: ['American', 'Burgers', 'Fast Food'],
                priceRange: '$',
                discount: '30% OFF',
                isOpen: true,
                address: {
                    street: '456 Burger Blvd',
                    city: 'Food City',
                    state: 'CA',
                    zipCode: '12345',
                    coordinates: { lat: 34.0522, lng: -118.2437 }
                },
                contact: {
                    phone: '555-0102',
                    email: 'info@burgerbarn.com'
                },
                operatingHours: {
                    monday: { open: '10:00', close: '23:00' },
                    tuesday: { open: '10:00', close: '23:00' },
                    wednesday: { open: '10:00', close: '23:00' },
                    thursday: { open: '10:00', close: '23:00' },
                    friday: { open: '10:00', close: '00:00' },
                    saturday: { open: '10:00', close: '00:00' },
                    sunday: { open: '10:00', close: '23:00' }
                },
                deliveryFee: 1.99,
                minOrderAmount: 10
            },
            {
                name: 'Sushi Spot',
                description: 'Fresh Japanese sushi and authentic Asian cuisine',
                image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop&crop=center',
                rating: 4.7,
                deliveryTime: '30-35 mins',
                cuisines: ['Japanese', 'Sushi', 'Asian'],
                priceRange: '$$$',
                isOpen: true,
                address: {
                    street: '789 Sushi Street',
                    city: 'Food City',
                    state: 'CA',
                    zipCode: '12345',
                    coordinates: { lat: 34.0522, lng: -118.2437 }
                },
                contact: {
                    phone: '555-0103',
                    email: 'info@sushispot.com'
                },
                operatingHours: {
                    monday: { open: '12:00', close: '21:00' },
                    tuesday: { open: '12:00', close: '21:00' },
                    wednesday: { open: '12:00', close: '21:00' },
                    thursday: { open: '12:00', close: '21:00' },
                    friday: { open: '12:00', close: '22:00' },
                    saturday: { open: '12:00', close: '22:00' },
                    sunday: { open: '12:00', close: '20:00' }
                },
                deliveryFee: 4.99,
                minOrderAmount: 25
            }
        ];
        const createdRestaurants = await Restaurant_1.default.insertMany(restaurants);
        console.log('🏪 Created restaurants');
        // Create menu items for each restaurant
        const menuItems = [
            // Pizza Palace items
            {
                restaurantId: createdRestaurants[0]._id,
                name: 'Margherita Pizza',
                description: 'Fresh mozzarella, tomato sauce, basil leaves on thin crust',
                price: 12.99,
                image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=400&fit=crop&crop=center',
                category: 'Pizza',
                isVeg: true,
                isBestseller: true,
                preparationTime: '15 mins'
            },
            {
                restaurantId: createdRestaurants[0]._id,
                name: 'Pepperoni Pizza',
                description: 'Spicy pepperoni, mozzarella, tomato sauce',
                price: 14.99,
                image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop&crop=center',
                category: 'Pizza',
                isVeg: false,
                preparationTime: '15 mins'
            },
            {
                restaurantId: createdRestaurants[0]._id,
                name: 'Caesar Salad',
                description: 'Romaine lettuce, croutons, parmesan, caesar dressing',
                price: 8.99,
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop&crop=center',
                category: 'Salads',
                isVeg: true,
                preparationTime: '5 mins'
            },
            // Burger Barn items
            {
                restaurantId: createdRestaurants[1]._id,
                name: 'Classic Cheeseburger',
                description: 'Juicy beef patty, cheese, lettuce, tomato, special sauce',
                price: 9.99,
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop&crop=center',
                category: 'Burgers',
                isVeg: false,
                isBestseller: true,
                preparationTime: '10 mins'
            },
            {
                restaurantId: createdRestaurants[1]._id,
                name: 'Crispy French Fries',
                description: 'Golden crispy fries with sea salt',
                price: 4.99,
                image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop&crop=center',
                category: 'Sides',
                isVeg: true,
                preparationTime: '8 mins'
            },
            // Sushi Spot items
            {
                restaurantId: createdRestaurants[2]._id,
                name: 'Salmon Sushi Roll',
                description: 'Fresh salmon, avocado, cucumber, sushi rice',
                price: 16.99,
                image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop&crop=center',
                category: 'Main Course',
                isVeg: false,
                isBestseller: true,
                preparationTime: '20 mins'
            },
            {
                restaurantId: createdRestaurants[2]._id,
                name: 'Vegetable Tempura',
                description: 'Lightly battered and fried vegetables with dipping sauce',
                price: 12.99,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop&crop=center',
                category: 'Appetizers',
                isVeg: true,
                preparationTime: '12 mins'
            }
        ];
        await MenuItem_1.default.insertMany(menuItems);
        console.log('🍔 Created menu items');
        console.log('✅ Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@foodbuddy.com / admin123');
        console.log('User: john@example.com / user123');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};
seedData();
//# sourceMappingURL=seed.js.map