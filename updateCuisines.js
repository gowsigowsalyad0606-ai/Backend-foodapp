// Script to update restaurant cuisines in MongoDB
// Run with: node updateCuisines.js

const mongoose = require('mongoose');

// MongoDB connection string - update if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodbuddy';

const cuisineUpdates = [
    { name: 'Burger Palace', cuisines: ['Burgers', 'American', 'Fast Food'] },
    { name: 'Pizza Paradise', cuisines: ['Pizza', 'Italian'] },
    { name: 'Sushi Master', cuisines: ['Sushi', 'Japanese'] },
    { name: 'Taco Fiesta', cuisines: ['Mexican', 'Tacos'] },
    { name: 'Dragon Wok', cuisines: ['Chinese', 'Asian'] },
    { name: 'Green Garden', cuisines: ['Salads', 'Vegetarian', 'Healthy'] },
    { name: 'Test', cuisines: ['Test'] }
];

async function updateCuisines() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
            name: String,
            cuisines: [String]
        }, { strict: false }));

        for (const update of cuisineUpdates) {
            const result = await Restaurant.updateOne(
                { name: update.name },
                { $set: { cuisines: update.cuisines } }
            );
            console.log(`${update.name}: ${result.modifiedCount > 0 ? 'Updated' : 'Not found'}`);
        }

        console.log('Done!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

updateCuisines();
