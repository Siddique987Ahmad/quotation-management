const { prisma } = require('../config/database');
const { STATUS_CODES, MESSAGES } = require('../config/constants');
const { generateToken, verifyToken, extractTokenFromHeader } = require('../utils/jwt');

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'Access token is required'
      });
    }

    const tokenResult = verifyToken(token);
    
    if (!tokenResult.success) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: tokenResult.error.name === 'TokenExpiredError' ? 
          MESSAGES.ERROR.TOKEN_EXPIRED : MESSAGES.ERROR.TOKEN_INVALID,
        error: tokenResult.error.message
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: tokenResult.decoded.id,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'User not found or inactive'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      error: 'Authentication failed'
    });
  }
};

// Optional Authentication (for public routes that can benefit from user info)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const tokenResult = verifyToken(token);
      
      if (tokenResult.success) {
        const user = await prisma.user.findUnique({
          where: { 
            id: tokenResult.decoded.id,
            isActive: true 
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
          }
        });

        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth, just continue without user
    next();
  }
};

// Check if user is active
const requireActiveUser = (req, res, next) => {
  if (!req.user || !req.user.isActive) {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: MESSAGES.ERROR.FORBIDDEN,
      error: 'User account is not active'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireActiveUser
};