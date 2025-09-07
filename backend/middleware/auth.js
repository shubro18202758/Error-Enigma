const { verifyIdToken, getUserById } = require('../config/firebase');
const { AppError, catchAsync } = require('./errorHandler');
const jwt = require('jsonwebtoken');

// Firebase token authentication
const authenticateToken = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401, 'NO_TOKEN'));
  }

  try {
    // 2) Verify token
    let decodedToken;
    
    // Try Firebase ID token first
    try {
      decodedToken = await verifyIdToken(token);
      
      // Add user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.display_name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified,
        role: decodedToken.role || 'student',
        authProvider: 'firebase'
      };
      
    } catch (firebaseError) {
      // Fallback to JWT token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.user.authProvider = 'jwt';
      } catch (jwtError) {
        return next(new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN'));
      }
    }

    next();
  } catch (error) {
    return next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
});

// Role-based authorization
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    next();
  };
};

// Check if user is authenticated (optional)
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decodedToken = await verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.display_name,
        picture: decodedToken.picture,
        role: decodedToken.role || 'student'
      };
    } catch (error) {
      // Continue without user if token is invalid
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

// Validate user profile completion
const requireProfileCompletion = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  // Check if essential profile fields are present
  if (!req.user.name || !req.user.email) {
    return next(new AppError('Please complete your profile to access this feature', 400, 'INCOMPLETE_PROFILE'));
  }

  next();
};

// Rate limiting for sensitive operations
const sensitiveOperation = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.user ? req.user.uid : req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userAttempts = attempts.get(key);
    
    if (now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return next(new AppError('Too many attempts. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    userAttempts.count++;
    next();
  };
};

module.exports = {
  authenticateToken,
  restrictTo,
  optionalAuth,
  requireProfileCompletion,
  sensitiveOperation
};
