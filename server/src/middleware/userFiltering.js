// middleware/userFiltering.js - NEW FILE

const { ROLE_PERMISSIONS, PERMISSIONS } = require('../config/constants');

/**
 * Check if user can see all records for a specific resource
 */
const canSeeAllRecords = (userRole, resource) => {
  const readAllPermission = PERMISSIONS[resource.toUpperCase()]?.READ_ALL;
  if (!readAllPermission) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(readAllPermission);
};

/**
 * Middleware to automatically filter data by userId if user doesn't have READ_ALL permission
 */
const applyUserFilter = (resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user can see all records
    const canSeeAll = canSeeAllRecords(req.user.role, resource);
    
    // If user can't see all records, add userId filter
    if (!canSeeAll) {
      req.query.userId = req.user.id;
      req.userFiltered = true; // Flag to indicate filtering was applied
    }

    // Store this info for use in controllers
    req.canSeeAllRecords = canSeeAll;
    
    next();
  };
};

/**
 * Helper function to build filtered where clause in controllers
 */
const buildUserFilteredWhere = (req, baseWhere = {}) => {
  // If user filtering was applied, ensure userId is in the where clause
  if (req.userFiltered && req.user) {
    return {
      ...baseWhere,
      userId: req.user.id
    };
  }
  
  // If userId was explicitly provided in query and user can see all records
  if (req.query.userId && req.canSeeAllRecords) {
    return {
      ...baseWhere,
      userId: req.query.userId
    };
  }
  
  return baseWhere;
};

/**
 * Check if user can access a specific record
 */
const canAccessRecord = async (req, recordUserId) => {
  // Admins and above can access any record
  if (req.canSeeAllRecords) {
    return true;
  }
  
  // Regular users can only access their own records
  return req.user.id === recordUserId;
};

module.exports = {
  canSeeAllRecords,
  applyUserFilter,
  buildUserFilteredWhere,
  canAccessRecord
};