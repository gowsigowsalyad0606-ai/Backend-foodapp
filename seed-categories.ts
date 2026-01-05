import mongoose from 'mongoose';
import Category from './src/models/Category';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const defaultCategories = [
  {
    name: 'Appetizers',
    description: 'Start your meal with our delicious appetizers and small bites',
    icon: '🥗',
    color: '#FF6B6B',
    isActive: true,
    sortOrder: 1,
    isGlobal: true
  },
  {
    name: 'Main Course',
    description: 'Hearty and satisfying main dishes for a complete meal',
    icon: '🍽️',
    color: '#4ECDC4',
    isActive: true,
    sortOrder: 2,
    isGlobal: true
  },
  {
    name: 'Burgers',
    description: 'Juicy burgers with premium ingredients and fresh toppings',
    icon: '🍔',
    color: '#FF7A00',
    isActive: true,
    sortOrder: 3,
    isGlobal: true
  },
  {
    name: 'Pizza',
    description: 'Authentic wood-fired pizzas with fresh ingredients',
    icon: '🍕',
    color: '#E74C3C',
    isActive: true,
    sortOrder: 4,
    isGlobal: true
  },
  {
    name: 'Sushi & Rolls',
    description: 'Fresh sushi and expertly crafted rolls',
    icon: '🍱',
    color: '#9B59B6',
    isActive: true,
    sortOrder: 5,
    isGlobal: true
  },
  {
    name: 'Pasta',
    description: 'Classic Italian pasta dishes with rich sauces',
    icon: '🍝',
    color: '#F39C12',
    isActive: true,
    sortOrder: 6,
    isGlobal: true
  },
  {
    name: 'Salads',
    description: 'Fresh and healthy salads with premium ingredients',
    icon: '🥬',
    color: '#2ECC71',
    isActive: true,
    sortOrder: 7,
    isGlobal: true
  },
  {
    name: 'Soups',
    description: 'Warm and comforting soups made from scratch',
    icon: '🍲',
    color: '#E67E22',
    isActive: true,
    sortOrder: 8,
    isGlobal: true
  },
  {
    name: 'Desserts',
    description: 'Indulgent sweet treats to end your meal perfectly',
    icon: '🍰',
    color: '#FF69B4',
    isActive: true,
    sortOrder: 9,
    isGlobal: true
  },
  {
    name: 'Beverages',
    description: 'Refreshing drinks and beverages to complement your meal',
    icon: '🥤',
    color: '#3498DB',
    isActive: true,
    sortOrder: 10,
    isGlobal: true
  },
  {
    name: 'Sides',
    description: 'Perfect side dishes to complement your main course',
    icon: '🍟',
    color: '#95A5A6',
    isActive: true,
    sortOrder: 11,
    isGlobal: true
  },
  {
    name: 'Breakfast',
    description: 'Start your day with our delicious breakfast options',
    icon: '🍳',
    color: '#F1C40F',
    isActive: true,
    sortOrder: 12,
    isGlobal: true
  },
  {
    name: 'Tacos',
    description: 'Authentic Mexican tacos with fresh ingredients',
    icon: '🌮',
    color: '#E74C3C',
    isActive: true,
    sortOrder: 13,
    isGlobal: true
  },
  {
    name: 'Asian Cuisine',
    description: 'Flavorful Asian dishes from various regions',
    icon: '🥢',
    color: '#8E44AD',
    isActive: true,
    sortOrder: 14,
    isGlobal: true
  },
  {
    name: 'Healthy Options',
    description: 'Nutritious and healthy meal choices',
    icon: '🥑',
    color: '#27AE60',
    isActive: true,
    sortOrder: 15,
    isGlobal: true
  },
  {
    name: 'Kids Menu',
    description: 'Kid-friendly meals and smaller portions',
    icon: '🧸',
    color: '#FFB6C1',
    isActive: true,
    sortOrder: 16,
    isGlobal: true
  },
  {
    name: 'Special Combos',
    description: 'Value-packed combo meals and special offers',
    icon: '🎁',
    color: '#FF8C00',
    isActive: true,
    sortOrder: 17,
    isGlobal: true
  },
  {
    name: 'Seafood',
    description: 'Fresh seafood dishes from sustainable sources',
    icon: '🦐',
    color: '#00CED1',
    isActive: true,
    sortOrder: 18,
    isGlobal: true
  },
  {
    name: 'Vegetarian',
    description: 'Delicious vegetarian and plant-based options',
    icon: '🌱',
    color: '#2ECC71',
    isActive: true,
    sortOrder: 19,
    isGlobal: true
  },
  {
    name: 'Grill & BBQ',
    description: 'Smoky grilled items and BBQ specialties',
    icon: '🔥',
    color: '#D35400',
    isActive: true,
    sortOrder: 20,
    isGlobal: true
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories (optional - remove if you want to keep existing)
    await Category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // Insert default categories
    const insertedCategories = await Category.insertMany(defaultCategories);
    console.log(`🎉 Successfully seeded ${insertedCategories.length} categories:`);
    
    insertedCategories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.icon} ${category.name} (${category.color})`);
    });

    console.log('\n✨ Category seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding function
seedCategories();
