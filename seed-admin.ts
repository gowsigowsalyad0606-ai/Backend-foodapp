import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@foodbuddy.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Create admin account
    const admin = new User({
      name: 'System Admin',
      email: 'admin@foodbuddy.com',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin account created successfully');
    // Create restaurant partner account
    const partnerEmail = 'partner@foodbuddy.com';
    const existingPartner = await User.findOne({ email: partnerEmail });
    if (!existingPartner) {
      const partner = new User({
        name: 'Pizza Palace Owner',
        email: partnerEmail,
        password: 'partner123',
        role: 'restaurant',
        isVerified: true
      });
      await partner.save();
      console.log('✅ Partner account created successfully');
      console.log(`Email: ${partnerEmail}`);
      console.log('Password: partner123');
      console.log('Role: restaurant');
    }

    console.log('\n🚀 All set! You can now login with these accounts.');
  } catch (error) {
    console.error('❌ Error creating seeds:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
