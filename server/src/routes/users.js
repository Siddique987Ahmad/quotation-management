// const express = require('express');
// const { body } = require('express-validator');
// const {
//   getUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deleteUser,
//   toggleUserStatus,
//   resetUserPassword,
//   getUserStatistics
// } = require('../controllers/userController');

// const { authenticateToken } = require('../middleware/auth');
// const { 
//   requirePermission, 
//   requireRole, 
//   canModifyUser 
// } = require('../middleware/permissions');
// const { 
//   validateUser, 
//   validatePagination, 
//   validateUUIDParam,
//   handleValidationErrors 
// } = require('../middleware/validation');
// const { PERMISSIONS, ROLES } = require('../config/constants');

// const router = express.Router();

// // All user routes require authentication
// router.use(authenticateToken);

// /**
//  * @route   GET /api/users
//  * @desc    Get all users with pagination and filtering
//  * @access  Private (Admin+)
//  * @query   page, limit, sortBy, sortOrder, search, role, isActive
//  */
// router.get('/', [
//   requirePermission(PERMISSIONS.USERS.READ),
//   validatePagination
// ], getUsers);

// // IMPORTANT: Place specific routes BEFORE parameterized routes
// /**
//  * @route   GET /api/users/roles
//  * @desc    Get available user roles (moved before /:id to avoid conflict)
//  * @access  Private (Admin+)
//  */
// router.get('/roles', [
//   requireRole(ROLES.ADMIN)
// ], (req, res) => {
//   const { ROLE_HIERARCHY } = require('../config/constants');
//   const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
  
//   // Users can assign roles at or below their level (Super Admin can assign any role)
//   const availableRoles = Object.keys(ROLES).filter(role => {
//     const roleLevel = ROLE_HIERARCHY[ROLES[role]] || 0;
//     return roleLevel <= currentUserLevel || req.user.role === ROLES.SUPER_ADMIN;
//   }).map(role => ({
//     value: ROLES[role],
//     label: role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
//     level: ROLE_HIERARCHY[ROLES[role]] || 0
//   }));

//   res.json({
//     success: true,
//     message: 'Available roles fetched successfully',
//     data: { roles: availableRoles }
//   });
// });

// /**
//  * @route   POST /api/users/bulk
//  * @desc    Perform bulk actions on users (activate, deactivate, delete)
//  * @access  Private (Super Admin only)
//  * @body    { userIds: string[], action: 'activate' | 'deactivate' | 'delete' }
//  */
// router.post('/bulk', [
//   requireRole(ROLES.SUPER_ADMIN),
//   body('userIds')
//     .isArray({ min: 1 })
//     .withMessage('At least one user ID is required'),
//   body('userIds.*')
//     .isUUID()
//     .withMessage('Invalid user ID format'),
//   body('action')
//     .isIn(['activate', 'deactivate', 'delete'])
//     .withMessage('Invalid action. Must be activate, deactivate, or delete'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { userIds, action } = req.body;
//     const { prisma } = require('../config/database');
//     const { STATUS_CODES, MESSAGES, ROLES } = require('../config/constants');

//     // Prevent bulk action on current user
//     if (userIds.includes(req.user.id)) {
//       return res.status(STATUS_CODES.FORBIDDEN).json({
//         success: false,
//         message: 'Cannot perform bulk action on your own account'
//       });
//     }

//     // Special handling for Super Admin deactivation/deletion
//     if (action === 'deactivate' || action === 'delete') {
//       const targetSuperAdmins = await prisma.user.findMany({
//         where: { 
//           id: { in: userIds },
//           role: ROLES.SUPER_ADMIN 
//         }
//       });
      
//       if (targetSuperAdmins.length > 0) {
//         const remainingActiveSuperAdmins = await prisma.user.count({
//           where: { 
//             role: ROLES.SUPER_ADMIN,
//             isActive: true,
//             NOT: { id: { in: userIds } }
//           }
//         });
        
//         if (remainingActiveSuperAdmins === 0) {
//           return res.status(STATUS_CODES.FORBIDDEN).json({
//             success: false,
//             message: 'Cannot deactivate/delete all Super Admins. At least one must remain active.'
//           });
//         }
//       }
//     }

//     let updateData = {};
//     let actionMessage = '';

//     switch (action) {
//       case 'activate':
//         updateData = { isActive: true };
//         actionMessage = 'activated';
//         break;
//       case 'deactivate':
//         updateData = { isActive: false };
//         actionMessage = 'deactivated';
//         break;
//       case 'delete':
//         updateData = { isActive: false }; // Soft delete
//         actionMessage = 'deleted';
//         break;
//     }

//     const result = await prisma.user.updateMany({
//       where: {
//         id: { in: userIds },
//         NOT: { id: req.user.id } // Extra safety check
//       },
//       data: {
//         ...updateData,
//         updatedAt: new Date()
//       }
//     });

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `${result.count} users ${actionMessage} successfully`,
//       data: { affectedCount: result.count }
//     });

//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/users/:id
//  * @desc    Get user by ID
//  * @access  Private (Admin+ or own profile)
//  */
// router.get('/:id', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.USERS.READ)
// ], getUserById);

// /**
//  * @route   GET /api/users/:id/statistics
//  * @desc    Get user statistics (quotations, invoices, etc.)
//  * @access  Private (Admin+ or own profile)
//  */
// router.get('/:id/statistics', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.USERS.READ)
// ], getUserStatistics);

// /**
//  * @route   POST /api/users
//  * @desc    Create new user
//  * @access  Private (Admin+)
//  * @body    { email, password, firstName, lastName, role? }
//  */
// router.post('/', [
//   requirePermission(PERMISSIONS.USERS.CREATE),
//   validateUser.create
// ], createUser);

// /**
//  * @route   PUT /api/users/:id
//  * @desc    Update user
//  * @access  Private (Admin+ or own profile for limited fields)
//  */
// router.put('/:id', [
//   validateUUIDParam('id'),
//   canModifyUser,
//   validateUser.update
// ], updateUser);

// /**
//  * @route   PATCH /api/users/:id/status
//  * @desc    Activate/Deactivate user
//  * @access  Private (Admin+)
//  * @body    { isActive: boolean }
//  */
// router.patch('/:id/status', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.USERS.UPDATE),
//   canModifyUser,
//   body('isActive')
//     .isBoolean()
//     .withMessage('isActive must be true or false'),
//   handleValidationErrors
// ], toggleUserStatus);

// /**
//  * @route   POST /api/users/:id/reset-password
//  * @desc    Reset user password (Admin function)
//  * @access  Private (Admin+)
//  * @body    { newPassword }
//  */
// router.post('/:id/reset-password', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.USERS.UPDATE),
//   canModifyUser,
//   body('newPassword')
//     .isLength({ min: 6 })
//     .withMessage('Password must be at least 6 characters long'),
//   body('confirmPassword')
//     .custom((value, { req }) => {
//       if (value !== req.body.newPassword) {
//         throw new Error('Password confirmation does not match');
//       }
//       return true;
//     }),
//   handleValidationErrors
// ], resetUserPassword);

// /**
//  * @route   DELETE /api/users/:id
//  * @desc    Delete user (soft delete - deactivate)
//  * @access  Private (Admin+)
//  */
// router.delete('/:id', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.USERS.DELETE),
//   canModifyUser
// ], deleteUser);

// module.exports = router;


const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStatistics,
  bulkUserAction, // NEW
  getAvailableRoles // NEW
} = require('../controllers/userController');

const { authenticateToken } = require('../middleware/auth');
const { 
  requirePermission, 
  requireRole, 
  canModifyUser 
} = require('../middleware/permissions');
const { 
  validateUser, 
  validatePagination, 
  validateUUIDParam,
  handleValidationErrors 
} = require('../middleware/validation');
const { PERMISSIONS, ROLES } = require('../config/constants');
    // const { getUserPermissions,updateUserPermissions,getAvailablePermissions } = require('../controllers/userPermissionController');


const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin+)
 * @query   page, limit, sortBy, sortOrder, search, role, isActive
 */
router.get('/', [
  requirePermission(PERMISSIONS.USERS.READ),
  validatePagination
], getUsers);

// IMPORTANT: Place specific routes BEFORE parameterized routes
/**
 * @route   GET /api/users/roles
 * @desc    Get available user roles (moved before /:id to avoid conflict)
 * @access  Private (Admin+)
 */
router.get('/roles', [
  requireRole(ROLES.ADMIN)
], getAvailableRoles); // NEW: Use controller function

/**
 * @route   POST /api/users/bulk
 * @desc    Perform bulk actions on users (activate, deactivate, delete)
 * @access  Private (Super Admin only)
 * @body    { userIds: string[], action: 'activate' | 'deactivate' | 'delete' }
 */
router.post('/bulk', [
  requireRole(ROLES.SUPER_ADMIN),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('At least one user ID is required'),
  body('userIds.*')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Invalid action. Must be activate, deactivate, or delete'),
  handleValidationErrors
], bulkUserAction); // NEW: Use controller function

// /**
//  * @route   GET /api/users/permissions/available
//  * @desc    Get all available permissions (for checkbox UI)
//  * @access  Private (Admin+)
//  */
// router.get('/permissions/available', [
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS)
// ], async (req, res, next) => {
//   try {
//     const permissions = getAvailablePermissions();
//     res.json({
//       success: true,
//       message: 'Available permissions retrieved successfully',
//       data: permissions
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/users/:userId/permissions
//  * @desc    Get user's permissions (role-based + custom)
//  * @access  Private (Admin+)
//  */
// router.get('/:userId/permissions', [
//   validateUUIDParam('userId'),
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS),
// ], async (req, res, next) => {
//   try {
//     const permissions = await getUserPermissions(req.params.userId);
//     res.json({
//       success: true,
//       message: 'User permissions retrieved successfully',
//       data: permissions
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * @route   PUT /api/users/:userId/permissions
//  * @desc    Update user's custom permissions
//  * @access  Private (Admin+)
//  */
// router.put('/:userId/permissions', [
//   validateUUIDParam('userId'),
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS),
//   body('customPermissions')
//     .isArray()
//     .withMessage('Custom permissions must be an array'),
//   body('customPermissions.*')
//     .isString()
//     .withMessage('Each permission must be a string'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const updatedUser = await updateUserPermissions(req.params.userId, req.body.customPermissions);
//     res.json({
//       success: true,
//       message: 'User permissions updated successfully',
//       data: updatedUser
//     });
//   } catch (error) {
//     next(error);
//   }
// });



/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin+ or own profile)
 */
router.get('/:id', [
  validateUUIDParam('id'),
  // NOTE: Access control for viewing own profile vs others is handled in controller
  (req, res, next) => {
    // Allow if admin OR viewing own profile
    const { hasPermission } = require('../middleware/permissions');
    const isAdmin = hasPermission(req.user.role, PERMISSIONS.USERS.READ);
    const isOwnProfile = req.user.id === req.params.id;
    
    if (isAdmin || isOwnProfile) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
], getUserById);

/**
 * @route   GET /api/users/:id/statistics
 * @desc    Get user statistics (quotations, invoices, etc.)
 * @access  Private (Admin+ or own profile)
 */
router.get('/:id/statistics', [
  validateUUIDParam('id'),
  // NOTE: Access control for viewing own profile vs others is handled in controller
  (req, res, next) => {
    // Allow if admin OR viewing own profile
    const { hasPermission } = require('../middleware/permissions');
    const isAdmin = hasPermission(req.user.role, PERMISSIONS.USERS.READ);
    const isOwnProfile = req.user.id === req.params.id;
    
    if (isAdmin || isOwnProfile) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
], getUserStatistics);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin+)
 * @body    { email, password, firstName, lastName, role? }
 */
router.post('/', [
  requirePermission(PERMISSIONS.USERS.CREATE),
  validateUser.create
], createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin+ or own profile for limited fields)
 */
router.put('/:id', [
  validateUUIDParam('id'),
  // NOTE: Enhanced access control is handled in the controller
  // This allows both admins and users updating their own profile
  (req, res, next) => {
    const { hasPermission } = require('../middleware/permissions');
    const isAdmin = hasPermission(req.user.role, PERMISSIONS.USERS.UPDATE);
    const isOwnProfile = req.user.id === req.params.id;
    
    if (isAdmin || isOwnProfile) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  },
  validateUser.update
], updateUser);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Activate/Deactivate user
 * @access  Private (Admin+)
 * @body    { isActive: boolean }
 */
router.patch('/:id/status', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.USERS.UPDATE),
  canModifyUser,
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be true or false'),
  handleValidationErrors
], toggleUserStatus);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (Admin function)
 * @access  Private (Admin+)
 * @body    { newPassword, confirmPassword }
 */
router.post('/:id/reset-password', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.USERS.UPDATE),
  canModifyUser,
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors
], resetUserPassword);

/**
 * @route   PATCH /api/users/:id/password
 * @desc    Update user password (Admin+ or own password)
 * @access  Private (Admin+ or own profile)
 * @body    { password }
 */
router.patch('/:id/password', [
  validateUUIDParam('id'),
  (req, res, next) => {
    // Allow if admin OR changing own password
    const { hasPermission } = require('../middleware/permissions');
    const isAdmin = hasPermission(req.user.role, PERMISSIONS.USERS.UPDATE);
    const isOwnProfile = req.user.id === req.params.id;
    
    if (isAdmin || isOwnProfile) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  },
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { updateUserPassword } = require('../controllers/userController');
    await updateUserPassword(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete - deactivate)
 * @access  Private (Admin+)
 */
router.delete('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.USERS.DELETE),
  canModifyUser
], deleteUser);

/**
 * @route   GET /api/users/analytics/summary
 * @desc    Get user analytics summary
 * @access  Private (Admin+)
 */
router.get('/analytics/summary', [
  requirePermission(PERMISSIONS.USERS.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentlyCreated,
      usersWithActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        orderBy: { _count: { role: 'desc' } }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { quotations: { some: {} } },
            { invoices: { some: {} } }
          ]
        }
      })
    ]);

    res.json({
      success: true,
      message: 'User analytics fetched successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentlyCreated,
        usersWithActivity,
        roleDistribution: usersByRole
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/export/csv
 * @desc    Export users data as CSV
 * @access  Private (Admin+)
 */
router.get('/export/csv', [
  requirePermission(PERMISSIONS.USERS.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    
    const users = await prisma.user.findMany({
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            quotations: true,
            invoices: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to CSV format
    const csvData = users.map(user => ({
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Email': user.email,
      'Role': user.role,
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Total Quotations': user._count.quotations,
      'Total Invoices': user._count.invoices,
      'Created Date': user.createdAt.toISOString().split('T')[0]
    }));

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');

    // Simple CSV generation
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => 
          `"${(row[header] || '').toString().replace(/"/g, '""')}"`)
        .join(',')
      )
    ].join('\n');

    res.send(csvContent);

  } catch (error) {
    next(error);
  }
});

module.exports = router;