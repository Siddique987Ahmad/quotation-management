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
    CREATE: 'settings:create',
    DELETE: 'settings:delete'
  },
  
  // Department Management
  DEPARTMENTS: {
    CREATE: 'departments:create',
    READ: 'departments:read',
    UPDATE: 'departments:update',
    DELETE: 'departments:delete',
    MANAGE_CLIENTS: 'departments:manage_clients'
  },
  
  // Email Templates
  EMAIL_TEMPLATES: {
    CREATE: 'email_templates:create',
    READ: 'email_templates:read',
    UPDATE: 'email_templates:update',
    DELETE: 'email_templates:delete'
  },
  
  // Dashboard & Reports
  DASHBOARD: {
    READ: 'dashboard:read',
    EXPORT: 'dashboard:export'
  },
  
  // File Management
  FILES: {
    UPLOAD: 'files:upload',
    DOWNLOAD: 'files:download',
    DELETE: 'files:delete'
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
    ...Object.values(PERMISSIONS.SETTINGS),
    ...Object.values(PERMISSIONS.DEPARTMENTS),
    ...Object.values(PERMISSIONS.EMAIL_TEMPLATES),
    ...Object.values(PERMISSIONS.DASHBOARD),
    ...Object.values(PERMISSIONS.FILES)
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
    ...Object.values(PERMISSIONS.SETTINGS),
    
    // Department management
    ...Object.values(PERMISSIONS.DEPARTMENTS),
    
    // Email templates
    ...Object.values(PERMISSIONS.EMAIL_TEMPLATES),
    
    // Dashboard access
    ...Object.values(PERMISSIONS.DASHBOARD),
    
    // File management
    ...Object.values(PERMISSIONS.FILES)
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
    PERMISSIONS.SETTINGS.READ,
    
    // Department management
    ...Object.values(PERMISSIONS.DEPARTMENTS),
    
    // Email templates
    ...Object.values(PERMISSIONS.EMAIL_TEMPLATES),
    
    // Dashboard access
    ...Object.values(PERMISSIONS.DASHBOARD),
    
    // File management
    ...Object.values(PERMISSIONS.FILES)
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
    PERMISSIONS.SETTINGS.READ,
    
    // Basic dashboard access
    PERMISSIONS.DASHBOARD.READ,
    
    // Basic file access
    PERMISSIONS.FILES.UPLOAD,
    PERMISSIONS.FILES.DOWNLOAD
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
  },
  DEPARTMENT_MANAGEMENT: {
    name: 'Departments',
    description: 'Manage departments and client assignments',
    permissions: Object.values(PERMISSIONS.DEPARTMENTS)
  },
  EMAIL_TEMPLATES: {
    name: 'Email Templates',
    description: 'Manage email templates',
    permissions: Object.values(PERMISSIONS.EMAIL_TEMPLATES)
  },
  DASHBOARD_REPORTS: {
    name: 'Dashboard & Reports',
    description: 'Access dashboard and export reports',
    permissions: Object.values(PERMISSIONS.DASHBOARD)
  },
  FILE_MANAGEMENT: {
    name: 'File Management',
    description: 'Upload, download, and manage files',
    permissions: Object.values(PERMISSIONS.FILES)
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