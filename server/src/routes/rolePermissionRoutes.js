const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { ROLES } = require('../config/constants');
const {
  getAllRolePermissionsWithDetails,
  updateRolePermissions
} = require('../controllers/rolePermissionController');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(ROLES.ADMIN));

/**
 * @route   GET /api/role-permissions
 * @desc    Get all role permissions configuration
 * @access  Private (Admin+)
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await getAllRolePermissionsWithDetails();
    res.json({
      success: true,
      message: 'Role permissions retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/role-permissions/:role
 * @desc    Update permissions for a specific role
 * @access  Private (Admin+)
 */
router.put('/:role', [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .isString()
    .withMessage('Each permission must be a string'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    const updatedRolePermissions = await updateRolePermissions(role, permissions);

    res.json({
      success: true,
      message: `Permissions updated successfully for role: ${role}`,
      data: {
        role,
        permissions: updatedRolePermissions[role],
        allRolePermissions: updatedRolePermissions
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;