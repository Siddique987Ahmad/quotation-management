// const { ROLES, ROLE_PERMISSIONS, ROLE_HIERARCHY, STATUS_CODES, MESSAGES } = require('../config/constants');

// // Check if user has specific permission
// const hasPermission = (userRole, requiredPermission) => {
//   const userPermissions = ROLE_PERMISSIONS[userRole] || [];
//   return userPermissions.includes(requiredPermission);
// };

// // Check if user has any of the specified permissions
// const hasAnyPermission = (userRole, requiredPermissions) => {
//   const userPermissions = ROLE_PERMISSIONS[userRole] || [];
//   return requiredPermissions.some(permission => userPermissions.includes(permission));
// };

// // Check if user role is higher than or equal to required role
// const hasRoleOrHigher = (userRole, requiredRole) => {
//   const userLevel = ROLE_HIERARCHY[userRole] || 0;
//   const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
//   return userLevel >= requiredLevel;
// };

// // Middleware to check specific permission
// const requirePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(STATUS_CODES.UNAUTHORIZED).json({
//         success: false,
//         message: MESSAGES.ERROR.UNAUTHORIZED,
//         error: 'Authentication required'
//       });
//     }

//     if (!hasPermission(req.user.role, permission)) {
//       return res.status(STATUS_CODES.FORBIDDEN).json({
//         success: false,
//         message: MESSAGES.ERROR.FORBIDDEN,
//         error: `Permission required: ${permission}`
//       });
//     }

//     next();
//   };
// };

// // Middleware to check any of multiple permissions
// const requireAnyPermission = (permissions) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(STATUS_CODES.UNAUTHORIZED).json({
//         success: false,
//         message: MESSAGES.ERROR.UNAUTHORIZED,
//         error: 'Authentication required'
//       });
//     }

//     if (!hasAnyPermission(req.user.role, permissions)) {
//       return res.status(STATUS_CODES.FORBIDDEN).json({
//         success: false,
//         message: MESSAGES.ERROR.FORBIDDEN,
//         error: `One of these permissions required: ${permissions.join(', ')}`
//       });
//     }

//     next();
//   };
// };

// // Middleware to check minimum role level
// const requireRole = (minimumRole) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(STATUS_CODES.UNAUTHORIZED).json({
//         success: false,
//         message: MESSAGES.ERROR.UNAUTHORIZED,
//         error: 'Authentication required'
//       });
//     }

//     if (!hasRoleOrHigher(req.user.role, minimumRole)) {
//       return res.status(STATUS_CODES.FORBIDDEN).json({
//         success: false,
//         message: MESSAGES.ERROR.FORBIDDEN,
//         error: `Minimum role required: ${minimumRole}`
//       });
//     }

//     next();
//   };
// };

// // Middleware to check if user can access specific resource
// const canAccessResource = (resourceType) => {
//   return async (req, res, next) => {
//     if (!req.user) {
//       return res.status(STATUS_CODES.UNAUTHORIZED).json({
//         success: false,
//         message: MESSAGES.ERROR.UNAUTHORIZED,
//         error: 'Authentication required'
//       });
//     }

//     const userId = req.user.id;
//     const resourceId = req.params.id;

//     try {
//       // Check if user is admin or higher (can access all resources)
//       if (hasRoleOrHigher(req.user.role, ROLES.ADMIN)) {
//         return next();
//       }

//       // For regular users, check if they own the resource
//       switch (resourceType) {
//         case 'quotation':
//           const { prisma } = require('../config/database');
//           const quotation = await prisma.quotation.findUnique({
//             where: { id: resourceId },
//             select: { userId: true }
//           });
          
//           if (!quotation) {
//             return res.status(STATUS_CODES.NOT_FOUND).json({
//               success: false,
//               message: MESSAGES.ERROR.NOT_FOUND,
//               error: 'Quotation not found'
//             });
//           }

//           if (quotation.userId !== userId) {
//             return res.status(STATUS_CODES.FORBIDDEN).json({
//               success: false,
//               message: MESSAGES.ERROR.FORBIDDEN,
//               error: 'Cannot access this quotation'
//             });
//           }
//           break;

//         case 'invoice':
//           const { prisma: invoicePrisma } = require('../config/database');
//           const invoice = await invoicePrisma.invoice.findUnique({
//             where: { id: resourceId },
//             select: { userId: true }
//           });
          
//           if (!invoice) {
//             return res.status(STATUS_CODES.NOT_FOUND).json({
//               success: false,
//               message: MESSAGES.ERROR.NOT_FOUND,
//               error: 'Invoice not found'
//             });
//           }

//           if (invoice.userId !== userId) {
//             return res.status(STATUS_CODES.FORBIDDEN).json({
//               success: false,
//               message: MESSAGES.ERROR.FORBIDDEN,
//               error: 'Cannot access this invoice'
//             });
//           }
//           break;

//         default:
//           // For other resources, allow access if user has general read permission
//           break;
//       }

//       next();
//     } catch (error) {
//       console.error('Resource access check error:', error);
//       return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
//         success: false,
//         message: MESSAGES.ERROR.INTERNAL_SERVER,
//         error: 'Failed to check resource access'
//       });
//     }
//   };
// };

// // Middleware to check if user can modify user accounts
// const canModifyUser = async (req, res, next) => {
//   if (!req.user) {
//     return res.status(STATUS_CODES.UNAUTHORIZED).json({
//       success: false,
//       message: MESSAGES.ERROR.UNAUTHORIZED,
//       error: 'Authentication required'
//     });
//   }

//   const targetUserId = req.params.id;
//   const currentUserRole = req.user.role;

//   try {
//     // Super admins can modify anyone
//     if (currentUserRole === ROLES.SUPER_ADMIN) {
//       return next();
//     }

//     // Get target user's role
//     const { prisma } = require('../config/database');
//     const targetUser = await prisma.user.findUnique({
//       where: { id: targetUserId },
//       select: { role: true }
//     });

//     if (!targetUser) {
//       return res.status(STATUS_CODES.NOT_FOUND).json({
//         success: false,
//         message: MESSAGES.ERROR.NOT_FOUND,
//         error: 'User not found'
//       });
//     }

//     // Users can only modify users with lower hierarchy
//     const currentUserLevel = ROLE_HIERARCHY[currentUserRole] || 0;
//     const targetUserLevel = ROLE_HIERARCHY[targetUser.role] || 0;

//     if (currentUserLevel <= targetUserLevel && req.user.id !== targetUserId) {
//       return res.status(STATUS_CODES.FORBIDDEN).json({
//         success: false,
//         message: MESSAGES.ERROR.FORBIDDEN,
//         error: 'Cannot modify user with equal or higher privileges'
//       });
//     }

//     next();
//   } catch (error) {
//     console.error('User modification check error:', error);
//     return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: MESSAGES.ERROR.INTERNAL_SERVER,
//       error: 'Failed to check user modification permissions'
//     });
//   }
// };

// module.exports = {
//   hasPermission,
//   hasAnyPermission,
//   hasRoleOrHigher,
//   requirePermission,
//   requireAnyPermission,
//   requireRole,
//   canAccessResource,
//   canModifyUser
// };


const { ROLES, ROLE_HIERARCHY, STATUS_CODES, MESSAGES } = require('../config/constants');
const { getRolePermissions, getPermissionsForRole } = require('../controllers/rolePermissionController');

// Check if user has specific permission (NOW ASYNC)
const hasPermission = async (userRole, requiredPermission) => {
  const userPermissions = await getPermissionsForRole(userRole);
  return userPermissions.includes(requiredPermission);
};

// Check if user has any of the specified permissions (NOW ASYNC)
const hasAnyPermission = async (userRole, requiredPermissions) => {
  const userPermissions = await getPermissionsForRole(userRole);
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Check if user role is higher than or equal to required role (UNCHANGED)
const hasRoleOrHigher = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

// Middleware to check specific permission (NOW ASYNC)
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'Authentication required'
      });
    }

    const userHasPermission = await hasPermission(req.user.role, permission);
    
    if (!userHasPermission) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
        error: `Permission required: ${permission}`
      });
    }

    next();
  };
};

// Middleware to check any of multiple permissions (NOW ASYNC)
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'Authentication required'
      });
    }

    const userHasAnyPermission = await hasAnyPermission(req.user.role, permissions);
    
    if (!userHasAnyPermission) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
        error: `One of these permissions required: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check minimum role level (UNCHANGED - uses hierarchy, not permissions)
const requireRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'Authentication required'
      });
    }

    if (!hasRoleOrHigher(req.user.role, minimumRole)) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
        error: `Minimum role required: ${minimumRole}`
      });
    }

    next();
  };
};

// Middleware to check if user can access specific resource (NOW ASYNC)
const canAccessResource = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const resourceId = req.params.id;

    try {
      // Check if user is admin or higher (can access all resources)
      if (hasRoleOrHigher(req.user.role, ROLES.ADMIN)) {
        return next();
      }

      // For regular users, check if they own the resource
      switch (resourceType) {
        case 'quotation':
          const { prisma } = require('../config/database');
          const quotation = await prisma.quotation.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          
          if (!quotation) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
              success: false,
              message: MESSAGES.ERROR.NOT_FOUND,
              error: 'Quotation not found'
            });
          }

          if (quotation.userId !== userId) {
            return res.status(STATUS_CODES.FORBIDDEN).json({
              success: false,
              message: MESSAGES.ERROR.FORBIDDEN,
              error: 'Cannot access this quotation'
            });
          }
          break;

        case 'invoice':
          const { prisma: invoicePrisma } = require('../config/database');
          const invoice = await invoicePrisma.invoice.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          
          if (!invoice) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
              success: false,
              message: MESSAGES.ERROR.NOT_FOUND,
              error: 'Invoice not found'
            });
          }

          if (invoice.userId !== userId) {
            return res.status(STATUS_CODES.FORBIDDEN).json({
              success: false,
              message: MESSAGES.ERROR.FORBIDDEN,
              error: 'Cannot access this invoice'
            });
          }
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ERROR.INTERNAL_SERVER,
        error: 'Failed to check resource access'
      });
    }
  };
};

// Middleware to check if user can modify user accounts (UNCHANGED)
const canModifyUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
      error: 'Authentication required'
    });
  }

  const targetUserId = req.params.id;
  const currentUserRole = req.user.role;

  try {
    if (currentUserRole === ROLES.SUPER_ADMIN) {
      return next();
    }

    const { prisma } = require('../config/database');
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    if (!targetUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }

    const currentUserLevel = ROLE_HIERARCHY[currentUserRole] || 0;
    const targetUserLevel = ROLE_HIERARCHY[targetUser.role] || 0;

    if (currentUserLevel <= targetUserLevel && req.user.id !== targetUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
        error: 'Cannot modify user with equal or higher privileges'
      });
    }

    next();
  } catch (error) {
    console.error('User modification check error:', error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      error: 'Failed to check user modification permissions'
    });
  }
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasRoleOrHigher,
  requirePermission,
  requireAnyPermission,
  requireRole,
  canAccessResource,
  canModifyUser
};