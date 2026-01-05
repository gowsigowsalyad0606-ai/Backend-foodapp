// Simple test to verify category endpoints are working
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
const testCategory = {
  name: 'Test Category',
  description: 'This is a test category'
};

async function testCategoryEndpoints() {
  try {
    console.log('🧪 Testing category endpoints...\n');

    // Test 1: Get all categories
    console.log('1. Testing GET /api/categories');
    try {
      const response = await axios.get(`${BASE_URL}/api/categories`);
      console.log('✅ GET /api/categories - SUCCESS');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ GET /api/categories - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 2: Create a category
    console.log('2. Testing POST /api/categories');
    try {
      const response = await axios.post(`${BASE_URL}/api/categories`, testCategory);
      console.log('✅ POST /api/categories - SUCCESS');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ POST /api/categories - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 3: Check if server is running
    console.log('3. Testing server health');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server health check - SUCCESS');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Server health check - FAILED');
      console.log('Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testCategoryEndpoints();
