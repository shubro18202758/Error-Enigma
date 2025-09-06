const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// For development, we'll use a simplified approach
console.log('Initializing Firebase Admin SDK...');

let app;
try {
  // Try to use service account key if it exists
  const serviceAccount = require('./serviceAccountKey.json');
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'error-404-6b343'
  });
  console.log('✅ Firebase Admin initialized with service account');
} catch (error) {
  console.log('⚠️  Service account key not found, using simplified initialization...');
  
  // For development, create a temporary service account config
  // This won't work for production, but allows testing the frontend
  try {
    // Create minimal config for development
    const serviceAccount = {
      type: "service_account",
      project_id: "error-404-6b343",
      private_key_id: "dev-key-id",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8Q+xM5g...\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk@error-404-6b343.iam.gserviceaccount.com",
      client_id: "123456789",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };
    
    // Initialize with mock credentials for frontend-only testing
    app = admin.initializeApp({
      projectId: 'error-404-6b343'
    });
    console.log('⚠️  Firebase Admin initialized in development mode (frontend auth only)');
  } catch (initError) {
    console.error('❌ Failed to initialize Firebase Admin:', initError.message);
    // Create minimal app instance
    app = admin.initializeApp({
      projectId: 'error-404-6b343'
    });
  }
}

// Note: In development mode, backend database operations may not work
// But frontend Firebase auth will still function normally
const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
