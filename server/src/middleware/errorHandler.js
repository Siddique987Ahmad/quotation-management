const { STATUS_CODES, MESSAGES } = require('../config/constants');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Prisma errors
const handlePrismaError = (error) => {
  let message = MESSAGES.ERROR.INTERNAL_SERVER;
  let statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;

  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target ? error.meta.target[0] : 'field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      statusCode = STATUS_CODES.CONFLICT;
      break;

    case 'P2025':
      // Record not found
      message = MESSAGES.ERROR.NOT_FOUND;
      statusCode = STATUS_CODES.NOT_FOUND;
      break;

    case 'P2003':
      // Foreign key constraint violation
      message = 'Referenced record does not exist';
      statusCode = STATUS_CODES.BAD_REQUEST;
      break;

    case 'P2014':
      // Required relation missing
      message = 'Required related record is missing';
      statusCode = STATUS_CODES.BAD_REQUEST;
      break;

    case 'P2000':
      // Value too long for column
      message = 'Input data is too long for the field';
      statusCode = STATUS_CODES.BAD_REQUEST;
      break;

    case 'P2001':
      // Record does not exist
      message = 'Record does not exist';
      statusCode = STATUS_CODES.NOT_FOUND;
      break;

    case 'P2015':
      // Related record not found
      message = 'Related record not found';
      statusCode = STATUS_CODES.NOT_FOUND;
      break;

    case 'P2016':
      // Query interpretation error
      message = 'Query interpretation error';
      statusCode = STATUS_CODES.BAD_REQUEST;
      break;

    case 'P2021':
      // Table does not exist
      message = 'Database table does not exist';
      statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
      break;

    case 'P2022':
      // Column does not exist
      message = 'Database column does not exist';
      statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
      break;

    default:
      console.error('Unhandled Prisma error:', error.code, error.message);
      break;
  }

  return new AppError(message, statusCode);
};

// Handle JWT errors
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError(MESSAGES.ERROR.TOKEN_INVALID, STATUS_CODES.UNAUTHORIZED);
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError(MESSAGES.ERROR.TOKEN_EXPIRED, STATUS_CODES.UNAUTHORIZED);
  }
  
  return new AppError('Authentication failed', STATUS_CODES.UNAUTHORIZED);
};

// Handle validation errors
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, STATUS_CODES.BAD_REQUEST);
};

// Handle mongoose cast errors
const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, STATUS_CODES.BAD_REQUEST);
};

// Handle duplicate key errors (MongoDB/MySQL)
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  return new AppError(message, STATUS_CODES.CONFLICT);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      timestamp: err.timestamp || new Date().toISOString()
    }
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Only send operational errors to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: err.timestamp || new Date().toISOString()
    });
  } else {
    // Log the error for debugging
    console.error('ERROR:', err);

    // Send generic message
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      timestamp: new Date().toISOString()
    });
  }
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Handle different types of errors
  if (err.code && err.code.startsWith('P')) {
    // Prisma errors
    error = handlePrismaError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // JWT errors
    error = handleJWTError(err);
  } else if (err.name === 'ValidationError') {
    // Mongoose validation errors
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    // Mongoose cast errors
    error = handleCastError(err);
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error = handleDuplicateKeyError(err);
  } else if (err.statusCode) {
    // Custom operational errors
    error = new AppError(err.message, err.statusCode, err.isOperational);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    STATUS_CODES.NOT_FOUND
  );
  next(error);
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  res.status(STATUS_CODES.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests, please try again later',
    timestamp: new Date().toISOString()
  });
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));
};

// Database connection error handler
const handleDatabaseError = (error) => {
  console.error('Database connection error:', error);
  
  return {
    success: false,
    message: 'Database connection failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    timestamp: new Date().toISOString()
  };
};

// File upload error handler
const handleFileUploadError = (error) => {
  let message = 'File upload failed';
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File size too large';
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files uploaded';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
  } else if (error.code === 'INVALID_FILE_TYPE') {
    message = 'Invalid file type';
  }
  
  return new AppError(message, STATUS_CODES.BAD_REQUEST);
};

// Create error response
const createErrorResponse = (message, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  if (process.env.NODE_ENV === 'development') {
    response.statusCode = statusCode;
  }
  
  return response;
};

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
  rateLimitHandler,
  formatValidationErrors,
  handleDatabaseError,
  handleFileUploadError,
  createErrorResponse
};