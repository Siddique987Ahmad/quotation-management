import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  SystemSettingsData,
  CompanySettings,
  EmailSettings,
  TaxSettings,
  InvoiceSettings,
  NotificationSettings,
  SecuritySettings,
  UserPermissionData,
  AvailablePermissions,
  RolePermissionSettings,
  RoleStatistics,
  EmailTemplate,
  UpdateTemplateData,
  CreateTemplateData,
  BulkQuotationActionResponse,
  // EmailCheckResponse
} from "../types";

// API Configuration - Enhanced for VPS deployment
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // In production, try to use the same domain with /api
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/api`;
  }
  
  // Check if we're running on VPS (IP address)
  const currentHost = window.location.hostname;
  console.log('🔍 Current hostname:', currentHost);
  
  // Force VPS configuration for IP addresses
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    // Running on VPS - use the same IP with port 5000
    const apiUrl = `http://${currentHost}:5000/api`;
    console.log('🌐 Using VPS API URL:', apiUrl);
    return apiUrl;
  }
  
  // Development fallback
  console.log('🏠 Using localhost API URL');
  return "http://148.230.82.188:5000/api";
};

// Force API URL for VPS deployment
const API_BASE_URL = (() => {
  const currentHost = window.location.hostname;
  
  // If running on VPS IP, use the same IP for API
  if (currentHost === '148.230.82.188') {
    return 'http://148.230.82.188:5000/api';
  }
  
  // Otherwise use the dynamic configuration
  return getApiBaseUrl();
})();

// Debug logging
console.log('🔧 API Configuration Debug:');
console.log('📍 Current hostname:', window.location.hostname);
console.log('🌐 Current origin:', window.location.origin);
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Test API connectivity
fetch(API_BASE_URL.replace('/api', '') + '/health')
  .then(response => response.json())
  .then(data => console.log('✅ Backend health check:', data))
  .catch(error => console.error('❌ Backend health check failed:', error));

// Create axios instance with enhanced configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for VPS
  headers: {
    "Content-Type": "application/json",
  },
  // Enhanced configuration for VPS deployment
  withCredentials: true, // Important for CORS with credentials
  validateStatus: (status) => {
    // Accept status codes 200-299 and 401 for auth redirects
    return (status >= 200 && status < 300) || status === 401;
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
// api.interceptors.response.use(
//   (response: AxiosResponse) => {
//     return response;
//   },
//   (error: AxiosError) => {
//     if (error.response?.status === 401) {
//       // Unauthorized - clear token and redirect to login
//       localStorage.removeItem("auth_token");
//       localStorage.removeItem("auth_user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// Enhanced response interceptor with CORS error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network/CORS Error:', error);
      return Promise.reject({
        ...error,
        message: 'Unable to connect to server. Please check your internet connection and try again.',
        isCorsError: true
      });
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limited - waiting 5 seconds before retry');
      return Promise.reject({
        ...error,
        message: 'Too many requests. Please wait a moment before trying again.'
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = "/login";
      }
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server Error:', error.response?.data || error.message);
      return Promise.reject({
        ...error,
        message: 'Server error. Please try again later or contact support if the problem persists.'
      });
    }
    
    return Promise.reject(error);
  }
);

// Base API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Specific Response Types for different APIs
interface UsersPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    users: any[];
    pagination: PaginationInfo;
  };
}

interface ClientsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    clients: any[];
    pagination: PaginationInfo;
  };
}

interface QuotationsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    quotations: any[];
    pagination: PaginationInfo;
  };
}

interface InvoicesPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    invoices: any[];
    pagination: PaginationInfo;
  };
}

interface NotificationsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    notifications: any[];
    pagination: PaginationInfo;
  };
}

// Authentication API
export const authAPI = {
  // Login user
  login: (
    email: string,
    password: string
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/auth/login", { email, password }),

  // Register user
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AxiosResponse<ApiResponse>> => api.post("/auth/register", data),

  // Get current user profile
  getProfile: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/auth/profile"),

  // Update profile
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<AxiosResponse<ApiResponse>> => api.put("/auth/profile", data),

  // Change password
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/auth/change-password", data),

  // Forgot password
  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/auth/forgot-password", { email }),

  // Reset password
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/auth/reset-password", data),

  // Refresh token
  refreshToken: (): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/auth/refresh-token"),

  // Logout
  logout: (): Promise<AxiosResponse<ApiResponse>> => api.post("/auth/logout"),

  // Check system status
  checkSystemStatus: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/auth/status"),
  
    getMyPermissions: () => api.get('/auth/permissions'),
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<AxiosResponse<UsersPaginatedResponse>> =>
    api.get("/users", { params }),

  // Get user by ID
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/users/${id}`),

  // Get user statistics
  getStatistics: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/users/${id}/statistics`),

  // Create user
  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AxiosResponse<ApiResponse>> => api.post("/users", data),

  // Update user
  update: (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    }
  ): Promise<AxiosResponse<ApiResponse>> => api.put(`/users/${id}`, data),

  // Update user status
  updateStatus: (
    id: string,
    isActive: boolean
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(`/users/${id}/status`, { isActive }),

  // Reset user password
  resetPassword: (
    id: string,
    data: {
      newPassword: string;
      confirmPassword: string;
    }
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/users/${id}/reset-password`, data),

  // Delete user
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/users/${id}`),

  // Get available roles
  getAvailableRoles: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/users/roles"),

  // Bulk actions
  bulkAction: (data: {
    userIds: string[];
    action: "activate" | "deactivate" | "delete";
  }): Promise<AxiosResponse<ApiResponse>> => api.post("/users/bulk", data),
};

// export const settingsAPI = {
//   // Get all system settings
//   getAll: (): Promise<AxiosResponse<ApiResponse<SystemSettingsData>>> =>
//     api.get('/settings'),

//   // Update company settings
//   updateCompany: (data: CompanySettings): Promise<AxiosResponse<ApiResponse<{ company: CompanySettings }>>> =>
//     api.post('/settings/company', data),

//   // Update email settings
//   updateEmail: (data: EmailSettings): Promise<AxiosResponse<ApiResponse<{ email: Omit<EmailSettings, 'password'> }>>> =>
//     api.post('/settings/email', data),

//   // Update tax settings
//   updateTax: (data: TaxSettings): Promise<AxiosResponse<ApiResponse<{ tax: TaxSettings }>>> =>
//     api.post('/settings/tax', data),

//   // Update invoice settings
//   updateInvoice: (data: InvoiceSettings): Promise<AxiosResponse<ApiResponse<{ invoice: InvoiceSettings }>>> =>
//     api.post('/settings/invoice', data),

//   // Update notification settings
//   updateNotifications: (data: NotificationSettings): Promise<AxiosResponse<ApiResponse<{ notifications: NotificationSettings }>>> =>
//     api.post('/settings/notifications', data),

//   // Update security settings
//   updateSecurity: (data: SecuritySettings): Promise<AxiosResponse<ApiResponse<{ security: SecuritySettings }>>> =>
//     api.post('/settings/security', data),

//   // Test email configuration
//   testEmail: (data: EmailTestData): Promise<AxiosResponse<ApiResponse<EmailTestResponse>>> =>
//     api.post('/settings/test-email', data),
// };

// export const settingsAPI = {
//   // Get all system settings
//   getAll: (): Promise<AxiosResponse<ApiResponse<SystemSettingsData>>> =>
//     api.get("/settings"),

//   // Get company settings specifically
//   getCompany: (): Promise<AxiosResponse<ApiResponse<CompanySettings>>> =>
//     api.get("/settings/company"),

//   // Update company settings (now supports FormData for file uploads)
//   updateCompany: (
//     data: CompanySettings | FormData
//   ): Promise<
//     AxiosResponse<
//       ApiResponse<{
//         company: CompanySettings;
//         logoUrl?: string;
//       }>
//     >
//   > => {
//     // Handle both regular JSON data and FormData for file uploads
//     const config =
//       data instanceof FormData
//         ? {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//           }
//         : {};

//     return api.post("/settings/company", data, config);
//   },

//   // Upload company logo specifically
//   uploadLogo: (
//     formData: FormData
//   ): Promise<
//     AxiosResponse<
//       ApiResponse<{
//         logoPath: string;
//         logoUrl: string;
//       }>
//     >
//   > =>
//     api.post("/settings/company/logo", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     }),

//   // Delete company logo
//   deleteLogo: (): Promise<AxiosResponse<ApiResponse>> =>
//     api.delete("/settings/company/logo"),

//   // Update email settings
//   updateEmail: (
//     data: EmailSettings
//   ): Promise<
//     AxiosResponse<ApiResponse<{ email: Omit<EmailSettings, "password"> }>>
//   > => api.post("/settings/email", data),

//   // Update tax settings
//   updateTax: (
//     data: TaxSettings
//   ): Promise<AxiosResponse<ApiResponse<{ tax: TaxSettings }>>> =>
//     api.post("/settings/tax", data),

//   // Update invoice settings
//   updateInvoice: (
//     data: InvoiceSettings
//   ): Promise<AxiosResponse<ApiResponse<{ invoice: InvoiceSettings }>>> =>
//     api.post("/settings/invoice", data),

//   // Update notification settings
//   updateNotifications: (
//     data: NotificationSettings
//   ): Promise<
//     AxiosResponse<ApiResponse<{ notifications: NotificationSettings }>>
//   > => api.post("/settings/notifications", data),

//   // Update security settings
//   updateSecurity: (
//     data: SecuritySettings
//   ): Promise<AxiosResponse<ApiResponse<{ security: SecuritySettings }>>> =>
//     api.post("/settings/security", data),

//   // Test email configuration
//   testEmail: (
//     data: EmailTestData
//   ): Promise<AxiosResponse<ApiResponse<EmailTestResponse>>> =>
//     api.post("/settings/test-email", data),

//   // Add to your existing settingsAPI object
//   getEmailTemplates: (): Promise<
//     AxiosResponse<ApiResponse<{ templates: any }>>
//   > => api.get("/settings/email-templates"),

//   updateEmailTemplates: (
//     templates: any
//   ): Promise<AxiosResponse<ApiResponse<{ templates: any }>>> =>
//     api.put("/settings/email-templates", { templates }),

//   previewEmailTemplate: (
//     templateName: string,
//     template: any
//   ): Promise<AxiosResponse<ApiResponse<{ preview: any }>>> =>
//     api.post("/settings/email-templates/preview", { templateName, template }),

//   getPreviewData: (
//     type: string
//   ): Promise<AxiosResponse<ApiResponse<{ records: any[] }>>> =>
//     api.get(`/settings/email-templates/preview-data/${type}`),

//   previewEmailTemplateWithRecord: (
//     recordId: string,
//     templateName: string,
//     template: any
//   ): Promise<AxiosResponse<ApiResponse<{ preview: any }>>> =>
//     api.post(`/settings/email-templates/preview/${recordId}`, {
//       templateName,
//       template,
//     }),
// };

// Enhanced Settings API - Replace your existing settingsAPI object with this complete version

export const settingsAPI = {
  // ==================== CORE SYSTEM SETTINGS ====================
  
  // Get all system settings
  getAll: (): Promise<AxiosResponse<ApiResponse<SystemSettingsData>>> =>
    api.get("/settings"),

  // Get company settings specifically
  getCompany: (): Promise<AxiosResponse<ApiResponse<CompanySettings>>> =>
    api.get("/settings/company"),

  // Update company settings (supports FormData for file uploads)
  updateCompany: (
    data: CompanySettings | FormData
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        company: CompanySettings;
        logoUrl?: string;
      }>
    >
  > => {
    const config =
      data instanceof FormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : {};
    return api.post("/settings/company", data, config);
  },

  // Upload company logo specifically
  uploadLogo: (
    formData: FormData
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        logoPath: string;
        logoUrl: string;
      }>
    >
  > =>
    api.post("/settings/company/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Delete company logo
  deleteLogo: (): Promise<AxiosResponse<ApiResponse>> =>
    api.delete("/settings/company/logo"),

  // Update email settings
  updateEmail: (
    data: EmailSettings
  ): Promise<
    AxiosResponse<ApiResponse<{ email: Omit<EmailSettings, "password"> }>>
  > => api.post("/settings/email", data),

  // Update tax settings
  updateTax: (
    data: TaxSettings
  ): Promise<AxiosResponse<ApiResponse<{ tax: TaxSettings }>>> =>
    api.post("/settings/tax", data),

  // Update invoice settings
  updateInvoice: (
    data: InvoiceSettings
  ): Promise<AxiosResponse<ApiResponse<{ invoice: InvoiceSettings }>>> =>
    api.post("/settings/invoice", data),

  // Update notification settings
  updateNotifications: (
    data: NotificationSettings
  ): Promise<
    AxiosResponse<ApiResponse<{ notifications: NotificationSettings }>>
  > => api.post("/settings/notifications", data),

  // Update security settings
  updateSecurity: (
    data: SecuritySettings
  ): Promise<AxiosResponse<ApiResponse<{ security: SecuritySettings }>>> =>
    api.post("/settings/security", data),
  

  /**
   * Get default sections for template type
   */
  // getDefaultSections: (type: EmailTemplateType): Record<string, any> => {
  //   const baseSections = {
  //     header: { enabled: true, title: "{{companyName}}", backgroundColor: "#f8f9fa" },
  //     greeting: { enabled: true },
  //     footer: { enabled: true, showCompanyInfo: true }
  //   };

  //   switch (type) {
  //     case 'QUOTATION_SENT':
  //     case 'QUOTATION_APPROVED':
  //       return {
  //         ...baseSections,
  //         quotationDetails: { 
  //           enabled: true, 
  //           fields: {
  //             quotationNumber: true,
  //             quotationTitle: true,
  //             description: true,
  //             validUntil: true,
  //             approvedDate: false
  //           }
  //         },
  //         financialSummary: { 
  //           enabled: true, 
  //           showSubtotal: true, 
  //           showGstBreakdown: true,
  //           showPstBreakdown: true,
  //           showTotal: true 
  //         }
  //       };
      
  //     case 'INVOICE_SENT':
  //     case 'INVOICE_PAID':
  //     case 'INVOICE_OVERDUE':
  //       return {
  //         ...baseSections,
  //         invoiceDetails: { 
  //           enabled: true, 
  //           fields: {
  //             invoiceNumber: true,
  //             invoiceType: true,
  //             totalAmount: true,
  //             dueDate: true,
  //             quotationTitle: true
  //           }
  //         },
  //         financialSummary: { 
  //           enabled: true, 
  //           showSubtotal: true, 
  //           showGstBreakdown: true,
  //           showPstBreakdown: true,
  //           showTotal: true 
  //         }
  //       };
      
  //     case 'USER_WELCOME':
  //       return {
  //         ...baseSections,
  //         greeting: { enabled: true, customMessage: "Welcome to our platform!" }
  //       };
      
  //     default:
  //       return baseSections;
  //   }
  // },

  /**
   * Get required variables for template type
   */
  // getRequiredVariables: (type: EmailTemplateType): string[] => {
  //   const baseVariables = ["companyName", "clientName", "userName"];

  //   switch (type) {
  //     case 'QUOTATION_SENT':
  //     case 'QUOTATION_APPROVED':
  //       return [...baseVariables, "quotationNumber", "quotationTitle", "totalAmount", "validUntil"];
      
  //     case 'INVOICE_SENT':
  //     case 'INVOICE_PAID':
  //     case 'INVOICE_OVERDUE':
  //       return [...baseVariables, "invoiceNumber", "totalAmount", "dueDate"];
      
  //     case 'USER_WELCOME':
  //       return [...baseVariables, "userEmail", "userRole"];
      
  //     default:
  //       return baseVariables;
  //   }
  // },

};

// ==================== CLEAN EMAIL TEMPLATE API ====================
export const emailTemplatesAPI = {
  // Get all templates
  getAll: (): Promise<AxiosResponse<ApiResponse<{ templates: EmailTemplate[]; count: number }>>> =>
    api.get("/settings/email-templates"),

  // Get specific template
  get: (templateKey: string): Promise<AxiosResponse<ApiResponse<{ template: EmailTemplate }>>> =>
    api.get(`/settings/email-templates/${templateKey}`),

  // Create template
  create: (data: CreateTemplateData): Promise<AxiosResponse<ApiResponse<{ template: EmailTemplate }>>> =>
    api.post("/settings/email-templates", data),

  // Update template
  update: (templateKey: string, data: UpdateTemplateData): Promise<AxiosResponse<ApiResponse<{ template: EmailTemplate }>>> =>
    api.put(`/settings/email-templates/${templateKey}`, data),

  // Delete template
  delete: (templateKey: string): Promise<AxiosResponse<ApiResponse<{ deletedTemplate: string }>>> =>
    api.delete(`/settings/email-templates/${templateKey}`),

  // Duplicate template
  duplicate: (templateKey: string, data: { newTemplateKey: string; newName: string }): Promise<AxiosResponse<ApiResponse<{ template: EmailTemplate }>>> =>
    api.post(`/settings/email-templates/${templateKey}/duplicate`, data),

  // Toggle enabled/disabled
  toggle: (templateKey: string): Promise<AxiosResponse<ApiResponse<{ template: EmailTemplate }>>> =>
    api.post(`/settings/email-templates/${templateKey}/toggle`),

  // Test send email with template
  testSend: (data: { templateKey: string; testEmail: string; recordId?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post("/settings/email-templates/test-send", data),

  // Get sample data for preview
  getPreviewData: (type: 'quotations' | 'invoices' | 'users'): Promise<AxiosResponse<ApiResponse<{ records: any[] }>>> =>
    api.get(`/settings/email-templates/preview-data/${type}`),

  // Preview template with data
  preview: (data: { templateKey: string; recordId?: string }): Promise<AxiosResponse<ApiResponse<{ template: any; sampleData: any }>>> =>
    api.post("/settings/email-templates/preview", data),

  // Get available variables for template type
  getVariables: (templateKey: string): Promise<AxiosResponse<ApiResponse<{ variables: string[] }>>> =>
    api.get(`/settings/email-templates/variables/${templateKey}`),

  // Seed default templates
  seedDefaults: (): Promise<AxiosResponse<ApiResponse<{ createdCount: number }>>> =>
    api.post("/settings/email-templates/seed-defaults")
};

// Additional utility functions for logo handling
export const uploadLogoFile = async (
  file: File
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Please upload a valid image file (JPEG, PNG, GIF, WebP)",
      };
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return {
        success: false,
        error: "File size must be less than 2MB",
      };
    }

    const formData = new FormData();
    formData.append("logo", file);

    const response = await settingsAPI.uploadLogo(formData);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || "Upload failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
};

// Helper function to get full logo URL
export const getLogoUrl = (
  logoPath: string | null | undefined
): string | null => {
  if (!logoPath) return null;

  // Use the same logic as getApiBaseUrl but without /api
  const getBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL.replace('/api', '');
    }
    
    if (process.env.NODE_ENV === 'production') {
      const currentOrigin = window.location.origin;
      return currentOrigin;
    }
    
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:5000`;
    }
    
    return "http://148.230.82.188:5000";
  };

  const baseUrl = getBaseUrl();

  // If logoPath already includes the base URL, return as is
  if (logoPath.startsWith("http")) {
    return logoPath;
  }

  // If logoPath starts with /, it's relative to the domain
  if (logoPath.startsWith("/")) {
    return `${baseUrl}${logoPath}`;
  }

  // Otherwise, assume it needs the full path
  return `${baseUrl}/${logoPath}`;
};

// Helper function to validate image files before upload
export const validateImageFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid image file (JPEG, PNG, GIF, WebP)",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image file must be less than 2MB",
    };
  }

  return { isValid: true };
};

// Clients API
export const clientsAPI = {
  // Get all clients
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    city?: string;
    country?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<AxiosResponse<ClientsPaginatedResponse>> =>
    api.get("/clients", { params }),

  // Get clients for dropdown
  getDropdown: (search?: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/clients/dropdown", { params: { search } }),

  // Get client by ID
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/clients/${id}`),

  // Get client statistics
  getStatistics: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/clients/${id}/statistics`),

  // Create client
  create: (data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    taxId?: string;
    customFields?: any;
  }): Promise<AxiosResponse<ApiResponse>> => api.post("/clients", data),

  // Update client
  update: (
    id: string,
    data: {
      companyName?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      taxId?: string;
      customFields?: any;
      isActive?: boolean;
    }
  ): Promise<AxiosResponse<ApiResponse>> => api.put(`/clients/${id}`, data),

  // Update client status
  updateStatus: (
    id: string,
    isActive: boolean
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(`/clients/${id}/status`, { isActive }),

  // Update custom fields
  updateCustomFields: (
    id: string,
    customFields: any
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(`/clients/${id}/custom-fields`, { customFields }),

  // Delete client
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/clients/${id}`),

  // Bulk actions
  bulkAction: (data: {
    clientIds: string[];
    action: "activate" | "deactivate" | "delete";
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.post("/clients/bulk-action", data),

  // Export CSV
  exportCSV: (): Promise<AxiosResponse<Blob>> =>
    api.get("/clients/export/csv", { responseType: "blob" }),

  // Analytics summary
  getAnalyticsSummary: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/clients/analytics/summary"),
  // checkEmailExists: (email: string) => {
  //   return api.get(`/clients/check-email?email=${encodeURIComponent(email)}`);
  // }
  // checkEmail: (email: string): Promise<AxiosResponse<EmailCheckResponse>> =>
  //   api.get(`/clients/check-email`, { params: { email } }),
  checkEmail: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/clients/check-email`, { params: { email } }),

};

// Quotations API
export const quotationsAPI = {
  // Get all quotations
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    clientId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<AxiosResponse<QuotationsPaginatedResponse>> =>
    api.get("/quotations", { params }),

  // Get quotation statistics
  getStatistics: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/quotations/statistics"),

  // Get dashboard summary
  getDashboardSummary: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/quotations/dashboard/summary"),

  // Get quotation by ID
  getById: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/quotations/${id}`),

  // Get quotations by client
  getByClient: (
    clientId: string
  ): Promise<AxiosResponse<ApiResponse<{ quotations: any[] }>>> =>
    api.get(`/quotations/client/${clientId}`),

  // Get quotations by status
  getByStatus: (
    status: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<
    AxiosResponse<
      ApiResponse<{ quotations: any[]; pagination: PaginationInfo }>
    >
  > => api.get(`/quotations/status/${status}`, { params }),

  // Create quotation
  create: (data: {
    title: string;
    description?: string;
    clientId: string;
    subtotal: number;
    taxPercentage?: number;
    validUntil?: string;
    notes?: string;
    formData?: any;
  }): Promise<AxiosResponse<ApiResponse>> => api.post("/quotations", data),

  // Update quotation
  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      subtotal?: number;
      taxPercentage?: number;
      validUntil?: string;
      notes?: string;
      formData?: any;
    }
  ): Promise<AxiosResponse<ApiResponse<{ quotation: any }>>> =>
    api.put(`/quotations/${id}`, data),

  // Update quotation status
  updateStatus: (
    id: string,
    status: string
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        quotation: any;
        generatedInvoice?: any;
      }>
    >
  > => api.patch(`/quotations/${id}/status`, { status }),

  // Duplicate quotation
  duplicate: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/quotations/${id}/duplicate`),

  // Delete quotation
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/quotations/${id}`),

  // Download PDF
  downloadPDF: (
    id: string,
    includeTax: boolean = true
  ): Promise<AxiosResponse<Blob>> =>
    api.get(`/quotations/${id}/pdf?includeTax=${includeTax}`, {
      responseType: "blob",
    }),

  // Download both PDFs (with and without tax)
  downloadBothPDFs: async (
    id: string
  ): Promise<{
    withTax: AxiosResponse<Blob>;
    withoutTax: AxiosResponse<Blob>;
  }> => {
    const [withTax, withoutTax] = await Promise.all([
      api.get(`/quotations/${id}/pdf?includeTax=true`, {
        responseType: "blob",
      }),
      api.get(`/quotations/${id}/pdf?includeTax=false`, {
        responseType: "blob",
      }),
    ]);

    return { withTax, withoutTax };
  },

  // Send email
  sendEmail: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/quotations/${id}/send-email`),

  // Get with invoices
  getWithInvoices: (
    id: string
  ): Promise<AxiosResponse<ApiResponse<{ quotation: any }>>> =>
    api.get(`/quotations/${id}/with-invoices`),

  // Bulk actions
  // bulkAction: (data: {
  //   quotationIds: string[];
  //   action: "approve" | "reject" | "delete";
  // }): Promise<
  //   AxiosResponse<
  //     ApiResponse<{
  //       affectedCount: number;
  //       generatedInvoices?: Array<{
  //         quotationId: string;
  //         quotationNumber: string;
  //         invoiceId: string;
  //         invoiceNumber: string;
  //       }>;
  //     }>
  //   >
  // > => api.post("/quotations/bulk-action", data),

  bulkAction: (data: {
    quotationIds: string[];
    action: "approve" | "reject" | "delete";
  }): Promise<AxiosResponse<ApiResponse<BulkQuotationActionResponse>>> =>
    api.post("/quotations/bulk-action", data),

  // Export CSV
  exportCSV: (): Promise<AxiosResponse<Blob>> =>
    api.get("/quotations/export/csv", { responseType: "blob" }),
};

// UPDATED: Enhanced Invoices API with Dynamic Tax Support
export const invoicesAPI = {
  // Get all invoices
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    clientId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<AxiosResponse<InvoicesPaginatedResponse>> =>
    api.get("/invoices", { params }),

  // Get invoice statistics
  getStatistics: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/invoices/statistics"),

  // Get dashboard summary
  getDashboardSummary: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/invoices/dashboard/summary"),

  // Get overdue invoices
  getOverdue: (params?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/invoices/overdue/list", { params }),

  // Get available invoice types
  getAvailableTypes: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/invoices/types/available"),

  // NEW: Get tax rate presets
  getTaxPresets: (): Promise<AxiosResponse<ApiResponse<{ presets: any[] }>>> =>
    api.get("/invoices/tax-presets"),

  // Get invoice by ID
  getById: (
    id: string
  ): Promise<AxiosResponse<ApiResponse<{ invoice: any }>>> =>
    api.get(`/invoices/${id}`),

  // Get invoices by quotation
  getByQuotation: (
    quotationId: string
  ): Promise<AxiosResponse<ApiResponse<{ invoices: any[] }>>> =>
    api.get(`/invoices/quotation/${quotationId}`),

  // Get invoices by client
  getByClient: (
    clientId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<
    AxiosResponse<ApiResponse<{ invoices: any[]; pagination: PaginationInfo }>>
  > => api.get(`/invoices/client/${clientId}`, { params }),

  // Get invoices by status
  getByStatus: (
    status: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<
    AxiosResponse<ApiResponse<{ invoices: any[]; pagination: PaginationInfo }>>
  > => api.get(`/invoices/status/${status}`, { params }),

  // ENHANCED: Create invoice with custom tax rates
  create: (data: {
    quotationId: string;
    type: string;
    dueDate?: string;
    gstPercentage?: number;
    pstPercentage?: number;
  }): Promise<AxiosResponse<ApiResponse<{ invoice: any }>>> =>
    api.post("/invoices", data),

  // ENHANCED: Update invoice with tax rate support
  update: (
    id: string,
    data: {
      status?: string;
      dueDate?: string;
      paidDate?: string;
      gstPercentage?: number;
      pstPercentage?: number;
    }
  ): Promise<AxiosResponse<ApiResponse<{ invoice: any }>>> =>
    api.put(`/invoices/${id}`, data),

  // Send invoice via email
  sendEmail: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/invoices/${id}/send`),

  // ENHANCED: Download PDF with dynamic tax options
  downloadPDF: (
    id: string,
    params?: {
      taxType?: string;
      customGstRate?: number;
      customPstRate?: number;
    }
  ): Promise<AxiosResponse<Blob>> => {
    const searchParams = new URLSearchParams();

    if (params?.taxType) {
      searchParams.append("taxType", params.taxType);
    }
    if (params?.customGstRate !== undefined) {
      searchParams.append("customGstRate", params.customGstRate.toString());
    }
    if (params?.customPstRate !== undefined) {
      searchParams.append("customPstRate", params.customPstRate.toString());
    }

    const queryString = searchParams.toString();
    const url = `/invoices/${id}/pdf${queryString ? "?" + queryString : ""}`;

    return api.get(url, { responseType: "blob" });
  },

  // NEW: Bulk update tax rates for multiple invoices
  bulkUpdateTaxRates: (data: {
    invoiceIds: string[];
    gstPercentage: number;
    pstPercentage: number;
  }): Promise<AxiosResponse<ApiResponse<{ updatedCount: number }>>> =>
    api.post("/invoices/bulk-update-tax-rates", data),

  // Delete invoice
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/invoices/${id}`),

  // ENHANCED: Bulk actions for invoices
  bulkAction: (data: {
    invoiceIds: string[];
    action: "send" | "mark_paid" | "cancel" | "delete";
  }): Promise<AxiosResponse<ApiResponse<{ affectedCount: number }>>> =>
    api.post("/invoices/bulk-action", data),

  // Export CSV
  exportCSV: (): Promise<AxiosResponse<Blob>> =>
    api.get("/invoices/export/csv", { responseType: "blob" }),

  // NEW: Preview tax calculation before applying changes
  previewTaxCalculation: (
    invoiceId: string,
    params: {
      gstRate: number;
      pstRate: number;
      taxType: string;
    }
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        subtotal: number;
        gstAmount: number;
        pstAmount: number;
        combinedTaxAmount: number;
        totalAmount: number;
      }>
    >
  > => {
    const searchParams = new URLSearchParams({
      gstRate: params.gstRate.toString(),
      pstRate: params.pstRate.toString(),
      taxType: params.taxType,
    });

    return api.get(
      `/invoices/${invoiceId}/tax-preview?${searchParams.toString()}`
    );
  },

  // NEW: Apply tax preset to multiple invoices
  applyTaxPreset: (data: {
    invoiceIds: string[];
    presetId: string;
  }): Promise<AxiosResponse<ApiResponse<{ updatedCount: number }>>> =>
    api.post("/invoices/apply-tax-preset", data),

  // NEW: Get regional tax suggestions based on client location
  getRegionalTaxSuggestions: (
    clientId: string
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        suggestions: Array<{
          region: string;
          gstRate: number;
          pstRate: number;
          description: string;
          isDefault: boolean;
        }>;
      }>
    >
  > => api.get(`/invoices/regional-tax-suggestions/${clientId}`),

  // NEW: Validate tax rates for compliance
  validateTaxRates: (data: {
    gstRate: number;
    pstRate: number;
    region?: string;
    effectiveDate?: string;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        isValid: boolean;
        warnings: string[];
        errors: string[];
        suggestions: Array<{
          reason: string;
          recommendedGstRate: number;
          recommendedPstRate: number;
        }>;
      }>
    >
  > => api.post("/invoices/validate-tax-rates", data),

  // NEW: Generate tax comparison report
  generateTaxComparisonReport: (data: {
    invoiceIds: string[];
    scenarios: Array<{
      name: string;
      gstRate: number;
      pstRate: number;
      taxType: string;
    }>;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        comparison: Array<{
          invoiceId: string;
          invoiceNumber: string;
          scenarios: Array<{
            name: string;
            gstAmount: number;
            pstAmount: number;
            totalTax: number;
            totalAmount: number;
          }>;
        }>;
      }>
    >
  > => api.post("/invoices/tax-comparison-report", data),
  // NEW: Send invoice with tax-specific configuration
  sendEmailWithTax: (
    id: string,
    data: {
      taxType: string;
      customGstRate?: number;
      customPstRate?: number;
    }
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/invoices/${id}/send-with-tax`, data),
  // Add this to your invoicesAPI in api.ts
};

export const rolePermissionAPI = {
  // Get all role and permission settings
  getSettings: (): Promise<
    AxiosResponse<ApiResponse<RolePermissionSettings>>
  > => api.get("/settings/role-permissions"),

  // Get role statistics
  getStatistics: (): Promise<AxiosResponse<ApiResponse<RoleStatistics>>> =>
    api.get("/settings/role-permissions/statistics"),

  // Get available permissions
  getAvailablePermissions: (): Promise<
    AxiosResponse<ApiResponse<{ permissions: any[] }>>
  > => api.get("/settings/role-permissions/available-permissions"),

  // Get role permissions mapping
  getRoleMapping: (): Promise<AxiosResponse<ApiResponse<{ mapping: any }>>> =>
    api.get("/settings/role-permissions/role-mapping"),

  // Update role settings
  updateRoleSettings: (data: {
    enableRoleHierarchy?: boolean;
    allowRoleOverrides?: boolean;
    requireApprovalForRoleChanges?: boolean;
    defaultUserRole?: string;
    maxUsersPerRole?: Record<string, number>;
    roleDescriptions?: Record<string, string>;
  }): Promise<AxiosResponse<ApiResponse<{ roles: any }>>> =>
    api.post("/settings/role-permissions/roles", data),

  // Update permission settings
  updatePermissionSettings: (data: {
    enableGranularPermissions?: boolean;
    allowCustomPermissions?: boolean;
    inheritanceEnabled?: boolean;
    auditPermissionChanges?: boolean;
    sessionPermissionCache?: boolean;
    permissionTimeout?: number;
  }): Promise<AxiosResponse<ApiResponse<{ permissions: any }>>> =>
    api.post("/settings/role-permissions/permissions", data),

  // Update audit settings
  updateAuditSettings: (data: {
    enableAuditLog?: boolean;
    auditUserActions?: boolean;
    auditRoleChanges?: boolean;
    auditPermissionChanges?: boolean;
    retentionDays?: number;
    alertOnSuspiciousActivity?: boolean;
    maxFailedAttempts?: number;
  }): Promise<AxiosResponse<ApiResponse<{ auditSettings: any }>>> =>
    api.post("/settings/role-permissions/audit", data),

  // Update role permissions mapping (Super Admin only)
  updateRoleMapping: (data: {
    rolePermissionsMapping: Record<string, string[]>;
  }): Promise<AxiosResponse<ApiResponse<{ rolePermissionsMapping: any }>>> =>
    api.post("/settings/role-permissions/role-mapping", data),
};

// API Endpoints
// export const permissionAPI = {
//   /**
//    * Get user's complete permissions (role-based + custom)
//    */
//   getUserPermissions: (
//     userId: string
//   ): Promise<AxiosResponse<ApiResponse<UserPermissionData>>> => 
//     api.get(`/users/${userId}/permissions`),

//   /**
//    * Update user's custom permissions
//    */
//   updateUserPermissions: (
//     userId: string,
//     customPermissions: string[]
//   ): Promise<AxiosResponse<ApiResponse<UserPermissionData>>> =>
//     api.put(`/users/${userId}/permissions`, { customPermissions }),

//   /**
//    * Get all available permissions organized by category (for UI)
//    */
//   getAvailablePermissions: (): Promise<
//     AxiosResponse<ApiResponse<AvailablePermissions>>
//   > => api.get('/permissions/available')
// };

export const rolePermissionsAPI = {
  // Get all role permissions
  getAll: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/settings/role-permissions'),

  // Update permissions for a specific role
  updateRole: (role: string, permissions: string[]): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/settings/role-permissions/${role}`, { permissions }),
};

export const permissionAPI = {
  getUserPermissions: (userId: string): Promise<AxiosResponse<ApiResponse<UserPermissionData>>> =>
    api.get(`/users/${userId}/permissions`),

  updateUserPermissions: (
    userId: string,
    customPermissions: string[]
  ): Promise<AxiosResponse<ApiResponse<UserPermissionData>>> =>
    api.put(`/users/${userId}/permissions`, { customPermissions }),

  getAvailablePermissions: (): Promise<AxiosResponse<ApiResponse<AvailablePermissions>>> =>
    api.get('/users/permissions/available')  // FIXED: Added /users prefix
};
// Notifications API
export const notificationsAPI = {
  // Get notifications
  getAll: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
  }): Promise<AxiosResponse<NotificationsPaginatedResponse>> =>
    api.get("/notifications", { params }),

  // Get unread count
  getUnreadCount: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/notifications/unread-count"),

  // Mark as read
  markAsRead: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: (): Promise<AxiosResponse<ApiResponse>> =>
    api.patch("/notifications/mark-all-read"),

  // Delete notification
  delete: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/notifications/${id}`),

  // Clear all notifications
  clearAll: (): Promise<AxiosResponse<ApiResponse>> =>
    api.delete("/notifications/clear-all"),
};

// Health and System API
export const systemAPI = {
  // Health check
  healthCheck: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/health"),

  // Test database
  testDatabase: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get("/test-db"),
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Download file utility
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;
