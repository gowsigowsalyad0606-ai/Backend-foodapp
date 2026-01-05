const http = require('http');

// Test login with different credentials
console.log('Testing login with admin credentials...');

const adminData = JSON.stringify({
  email: 'admin@test.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': adminData.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    
    // Try with original admin credentials
    console.log('\n--- Testing with original admin credentials ---');
    testOriginalAdmin();
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(adminData);
req.end();

function testOriginalAdmin() {
  const originalData = JSON.stringify({
    email: 'admin@foodbuddy.com',
    password: 'admin123'
  });

  const options2 = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': originalData.length
    }
  };

  const req2 = http.request(options2, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (d) => {
      data += d;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req2.write(originalData);
  req2.end();
}
