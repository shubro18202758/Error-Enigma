const express = require('express');
const request = require('supertest');

// Simple test to verify the API is working
async function testAPI() {
  try {
    // Import your server (make sure to update the path if needed)
    const app = require('./server');
    
    // Test health endpoint
    const response = await request(app).get('/health');
    
    console.log('✅ API Health Check:', response.status);
    console.log('Response:', response.body);
    
    if (response.status === 200) {
      console.log('🎉 Backend API is working correctly!');
    } else {
      console.log('❌ Backend API has issues');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('📝 Make sure to:');
    console.log('   1. Download Firebase service account key');
    console.log('   2. Place it as config/serviceAccountKey.json');
    console.log('   3. Update .env file with correct values');
  }
}

// Run the test
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
