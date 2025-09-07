#!/usr/bin/env node

// Quick test script to verify the system works
const axios = require('axios').default;

async function testSystem() {
  console.log('🧪 Testing LearnMate System...\n');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Test 1: Server health check
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${baseURL}/health`).catch(() => null);
    
    if (healthResponse && healthResponse.status === 200) {
      console.log('✅ Server is running and healthy');
    } else {
      console.log('❌ Server is not responding. Please start the backend server first.');
      console.log('   Run: cd backend && node server.js');
      return;
    }
    
    // Test 2: Content API (should fail without auth)
    console.log('\n2️⃣ Testing content API (without auth - should fail)...');
    try {
      await axios.get(`${baseURL}/api/content`);
      console.log('❌ Content API should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Content API correctly requires authentication');
      } else {
        console.log('❓ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Check content library files exist
    console.log('\n3️⃣ Checking content library structure...');
    const fs = require('fs');
    const path = require('path');
    
    const contentPath = path.join(__dirname, 'services', 'shared', 'content_library');
    const coursesPath = path.join(contentPath, 'Courses');
    
    if (fs.existsSync(coursesPath)) {
      const courses = fs.readdirSync(coursesPath);
      console.log(`✅ Found ${courses.length} courses in content library:`);
      courses.forEach(course => console.log(`   📚 ${course}`));
      
      // Check if courses have metadata
      for (const course of courses) {
        const metadataPath = path.join(coursesPath, course, 'course_metadata.json');
        if (fs.existsSync(metadataPath)) {
          console.log(`   ✅ ${course} has metadata`);
        } else {
          console.log(`   ❌ ${course} missing metadata`);
        }
      }
    } else {
      console.log('❌ Content library not found');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('1. Start backend: cd backend && node server.js');
    console.log('2. Start frontend: cd frontend && npm start');
    console.log('3. Access: http://localhost:3000');
    console.log('4. System should load ONLY real content from library');
    console.log('5. No mock/dummy content should appear');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testSystem();
}

module.exports = { testSystem };
