const http = require('http');

// Test user registration
const registerData = JSON.stringify({
  name: 'Test User',
  email: 'user@test.com',
  password: 'user123'
});

const registerOptions = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const registerReq = http.request(registerOptions, (res) => {
  console.log(`\nUser Registration Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Registration Response:', d.toString());
  });
});

registerReq.on('error', (e) => {
  console.error(`Registration error: ${e.message}`);
});

registerReq.write(registerData);
registerReq.end();

// Test user login after a delay
setTimeout(() => {
  const loginData = JSON.stringify({
    email: 'user@test.com',
    password: 'user123'
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
    console.log(`\nUser Login Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log('Login Response:', d.toString());
    });
  });

  loginReq.on('error', (e) => {
    console.error(`Login error: ${e.message}`);
  });

  loginReq.write(loginData);
  loginReq.end();
}, 1000);
