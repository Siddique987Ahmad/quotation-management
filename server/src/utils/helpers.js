const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// String utilities
const capitalize = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const slugify = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const truncate = (str, length = 100, suffix = '...') => {
  if (!str || typeof str !== 'string') return str;
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// Number and currency utilities
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(amount));
};

const formatNumber = (number, locale = 'en-US', options = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };
  
  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(number);
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  return parseFloat(cleaned);
};

const roundToDecimals = (number, decimals = 2) => {
  if (isNaN(number)) return 0;
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Date utilities
const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

const formatDateTime = (date, locale = 'en-US') => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isDateExpired = (date) => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj < new Date();
};

const getDaysUntil = (date) => {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffTime = dateObj - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Object utilities
const removeEmptyFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedValue = removeEmptyFields(value);
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

const pick = (obj, keys) => {
  const picked = {};
  keys.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      picked[key] = obj[key];
    }
  });
  return picked;
};

const omit = (obj, keys) => {
  const omitted = { ...obj };
  keys.forEach(key => {
    delete omitted[key];
  });
  return omitted;
};

// Array utilities
const chunk = (array, size) => {
  if (!Array.isArray(array) || size <= 0) return array;
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const unique = (array, key = null) => {
  if (!Array.isArray(array)) return array;
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  
  return [...new Set(array)];
};

const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

const sortBy = (array, key, order = 'asc') => {
  if (!Array.isArray(array)) return array;
  
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (order === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

// Validation utilities
const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

const isUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// File utilities
const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  return filename.split('.').pop().toLowerCase();
};

const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

const isPdfFile = (filename) => {
  return getFileExtension(filename) === 'pdf';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Security utilities
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const hashString = (str, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(str).digest('hex');
};

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

const maskEmail = (email) => {
  if (!email || !isEmail(email)) return email;
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(Math.max(0, username.length - 2)) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return phone;
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4) + lastFour;
  return masked;
};

// API utilities
const buildQueryString = (params) => {
  const query = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, value.toString());
    }
  });
  
  return query.toString();
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  const browsers = {
    Chrome: /Chrome/,
    Firefox: /Firefox/,
    Safari: /Safari/,
    Edge: /Edge/,
    IE: /MSIE/
  };
  
  const systems = {
    Windows: /Windows/,
    macOS: /Mac OS X/,
    Linux: /Linux/,
    Android: /Android/,
    iOS: /iPhone|iPad/
  };
  
  const browser = Object.keys(browsers).find(b => browsers[b].test(userAgent)) || 'Unknown';
  const os = Object.keys(systems).find(s => systems[s].test(userAgent)) || 'Unknown';
  
  return { browser, os };
};

// Pagination utilities
const calculatePagination = (page, limit, totalCount) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null
  };
};

// Error utilities
const createErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Sleep utility for testing/delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry utility
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        await sleep(delay * attempt);
      }
    }
  }
  
  throw lastError;
};

module.exports = {
  // String utilities
  capitalize,
  capitalizeWords,
  slugify,
  truncate,
  sanitizeString,
  
  // Number utilities
  formatCurrency,
  formatNumber,
  parseNumber,
  roundToDecimals,
  
  // Date utilities
  formatDate,
  formatDateTime,
  getDateRange,
  addDays,
  isDateExpired,
  getDaysUntil,
  
  // Object utilities
  removeEmptyFields,
  deepClone,
  pick,
  omit,
  
  // Array utilities
  chunk,
  unique,
  groupBy,
  sortBy,
  
  // Validation utilities
  isEmail,
  isPhoneNumber,
  isUrl,
  isUUID,
  
  // File utilities
  getFileExtension,
  isImageFile,
  isPdfFile,
  formatFileSize,
  ensureDirectoryExists,
  
  // Security utilities
  generateRandomString,
  hashString,
  generateOTP,
  maskEmail,
  maskPhone,
  
  // API utilities
  buildQueryString,
  parseUserAgent,
  calculatePagination,
  
  // Response utilities
  createErrorResponse,
  createSuccessResponse,
  
  // Async utilities
  sleep,
  retry
};