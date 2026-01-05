// Test the authentication system
const http = require('http');

// Test health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  console.log(`Health Check Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Health Response:', d.toString());
  });
});

healthReq.on('error', (e) => {
  console.error(`Health check error: ${e.message}`);
});

healthReq.end();

// Test login endpoint
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
  console.log(`\nLogin Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Login Response:', d.toString());
  });
});

loginReq.on('error', (e) => {
  console.error(`Login error: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();
