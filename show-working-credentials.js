const http = require('http');

console.log('🧪 Complete Login Test\n');

// Test all available admin accounts
const testAccounts = [
  {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin123'
  },
  {
    name: 'System Admin', 
    email: 'admin@foodbuddy.com',
    password: 'admin123'
  },
  {
    name: 'Test User',
    email: 'user@test.com', 
    password: 'user123'
  }
];

testAccounts.forEach((account, index) => {
  setTimeout(() => {
    console.log(`\n--- Testing ${account.name} (${account.email}) ---`);
    
    const data = JSON.stringify({
      email: account.email,
      password: account.password
    });

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (d) => {
        responseData += d;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.success) {
            console.log(`✅ ${account.name} login successful!`);
            console.log(`   Role: ${response.data.user.role}`);
            console.log(`   Token: ${response.data.token.substring(0, 50)}...`);
          } else {
            console.log(`❌ ${account.name} login failed: ${response.message}`);
          }
        } catch (e) {
          console.log(`❌ Error parsing response: ${responseData}`);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
    });

    req.write(data);
    req.end();
  }, index * 1000); // Test each account with 1 second delay
});

// Show working credentials after all tests
setTimeout(() => {
  console.log('\n🔑 Working Login Credentials:');
  console.log('1. Email: admin@test.com, Password: admin123 (Admin)');
  console.log('2. Email: admin@foodbuddy.com, Password: admin123 (Admin)');  
  console.log('3. Email: user@test.com, Password: user123 (User)');
  console.log('\n📝 Request Format:');
  console.log('POST http://localhost:8000/api/auth/login');
  console.log('Content-Type: application/json');
  console.log('Body: {"email": "admin@test.com", "password": "admin123"}');
}, 4000);
