import AuthService from './src/services/authService';
import User from './src/models/User';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testRoleBasedAuth = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Role-Based Authentication System\n');

    // Test 1: Create test users
    console.log('\n📝 Creating test users...');
    
    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'user@test.com',
      password: 'user123',
      phone: '1234567890',
      role: 'user'
    });
    await testUser.save();
    console.log('✅ Test user created: user@test.com / user123');

    // Create test admin
    const testAdmin = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      phone: '0987654321',
      role: 'admin'
    });
    await testAdmin.save();
    console.log('✅ Test admin created: admin@test.com / admin123');

    // Test 2: User Login
    console.log('\n🔐 Testing User Login...');
    const userLogin = await AuthService.login('user@test.com', 'user123');
    console.log('User Login Result:', userLogin);

    // Test 3: Admin Login
    console.log('\n👑 Testing Admin Login...');
    const adminLogin = await AuthService.login('admin@test.com', 'admin123');
    console.log('Admin Login Result:', adminLogin);

    // Test 4: Token Verification
    console.log('\n🔍 Testing Token Verification...');
    if (userLogin.success && adminLogin.success) {
      const userToken = userLogin.data!.token;
      const adminToken = adminLogin.data!.token;

      const userPayload = AuthService.verifyToken(userToken);
      const adminPayload = AuthService.verifyToken(adminToken);

      console.log('User Token Payload:', userPayload);
      console.log('Admin Token Payload:', adminPayload);

      // Test 5: Role Checking
      console.log('\n🛡️ Testing Role Checking...');
      console.log('Is user token valid role?', AuthService.isUser(userPayload?.role || ''));
      console.log('Is admin token valid role?', AuthService.isAdmin(adminPayload?.role || ''));

      // Test 6: Logout
      console.log('\n🚪 Testing Logout...');
      const userLogout = await AuthService.logout(userToken);
      const adminLogout = await AuthService.logout(adminToken);
      
      console.log('User Logout Result:', userLogout);
      console.log('Admin Logout Result:', adminLogout);

      // Test 7: Blacklisted Token Verification
      console.log('\n🚫 Testing Blacklisted Token...');
      const blacklistedCheck = await AuthService.isTokenBlacklisted(userToken);
      console.log('Is user token blacklisted after logout?', blacklistedCheck);
    }

    console.log('\n✅ Role-based authentication test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testRoleBasedAuth();
