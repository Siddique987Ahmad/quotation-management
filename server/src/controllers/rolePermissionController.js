const { prisma } = require('../config/database');
const { PERMISSIONS, PERMISSION_CATEGORIES } = require('../config/constants');

/**
 * Get role permission settings from database
 * Falls back to default ROLE_PERMISSIONS if not configured
 */
const getRolePermissions = async () => {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { 
        key: 'role_permissions_mapping'
      }
    });

    if (!setting) {
      // Return default from constants if not configured yet
      const { ROLE_PERMISSIONS } = require('../config/constants');
      return ROLE_PERMISSIONS;
    }

    return setting.value;
  } catch (error) {
    console.error('Error getting role permissions:', error);
    const { ROLE_PERMISSIONS } = require('../config/constants');
    return ROLE_PERMISSIONS;
  }
};

/**
 * Get permissions for a specific role
 */
const getPermissionsForRole = async (role) => {
  const allRolePermissions = await getRolePermissions();
  return allRolePermissions[role] || [];
};

/**
 * Update permissions for a specific role
 */
const updateRolePermissions = async (role, permissions) => {
  // Validate that all permissions are valid
  const allValidPermissions = Object.values(PERMISSIONS).flatMap(category =>
    Object.values(category)
  );

  const invalidPermissions = permissions.filter(
    perm => !allValidPermissions.includes(perm)
  );

  if (invalidPermissions.length > 0) {
    const error = new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Get current role permissions
  const currentRolePermissions = await getRolePermissions();

  // Update the specific role
  const updatedRolePermissions = {
    ...currentRolePermissions,
    [role]: permissions
  };

  // Save to database
  await prisma.systemSettings.upsert({
    where: { key: 'role_permissions_mapping' },
    update: {
      value: updatedRolePermissions,
      updatedAt: new Date()
    },
    create: {
      key: 'role_permissions_mapping',
      category: 'rolePermissions',
      value: updatedRolePermissions,
      description: 'Role-based permission mappings'
    }
  });

  return updatedRolePermissions;
};

/**
 * Get available permissions organized by category
 */
const getAvailablePermissions = () => {
  return PERMISSION_CATEGORIES;
};

/**
 * Get all role permissions with metadata
 */
const getAllRolePermissionsWithDetails = async () => {
  const rolePermissions = await getRolePermissions();
  const { ROLES } = require('../config/constants');

  return {
    roles: Object.values(ROLES),
    rolePermissions,
    permissionCategories: PERMISSION_CATEGORIES
  };
};

module.exports = {
  getRolePermissions,
  getPermissionsForRole,
  updateRolePermissions,
  getAvailablePermissions,
  getAllRolePermissionsWithDetails
};