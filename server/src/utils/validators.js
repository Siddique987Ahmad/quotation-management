const { body, param, query } = require('express-validator');

// Business-specific validation rules
const validateQuotationNumber = (value) => {
  const quotationRegex = /^QUO-\d{6}-\d{4}$/;
  if (!quotationRegex.test(value)) {
    throw new Error('Invalid quotation number format. Expected format: QUO-YYYYMM-XXXX');
  }
  return true;
};

const validateInvoiceNumber = (value) => {
  const invoiceRegex = /^INV[123]-\d{6}-\d{4}$/;
  if (!invoiceRegex.test(value)) {
    throw new Error('Invalid invoice number format. Expected format: INV[1-3]-YYYYMM-XXXX');
  }
  return true;
};

const validateTaxPercentage = (value) => {
  const tax = parseFloat(value);
  if (isNaN(tax) || tax < 0 || tax > 100) {
    throw new Error('Tax percentage must be between 0 and 100');
  }
  return true;
};

const validateCurrency = (value) => {
  const amount = parseFloat(value);
  if (isNaN(amount) || amount < 0) {
    throw new Error('Amount must be a positive number');
  }
  
  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new Error('Amount cannot have more than 2 decimal places');
  }
  
  return true;
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
  
  return true;
};

const validateFutureDate = (value) => {
  const date = new Date(value);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (date <= now) {
    throw new Error('Date must be in the future');
  }
  
  return true;
};

const validatePassword = (value) => {
  if (!value || value.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(value)) {
    throw new Error('Password must contain at least one letter');
  }
  
  // Check for at least one number
  if (!/\d/.test(value)) {
    throw new Error('Password must contain at least one number');
  }
  
  return true;
};

const validateStrongPassword = (value) => {
  if (!value || value.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(value)) {
    throw new Error('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    throw new Error('Password must contain at least one special character');
  }
  
  return true;
};

const validatePhoneNumber = (value) => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Phone number must be between 10 and 15 digits');
  }
  
  return true;
};

const validateBusinessEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    throw new Error('Please provide a valid email address');
  }
  
  // Check for common personal email domains (optional business rule)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = value.split('@')[1].toLowerCase();
  
  if (personalDomains.includes(domain)) {
    // This is a warning, not an error - you might want to handle this differently
    console.warn(`Personal email domain detected: ${domain}`);
  }
  
  return true;
};

const validateCompanyName = (value) => {
  if (!value || value.trim().length < 2) {
    throw new Error('Company name must be at least 2 characters long');
  }
  
  if (value.trim().length > 100) {
    throw new Error('Company name cannot exceed 100 characters');
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^test\s*company$/i,
    /^sample\s*company$/i,
    /^abc\s*company$/i,
    /^company\s*name$/i
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(value.trim()));
  if (hasSuspiciousPattern) {
    console.warn(`Suspicious company name detected: ${value}`);
  }
  
  return true;
};

const validateTaxId = (value) => {
  if (!value) return true; // Optional field
  
  // Remove spaces and hyphens
  const cleaned = value.replace(/[\s-]/g, '');
  
  // Basic format validation (adjust based on your country's requirements)
  if (cleaned.length < 8 || cleaned.length > 15) {
    throw new Error('Tax ID must be between 8 and 15 characters');
  }
  
  if (!/^[A-Z0-9]+$/i.test(cleaned)) {
    throw new Error('Tax ID can only contain letters and numbers');
  }
  
  return true;
};

const validateCustomFields = (value) => {
  if (!value) return true; // Optional
  
  if (typeof value !== 'object') {
    throw new Error('Custom fields must be a valid JSON object');
  }
  
  // Check for reasonable size
  const jsonString = JSON.stringify(value);
  if (jsonString.length > 10000) {
    throw new Error('Custom fields data is too large (max 10KB)');
  }
  
  // Validate that it doesn't contain dangerous content
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const hasUnsafeKeys = dangerousKeys.some(key => 
    jsonString.toLowerCase().includes(key.toLowerCase())
  );
  
  if (hasUnsafeKeys) {
    throw new Error('Custom fields contain invalid properties');
  }
  
  return true;
};

const validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    throw new Error(`File size exceeds maximum limit of ${maxSizeMB}MB`);
  }
  
  // Check file extension matches mimetype
  const extension = file.originalname.split('.').pop().toLowerCase();
  const mimeTypeExtensionMap = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf'],
    'text/csv': ['csv'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
  };
  
  const expectedExtensions = mimeTypeExtensionMap[file.mimetype] || [];
  if (expectedExtensions.length > 0 && !expectedExtensions.includes(extension)) {
    throw new Error('File extension does not match content type');
  }
  
  return true;
};

// Composite validators for common scenarios
const validateQuotationData = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('clientId')
    .isUUID()
    .withMessage('Invalid client ID'),
  body('subtotal')
    .custom(validateCurrency)
    .withMessage('Invalid subtotal amount'),
  body('taxPercentage')
    .optional()
    .custom(validateTaxPercentage)
    .withMessage('Invalid tax percentage'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(validateFutureDate)
    .withMessage('Valid until date must be in the future'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('formData')
    .optional()
    .custom(validateCustomFields)
    .withMessage('Invalid form data')
];

const validateClientData = [
  body('companyName')
    .trim()
    .custom(validateCompanyName)
    .withMessage('Invalid company name'),
  body('contactPerson')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Contact person can only contain letters, spaces, hyphens, and apostrophes'),
  body('email')
    .custom(validateBusinessEmail)
    .withMessage('Invalid email address'),
  body('phone')
    .optional()
    .custom(validatePhoneNumber)
    .withMessage('Invalid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  body('taxId')
    .optional()
    .custom(validateTaxId)
    .withMessage('Invalid tax ID'),
  body('customFields')
    .optional()
    .custom(validateCustomFields)
    .withMessage('Invalid custom fields')
];

const validateUserData = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .custom(validatePassword)
    .withMessage('Password does not meet requirements'),
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])
    .withMessage('Invalid role specified')
];

const validateLoginData = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .custom(validatePassword)
    .withMessage('New password does not meet requirements')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

// Query parameter validators
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be between 1 and 50 characters'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

const validateSearchQuery = [
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-._@]+$/)
    .withMessage('Search query contains invalid characters')
];

const validateDateRangeQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        return validateDateRange(req.query.startDate, value);
      }
      return true;
    })
];

// Sanitization helpers
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

const sanitizeSearchQuery = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/[^\w\s\-._@]/g, '') // Allow only word chars, spaces, and safe punctuation
    .trim()
    .substring(0, 100); // Limit length
};

// Custom validation functions for specific business rules
const validateQuotationStatus = (status, userRole) => {
  const allowedTransitions = {
    DRAFT: ['PENDING'],
    PENDING: ['APPROVED', 'REJECTED', 'DRAFT'],
    APPROVED: [], // Cannot change from approved
    REJECTED: ['PENDING', 'DRAFT'],
    EXPIRED: ['DRAFT']
  };
  
  // Only certain roles can approve/reject
  const approvalRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
  
  if ((status === 'APPROVED' || status === 'REJECTED') && !approvalRoles.includes(userRole)) {
    throw new Error('Insufficient permissions to approve or reject quotations');
  }
  
  return true;
};

const validateInvoiceStatus = (status, currentStatus) => {
  const allowedTransitions = {
    PENDING: ['SENT', 'CANCELLED'],
    SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
    PAID: [], // Cannot change from paid
    OVERDUE: ['PAID', 'CANCELLED'],
    CANCELLED: ['PENDING'] // Can reactivate cancelled invoices
  };
  
  const allowed = allowedTransitions[currentStatus] || [];
  
  if (!allowed.includes(status)) {
    throw new Error(`Cannot change invoice status from ${currentStatus} to ${status}`);
  }
  
  return true;
};

// Environment-specific validators
const validateEnvironmentConfig = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('JWT_SECRET should be at least 32 characters long for better security');
  }
  
  return true;
};

module.exports = {
  // Individual validators
  validateQuotationNumber,
  validateInvoiceNumber,
  validateTaxPercentage,
  validateCurrency,
  validateDateRange,
  validateFutureDate,
  validatePassword,
  validateStrongPassword,
  validatePhoneNumber,
  validateBusinessEmail,
  validateCompanyName,
  validateTaxId,
  validateCustomFields,
  validateFileUpload,
  validateQuotationStatus,
  validateInvoiceStatus,
  validateEnvironmentConfig,
  
  // Composite validators
  validateQuotationData,
  validateClientData,
  validateUserData,
  validateLoginData,
  validatePasswordChange,
  validatePaginationQuery,
  validateSearchQuery,
  validateDateRangeQuery,
  
  // Sanitization
  sanitizeInput,
  sanitizeSearchQuery
};