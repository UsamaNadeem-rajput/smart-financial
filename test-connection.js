// Test script to check frontend-backend connection
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:8080/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test API endpoint
    const testResponse = await axios.get('http://localhost:8080/api/test');
    console.log('✅ API test:', testResponse.data);
    
    // Test registration endpoint (should fail but show it's reachable)
    try {
      await axios.post('http://localhost:8080/api/register', {});
    } catch (error) {
      if (error.response) {
        console.log('✅ Registration endpoint reachable:', error.response.status);
      }
    }
    
    console.log('🎉 Backend is accessible!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure backend server is running on port 8080');
    }
  }
}

testConnection();