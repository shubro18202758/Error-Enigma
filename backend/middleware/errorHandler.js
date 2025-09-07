const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Development error handler
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      status: err.status,
      message: err.message,
      code: err.errorCode,
      stack: err.stack
    }
  });
};

// Production error handler
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.errorCode
      }
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong!',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

// Handle specific error types
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

// Firebase Auth errors
const handleFirebaseAuthError = (err) => {
  let message = 'Authentication failed';
  let code = 'AUTH_ERROR';

  switch (err.code) {
    case 'auth/id-token-expired':
      message = 'Authentication token has expired';
      code = 'TOKEN_EXPIRED';
      break;
    case 'auth/id-token-revoked':
      message = 'Authentication token has been revoked';
      code = 'TOKEN_REVOKED';
      break;
    case 'auth/invalid-id-token':
      message = 'Invalid authentication token';
      code = 'INVALID_TOKEN';
      break;
    case 'auth/user-not-found':
      message = 'User not found';
      code = 'USER_NOT_FOUND';
      break;
    default:
      message = err.message;
  }

  return new AppError(message, 401, code);
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code && error.code.startsWith('auth/')) error = handleFirebaseAuthError(error);

    sendErrorProd(error, res);
  }
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync
};
