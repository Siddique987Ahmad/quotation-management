// // User Roles and Permissions
// const ROLES = {
//   SUPER_ADMIN: 'SUPER_ADMIN',
//   ADMIN: 'ADMIN',
//   MANAGER: 'MANAGER', 
//   USER: 'USER'
// };

// // Role Hierarchy (higher number = more permissions)
// const ROLE_HIERARCHY = {
//   [ROLES.USER]: 1,
//   [ROLES.MANAGER]: 2,
//   [ROLES.ADMIN]: 3,
//   [ROLES.SUPER_ADMIN]: 4
// };

// // Permissions for each module
// const PERMISSIONS = {
//   // User Management
//   USERS: {
//     CREATE: 'users:create',
//     READ: 'users:read',
//     UPDATE: 'users:update',
//     DELETE: 'users:delete',
//     MANAGE_ROLES: 'users:manage_roles',
//     VIEW_AUDIT: 'users:view_audit',
//     BULK_ACTIONS: 'users:bulk_actions'
//   },
  
//   // Client Management  
//   CLIENTS: {
//     CREATE: 'clients:create',
//     READ: 'clients:read',
//     UPDATE: 'clients:update',
//     DELETE: 'clients:delete',
//     EXPORT: 'clients:export',
//     BULK_ACTIONS: 'clients:bulk_actions'
//   },
  
//   // Quotation Management
//   QUOTATIONS: {
//     CREATE: 'quotations:create',
//     READ: 'quotations:read',
//     UPDATE: 'quotations:update',
//     DELETE: 'quotations:delete',
//     APPROVE: 'quotations:approve',
//     REJECT: 'quotations:reject',
//     READ_ALL: 'quotations:read_all',
//     SEND_EMAIL: 'quotations:send_email',
//     EXPORT: 'quotations:export',
//     BULK_ACTIONS: 'quotations:bulk_actions'
//   },
  
//   // Invoice Management
//   INVOICES: {
//     CREATE: 'invoices:create',
//     READ: 'invoices:read', 
//     UPDATE: 'invoices:update',
//     DELETE: 'invoices:delete',
//     SEND: 'invoices:send',
//     READ_ALL: 'invoices:read_all',
//     MARK_PAID: 'invoices:mark_paid',
//     UPDATE_TAX_RATES: 'invoices:update_tax_rates',
//     EXPORT: 'invoices:export',
//     BULK_ACTIONS: 'invoices:bulk_actions'
//   },
  
//   // System Settings
//   SETTINGS: {
//     READ: 'settings:read',
//     CREATE: 'settings:create',
//     UPDATE: 'settings:update',
//     DELETE: 'settings:delete',
//     MANAGE_ROLES: 'settings:manage_roles',
//     MANAGE_PERMISSIONS: 'settings:manage_permissions',
//     VIEW_AUDIT: 'settings:view_audit'
//   },

//   // NEW: Role and Permission Management
//   ROLE_PERMISSIONS: {
//     READ: 'role_permissions:read',
//     UPDATE_ROLES: 'role_permissions:update_roles',
//     UPDATE_PERMISSIONS: 'role_permissions:update_permissions',
//     UPDATE_AUDIT: 'role_permissions:update_audit',
//     VIEW_STATISTICS: 'role_permissions:view_statistics',
//     MANAGE_CUSTOM_PERMISSIONS: 'role_permissions:manage_custom_permissions',
//     APPROVE_ROLE_CHANGES: 'role_permissions:approve_role_changes',
//     VIEW_AUDIT_LOG: 'role_permissions:view_audit_log'
//   },

//   // NEW: Advanced System Administration
//   SYSTEM_ADMIN: {
//     MANAGE_SYSTEM: 'system_admin:manage_system',
//     VIEW_LOGS: 'system_admin:view_logs',
//     BACKUP_RESTORE: 'system_admin:backup_restore',
//     MANAGE_INTEGRATIONS: 'system_admin:manage_integrations',
//     SYSTEM_MAINTENANCE: 'system_admin:system_maintenance'
//   }
// };

// // Enhanced Role-based permissions mapping
// const ROLE_PERMISSIONS = {
//   [ROLES.SUPER_ADMIN]: [
//     // Full access to everything
//     ...Object.values(PERMISSIONS.USERS),
//     ...Object.values(PERMISSIONS.CLIENTS),
//     ...Object.values(PERMISSIONS.QUOTATIONS),
//     ...Object.values(PERMISSIONS.INVOICES),
//     ...Object.values(PERMISSIONS.SETTINGS),
//     ...Object.values(PERMISSIONS.ROLE_PERMISSIONS),
//     ...Object.values(PERMISSIONS.SYSTEM_ADMIN)
//   ],
  
//   [ROLES.ADMIN]: [
//     // Can manage users (except super admin functions)
//     PERMISSIONS.USERS.CREATE,
//     PERMISSIONS.USERS.READ,
//     PERMISSIONS.USERS.UPDATE,
//     PERMISSIONS.USERS.DELETE,
//     PERMISSIONS.USERS.VIEW_AUDIT,
//     PERMISSIONS.USERS.BULK_ACTIONS,
    
//     // Full client access
//     ...Object.values(PERMISSIONS.CLIENTS),
    
//     // Full quotation access
//     ...Object.values(PERMISSIONS.QUOTATIONS),
    
//     // Full invoice access
//     ...Object.values(PERMISSIONS.INVOICES),
    
//     // Settings access
//     PERMISSIONS.SETTINGS.READ,
//     PERMISSIONS.SETTINGS.CREATE,      // ← ADD THIS
//     PERMISSIONS.SETTINGS.UPDATE,
//     PERMISSIONS.SETTINGS.DELETE,      // ← ADD THIS TOO
    
//     // Role permission management (limited)
//     PERMISSIONS.ROLE_PERMISSIONS.READ,
//     PERMISSIONS.ROLE_PERMISSIONS.UPDATE_ROLES,
//     PERMISSIONS.ROLE_PERMISSIONS.UPDATE_PERMISSIONS,
//     PERMISSIONS.ROLE_PERMISSIONS.VIEW_STATISTICS,
//     PERMISSIONS.ROLE_PERMISSIONS.APPROVE_ROLE_CHANGES,
    
//     // Limited system admin
//     PERMISSIONS.SYSTEM_ADMIN.VIEW_LOGS,
//     PERMISSIONS.SYSTEM_ADMIN.BACKUP_RESTORE
//   ],
  
//   [ROLES.MANAGER]: [
//     // Can view users
//     PERMISSIONS.USERS.READ,
    
//     // Full client access
//     ...Object.values(PERMISSIONS.CLIENTS),
    
//     // Can manage quotations
//     PERMISSIONS.QUOTATIONS.CREATE,
//     PERMISSIONS.QUOTATIONS.READ,
//     PERMISSIONS.QUOTATIONS.UPDATE,
//     PERMISSIONS.QUOTATIONS.READ_ALL,
//     PERMISSIONS.QUOTATIONS.APPROVE,
//     PERMISSIONS.QUOTATIONS.REJECT,
//     PERMISSIONS.QUOTATIONS.SEND_EMAIL,
//     PERMISSIONS.QUOTATIONS.EXPORT,
//     PERMISSIONS.QUOTATIONS.BULK_ACTIONS,
    
//     // Can manage invoices
//     PERMISSIONS.INVOICES.CREATE,
//     PERMISSIONS.INVOICES.READ,
//     PERMISSIONS.INVOICES.UPDATE,
//     PERMISSIONS.INVOICES.SEND,
//     PERMISSIONS.INVOICES.READ_ALL,
//     PERMISSIONS.INVOICES.MARK_PAID,
//     PERMISSIONS.INVOICES.EXPORT,
//     PERMISSIONS.INVOICES.BULK_ACTIONS,
    
//     // Settings read only
//     PERMISSIONS.SETTINGS.READ,
    
//     // Role permissions read only
//     PERMISSIONS.ROLE_PERMISSIONS.READ,
//     PERMISSIONS.ROLE_PERMISSIONS.VIEW_STATISTICS
//   ],
  
//   [ROLES.USER]: [
//     // UPDATED: Employees can manage clients (key part of your workflow)
//     PERMISSIONS.CLIENTS.CREATE,
//     PERMISSIONS.CLIENTS.READ,
//     PERMISSIONS.CLIENTS.UPDATE,
//     // Note: No DELETE permission for clients - only managers+ can delete
    
//     // Can create and manage own quotations
//     PERMISSIONS.QUOTATIONS.CREATE,
//     PERMISSIONS.QUOTATIONS.READ,
//     PERMISSIONS.QUOTATIONS.UPDATE,
//     PERMISSIONS.QUOTATIONS.APPROVE,
//     PERMISSIONS.QUOTATIONS.REJECT,
//     PERMISSIONS.QUOTATIONS.SEND_EMAIL,
//     // Note: No READ_ALL or DELETE - those are for managers+
    
//     // Can view own invoices and send them
//     PERMISSIONS.INVOICES.READ,
//     PERMISSIONS.INVOICES.SEND,
//     // Note: No CREATE, UPDATE, DELETE, or READ_ALL - those are for managers+
    
//     // Basic settings read
//     PERMISSIONS.SETTINGS.READ
//   ]
// };

// // NEW: Role permission management constants
// const ROLE_PERMISSION_DEFAULTS = {
//   ROLE_SETTINGS: {
//     enableRoleHierarchy: true,
//     allowRoleOverrides: false,
//     requireApprovalForRoleChanges: true,
//     defaultUserRole: ROLES.USER,
//     maxUsersPerRole: {
//       [ROLES.SUPER_ADMIN]: 2,
//       [ROLES.ADMIN]: 5,
//       [ROLES.MANAGER]: 10,
//       [ROLES.USER]: 1000
//     },
//     roleDescriptions: {
//       [ROLES.SUPER_ADMIN]: 'Full system access with all administrative privileges',
//       [ROLES.ADMIN]: 'Administrative access with user and system management capabilities',
//       [ROLES.MANAGER]: 'Management access with team oversight and approval capabilities',
//       [ROLES.USER]: 'Standard user access for daily operations and client management'
//     }
//   },
  
//   PERMISSION_SETTINGS: {
//     enableGranularPermissions: true,
//     allowCustomPermissions: false,
//     inheritanceEnabled: true,
//     auditPermissionChanges: true,
//     sessionPermissionCache: true,
//     permissionTimeout: 60
//   },
  
//   AUDIT_SETTINGS: {
//     enableAuditLog: true,
//     auditUserActions: true,
//     auditRoleChanges: true,
//     auditPermissionChanges: true,
//     retentionDays: 90,
//     alertOnSuspiciousActivity: true,
//     maxFailedAttempts: 5
//   }
// };

// // NEW: Permission categories for UI organization
// const PERMISSION_CATEGORIES = {
//   USER_MANAGEMENT: {
//     name: 'User Management',
//     description: 'Manage system users and their accounts',
//     permissions: Object.values(PERMISSIONS.USERS),
//     icon: 'Users',
//     color: '#3B82F6'
//   },
//   CLIENT_MANAGEMENT: {
//     name: 'Client Management',
//     description: 'Manage client information and relationships',
//     permissions: Object.values(PERMISSIONS.CLIENTS),
//     icon: 'Building',
//     color: '#10B981'
//   },
//   QUOTATION_MANAGEMENT: {
//     name: 'Quotation Management',
//     description: 'Create and manage quotations',
//     permissions: Object.values(PERMISSIONS.QUOTATIONS),
//     icon: 'Document',
//     color: '#F59E0B'
//   },
//   INVOICE_MANAGEMENT: {
//     name: 'Invoice Management',
//     description: 'Generate and manage invoices',
//     permissions: Object.values(PERMISSIONS.INVOICES),
//     icon: 'CreditCard',
//     color: '#EF4444'
//   },
//   SYSTEM_SETTINGS: {
//     name: 'System Settings',
//     description: 'Configure system-wide settings',
//     permissions: Object.values(PERMISSIONS.SETTINGS),
//     icon: 'Settings',
//     color: '#8B5CF6'
//   },
//   ROLE_PERMISSIONS: {
//     name: 'Roles & Permissions',
//     description: 'Manage user roles and permissions',
//     permissions: Object.values(PERMISSIONS.ROLE_PERMISSIONS),
//     icon: 'Shield',
//     color: '#F97316'
//   },
//   SYSTEM_ADMINISTRATION: {
//     name: 'System Administration',
//     description: 'Advanced system administration tasks',
//     permissions: Object.values(PERMISSIONS.SYSTEM_ADMIN),
//     icon: 'Terminal',
//     color: '#6B7280'
//   }
// };

// // Quotation Status
// const QUOTATION_STATUS = {
//   DRAFT: 'DRAFT',
//   PENDING: 'PENDING',
//   APPROVED: 'APPROVED',
//   REJECTED: 'REJECTED',
//   EXPIRED: 'EXPIRED'
// };

// // Invoice Status
// const INVOICE_STATUS = {
//   PENDING: 'PENDING',
//   SENT: 'SENT',
//   PAID: 'PAID',
//   OVERDUE: 'OVERDUE',
//   CANCELLED: 'CANCELLED',
//   APPROVED: 'APPROVED' // NEW: Approved status for invoices
// };

// // Invoice Types
// const INVOICE_TYPES = {
//   TAX_INVOICE_1: 'TAX_INVOICE_1',
//   TAX_INVOICE_2: 'TAX_INVOICE_2',
//   TAX_INVOICE_3: 'TAX_INVOICE_3'
// };

// // NEW: Audit action types
// const AUDIT_ACTIONS = {
//   USER_CREATED: 'USER_CREATED',
//   USER_UPDATED: 'USER_UPDATED',
//   USER_DELETED: 'USER_DELETED',
//   USER_ACTIVATED: 'USER_ACTIVATED',
//   USER_DEACTIVATED: 'USER_DEACTIVATED',
//   ROLE_ASSIGNED: 'ROLE_ASSIGNED',
//   ROLE_REMOVED: 'ROLE_REMOVED',
//   PERMISSION_GRANTED: 'PERMISSION_GRANTED',
//   PERMISSION_REVOKED: 'PERMISSION_REVOKED',
//   SETTINGS_UPDATED: 'SETTINGS_UPDATED',
//   LOGIN_SUCCESS: 'LOGIN_SUCCESS',
//   LOGIN_FAILED: 'LOGIN_FAILED',
//   LOGOUT: 'LOGOUT',
//   PASSWORD_CHANGED: 'PASSWORD_CHANGED',
//   PASSWORD_RESET: 'PASSWORD_RESET'
// };

// // API Response Messages
// const MESSAGES = {
//   SUCCESS: {
//     CREATED: 'Created successfully',
//     UPDATED: 'Updated successfully',
//     DELETED: 'Deleted successfully',
//     FETCHED: 'Data fetched successfully',
//     LOGIN: 'Login successful',
//     LOGOUT: 'Logout successful',
//     ROLE_ASSIGNED: 'Role assigned successfully',
//     PERMISSION_GRANTED: 'Permission granted successfully',
//     SETTINGS_SAVED: 'Settings saved successfully'
//   },
  
//   ERROR: {
//     INTERNAL_SERVER: 'Internal server error',
//     NOT_FOUND: 'Resource not found',
//     UNAUTHORIZED: 'Unauthorized access',
//     FORBIDDEN: 'Access forbidden',
//     VALIDATION_FAILED: 'Validation failed',
//     DUPLICATE_ENTRY: 'Resource already exists',
//     INVALID_CREDENTIALS: 'Invalid credentials',
//     TOKEN_EXPIRED: 'Token expired',
//     TOKEN_INVALID: 'Invalid token',
//     INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
//     ROLE_ASSIGNMENT_FAILED: 'Role assignment failed',
//     PERMISSION_DENIED: 'Permission denied',
//     MAX_USERS_EXCEEDED: 'Maximum users for this role exceeded'
//   }
// };

// // HTTP Status Codes
// const STATUS_CODES = {
//   OK: 200,
//   CREATED: 201,
//   NO_CONTENT: 204,
//   BAD_REQUEST: 400,
//   UNAUTHORIZED: 401,
//   FORBIDDEN: 403,
//   NOT_FOUND: 404,
//   CONFLICT: 409,
//   UNPROCESSABLE_ENTITY: 422,
//   INTERNAL_SERVER_ERROR: 500
// };

// // Pagination defaults
// const PAGINATION = {
//   DEFAULT_PAGE: 1,
//   DEFAULT_LIMIT: 10,
//   MAX_LIMIT: 100
// };

// // File upload settings
// const FILE_UPLOAD = {
//   MAX_SIZE: 5 * 1024 * 1024, // 5MB
//   ALLOWED_TYPES: {
//     IMAGES: ['image/jpeg', 'image/png', 'image/gif'],
//     DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
//   },
//   UPLOAD_PATH: './uploads'
// };

// // Email settings
// const EMAIL = {
//   TEMPLATES: {
//     QUOTATION_APPROVED: 'quotation_approved',
//     INVOICE_SENT: 'invoice_sent',
//     USER_CREATED: 'user_created',
//     PASSWORD_RESET: 'password_reset',
//     ROLE_ASSIGNED: 'role_assigned',
//     PERMISSION_CHANGED: 'permission_changed'
//   },
  
//   SUBJECTS: {
//     QUOTATION_APPROVED: 'Quotation Approved - Invoice Generated',
//     INVOICE_SENT: 'Invoice - Payment Required',
//     USER_CREATED: 'Welcome to Quotation Management System',
//     PASSWORD_RESET: 'Password Reset Request',
//     ROLE_ASSIGNED: 'Your role has been updated',
//     PERMISSION_CHANGED: 'Your permissions have been modified'
//   }
// };

// // JWT Settings
// const JWT = {
//   EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
//   ALGORITHM: 'HS256'
// };

// // Validation rules
// const VALIDATION = {
//   PASSWORD: {
//     MIN_LENGTH: 6,
//     REQUIRE_UPPERCASE: false,
//     REQUIRE_LOWERCASE: false,
//     REQUIRE_NUMBERS: false,
//     REQUIRE_SPECIAL_CHARS: false
//   },
  
//   PAGINATION: {
//     MAX_LIMIT: 100,
//     DEFAULT_LIMIT: 10
//   },
  
//   // NEW: Role and permission validation
//   ROLE_PERMISSIONS: {
//     MAX_CUSTOM_PERMISSIONS: 50,
//     MAX_ROLE_DESCRIPTION_LENGTH: 500,
//     MIN_ROLE_DESCRIPTION_LENGTH: 10,
//     PERMISSION_TIMEOUT_MIN: 1,
//     PERMISSION_TIMEOUT_MAX: 1440, // 24 hours
//     AUDIT_RETENTION_MIN: 1,
//     AUDIT_RETENTION_MAX: 365,
//     MAX_FAILED_ATTEMPTS_MIN: 1,
//     MAX_FAILED_ATTEMPTS_MAX: 20
//   }
// };

// // NEW: System configuration defaults
// const SYSTEM_DEFAULTS = {
//   ROLE_PERMISSIONS: ROLE_PERMISSION_DEFAULTS,
//   PAGINATION,
//   FILE_UPLOAD,
//   EMAIL,
//   JWT,
//   VALIDATION
// };

// // Export all constants
// module.exports = {
//   ROLES,
//   ROLE_HIERARCHY,
//   PERMISSIONS,
//   ROLE_PERMISSIONS,
//   ROLE_PERMISSION_DEFAULTS,
//   PERMISSION_CATEGORIES,
//   QUOTATION_STATUS,
//   INVOICE_STATUS,
//   INVOICE_TYPES,
//   AUDIT_ACTIONS,
//   MESSAGES,
//   STATUS_CODES,
//   PAGINATION,
//   FILE_UPLOAD,
//   EMAIL,
//   JWT,
//   VALIDATION,
//   SYSTEM_DEFAULTS
// };



// ============================================================================
// SIMPLIFIED ROLE & PERMISSION SYSTEM
// ============================================================================

// User Roles
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER', 
  USER: 'USER'
};

// Role Hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4
};

// All Available Permissions
const PERMISSIONS = {
  // User Management
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    MANAGE_PERMISSIONS: 'users:manage_permissions' // New: For checkbox permission management
  },
  
  // Client Management  
  CLIENTS: {
    CREATE: 'clients:create',
    READ: 'clients:read',
    UPDATE: 'clients:update',
    DELETE: 'clients:delete',
    EXPORT: 'clients:export'
  },
  
  // Quotation Management
  QUOTATIONS: {
    CREATE: 'quotations:create',
    READ: 'quotations:read',
    UPDATE: 'quotations:update',
    DELETE: 'quotations:delete',
    APPROVE: 'quotations:approve',
    REJECT: 'quotations:reject',
    READ_ALL: 'quotations:read_all', // Can see all users' quotations
    SEND_EMAIL: 'quotations:send_email'
  },
  
  // Invoice Management
  INVOICES: {
    CREATE: 'invoices:create',
    READ: 'invoices:read', 
    UPDATE: 'invoices:update',
    DELETE: 'invoices:delete',
    SEND: 'invoices:send',
    READ_ALL: 'invoices:read_all', // Can see all users' invoices
    MARK_PAID: 'invoices:mark_paid'
  },
  
  // System Settings
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
    CREATE: 'settings:create',      // ← ADD THIS
    DELETE: 'settings:delete'       // ← ADD THIS
  }
};

// Default Role-based Permissions (baseline for each role)
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.CLIENTS),
    ...Object.values(PERMISSIONS.QUOTATIONS),
    ...Object.values(PERMISSIONS.INVOICES),
    ...Object.values(PERMISSIONS.SETTINGS)
  ],
  
  [ROLES.ADMIN]: [
    // Can manage users and their permissions
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
    PERMISSIONS.USERS.MANAGE_PERMISSIONS, // Can manage user permissions
    
    // Full client access
    ...Object.values(PERMISSIONS.CLIENTS),
    
    // Full quotation access
    ...Object.values(PERMISSIONS.QUOTATIONS),
    
    // Full invoice access
    ...Object.values(PERMISSIONS.INVOICES),
    
    // Settings access
    PERMISSIONS.SETTINGS.READ,
    PERMISSIONS.SETTINGS.UPDATE,
    PERMISSIONS.SETTINGS.CREATE,      // ← ADD THIS
    PERMISSIONS.SETTINGS.DELETE       // ← ADD THIS
  ],
  
  [ROLES.MANAGER]: [
    // Can view users
    PERMISSIONS.USERS.READ,
    
    // Full client access
    ...Object.values(PERMISSIONS.CLIENTS),
    
    // Can manage quotations
    PERMISSIONS.QUOTATIONS.CREATE,
    PERMISSIONS.QUOTATIONS.READ,
    PERMISSIONS.QUOTATIONS.UPDATE,
    PERMISSIONS.QUOTATIONS.READ_ALL,
    PERMISSIONS.QUOTATIONS.APPROVE,
    PERMISSIONS.QUOTATIONS.REJECT,
    PERMISSIONS.QUOTATIONS.SEND_EMAIL,
    
    // Can manage invoices
    PERMISSIONS.INVOICES.CREATE,
    PERMISSIONS.INVOICES.READ,
    PERMISSIONS.INVOICES.UPDATE,
    PERMISSIONS.INVOICES.SEND,
    PERMISSIONS.INVOICES.READ_ALL,
    PERMISSIONS.INVOICES.MARK_PAID,
    
    // Settings read only
    PERMISSIONS.SETTINGS.READ
  ],
  
  [ROLES.USER]: [
    // Can manage clients
    PERMISSIONS.CLIENTS.CREATE,
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.CLIENTS.UPDATE,
    
    // Can create and manage own quotations
    PERMISSIONS.QUOTATIONS.CREATE,
    PERMISSIONS.QUOTATIONS.READ,
    PERMISSIONS.QUOTATIONS.UPDATE,
    PERMISSIONS.QUOTATIONS.SEND_EMAIL,
    
    // Can view own invoices and send them
    PERMISSIONS.INVOICES.READ,
    PERMISSIONS.INVOICES.SEND,
    
    // Basic settings read
    PERMISSIONS.SETTINGS.READ
  ]
};

// Permission Categories (for UI grouping in checkbox interface)
const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: {
    name: 'User Management',
    description: 'Manage system users',
    permissions: Object.values(PERMISSIONS.USERS)
  },
  CLIENT_MANAGEMENT: {
    name: 'Client Management',
    description: 'Manage clients',
    permissions: Object.values(PERMISSIONS.CLIENTS)
  },
  QUOTATION_MANAGEMENT: {
    name: 'Quotations',
    description: 'Manage quotations',
    permissions: Object.values(PERMISSIONS.QUOTATIONS)
  },
  INVOICE_MANAGEMENT: {
    name: 'Invoices',
    description: 'Manage invoices',
    permissions: Object.values(PERMISSIONS.INVOICES)
  },
  SYSTEM_SETTINGS: {
    name: 'Settings',
    description: 'System settings',
    permissions: Object.values(PERMISSIONS.SETTINGS)
  }
};

// ============================================================================
// OTHER CONSTANTS (unchanged)
// ============================================================================

const QUOTATION_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const INVOICE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
};

const INVOICE_TYPES = {
  TAX_INVOICE_1: 'TAX_INVOICE_1',
  TAX_INVOICE_2: 'TAX_INVOICE_2',
  TAX_INVOICE_3: 'TAX_INVOICE_3'
};

const MESSAGES = {
  SUCCESS: {
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    FETCHED: 'Data fetched successfully',
    PERMISSIONS_UPDATED: 'Permissions updated successfully'
  },
  ERROR: {
    INTERNAL_SERVER: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_FAILED: 'Validation failed',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
  }
};

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  UPLOAD_PATH: './uploads'
};

const JWT = {
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256'
};

const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 6
  },
  PAGINATION: {
    MAX_LIMIT: 100,
    DEFAULT_LIMIT: 10
  }
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  QUOTATION_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPES,
  MESSAGES,
  STATUS_CODES,
  PAGINATION,
  FILE_UPLOAD,
  JWT,
  VALIDATION
};