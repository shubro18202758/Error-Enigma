const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const logger = require('./logger');

let firebaseApp = null;
let adminApp = null;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

async function initializeFirebase() {
  try {
    // Initialize client SDK only if not already initialized
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase client SDK initialized');
    }

    // Initialize Admin SDK only if not already initialized
    if (!adminApp) {
      // Check if admin app already exists
      try {
        adminApp = admin.app(); // Get existing default app
        console.log('✅ Firebase Admin SDK already initialized');
      } catch (appNotFoundError) {
        // No existing app, create new one
        try {
          // Try to use service account file first
          const path = require('path');
          const fs = require('fs');
          const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
          
          if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            adminApp = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('✅ Firebase Admin initialized with service account file');
          } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            // Use environment variables
            const serviceAccount = {
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            };
            
            adminApp = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
            console.log('✅ Firebase Admin initialized with environment variables');
          } else {
            // Development mode: Use project ID only
            adminApp = admin.initializeApp({
              projectId: process.env.FIREBASE_PROJECT_ID || 'error-404-6b343',
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'error-404-6b343.appspot.com'
            });
            console.log('⚠️  Firebase Admin initialized in development mode (frontend auth only)');
          }
        } catch (serviceAccountError) {
          // Fallback to basic initialization
          adminApp = admin.initializeApp({
            projectId: 'error-404-6b343',
            storageBucket: 'error-404-6b343.appspot.com'
          });
          console.log('⚠️  Firebase Admin initialized with fallback configuration');
        }
      }
    }

    return { firebaseApp, adminApp };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    // Don't throw error to allow server to start without Firebase in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return { firebaseApp: null, adminApp: null };
  }
}

// Firebase services
const getFirestore = () => {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore();
};

const getAuth = () => {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth();
};

const getStorage = () => {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.storage();
};

// Verify Firebase ID token
async function verifyIdToken(idToken) {
  try {
    if (!adminApp) {
      throw new Error('Firebase not initialized');
    }
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
}

// Get user by UID
async function getUserById(uid) {
  try {
    const userRecord = await getAuth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Failed to get user:', error);
    throw new Error('User not found');
  }
}

// Create custom token
async function createCustomToken(uid, additionalClaims = {}) {
  try {
    const customToken = await getAuth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Failed to create custom token:', error);
    throw error;
  }
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getStorage,
  verifyIdToken,
  getUserById,
  createCustomToken,
  firebaseConfig
};
