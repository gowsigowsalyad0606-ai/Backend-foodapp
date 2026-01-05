import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@foodbuddy.com' });
        if (admin) {
            console.log('✅ Admin user found:', admin.email);
            console.log('Role:', admin.role);
        } else {
            console.log('❌ Admin user NOT found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
