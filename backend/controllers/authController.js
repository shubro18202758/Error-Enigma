const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSequelize } = require('../config/database');
const { getAuth } = require('../config/firebase');
const logger = require('../config/logger');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, name, role = 'student' } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required'
        });
      }

      const sequelize = getSequelize();
      
      // Check if user already exists
      const existingUser = await sequelize.query(
        'SELECT * FROM users WHERE email = ?',
        { 
          replacements: [email],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user in database
      const [results] = await sequelize.query(
        `INSERT INTO users (email, password_hash, display_name, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [email, hashedPassword, name, role]
        }
      );

      const userId = results.insertId || results;

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId, 
          email, 
          role,
          name 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          displayName: name,
          role
        },
        token
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password, firebaseToken } = req.body;
      
      const sequelize = getSequelize();

      // Firebase authentication
      if (firebaseToken) {
        try {
          const auth = getAuth();
          const decodedToken = await auth.verifyIdToken(firebaseToken);
          
          // Find or create user
          let [user] = await sequelize.query(
            'SELECT * FROM users WHERE email = ? OR firebase_uid = ?',
            {
              replacements: [decodedToken.email, decodedToken.uid],
              type: sequelize.QueryTypes.SELECT
            }
          );

          if (!user) {
            // Create new user from Firebase data
            const [results] = await sequelize.query(
              `INSERT INTO users (email, firebase_uid, display_name, role, created_at, updated_at)
               VALUES (?, ?, ?, 'student', NOW(), NOW())`,
              {
                replacements: [decodedToken.email, decodedToken.uid, decodedToken.name || decodedToken.email.split('@')[0]]
              }
            );
            
            const userId = results.insertId || results;
            user = {
              id: userId,
              email: decodedToken.email,
              firebase_uid: decodedToken.uid,
              display_name: decodedToken.name,
              role: 'student'
            };
          }

          const jwtToken = jwt.sign(
            {
              userId: user.id,
              email: user.email,
              role: user.role,
              name: user.display_name
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
          );

          return res.json({
            success: true,
            message: 'Firebase authentication successful',
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role
            },
            token: jwtToken
          });

        } catch (firebaseError) {
          logger.error('Firebase auth error:', firebaseError);
          return res.status(401).json({
            success: false,
            message: 'Invalid Firebase token'
          });
        }
      }

      // Email/password authentication
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const [user] = await sequelize.query(
        'SELECT * FROM users WHERE email = ?',
        {
          replacements: [email],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (!user || !user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await sequelize.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        { replacements: [user.id] }
      );

      // Generate token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.display_name
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role
        },
        token
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Generate new token
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token: newToken
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  // Logout (optional - mainly for logging)
  static async logout(req, res) {
    try {
      logger.info(`User logged out: ${req.user?.email}`);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const sequelize = getSequelize();
      
      const [user] = await sequelize.query(
        `SELECT id, email, display_name, role, created_at, last_login,
                competency_level, total_points, streak_days
         FROM users WHERE id = ?`,
        {
          replacements: [req.user.userId],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          competencyLevel: user.competency_level || 1,
          totalPoints: user.total_points || 0,
          streakDays: user.streak_days || 0,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;
