// Test script to check frontend-backend connection
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic server response
    console.log('1. Testing basic server...');
    const basicResponse = await axios.get('http://localhost:8080/');
    console.log('✅ Basic server response:', basicResponse.status);
    
    // Test health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:8080/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test API endpoint
    console.log('3. Testing API endpoint...');
    const testResponse = await axios.get('http://localhost:8080/api/test');
    console.log('✅ API test:', testResponse.data);
    
    // Test registration endpoint (should fail but show it's reachable)
    console.log('4. Testing registration endpoint...');
    try {
      await axios.post('http://localhost:8080/api/register', {});
    } catch (error) {
      if (error.response) {
        console.log('✅ Registration endpoint reachable (expected error):', error.response.status, error.response.data.error);
      }
    }
    
    console.log('🎉 Backend is accessible!');
    
  } catch (error) {
    console.error('❌ Connection failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure backend server is running on port 8080');
      console.log('💡 Run: cd server && npm start');
    }
  }
}

testConnection();