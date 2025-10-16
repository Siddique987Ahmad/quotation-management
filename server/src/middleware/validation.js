const { body, param, query, validationResult } = require('express-validator');
const { STATUS_CODES, MESSAGES, VALIDATION } = require('../config/constants');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(STATUS_CODES.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: MESSAGES.ERROR.VALIDATION_FAILED,
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUser = {
  create: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: VALIDATION.PASSWORD.MIN_LENGTH })
      .withMessage(`Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters long`),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    body('role')
      .optional()
      .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])
      .withMessage('Invalid role specified'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid user ID format'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    body('role')
      .optional()
      .isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])
      .withMessage('Invalid role specified'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be true or false'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ]
};

// Client validation rules
// const validateClient = {
//   create: [
//     body('companyName')
//       .trim()
//       .isLength({ min: 2, max: 100 })
//       .withMessage('Company name must be between 2 and 100 characters'),
//     body('contactPerson')
//       .trim()
//       .isLength({ min: 2, max: 100 })
//       .withMessage('Contact person must be between 2 and 100 characters')
//       .matches(/^[a-zA-Z\s]+$/)
//       .withMessage('Contact person can only contain letters and spaces'),
//     body('email')
//       .isEmail()
//       .withMessage('Please provide a valid email address')
//       .normalizeEmail(),
//     body('phone')
//       .optional()
//       .isMobilePhone()
//       .withMessage('Please provide a valid phone number'),
//     body('address')
//       .optional()
//       .trim()
//       .isLength({ max: 500 })
//       .withMessage('Address must not exceed 500 characters'),
//     body('city')
//       .optional()
//       .trim()
//       .isLength({ max: 100 })
//       .withMessage('City must not exceed 100 characters'),
//     body('state')
//       .optional()
//       .trim()
//       .isLength({ max: 100 })
//       .withMessage('State must not exceed 100 characters'),
//     body('zipCode')
//       .optional()
//       .trim()
//       .isPostalCode('any')
//       .withMessage('Please provide a valid zip code'),
//     body('country')
//       .optional()
//       .trim()
//       .isLength({ max: 100 })
//       .withMessage('Country must not exceed 100 characters'),
//     body('taxId')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('Tax ID must not exceed 50 characters'),
//     handleValidationErrors
//   ],

//   update: [
//     param('id')
//       .isUUID()
//       .withMessage('Invalid client ID format'),
//     body('companyName')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 100 })
//       .withMessage('Company name must be between 2 and 100 characters'),
//     body('contactPerson')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 100 })
//       .withMessage('Contact person must be between 2 and 100 characters')
//       .matches(/^[a-zA-Z\s]+$/)
//       .withMessage('Contact person can only contain letters and spaces'),
//     body('email')
//       .optional()
//       .isEmail()
//       .withMessage('Please provide a valid email address')
//       .normalizeEmail(),
//     body('phone')
//       .optional()
//       .isMobilePhone()
//       .withMessage('Please provide a valid phone number'),
//     body('isActive')
//       .optional()
//       .isBoolean()
//       .withMessage('isActive must be true or false'),
//     handleValidationErrors
//   ]
// };

// Client validation rules (ADD THIS SECTION)
const validateClient = {
  create: [
    body('companyName')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    
    body('contactPerson')
      .trim()
      .notEmpty()
      .withMessage('Contact person is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Contact person name must be between 2 and 100 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone number must not exceed 20 characters'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters'),
    
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City must not exceed 50 characters'),
    
    body('state')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('State must not exceed 50 characters'),
    
    body('zipCode')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('ZIP code must not exceed 20 characters'),
    
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Country must not exceed 50 characters'),
    
    body('taxId')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tax ID must not exceed 50 characters'),
    
    body('customFields')
      .optional()
      .isObject()
      .withMessage('Custom fields must be a valid object'),
    
    handleValidationErrors
  ],

  update: [
    body('companyName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Company name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    
    body('contactPerson')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Contact person cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Contact person name must be between 2 and 100 characters'),
    
    body('email')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Email cannot be empty')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone number must not exceed 20 characters'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters'),
    
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City must not exceed 50 characters'),
    
    body('state')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('State must not exceed 50 characters'),
    
    body('zipCode')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('ZIP code must not exceed 20 characters'),
    
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Country must not exceed 50 characters'),
    
    body('taxId')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tax ID must not exceed 50 characters'),
    
    body('customFields')
      .optional()
      .isObject()
      .withMessage('Custom fields must be a valid object'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be true or false'),
    
    handleValidationErrors
  ]
};

// Quotation validation rules
const validateQuotation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('clientId')
      .isUUID()
      .withMessage('Invalid client ID format'),
    body('subtotal')
      .isFloat({ min: 0 })
      .withMessage('Subtotal must be a positive number'),
    // body('taxPercentage')
    //   .optional()
    //   .isFloat({ min: 0, max: 100 })
    //   .withMessage('Tax percentage must be between 0 and 100'),
    body('taxAmount')
      .isFloat({ min: 0 })
      .withMessage('Tax amount must be a positive number'),
    body('totalAmount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('validUntil')
      .optional()
      .isISO8601()
      .withMessage('Valid until must be a valid date')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Valid until date must be in the future');
        }
        return true;
      }),
    body('formData')
      .optional()
      .isObject()
      .withMessage('Form data must be a valid JSON object'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid quotation ID format'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('subtotal')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Subtotal must be a positive number'),
    body('taxPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax percentage must be between 0 and 100'),
    body('taxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Tax amount must be a positive number'),
    body('totalAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ]
};

// Invoice validation rules
const validateInvoice = {
  create: [
    body('quotationId')
      .isUUID()
      .withMessage('Invalid quotation ID format'),
    body('type')
      .isIn(['TAX_INVOICE_1', 'TAX_INVOICE_2', 'TAX_INVOICE_3'])
      .withMessage('Invalid invoice type'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid invoice ID format'),
    body('status')
      .optional()
      .isIn(['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
      .withMessage('Invalid status'),
    body('paidDate')
      .optional()
      .isISO8601()
      .withMessage('Paid date must be a valid date'),
    handleValidationErrors
  ]
};

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: VALIDATION.PAGINATION.MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${VALIDATION.PAGINATION.MAX_LIMIT}`),
  query('sortBy')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Sort by field cannot be empty'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUser,
  validateClient,
  validateQuotation,
  validateInvoice,
  validatePagination,
  validateUUIDParam
};