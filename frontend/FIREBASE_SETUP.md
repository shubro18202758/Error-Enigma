# Firebase Setup Instructions

## Getting the Missing Configuration Values

You need to get the correct `messagingSenderId` and `appId` from your Firebase project:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `error-404-6b343`
3. **Go to Project Settings** (gear icon)
4. **Scroll down to "Your apps"** section
5. **Click on the web app** (</> icon) or create one if it doesn't exist
6. **Copy the configuration object**

Your config should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4",
  authDomain: "error-404-6b343.firebaseapp.com",
  projectId: "error-404-6b343",
  storageBucket: "error-404-6b343.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Enable Authentication Methods

1. **Go to Authentication** > **Sign-in method**
2. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Save

3. **Enable Google Sign-In**:
   - Click on "Google" 
   - Toggle "Enable"
   - Add your email as a test user
   - Save

## Update Frontend Configuration

Replace the placeholder values in `frontend/src/config/firebase.ts` with your actual values:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4",
  authDomain: "error-404-6b343.firebaseapp.com", 
  projectId: "error-404-6b343",
  storageBucket: "error-404-6b343.appspot.com",
  messagingSenderId: "REPLACE_WITH_ACTUAL_VALUE",
  appId: "REPLACE_WITH_ACTUAL_VALUE"
};
```

## Test Authentication

After updating the configuration:

1. **Save the file**
2. **Refresh your browser**
3. **Try signing up with email/password**
4. **Try Google Sign-In**

Both should now work and redirect you to the dashboard with your real user data!

## Troubleshooting

If you get errors:
- Check browser console for detailed error messages
- Verify all Firebase config values are correct
- Make sure authentication methods are enabled in Firebase Console
- Check that your domain is added to authorized domains (usually localhost:3000 is auto-added)
