const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  };

  const tokenOptions = { ...defaultOptions, ...options };
  
  return jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return {
      success: true,
      decoded: jwt.verify(token, process.env.JWT_SECRET),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      decoded: null,
      error: {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt || null
      }
    };
  }
};

// Decode JWT token without verification (useful for getting payload from expired tokens)
const decodeToken = (token) => {
  try {
    return {
      success: true,
      decoded: jwt.decode(token),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      decoded: null,
      error: {
        name: error.name,
        message: error.message
      }
    };
  }
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Generate access and refresh token pair
const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload, { expiresIn: '15m' });
  const refreshToken = generateRefreshToken();
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
};

// Validate token expiry
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded.success || !decoded.decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.decoded.exp < currentTime;
};

// Get token expiry time
const getTokenExpiry = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded.success || !decoded.decoded.exp) {
    return null;
  }
  
  return new Date(decoded.decoded.exp * 1000);
};

// Get time until token expires (in seconds)
const getTimeUntilExpiry = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded.success || !decoded.decoded.exp) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.decoded.exp - currentTime;
  
  return Math.max(0, timeUntilExpiry);
};

// Generate password reset token
const generateResetToken = (userId) => {
  const payload = {
    userId,
    type: 'password_reset',
    timestamp: Date.now()
  };
  
  return generateToken(payload, { expiresIn: '1h' });
};

// Verify password reset token
const verifyResetToken = (token) => {
  const result = verifyToken(token);
  
  if (!result.success) {
    return result;
  }
  
  if (result.decoded.type !== 'password_reset') {
    return {
      success: false,
      decoded: null,
      error: {
        name: 'InvalidTokenType',
        message: 'Token is not a password reset token'
      }
    };
  }
  
  return result;
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    timestamp: Date.now()
  };
  
  return generateToken(payload, { expiresIn: '24h' });
};

// Verify email verification token
const verifyEmailVerificationToken = (token) => {
  const result = verifyToken(token);
  
  if (!result.success) {
    return result;
  }
  
  if (result.decoded.type !== 'email_verification') {
    return {
      success: false,
      decoded: null,
      error: {
        name: 'InvalidTokenType',
        message: 'Token is not an email verification token'
      }
    };
  }
  
  return result;
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Generate API key (for external integrations)
const generateApiKey = (identifier) => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(`${identifier}-${timestamp}-${randomBytes}`)
    .digest('hex');
  
  return `qms_${hash.substring(0, 32)}`;
};

// Validate JWT secret strength
const validateJWTSecret = (secret) => {
  if (!secret) {
    return {
      valid: false,
      message: 'JWT secret is required'
    };
  }
  
  if (secret.length < 32) {
    return {
      valid: false,
      message: 'JWT secret should be at least 32 characters long'
    };
  }
  
  // Check for common weak secrets
  const weakSecrets = [
    'secret',
    'jwt-secret',
    'your-secret-key',
    'supersecret',
    'defaultsecret'
  ];
  
  if (weakSecrets.includes(secret.toLowerCase())) {
    return {
      valid: false,
      message: 'JWT secret is too weak, please use a strong random string'
    };
  }
  
  return {
    valid: true,
    message: 'JWT secret is valid'
  };
};

// Create token blacklist entry (for logout functionality)
const createBlacklistEntry = (token, reason = 'logout') => {
  const decoded = decodeToken(token);
  
  if (!decoded.success) {
    return null;
  }
  
  return {
    token: crypto.createHash('sha256').update(token).digest('hex'), // Store hash only
    jti: decoded.decoded.jti || null,
    userId: decoded.decoded.id || decoded.decoded.userId,
    reason,
    blacklistedAt: new Date(),
    expiresAt: getTokenExpiry(token)
  };
};

// Token utility functions for debugging
const getTokenInfo = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded.success) {
    return {
      valid: false,
      error: decoded.error
    };
  }
  
  const payload = decoded.decoded;
  
  return {
    valid: true,
    header: jwt.decode(token, { complete: true })?.header || null,
    payload: {
      userId: payload.id || payload.userId,
      email: payload.email,
      role: payload.role,
      type: payload.type,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      notBefore: payload.nbf ? new Date(payload.nbf * 1000) : null,
      issuer: payload.iss,
      audience: payload.aud,
      subject: payload.sub,
      jwtId: payload.jti
    },
    isExpired: isTokenExpired(token),
    timeUntilExpiry: getTimeUntilExpiry(token)
  };
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  generateTokenPair,
  isTokenExpired,
  getTokenExpiry,
  getTimeUntilExpiry,
  generateResetToken,
  verifyResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  extractTokenFromHeader,
  generateApiKey,
  validateJWTSecret,
  createBlacklistEntry,
  getTokenInfo
};