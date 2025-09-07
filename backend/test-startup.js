#!/usr/bin/env node

/**
 * Comprehensive System Startup Test
 * Tests all critical components before starting the server
 */

const fs = require('fs');
const path = require('path');

// Load environment variables first
require('dotenv').config({ path: '../.env' });

console.log('🔍 Starting System Health Check...\n');

// 1. Test Environment Variables
console.log('1. Checking Environment Variables...');
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID', 'FIREBASE_API_KEY', 'GEMINI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.log('❌ Missing environment variables:', missingEnvVars);
} else {
  console.log('✅ Environment variables configured');
}

// 2. Test Database Connection
console.log('\n2. Testing Database Connection...');
try {
  const { databaseService } = require('./config/database');
  console.log('✅ Database service loaded');
  
  // Test basic database operations
  setTimeout(async () => {
    try {
      const testQuery = await databaseService.get("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('✅ Database connection working');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
    }
  }, 1000);
  
} catch (error) {
  console.log('❌ Database service failed:', error.message);
}

// 3. Test Firebase Configuration
console.log('\n3. Testing Firebase Configuration...');
try {
  const { initializeFirebase } = require('./config/firebase');
  initializeFirebase().then(() => {
    console.log('✅ Firebase configuration loaded');
  }).catch(error => {
    console.log('❌ Firebase configuration failed:', error.message);
  });
} catch (error) {
  console.log('❌ Firebase module failed:', error.message);
}

// 4. Test Content Library Access
console.log('\n4. Testing Content Library...');
const contentLibraryPath = path.join(__dirname, '../services/shared/content_library/Courses');
if (fs.existsSync(contentLibraryPath)) {
  const courseCount = fs.readdirSync(contentLibraryPath).length;
  console.log(`✅ Content library accessible (${courseCount} courses)`);
} else {
  console.log('❌ Content library not found at:', contentLibraryPath);
}

// 5. Test Model Dependencies
console.log('\n5. Testing Models...');
try {
  const UserProgress = require('./models/UserProgress');
  console.log('✅ UserProgress model loaded');
} catch (error) {
  console.log('❌ UserProgress model failed:', error.message);
}

// 6. Test Routes
console.log('\n6. Testing Routes...');
const routeFiles = ['user.js', 'content.js', 'auth.js'];
routeFiles.forEach(file => {
  try {
    require(`./routes/${file}`);
    console.log(`✅ ${file} route loaded`);
  } catch (error) {
    console.log(`❌ ${file} route failed:`, error.message);
  }
});

// 7. Test Required Directories
console.log('\n7. Testing Directory Structure...');
const requiredDirs = ['./database', './logs', './config', './models', './routes'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} exists`);
  } else {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created ${dir}`);
  }
});

setTimeout(() => {
  console.log('\n🏁 System Health Check Complete!');
  console.log('\nIf all components show ✅, the server should start successfully.');
  console.log('Run: node server.js\n');
}, 2000);
