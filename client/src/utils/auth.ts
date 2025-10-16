// import { 
//   User, 
//   AuthUser, 
//   Role, 
//   UserPermissions,
//   LoginCredentials,
//   AuthResponse 
// } from '../types';

// // =============================================================================
// // CONSTANTS
// // =============================================================================

// const TOKEN_KEY = 'auth_token';
// const USER_KEY = 'auth_user';
// const REFRESH_TOKEN_KEY = 'refresh_token';

// // Token expiration buffer (refresh 5 minutes before expiry)
// const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
// const PERMISSIONS_KEY = 'user_permissions';

// // =============================================================================
// // TOKEN MANAGEMENT
// // =============================================================================

// /**
//  * Store authentication token in localStorage
//  */
// export const setToken = (token: string): void => {
//   try {
//     localStorage.setItem(TOKEN_KEY, token);
//   } catch (error) {
//     console.error('Failed to store auth token:', error);
//   }
// };

// /**
//  * Retrieve authentication token from localStorage
//  */
// export const getToken = (): string | null => {
//   try {
//     return localStorage.getItem(TOKEN_KEY);
//   } catch (error) {
//     console.error('Failed to retrieve auth token:', error);
//     return null;
//   }
// };

// /**
//  * Remove authentication token from localStorage
//  */
// export const removeToken = (): void => {
//   try {
//     localStorage.removeItem(TOKEN_KEY);
//   } catch (error) {
//     console.error('Failed to remove auth token:', error);
//   }
// };

// /**
//  * Store refresh token in localStorage
//  */
// export const setRefreshToken = (refreshToken: string): void => {
//   try {
//     localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
//   } catch (error) {
//     console.error('Failed to store refresh token:', error);
//   }
// };

// /**
//  * Retrieve refresh token from localStorage
//  */
// export const getRefreshToken = (): string | null => {
//   try {
//     return localStorage.getItem(REFRESH_TOKEN_KEY);
//   } catch (error) {
//     console.error('Failed to retrieve refresh token:', error);
//     return null;
//   }
// };

// /**
//  * Remove refresh token from localStorage
//  */
// export const removeRefreshToken = (): void => {
//   try {
//     localStorage.removeItem(REFRESH_TOKEN_KEY);
//   } catch (error) {
//     console.error('Failed to remove refresh token:', error);
//   }
// };

// // =============================================================================
// // USER DATA MANAGEMENT
// // =============================================================================

// /**
//  * Store user data in localStorage
//  */
// export const setUser = (user: AuthUser): void => {
//   try {
//     localStorage.setItem(USER_KEY, JSON.stringify(user));
//   } catch (error) {
//     console.error('Failed to store user data:', error);
//   }
// };

// /**
//  * Retrieve user data from localStorage
//  */
// export const getUser = (): AuthUser | null => {
//   try {
//     const userData = localStorage.getItem(USER_KEY);
//     return userData ? JSON.parse(userData) : null;
//   } catch (error) {
//     console.error('Failed to retrieve user data:', error);
//     return null;
//   }
// };

// /**
//  * Remove user data from localStorage
//  */
// export const removeUser = (): void => {
//   try {
//     localStorage.removeItem(USER_KEY);
//   } catch (error) {
//     console.error('Failed to remove user data:', error);
//   }
// };

// /**
//  * Update user data in localStorage
//  */
// export const updateUser = (updates: Partial<AuthUser>): AuthUser | null => {
//   try {
//     const currentUser = getUser();
//     if (!currentUser) return null;
    
//     const updatedUser = { ...currentUser, ...updates };
//     setUser(updatedUser);
//     return updatedUser;
//   } catch (error) {
//     console.error('Failed to update user data:', error);
//     return null;
//   }
// };

// // =============================================================================
// // AUTHENTICATION STATE
// // =============================================================================

// /**
//  * Check if user is currently authenticated
//  */
// export const isAuthenticated = (): boolean => {
//   const token = getToken();
//   const user = getUser();
//   return !!(token && user && user.isActive);
// };

// /**
//  * Check if current user has specific role
//  */
// export const hasRole = (role: Role): boolean => {
//   const user = getUser();
//   return user ? user.role === role : false;
// };

// /**
//  * Check if current user has any of the specified roles
//  */
// export const hasAnyRole = (roles: Role[]): boolean => {
//   const user = getUser();
//   return user ? roles.includes(user.role) : false;
// };

// /**
//  * Check if current user has role equal or higher than specified role
//  */
// export const hasRoleOrHigher = (minimumRole: Role): boolean => {
//   const user = getUser();
//   if (!user) return false;

//   const roleHierarchy: Record<Role, number> = {
//     [Role.USER]: 1,
//     [Role.MANAGER]: 2,
//     [Role.ADMIN]: 3,
//     [Role.SUPER_ADMIN]: 4,
//   };

//   const userLevel = roleHierarchy[user.role] || 0;
//   const requiredLevel = roleHierarchy[minimumRole] || 0;
  
//   return userLevel >= requiredLevel;
// };

// /**
//  * Get current user's role level
//  */
// export const getUserRoleLevel = (): number => {
//   const user = getUser();
//   if (!user) return 0;

//   const roleHierarchy: Record<Role, number> = {
//     [Role.USER]: 1,
//     [Role.MANAGER]: 2,
//     [Role.ADMIN]: 3,
//     [Role.SUPER_ADMIN]: 4,
//   };

//   return roleHierarchy[user.role] || 0;
// };
// export const getUserPermissions = (): UserPermissions => {
//   const user = getUser();
//   if (!user) {
//     return {
//       users: { read: false, create: false, update: false, delete: false },
//       clients: { read: false, create: false, update: false, delete: false },
//       quotations: { read: false, create: false, update: false, delete: false, approve: false, reject: false, read_all: false },
//       invoices: { read: false, create: false, update: false, delete: false, send: false, read_all: false,mark_paid: false,update_tax_rates:false},
//     };
//   }

//   // Define permissions based on role
//   switch (user.role) {
//     case Role.SUPER_ADMIN:
//       return {
//         users: { read: true, create: true, update: true, delete: true,manage_permissions:true },
//         clients: { read: true, create: true, update: true, delete: true },
//         quotations: { read: true, create: true, update: true, delete: true, approve: true, reject: true, read_all: true },
//         invoices: { read: true, create: true, update: true, delete: true, send: true, read_all: true,mark_paid: false,update_tax_rates:false },
//       };

//     case Role.ADMIN:
//       return {
//         users: { read: true, create: true, update: true, delete: false,manage_permissions:true }, // Can manage employees
//         clients: { read: true, create: true, update: true, delete: true },
//         quotations: { read: true, create: true, update: true, delete: true, approve: true, reject: true, read_all: true },
//         invoices: { read: true, create: true, update: true, delete: true, send: true, read_all: true,mark_paid: false,update_tax_rates:false },
//       };

//     case Role.MANAGER:
//       return {
//         users: { read: true, create: false, update: false, delete: false,manage_permissions:false }, // Can view employees only
//         clients: { read: true, create: true, update: true, delete: false },
//         quotations: { read: true, create: true, update: true, delete: false, approve: true, reject: true, read_all: true },
//         invoices: { read: true, create: true, update: true, delete: false, send: true, read_all: true,mark_paid: false,update_tax_rates:false },
//       };

//     case Role.USER: // Employee role - main focus of your workflow
//     default:
//       return {
//         users: { read: false, create: false, update: false, delete: false,manage_permissions:false }, // No user management
//         clients: { read: true, create: true, update: true, delete: false }, // Can manage clients
//         quotations: { read: true, create: true, update: true, delete: false, approve: true, reject: true, read_all: true }, // Can manage own quotations
//         invoices: { read: true, create: false, update: false, delete: false, send: true, read_all: true,mark_paid: false,update_tax_rates:false }, // Can view and send invoices
//       };
//   }
// };

// /**
//  * Check if user has specific permission
//  */
// export const hasPermission = (resource: keyof UserPermissions, action: string): boolean => {
//   const permissions = getUserPermissions();
//   const resourcePermissions = permissions[resource];
//   return resourcePermissions && (resourcePermissions as any)[action] === true;
// };

// /**
//  * Check if user can access admin features
//  */
// export const canAccessAdmin = (): boolean => {
//   return hasRoleOrHigher(Role.ADMIN);
// };

// /**
//  * Check if user can manage users
//  */
// export const canManageUsers = (): boolean => {
//   return hasPermission('users', 'create') || hasPermission('users', 'update');
// };

// /**
//  * Check if user can manage clients
//  */
// export const canManageClients = (): boolean => {
//   return hasPermission('clients', 'create') || hasPermission('clients', 'update');
// };

// /**
//  * Check if user can approve/reject quotations
//  */
// export const canApproveQuotations = (): boolean => {
//   return hasPermission('quotations', 'approve') || hasPermission('quotations', 'reject');
// };

// /**
//  * Check if user can see all records (not just their own)
//  */
// export const canSeeAllRecords = (): boolean => {
//   return hasRoleOrHigher(Role.MANAGER);
// };

// // =============================================================================
// // JWT TOKEN UTILITIES
// // =============================================================================

// /**
//  * Decode JWT token payload (without verification)
//  */
// export const decodeToken = (token: string): any | null => {
//   try {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//         .join('')
//     );
//     return JSON.parse(jsonPayload);
//   } catch (error) {
//     console.error('Failed to decode token:', error);
//     return null;
//   }
// };

// /**
//  * Check if JWT token is expired
//  */
// export const isTokenExpired = (token: string): boolean => {
//   const decoded = decodeToken(token);
//   if (!decoded || !decoded.exp) return true;
  
//   const currentTime = Date.now() / 1000;
//   return decoded.exp < currentTime;
// };

// /**
//  * Check if JWT token needs refresh (within buffer time)
//  */
// export const shouldRefreshToken = (token: string): boolean => {
//   const decoded = decodeToken(token);
//   if (!decoded || !decoded.exp) return true;
  
//   const currentTime = Date.now();
//   const expirationTime = decoded.exp * 1000;
  
//   return (expirationTime - currentTime) < TOKEN_REFRESH_BUFFER;
// };

// /**
//  * Get time until token expires (in milliseconds)
//  */
// export const getTimeUntilExpiry = (token: string): number => {
//   const decoded = decodeToken(token);
//   if (!decoded || !decoded.exp) return 0;
  
//   const currentTime = Date.now();
//   const expirationTime = decoded.exp * 1000;
  
//   return Math.max(0, expirationTime - currentTime);
// };

// // =============================================================================
// // AUTHENTICATION ACTIONS
// // =============================================================================

// /**
//  * Handle successful login - store tokens and user data
//  */
// export const handleLoginSuccess = (authResponse: AuthResponse): void => {
//   const { token, refreshToken, user } = authResponse;
  
//   setToken(token);
//   setUser(user);
  
//   if (refreshToken) {
//     setRefreshToken(refreshToken);
//   }
// };

// /**
//  * Handle logout - clear all stored auth data
//  */
// export const handleLogout = (): void => {
//   removeToken();
//   removeRefreshToken();
//   removeUser();
  
//   // Clear any other app-specific data if needed
//   // You might want to clear other localStorage items here
// };

// /**
//  * Handle authentication error - clear invalid auth data
//  */
// export const handleAuthError = (): void => {
//   removeToken();
//   removeRefreshToken();
//   removeUser();
// };

// // =============================================================================
// // VALIDATION UTILITIES
// // =============================================================================

// /**
//  * Validate email format
//  */
// export const isValidEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// /**
//  * Validate password strength
//  */
// export const isValidPassword = (password: string): boolean => {
//   // At least 6 characters (matching backend validation)
//   return password.length >= 6;
// };

// /**
//  * Get password strength score (0-4)
//  */
// export const getPasswordStrength = (password: string): number => {
//   let score = 0;
  
//   if (password.length >= 6) score++;
//   if (password.length >= 10) score++;
//   if (/[A-Z]/.test(password)) score++;
//   if (/[0-9]/.test(password)) score++;
//   if (/[^A-Za-z0-9]/.test(password)) score++;
  
//   return Math.min(score, 4);
// };

// /**
//  * Validate login credentials
//  */
// export const validateLoginCredentials = (credentials: LoginCredentials): string[] => {
//   const errors: string[] = [];
  
//   if (!credentials.email) {
//     errors.push('Email is required');
//   } else if (!isValidEmail(credentials.email)) {
//     errors.push('Invalid email format');
//   }
  
//   if (!credentials.password) {
//     errors.push('Password is required');
//   } else if(!credentials.password || credentials.password.length < 6) {
//     errors.push('Password must be at least 6 characters long');
//   }
  
//   return errors;
// };

// // =============================================================================
// // UTILITY FUNCTIONS
// // =============================================================================

// /**
//  * Get user display name
//  */
// export const getUserDisplayName = (user?: User | AuthUser | null): string => {
//   if (!user) return 'Unknown User';
//   return `${user.firstName} ${user.lastName}`.trim() || user.email;
// };

// /**
//  * Get user initials
//  */
// export const getUserInitials = (user?: User | AuthUser | null): string => {
//   if (!user) return 'U';
  
//   const firstInitial = user.firstName?.[0]?.toUpperCase() || '';
//   const lastInitial = user.lastName?.[0]?.toUpperCase() || '';
  
//   return `${firstInitial}${lastInitial}` || user.email?.[0]?.toUpperCase() || 'U';
// };

// /**
//  * Get role display name
//  */
// export const getRoleDisplayName = (role: Role): string => {
//   const roleNames: Record<Role, string> = {
//     [Role.SUPER_ADMIN]: 'Super Admin',
//     [Role.ADMIN]: 'Admin',
//     [Role.MANAGER]: 'Manager',
//     [Role.USER]: 'User',
//   };
  
//   return roleNames[role] || 'Unknown';
// };

// /**
//  * Get role color for UI display
//  */
// export const getRoleColor = (role: Role): string => {
//   const roleColors: Record<Role, string> = {
//     [Role.SUPER_ADMIN]: '#dc2626', // red-600
//     [Role.ADMIN]: '#ea580c', // orange-600
//     [Role.MANAGER]: '#0369a1', // sky-700
//     [Role.USER]: '#16a34a', // green-600
//   };
  
//   return roleColors[role] || '#64748b'; // slate-500
// };

// // =============================================================================
// // AUTO-LOGOUT MANAGEMENT
// // =============================================================================

// let logoutTimer: NodeJS.Timeout | null = null;
// let warningTimer: NodeJS.Timeout | null = null;

// /**
//  * Set up automatic logout after inactivity
//  */
// export const setupAutoLogout = (
//   inactivityTime: number = 30 * 60 * 1000, // 30 minutes default
//   warningTime: number = 5 * 60 * 1000, // 5 minutes warning default
//   onWarning?: () => void,
//   onLogout?: () => void
// ): void => {
//   clearAutoLogout();

//   const resetTimers = () => {
//     clearAutoLogout();
    
//     // Set warning timer
//     warningTimer = setTimeout(() => {
//       if (onWarning) onWarning();
//     }, inactivityTime - warningTime);

//     // Set logout timer
//     logoutTimer = setTimeout(() => {
//       handleLogout();
//       if (onLogout) onLogout();
//     }, inactivityTime);
//   };

//   // Set initial timers
//   resetTimers();

//   // Reset timers on user activity
//   const resetOnActivity = () => {
//     if (isAuthenticated()) {
//       resetTimers();
//     }
//   };

//   // Listen for user activity
//   const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
//   events.forEach(event => {
//     document.addEventListener(event, resetOnActivity, true);
//   });
// };

// /**
//  * Clear auto-logout timers
//  */
// export const clearAutoLogout = (): void => {
//   if (logoutTimer) {
//     clearTimeout(logoutTimer);
//     logoutTimer = null;
//   }
//   if (warningTimer) {
//     clearTimeout(warningTimer);
//     warningTimer = null;
//   }
// };

// /**
//  * Extend session (reset auto-logout timers)
//  */
// export const extendSession = (): void => {
//   // This will be called by the setupAutoLogout activity listeners
//   // You can also call this manually when needed
// };

// // =============================================================================
// // SESSION MANAGEMENT
// // =============================================================================

// /**
//  * Initialize authentication session
//  * Call this when the app starts
//  */
// export const initializeAuth = (config?: {
//   autoLogoutTime?: number;
//   warningTime?: number;
//   onSessionWarning?: () => void;
//   onSessionExpired?: () => void;
// }): void => {
//   // Check if user is authenticated
//   const token = getToken();
//   const user = getUser();

//   if (token && user) {
//     // Check if token is expired
//     if (isTokenExpired(token)) {
//       handleAuthError();
//       if (config?.onSessionExpired) {
//         config.onSessionExpired();
//       }
//       return;
//     }

//     // Set up auto-logout if user is authenticated
//     if (config?.autoLogoutTime) {
//       setupAutoLogout(
//         config.autoLogoutTime,
//         config.warningTime,
//         config.onSessionWarning,
//         config.onSessionExpired
//       );
//     }
//   }
// };

// /**
//  * Clean up authentication session
//  * Call this when the app unmounts or user logs out
//  */
// export const cleanupAuth = (): void => {
//   clearAutoLogout();
// };

// // =============================================================================
// // ROUTE PROTECTION UTILITIES
// // =============================================================================

// /**
//  * Check if current user can access a specific route
//  */
// export const canAccessRoute = (routeRequirements: {
//   requireAuth?: boolean;
//   requiredRole?: Role;
//   requiredPermissions?: { resource: keyof UserPermissions; action: string }[];
// }): boolean => {
//   const { requireAuth = true, requiredRole, requiredPermissions } = routeRequirements;

//   // Check authentication
//   if (requireAuth && !isAuthenticated()) {
//     return false;
//   }

//   // Check role requirement
//   if (requiredRole && !hasRoleOrHigher(requiredRole)) {
//     return false;
//   }

//   // Check permission requirements
//   if (requiredPermissions) {
//     const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
//       hasPermission(resource, action)
//     );
//     if (!hasAllPermissions) {
//       return false;
//     }
//   }

//   return true;
// };

// /**
//  * Get redirect path for unauthorized access
//  */
// export const getUnauthorizedRedirect = (
//   currentPath: string,
//   isAuthenticated: boolean
// ): string => {
//   if (!isAuthenticated) {
//     return `/login?redirect=${encodeURIComponent(currentPath)}`;
//   }
//   return '/dashboard'; // Default redirect for authorized but insufficient permissions
// };

// // =============================================================================
// // FORM VALIDATION HELPERS
// // =============================================================================

// /**
//  * Validate user registration data
//  */
// export const validateRegistrationData = (data: {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword?: string;
// }): string[] => {
//   const errors: string[] = [];

//   // Name validation
//   if (!data.firstName?.trim()) {
//     errors.push('First name is required');
//   } else if (data.firstName.trim().length < 2) {
//     errors.push('First name must be at least 2 characters');
//   }

//   if (!data.lastName?.trim()) {
//     errors.push('Last name is required');
//   } else if (data.lastName.trim().length < 2) {
//     errors.push('Last name must be at least 2 characters');
//   }

//   // Email validation
//   if (!data.email) {
//     errors.push('Email is required');
//   } else if (!isValidEmail(data.email)) {
//     errors.push('Invalid email format');
//   }

//   // Password validation
//   if (!data.password) {
//     errors.push('Password is required');
//   } else if (!isValidPassword(data.password)) {
//     errors.push('Password must be at least 6 characters long');
//   }

//   // Confirm password validation (if provided)
//   if (data.confirmPassword !== undefined) {
//     if (data.password !== data.confirmPassword) {
//       errors.push('Passwords do not match');
//     }
//   }

//   return errors;
// };

// /**
//  * Validate password change data
//  */
// export const validatePasswordChangeData = (data: {
//   currentPassword: string;
//   newPassword: string;
//   confirmPassword: string;
// }): string[] => {
//   const errors: string[] = [];

//   if (!data.currentPassword) {
//     errors.push('Current password is required');
//   }

//   if (!data.newPassword) {
//     errors.push('New password is required');
//   } else if (!isValidPassword(data.newPassword)) {
//     errors.push('New password must be at least 6 characters long');
//   }

//   if (data.currentPassword === data.newPassword) {
//     errors.push('New password must be different from current password');
//   }

//   if (data.newPassword !== data.confirmPassword) {
//     errors.push('Password confirmation does not match new password');
//   }

//   return errors;
// };

// // =============================================================================
// // EXPORT DEFAULT OBJECT WITH ALL UTILITIES
// // =============================================================================

// const authUtils = {
//   // Token management
//   setToken,
//   getToken,
//   removeToken,
//   setRefreshToken,
//   getRefreshToken,
//   removeRefreshToken,
  
//   // User data management
//   setUser,
//   getUser,
//   removeUser,
//   updateUser,
  
//   // Authentication state
//   isAuthenticated,
//   hasRole,
//   hasAnyRole,
//   hasRoleOrHigher,
//   getUserRoleLevel,
  
//   // Permissions
//   getUserPermissions,
//   hasPermission,
//   canAccessAdmin,
//   canManageUsers,
//   canManageClients,
//   canApproveQuotations,
//   canSeeAllRecords,
  
//   // JWT utilities
//   decodeToken,
//   isTokenExpired,
//   shouldRefreshToken,
//   getTimeUntilExpiry,
  
//   // Authentication actions
//   handleLoginSuccess,
//   handleLogout,
//   handleAuthError,
  
//   // Validation
//   isValidEmail,
//   isValidPassword,
//   getPasswordStrength,
//   validateLoginCredentials,
//   validateRegistrationData,
//   validatePasswordChangeData,
  
//   // Display utilities
//   getUserDisplayName,
//   getUserInitials,
//   getRoleDisplayName,
//   getRoleColor,
  
//   // Session management
//   setupAutoLogout,
//   clearAutoLogout,
//   extendSession,
//   initializeAuth,
//   cleanupAuth,
  
//   // Route protection
//   canAccessRoute,
//   getUnauthorizedRedirect,
// };

// export default authUtils;


import { 
  User, 
  AuthUser, 
  Role, 
  UserPermissions,
  LoginCredentials,
  AuthResponse 
} from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_TOKEN_KEY = 'refresh_token';
const PERMISSIONS_KEY = 'user_permissions';

// Token expiration buffer (refresh 5 minutes before expiry)
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

/**
 * Store authentication token in localStorage
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
};

/**
 * Retrieve authentication token from localStorage
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove auth token:', error);
  }
};

/**
 * Store refresh token in localStorage
 */
export const setRefreshToken = (refreshToken: string): void => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
};

/**
 * Retrieve refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
};

/**
 * Remove refresh token from localStorage
 */
export const removeRefreshToken = (): void => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove refresh token:', error);
  }
};

// =============================================================================
// PERMISSIONS MANAGEMENT
// =============================================================================

/**
 * Store user permissions in localStorage
 */
export const setUserPermissions = (permissions: string[]): void => {
  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error('Failed to store permissions:', error);
  }
};

/**
 * Get stored permissions from localStorage
 */
export const getStoredPermissions = (): string[] => {
  try {
    const perms = localStorage.getItem(PERMISSIONS_KEY);
    return perms ? JSON.parse(perms) : [];
  } catch (error) {
    console.error('Failed to retrieve permissions:', error);
    return [];
  }
};

/**
 * Remove permissions from localStorage
 */
export const removeStoredPermissions = (): void => {
  try {
    localStorage.removeItem(PERMISSIONS_KEY);
  } catch (error) {
    console.error('Failed to remove permissions:', error);
  }
};

/**
 * Check if user has a specific permission (reads from stored permissions)
 */
const checkPermission = (permission: string): boolean => {
  const permissions = getStoredPermissions();
  return permissions.includes(permission);
};

// =============================================================================
// USER DATA MANAGEMENT
// =============================================================================

/**
 * Store user data in localStorage
 */
export const setUser = (user: AuthUser): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

/**
 * Retrieve user data from localStorage
 */
export const getUser = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove user data:', error);
  }
};

/**
 * Update user data in localStorage
 */
export const updateUser = (updates: Partial<AuthUser>): AuthUser | null => {
  try {
    const currentUser = getUser();
    if (!currentUser) return null;
    
    const updatedUser = { ...currentUser, ...updates };
    setUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user data:', error);
    return null;
  }
};

// =============================================================================
// AUTHENTICATION STATE
// =============================================================================

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user && user.isActive);
};

/**
 * Check if current user has specific role
 */
export const hasRole = (role: Role): boolean => {
  const user = getUser();
  return user ? user.role === role : false;
};

/**
 * Check if current user has any of the specified roles
 */
export const hasAnyRole = (roles: Role[]): boolean => {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
};

/**
 * Check if current user has role equal or higher than specified role
 */
export const hasRoleOrHigher = (minimumRole: Role): boolean => {
  const user = getUser();
  if (!user) return false;

  const roleHierarchy: Record<Role, number> = {
    [Role.USER]: 1,
    [Role.MANAGER]: 2,
    [Role.ADMIN]: 3,
    [Role.SUPER_ADMIN]: 4,
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Get current user's role level
 */
export const getUserRoleLevel = (): number => {
  const user = getUser();
  if (!user) return 0;

  const roleHierarchy: Record<Role, number> = {
    [Role.USER]: 1,
    [Role.MANAGER]: 2,
    [Role.ADMIN]: 3,
    [Role.SUPER_ADMIN]: 4,
  };

  return roleHierarchy[user.role] || 0;
};

/**
 * Get user permissions in structured format (reads from database-stored permissions)
 */
export const getUserPermissions = (): UserPermissions => {
  return {
    users: {
      read: checkPermission('users:read'),
      create: checkPermission('users:create'),
      update: checkPermission('users:update'),
      delete: checkPermission('users:delete'),
      manage_permissions: checkPermission('users:manage_permissions'),
    },
    clients: {
      read: checkPermission('clients:read'),
      create: checkPermission('clients:create'),
      update: checkPermission('clients:update'),
      delete: checkPermission('clients:delete'),
    },
    quotations: {
      read: checkPermission('quotations:read'),
      create: checkPermission('quotations:create'),
      update: checkPermission('quotations:update'),
      delete: checkPermission('quotations:delete'),
      approve: checkPermission('quotations:approve'),
      reject: checkPermission('quotations:reject'),
      read_all: checkPermission('quotations:read_all'),
    },
    invoices: {
      read: checkPermission('invoices:read'),
      create: checkPermission('invoices:create'),
      update: checkPermission('invoices:update'),
      delete: checkPermission('invoices:delete'),
      send: checkPermission('invoices:send'),
      read_all: checkPermission('invoices:read_all'),
      mark_paid: checkPermission('invoices:mark_paid'),
      update_tax_rates: checkPermission('invoices:update_tax_rates'),
    },
  };
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (resource: keyof UserPermissions, action: string): boolean => {
  const permissions = getUserPermissions();
  const resourcePermissions = permissions[resource];
  return resourcePermissions && (resourcePermissions as any)[action] === true;
};

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (): boolean => {
  return hasRoleOrHigher(Role.ADMIN);
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (): boolean => {
  return hasPermission('users', 'create') || hasPermission('users', 'update');
};

/**
 * Check if user can manage clients
 */
export const canManageClients = (): boolean => {
  return hasPermission('clients', 'create') || hasPermission('clients', 'update');
};

/**
 * Check if user can approve/reject quotations
 */
export const canApproveQuotations = (): boolean => {
  return hasPermission('quotations', 'approve') || hasPermission('quotations', 'reject');
};

/**
 * Check if user can see all records (not just their own)
 */
export const canSeeAllRecords = (): boolean => {
  return hasRoleOrHigher(Role.MANAGER);
};

// =============================================================================
// JWT TOKEN UTILITIES
// =============================================================================

/**
 * Decode JWT token payload (without verification)
 */
export const decodeToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Check if JWT token needs refresh (within buffer time)
 */
export const shouldRefreshToken = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now();
  const expirationTime = decoded.exp * 1000;
  
  return (expirationTime - currentTime) < TOKEN_REFRESH_BUFFER;
};

/**
 * Get time until token expires (in milliseconds)
 */
export const getTimeUntilExpiry = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Date.now();
  const expirationTime = decoded.exp * 1000;
  
  return Math.max(0, expirationTime - currentTime);
};

// =============================================================================
// AUTHENTICATION ACTIONS
// =============================================================================

/**
 * Handle successful login - store tokens and user data
 */
export const handleLoginSuccess = (authResponse: AuthResponse): void => {
  const { token, refreshToken, user } = authResponse;
  
  setToken(token);
  setUser(user);
  
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
};

/**
 * Handle logout - clear all stored auth data
 */
export const handleLogout = (): void => {
  removeToken();
  removeRefreshToken();
  removeUser();
  removeStoredPermissions(); // Clear permissions on logout
};

/**
 * Handle authentication error - clear invalid auth data
 */
export const handleAuthError = (): void => {
  removeToken();
  removeRefreshToken();
  removeUser();
  removeStoredPermissions(); // Clear permissions on error
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters (matching backend validation)
  return password.length >= 6;
};

/**
 * Get password strength score (0-4)
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  return Math.min(score, 4);
};

/**
 * Validate login credentials
 */
export const validateLoginCredentials = (credentials: LoginCredentials): string[] => {
  const errors: string[] = [];
  
  if (!credentials.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(credentials.email)) {
    errors.push('Invalid email format');
  }
  
  if (!credentials.password) {
    errors.push('Password is required');
  } else if(!credentials.password || credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get user display name
 */
export const getUserDisplayName = (user?: User | AuthUser | null): string => {
  if (!user) return 'Unknown User';
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
};

/**
 * Get user initials
 */
export const getUserInitials = (user?: User | AuthUser | null): string => {
  if (!user) return 'U';
  
  const firstInitial = user.firstName?.[0]?.toUpperCase() || '';
  const lastInitial = user.lastName?.[0]?.toUpperCase() || '';
  
  return `${firstInitial}${lastInitial}` || user.email?.[0]?.toUpperCase() || 'U';
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: Role): string => {
  const roleNames: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Super Admin',
    [Role.ADMIN]: 'Admin',
    [Role.MANAGER]: 'Manager',
    [Role.USER]: 'User',
  };
  
  return roleNames[role] || 'Unknown';
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: Role): string => {
  const roleColors: Record<Role, string> = {
    [Role.SUPER_ADMIN]: '#dc2626', // red-600
    [Role.ADMIN]: '#ea580c', // orange-600
    [Role.MANAGER]: '#0369a1', // sky-700
    [Role.USER]: '#16a34a', // green-600
  };
  
  return roleColors[role] || '#64748b'; // slate-500
};

// =============================================================================
// AUTO-LOGOUT MANAGEMENT
// =============================================================================

let logoutTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;

/**
 * Set up automatic logout after inactivity
 */
export const setupAutoLogout = (
  inactivityTime: number = 30 * 60 * 1000, // 30 minutes default
  warningTime: number = 5 * 60 * 1000, // 5 minutes warning default
  onWarning?: () => void,
  onLogout?: () => void
): void => {
  clearAutoLogout();

  const resetTimers = () => {
    clearAutoLogout();
    
    // Set warning timer
    warningTimer = setTimeout(() => {
      if (onWarning) onWarning();
    }, inactivityTime - warningTime);

    // Set logout timer
    logoutTimer = setTimeout(() => {
      handleLogout();
      if (onLogout) onLogout();
    }, inactivityTime);
  };

  // Set initial timers
  resetTimers();

  // Reset timers on user activity
  const resetOnActivity = () => {
    if (isAuthenticated()) {
      resetTimers();
    }
  };

  // Listen for user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetOnActivity, true);
  });
};

/**
 * Clear auto-logout timers
 */
export const clearAutoLogout = (): void => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
};

/**
 * Extend session (reset auto-logout timers)
 */
export const extendSession = (): void => {
  // This will be called by the setupAutoLogout activity listeners
  // You can also call this manually when needed
};

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Initialize authentication session
 * Call this when the app starts
 */
export const initializeAuth = (config?: {
  autoLogoutTime?: number;
  warningTime?: number;
  onSessionWarning?: () => void;
  onSessionExpired?: () => void;
}): void => {
  // Check if user is authenticated
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      handleAuthError();
      if (config?.onSessionExpired) {
        config.onSessionExpired();
      }
      return;
    }

    // Set up auto-logout if user is authenticated
    if (config?.autoLogoutTime) {
      setupAutoLogout(
        config.autoLogoutTime,
        config.warningTime,
        config.onSessionWarning,
        config.onSessionExpired
      );
    }
  }
};

/**
 * Clean up authentication session
 * Call this when the app unmounts or user logs out
 */
export const cleanupAuth = (): void => {
  clearAutoLogout();
};

// =============================================================================
// ROUTE PROTECTION UTILITIES
// =============================================================================

/**
 * Check if current user can access a specific route
 */
export const canAccessRoute = (routeRequirements: {
  requireAuth?: boolean;
  requiredRole?: Role;
  requiredPermissions?: { resource: keyof UserPermissions; action: string }[];
}): boolean => {
  const { requireAuth = true, requiredRole, requiredPermissions } = routeRequirements;

  // Check authentication
  if (requireAuth && !isAuthenticated()) {
    return false;
  }

  // Check role requirement
  if (requiredRole && !hasRoleOrHigher(requiredRole)) {
    return false;
  }

  // Check permission requirements
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    );
    if (!hasAllPermissions) {
      return false;
    }
  }

  return true;
};

/**
 * Get redirect path for unauthorized access
 */
export const getUnauthorizedRedirect = (
  currentPath: string,
  isAuthenticated: boolean
): string => {
  if (!isAuthenticated) {
    return `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
  return '/dashboard'; // Default redirect for authorized but insufficient permissions
};

// =============================================================================
// FORM VALIDATION HELPERS
// =============================================================================

/**
 * Validate user registration data
 */
export const validateRegistrationData = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}): string[] => {
  const errors: string[] = [];

  // Name validation
  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  } else if (data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  } else if (data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  } else if (!isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }

  // Confirm password validation (if provided)
  if (data.confirmPassword !== undefined) {
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
  }

  return errors;
};

/**
 * Validate password change data
 */
export const validatePasswordChangeData = (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string[] => {
  const errors: string[] = [];

  if (!data.currentPassword) {
    errors.push('Current password is required');
  }

  if (!data.newPassword) {
    errors.push('New password is required');
  } else if (!isValidPassword(data.newPassword)) {
    errors.push('New password must be at least 6 characters long');
  }

  if (data.currentPassword === data.newPassword) {
    errors.push('New password must be different from current password');
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.push('Password confirmation does not match new password');
  }

  return errors;
};

// =============================================================================
// EXPORT DEFAULT OBJECT WITH ALL UTILITIES
// =============================================================================

const authUtils = {
  // Token management
  setToken,
  getToken,
  removeToken,
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  
  // Permissions management
  setUserPermissions,
  getStoredPermissions,
  removeStoredPermissions,
  
  // User data management
  setUser,
  getUser,
  removeUser,
  updateUser,
  
  // Authentication state
  isAuthenticated,
  hasRole,
  hasAnyRole,
  hasRoleOrHigher,
  getUserRoleLevel,
  
  // Permissions
  getUserPermissions,
  hasPermission,
  canAccessAdmin,
  canManageUsers,
  canManageClients,
  canApproveQuotations,
  canSeeAllRecords,
  
  // JWT utilities
  decodeToken,
  isTokenExpired,
  shouldRefreshToken,
  getTimeUntilExpiry,
  
  // Authentication actions
  handleLoginSuccess,
  handleLogout,
  handleAuthError,
  
  // Validation
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  validateLoginCredentials,
  validateRegistrationData,
  validatePasswordChangeData,
  
  // Display utilities
  getUserDisplayName,
  getUserInitials,
  getRoleDisplayName,
  getRoleColor,
  
  // Session management
  setupAutoLogout,
  clearAutoLogout,
  extendSession,
  initializeAuth,
  cleanupAuth,
  
  // Route protection
  canAccessRoute,
  getUnauthorizedRedirect,
};

export default authUtils;