const express = require('express');
const { auth, db } = require('../config/firebaseAdmin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Register with email/password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, clanId } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Hash password for additional storage
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user data in Firestore
    const userData = {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      createdAt: new Date(),
      emailVerified: false,
      clanId: null, // Clan membership is optional
      progress: {
        totalTopics: 0,
        completedTopics: 0,
        lastActivity: new Date()
      },
      profile: {
        avatar: null,
        bio: '',
        level: 1,
        points: 0
      }
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // If clan ID provided, add user to clan (optional)
    if (clanId) {
      await addUserToClan(userRecord.uid, clanId);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        clanId: null // Users start without a clan
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Get user from Firestore
    const userQuery = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    
    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate custom token for Firebase Auth
    const customToken = await auth.createCustomToken(userData.uid);

    // Update last login
    await db.collection('users').doc(userData.uid).update({
      lastLogin: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful',
      customToken,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        clanId: userData.clanId,
        progress: userData.progress
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Google Sign-In verification
router.post('/google', async (req, res) => {
  try {
    const { idToken, clanId } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Google ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;

    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    let userData;
    if (!userDoc.exists) {
      // Create new user
      userData = {
        uid,
        email: email.toLowerCase(),
        name,
        avatar: picture,
        createdAt: new Date(),
        emailVerified: email_verified,
        authProvider: 'google',
        clanId: null, // Users start without a clan
        progress: {
          totalTopics: 0,
          completedTopics: 0,
          lastActivity: new Date()
        },
        profile: {
          avatar: picture,
          bio: '',
          level: 1,
          points: 0
        }
      };

      await db.collection('users').doc(uid).set(userData);

      // Only add to clan if explicitly requested during Google sign-in
      if (clanId) {
        await addUserToClan(uid, clanId);
        userData.clanId = clanId; // Update the response data
      }
    } else {
      // Update existing user
      userData = userDoc.data();
      await db.collection('users').doc(uid).update({
        lastLogin: new Date(),
        avatar: picture,
        emailVerified: email_verified
      });
    }

    res.json({
      success: true,
      message: 'Google sign-in successful',
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        clanId: userData.clanId,
        progress: userData.progress
      }
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(400).json({
      success: false,
      message: 'Google sign-in failed',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    // Firebase handles client-side logout
    // We can log this event or perform cleanup if needed
    await db.collection('users').doc(req.user.uid).update({
      lastLogout: new Date()
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Verify token
router.get('/verify', authenticateUser, async (req, res) => {
  try {
    // Get latest user data
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        clanId: userData.clanId,
        progress: userData.progress,
        profile: userData.profile
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
});

// Helper function to add user to clan
async function addUserToClan(userId, clanId) {
  try {
    const clanRef = db.collection('clans').doc(clanId);
    const clanDoc = await clanRef.get();

    if (clanDoc.exists) {
      await clanRef.update({
        members: admin.firestore.FieldValue.arrayUnion(userId),
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });

      // Update user's clan ID
      await db.collection('users').doc(userId).update({
        clanId: clanId,
        joinedClanAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error adding user to clan:', error);
  }
}

module.exports = router;
