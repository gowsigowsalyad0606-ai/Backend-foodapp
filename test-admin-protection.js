const http = require('http');

// Test admin login to get token
const loginData = JSON.stringify({
  email: 'admin@test.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('Admin Login Status:', res.statusCode);
    
    if (response.success && response.data.token) {
      const adminToken = response.data.token;
      console.log('✅ Got admin token');
      
      // Test admin-only route with valid token
      testAdminRoute(adminToken);
      
      // Test admin-only route with user token
      testWithUserToken();
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testAdminRoute(token) {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/menu-items',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': '0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nAdmin Route Test Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log('Admin Route Response:', d.toString());
    });
  });

  req.on('error', (e) => {
    console.error(`Admin route error: ${e.message}`);
  });

  req.end();
}

function testWithUserToken() {
  // First get user token
  const userLoginData = JSON.stringify({
    email: 'user@test.com',
    password: 'user123'
  });

  const userLoginOptions = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': userLoginData.length
    }
  };

  const userLoginReq = http.request(userLoginOptions, (res) => {
    let data = '';
    res.on('data', (d) => {
      data += d;
    });
    
    res.on('end', () => {
      const response = JSON.parse(data);
      if (response.success && response.data.token) {
        const userToken = response.data.token;
        console.log('✅ Got user token');
        
        // Try to access admin route with user token (should fail)
        testAdminRouteWithUserToken(userToken);
      }
    });
  });

  userLoginReq.write(userLoginData);
  userLoginReq.end();
}

function testAdminRouteWithUserToken(token) {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/menu-items',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': '0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nUser Accessing Admin Route Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log('User Access Response:', d.toString());
    });
  });

  req.on('error', (e) => {
    console.error(`User access error: ${e.message}`);
  });

  req.end();
}
