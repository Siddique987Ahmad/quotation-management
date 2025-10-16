// const express = require('express');
// const { body, param } = require('express-validator');
// const { authenticateToken } = require('../middleware/auth');
// const { requirePermission } = require('../middleware/permissions');
// const { handleValidationErrors } = require('../middleware/validation');
// const { PERMISSIONS } = require('../config/constants');

// const router = express.Router();

// // All routes require authentication and user management permissions
// router.use(authenticateToken);

// /**
//  * @route   GET /api/users/:userId/permissions
//  * @desc    Get user's permissions (role-based + custom)
//  * @access  Private (Admin only)
//  */
// router.get('/:userId/permissions',
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS),
//   param('userId').isUUID().withMessage('Invalid user ID'),
//   handleValidationErrors,
//   async (req, res, next) => {
//     try {
//       const { userId } = req.params;
//       const { getUserPermissions } = require('../controllers/userPermissionController');
      
//       const permissions = await getUserPermissions(userId);
      
//       res.json({
//         success: true,
//         message: 'User permissions retrieved successfully',
//         data: permissions
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// /**
//  * @route   PUT /api/users/:userId/permissions
//  * @desc    Update user's custom permissions
//  * @access  Private (Admin only)
//  */
// router.put('/:userId/permissions',
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS),
//   [
//     param('userId').isUUID().withMessage('Invalid user ID'),
//     body('customPermissions')
//       .isArray()
//       .withMessage('Custom permissions must be an array'),
//     body('customPermissions.*')
//       .isString()
//       .withMessage('Each permission must be a string'),
//     handleValidationErrors
//   ],
//   async (req, res, next) => {
//     try {
//       const { userId } = req.params;
//       const { customPermissions } = req.body;
//       const { updateUserPermissions } = require('../controllers/userPermissionController');
      
//       const updatedUser = await updateUserPermissions(userId, customPermissions);
      
//       res.json({
//         success: true,
//         message: 'User permissions updated successfully',
//         data: updatedUser
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// /**
//  * @route   GET /api/permissions/available
//  * @desc    Get all available permissions (for checkbox UI)
//  * @access  Private (Admin only)
//  */
// router.get('/available',
//   requirePermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS),
//   async (req, res, next) => {
//     try {
//       const { getAvailablePermissions } = require('../controllers/userPermissionController');
      
//       const permissions = getAvailablePermissions();
      
//       res.json({
//         success: true,
//         message: 'Available permissions retrieved successfully',
//         data: permissions
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// module.exports = router;