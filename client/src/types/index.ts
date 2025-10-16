// =============================================================================
// CORE SYSTEM TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  location?: string;
}

// =============================================================================
// USER & AUTHENTICATION TYPES
// =============================================================================

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthUser extends User {
  // Additional auth-specific fields if needed
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// =============================================================================
// CLIENT TYPES
// =============================================================================

export interface Client {
  id: string;
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
  customFields?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations and computed fields
  statistics?: {
    totalQuotations: number;
    totalInvoices: number;
    totalQuotationValue?: number;
    totalInvoiceValue?: number;
  };
  _count?: {
    quotations: number;
    invoices: number;
  };
  quotations?: Array<{
    id: string;
    quotationNumber: string;
    title: string;
    status: QuotationStatus;
    totalAmount: number;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    type: InvoiceType;
    status: InvoiceStatus;
    totalAmount: number;
    createdAt: string;
    dueDate?: string;
    paidDate?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface ClientDropdown {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  customFields?: Record<string, any>;
}

export interface CreateClientData {
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
  customFields?: Record<string, any>;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  isActive?: boolean;
}

export interface ClientStatistics {
  clientName: string;
  quotationStatistics: Array<{
    status: string;
    _count: { status: number };
    _sum: { totalAmount: number };
  }>;
  invoiceStatistics: Array<{
    status: string;
    _count: { status: number };
    _sum: { totalAmount: number };
  }>;
  monthlyActivity: Array<{
    month: string;
    quotation_count: number;
    total_amount: number;
  }>;
}

// =============================================================================
// QUOTATION TYPES
// =============================================================================

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

// export interface Quotation {
//   id: string;
//   quotationNumber: string;
//   title: string;
//   description?: string;
//   clientId: string;
//   userId: string;
//   status: QuotationStatus;
//   formData: Record<string, any>;
//   subtotal: number;
//   taxPercentage: number;
//   taxAmount: number;
//   totalAmount: number;
//   validUntil?: string;
//   notes?: string;
//   emailSent: boolean;
//   emailSentAt?: string;
//   createdAt: string;
//   updatedAt: string;
//   // Relations
//   client?: Client;
//   user?: User;
//   invoices?: Invoice[];
//   _count?: {
//     invoices: number;
//   };
// }

// export interface CreateQuotationData {
//   title: string;
//   description?: string;
//   clientId: string;
//   subtotal: number;
//   taxPercentage?: number;
//   validUntil?: string;
//   notes?: string;
//   formData?: Record<string, any>;
// }

// export interface Quotation {
//   id: string;
//   quotationNumber: string;
//   title: string;
//   description?: string;
//   clientId: string;
//   userId: string;
//   status: QuotationStatus;
//   formData: Record<string, any>;
//   subtotal: number;
  
//   // LEGACY: Keep for backward compatibility
//   taxPercentage: number;
//   taxAmount: number;
  
//   // NEW: Enhanced taxation fields for GST/PST support
//   gstPercentage?: number;
//   gstAmount?: number;
//   pstPercentage?: number;
//   pstAmount?: number;
//   combinedTaxAmount?: number;
  
//   totalAmount: number;
//   validUntil?: string;
//   notes?: string;
//   emailSent: boolean;
//   emailSentAt?: string;
//   createdAt: string;
//   updatedAt: string;
  
//   // Relations
//   client?: Client;
//   user?: User;
//   invoices?: Invoice[];
//   _count?: {
//     invoices: number;
//   };
// }

// UPDATE: Replace your Quotation interface in types.ts
export interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  description?: string;
  clientId: string;
  userId: string;
  status: QuotationStatus;
  formData: Record<string, any>;
  subtotal: number;
  
  // LEGACY: Keep for backward compatibility
  taxPercentage: number;
  taxAmount: number;
  
  // NEW: Enhanced taxation fields for GST/PST support
  gstPercentage: number;
  gstAmount: number;
  pstPercentage: number;
  pstAmount: number;
  combinedTaxAmount: number;
  
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
  user?: User;
  invoices?: Invoice[];
  _count?: {
    invoices: number;
  };
}

// ALSO UPDATE: Your CreateQuotationData interface
export interface CreateQuotationData {
  title: string;
  description?: string;
  clientId: string;
  subtotal: number;
  
  // LEGACY: Keep for backward compatibility
  taxPercentage?: number;
  
  // NEW: Enhanced taxation fields
  gstPercentage?: number;
  gstAmount?: number;
  pstPercentage?: number;
  pstAmount?: number;
  combinedTaxAmount?: number;
  
  validUntil?: string;
  notes?: string;
  formData?: Record<string, any>;
}

export interface QuotationStatusUpdateResponse {
  quotation: Quotation;
  generatedInvoice?: Invoice;
}

// export interface BulkQuotationActionResponse {
//   affectedCount: number;
//   generatedInvoices?: Array<{
//     quotationId: string;
//     quotationNumber: string;
//     invoiceId: string;
//     invoiceNumber: string;
//   }>;
// }

export interface BulkQuotationActionResponse {
  affectedCount: number;
  generatedInvoices?: Array<{
    quotationId: string;
    quotationNumber: string;
    invoiceId: string;
    invoiceNumber: string;
    invoiceStatus?: string;  // NEW: Invoice status
    gstPercentage?: number;  // NEW: GST percentage
    pstPercentage?: number;  // NEW: PST percentage
  }>;
  emailResults?: Array<{
    quotationId: string;
    quotationNumber: string;
    clientEmail: string | null;
    emailSent: boolean;
    messageId?: string;
    success: boolean;
    error?: string;
    templateSource?: string;  // NEW: Indicates if database or fallback template was used
  }>;
  emailSummary?: {  // NEW: Email summary statistics
    totalEmails: number;
    emailsSent: number;
    emailsFailed: number;
    emailsSkipped: number;
  };
}

export interface UpdateQuotationData extends Partial<CreateQuotationData> {
  status?: QuotationStatus;
}

export interface QuotationStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  expired: number;
  thisMonth: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  monthlyData: {
    month: string;
    count: number;
    value: number;
  }[];
  statusDistribution: {
    status: QuotationStatus;
    count: number;
    percentage: number;
  }[];
}

// export interface EmailCheckResponse{
//   data: {
//     exists: boolean;
//   };
// }

// =============================================================================
// ENHANCED INVOICE TYPES WITH DYNAMIC TAX SUPPORT
// =============================================================================

export enum InvoiceStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  APPROVED = 'APPROVED' // NEW: Approved status for invoices
}

export enum InvoiceType {
  TAX_INVOICE_1 = 'TAX_INVOICE_1',
  TAX_INVOICE_2 = 'TAX_INVOICE_2',
  TAX_INVOICE_3 = 'TAX_INVOICE_3'
}

// NEW: Tax types for PDF generation and calculations
export enum InvoiceTaxType {
  NO_TAX = 'NO_TAX',
  GST_ONLY = 'GST_ONLY',
  PST_ONLY = 'PST_ONLY',
  GST_AND_PST = 'GST_AND_PST'
}

// ENHANCED: Invoice interface with separate GST and PST fields
export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  clientId: string;
  userId: string;
  type: InvoiceType;
  subtotal: number;
  // Legacy fields for backward compatibility
  taxPercentage: number;
  taxAmount: number;
  // Enhanced tax fields
  gstPercentage: number;
  gstAmount: number;
  pstPercentage: number;
  pstAmount: number;
  combinedTaxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  emailSent: boolean;
  emailSentAt?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  quotation?: Quotation;
  client?: Client;
  user?: User;
  // Computed fields
  daysOverdue?: number;
  isOverdue?: boolean;
}

// NEW: Tax preset interface
export interface TaxPreset {
  id: string;
  name: string;
  description: string;
  gstRate: number;
  pstRate: number;
  region: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ENHANCED: Create invoice data with tax rates
export interface CreateInvoiceData {
  quotationId: string;
  type: InvoiceType;
  dueDate?: string;
  gstPercentage?: number;
  pstPercentage?: number;
}

// ENHANCED: Update invoice data with tax rates
export interface UpdateInvoiceData {
  status?: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  gstPercentage?: number;
  pstPercentage?: number;
}

// ENHANCED: Invoice statistics with tax breakdown
export interface InvoiceStatistics {
  total: number;
  pending: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  paidValue: number;
  outstandingValue: number;
  averageValue: number;
  monthlyData: {
    month: string;
    count: number;
    value: number;
    paid: number;
  }[];
  statusDistribution: {
    status: InvoiceStatus;
    count: number;
    percentage: number;
  }[];
  typeDistribution: {
    type: InvoiceType;
    count: number;
    percentage: number;
  }[];
  // NEW: Tax statistics
  averageGstRate: number;
  averagePstRate: number;
  totalGstCollected: number;
  totalPstCollected: number;
  taxBreakdown: {
    noTax: { count: number; value: number };
    gstOnly: { count: number; value: number };
    pstOnly: { count: number; value: number };
    bothTaxes: { count: number; value: number };
  };
}

export interface InvoiceTypeOption {
  value: InvoiceType;
  label: string;
  description: string;
}

export interface InvoiceDashboardSummary {
  total: number;
  pending: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  paidValue: number;
  outstandingValue: number;
}

export interface OverdueInvoice extends Invoice {
  daysOverdue: number;
}

// NEW: Tax calculation result
export interface TaxCalculationResult {
  subtotal: number;
  gstAmount: number;
  pstAmount: number;
  combinedTaxAmount: number;
  totalAmount: number;
  breakdown: {
    label: string;
    amount: number;
    rate?: number;
    type: 'subtotal' | 'tax' | 'total';
  }[];
}

// NEW: Tax validation result
export interface TaxValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: Array<{
    reason: string;
    recommendedGstRate: number;
    recommendedPstRate: number;
  }>;
}

// NEW: Regional tax suggestion
export interface RegionalTaxSuggestion {
  region: string;
  gstRate: number;
  pstRate: number;
  description: string;
  isDefault: boolean;
}

// NEW: Tax comparison scenario
export interface TaxComparisonScenario {
  name: string;
  gstRate: number;
  pstRate: number;
  taxType: InvoiceTaxType;
}

// NEW: Tax comparison report
export interface TaxComparisonReport {
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
}

// NEW: Bulk tax update data
export interface BulkTaxUpdateData {
  invoiceIds: string[];
  gstPercentage: number;
  pstPercentage: number;
}

// NEW: Tax preset application data
export interface TaxPresetApplicationData {
  invoiceIds: string[];
  presetId: string;
}

// =============================================================================
// FORM & TEMPLATE TYPES
// =============================================================================

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: { value: string; label: string; }[];
  defaultValue?: any;
  description?: string;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormTemplateData {
  name: string;
  description?: string;
  clientId?: string;
  fields: FormField[];
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export enum NotificationType {
  QUOTATION_CREATED = 'QUOTATION_CREATED',
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',
  QUOTATION_REJECTED = 'QUOTATION_REJECTED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  USER_CREATED = 'USER_CREATED',
  CLIENT_CREATED = 'CLIENT_CREATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// =============================================================================
// SYSTEM & SETTINGS TYPES
// =============================================================================

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  quotations: {
    total: number;
    pending: number;
    approved: number;
    thisMonth: number;
    totalValue: number;
  };
  invoices: {
    total: number;
    pending: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
    totalValue: number;
    paidValue: number;
    outstandingValue: number;
    thisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'quotation_created' | 'quotation_approved' | 'invoice_generated' | 'invoice_paid';
    title: string;
    description: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}
// =============================================================================
// SYSTEM SETTINGS API - Add this to your existing api.ts file
// =============================================================================

// Add these interfaces to your types.ts file
export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logo: string;
}

export interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

export interface TaxSettings {
  defaultGstRate: number;
  defaultPstRate: number;
  enableAutoTaxCalculation: boolean;
  taxExemptByDefault: boolean;
  requireTaxId: boolean;
}

export interface InvoiceSettings {
  autoGenerateOnApproval: boolean;
  autoSendEmail: boolean;
  defaultDueDays: number;
  defaultPaymentTerms: string;
  includeCompanyLogo: boolean;
  footerText: string;
  sequencePrefix: string;
  startingNumber: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  quotationApproved: boolean;
  invoiceGenerated: boolean;
  paymentReceived: boolean;
  overdueReminders: boolean;
  reminderDays: number[];
}

export interface SecuritySettings {
  sessionTimeout: number;
  passwordMinLength: number;
  requireStrongPasswords: boolean;
  enableTwoFactor: boolean;
  allowPasswordReset: boolean;
  maxLoginAttempts: number;
}

export interface SystemSettingsData {
  company: CompanySettings;
  email: EmailSettings;
  tax: TaxSettings;
  invoice: InvoiceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface EmailTestData {
  testEmail: string;
}

export interface EmailTestResponse {
  messageId: string;
  sentTo: string;
  timestamp: string;
}





// ==================== EMAIL TEMPLATE TYPES - UPDATED FOR BACKEND INTEGRATION ====================

// export enum EmailTemplateCategory {
//   QUOTATION = 'QUOTATION',
//   INVOICE = 'INVOICE', 
//   USER = 'USER',
//   NOTIFICATION = 'NOTIFICATION',
//   MARKETING = 'MARKETING',
//   SYSTEM = 'SYSTEM',
//   CUSTOM = 'CUSTOM'
// }

// export enum EmailTemplateType {
//   QUOTATION_SENT = 'QUOTATION_SENT',
//   QUOTATION_APPROVED = 'QUOTATION_APPROVED', 
//   QUOTATION_REJECTED = 'QUOTATION_REJECTED',
//   INVOICE_SENT = 'INVOICE_SENT',
//   INVOICE_PAID = 'INVOICE_PAID',
//   INVOICE_OVERDUE = 'INVOICE_OVERDUE',
//   USER_WELCOME = 'USER_WELCOME',
//   USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
//   NOTIFICATION_SYSTEM = 'NOTIFICATION_SYSTEM',
//   NOTIFICATION_REMINDER = 'NOTIFICATION_REMINDER',
//   CUSTOM = 'CUSTOM'
// }

// // Main EmailTemplate interface - matches backend schema exactly
// export interface EmailTemplate {
//   id?: string;                    // Database ID (optional for create)
//   templateKey: string;            // Unique identifier (required)
//   name: string;                   // Human-readable name (required, max 100 chars)
//   description?: string;           // Optional description (max 500 chars)
//   category: EmailTemplateCategory; // Required category
//   type: EmailTemplateType;        // Required type
//   enabled: boolean;               // Template enabled/disabled
//   isSystem: boolean;              // System template (cannot be deleted)
//   subject: string;                // Email subject line (required, max 200 chars)
//   htmlContent?: string;           // Custom HTML content (optional)
//   sections: Record<string, any>;  // Template sections configuration
//   variables: string[] | TemplateVariable[]; // Required/optional variables
//   metadata?: Record<string, any>; // Additional metadata
//   version?: number;               // Template version
//   creator?: {                     // Created by user info
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   updater?: {                     // Last updated by user info
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   createdAt?: string;             // Creation timestamp
//   updatedAt?: string;             // Last update timestamp
// }

// // Template variable definition
// export interface TemplateVariable {
//   name: string;
//   label: string;
//   description: string;
//   required: boolean;
//   type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'array';
//   example: string;
// }

// // Template type configuration
// export interface TemplateType {
//   type: EmailTemplateType;
//   label: string;
//   description: string;
//   category: EmailTemplateCategory;
//   requiredVariables: string[];
//   optionalVariables: string[];
//   defaultSections: string[];
// }

// // Email preview structure
// export interface EmailPreview {
//   subject: string;
//   html: string;
//   text?: string;
//   variables?: Record<string, any>;
//   previewGeneratedAt?: string;
// }

// // Template validation result
// export interface TemplateValidationResult {
//   isValid: boolean;
//   errors: string[];
//   warnings?: string[];
//   variablesFound?: string[];
//   sectionsCount?: number;
// }

// // Template statistics
// export interface TemplateStats {
//   totalTemplates: number;
//   enabledTemplates: number;
//   systemTemplates: number;
//   customTemplates: number;
//   categoryCounts: Record<EmailTemplateCategory, number>;
// }

// // ==================== API REQUEST/RESPONSE TYPES ====================

// // Create template request (matches backend validation exactly)
// export interface CreateEmailTemplateRequest {
//   templateKey: string;            // Required: unique, letters/numbers/underscores only
//   name: string;                   // Required: 1-100 characters
//   description?: string;           // Optional: max 500 characters
//   category: EmailTemplateCategory; // Required: valid enum value
//   type: EmailTemplateType;        // Required: valid enum value
//   subject: string;                // Required: 1-200 characters
//   htmlContent?: string;           // Optional: custom HTML
//   sections?: Record<string, any>; // Optional: sections config
//   variables?: string[];           // Optional: variable names array
//   metadata?: Record<string, any>; // Optional: additional data
// }

// // Update template request (all fields optional except restrictions)
// export interface UpdateEmailTemplateRequest {
//   name?: string;                  // Max 100 characters
//   description?: string;           // Max 500 characters
//   category?: EmailTemplateCategory;
//   type?: EmailTemplateType;
//   subject?: string;               // Max 200 characters
//   enabled?: boolean;
//   htmlContent?: string;
//   sections?: Record<string, any>;
//   variables?: string[];
//   metadata?: Record<string, any>;
// }

// // Email template API response types
// export interface EmailTemplatesResponse {
//   success: boolean;
//   message: string;
//   data: { 
//     templates: Record<string, EmailTemplate>; 
//     count: number;
//   };
// }

// export interface EmailTemplateResponse {
//   success: boolean;
//   message: string;
//   data: { template: EmailTemplate };
// }

// export interface TemplateTypesResponse {
//   success: boolean;
//   message: string;
//   data: { templateTypes: TemplateType[] };
// }

// export interface TemplateValidationResponse {
//   success: boolean;
//   message: string;
//   data: TemplateValidationResult;
// }

// export interface TemplatePreviewResponse {
//   success: boolean;
//   message: string;
//   data: { 
//     preview: EmailPreview;
//     sampleData?: any;
//     recordData?: any;
//     templateName?: string;
//     recordId?: string;
//     previewGeneratedAt?: string;
//   };
// }

// export interface PreviewDataResponse {
//   success: boolean;
//   message: string;
//   data: { 
//     records: any[]; 
//     count: number;
//     type: string;
//   };
// }

// export interface BulkTemplateDeleteResponse {
//   success: boolean;
//   message: string;
//   data: {
//     deleted: string[];
//     errors?: Array<{ templateKey: string; error: string }>;
//     deletedCount: number;
//     errorCount: number;
//   };
// }

// export interface TemplateMigrationResponse {
//   success: boolean;
//   message: string;
//   data: {
//     migratedCount: number;
//     errors: string[];
//   };
// }

// // ==================== TEMPLATE SECTION CONFIGURATIONS ====================

// export interface TemplateSection {
//   enabled: boolean;
//   [key: string]: any;
// }

// export interface HeaderSection extends TemplateSection {
//   title: string;
//   backgroundColor: string;
//   showLogo?: boolean;
// }

// export interface GreetingSection extends TemplateSection {
//   customMessage?: string;
// }

// export interface QuotationDetailsSection extends TemplateSection {
//   fields: {
//     quotationNumber: boolean;
//     quotationTitle: boolean;
//     description: boolean;
//     validUntil: boolean;
//     approvedDate: boolean;
//     [key: string]: boolean;
//   };
// }

// export interface InvoiceDetailsSection extends TemplateSection {
//   fields: {
//     invoiceNumber: boolean;
//     invoiceType: boolean;
//     totalAmount: boolean;
//     dueDate: boolean;
//     quotationTitle: boolean;
//     [key: string]: boolean;
//   };
// }

// export interface FinancialSummarySection extends TemplateSection {
//   showSubtotal: boolean;
//   showGstBreakdown: boolean;
//   showPstBreakdown: boolean;
//   showTotal: boolean;
// }

// export interface FooterSection extends TemplateSection {
//   showCompanyInfo: boolean;
//   customFooter?: string;
// }

// export interface CustomContentSection extends TemplateSection {
//   htmlContent: string;
//   allowVariables: boolean;
// }

// // Template sections type map
// export interface TemplateSections {
//   header?: HeaderSection;
//   greeting?: GreetingSection;
//   quotationDetails?: QuotationDetailsSection;
//   invoiceDetails?: InvoiceDetailsSection;
//   financialSummary?: FinancialSummarySection;
//   dynamicFields?: TemplateSection;
//   notes?: TemplateSection;
//   nextSteps?: TemplateSection;
//   projectDescription?: TemplateSection;
//   paymentInstructions?: TemplateSection;
//   attachmentNote?: TemplateSection;
//   footer?: FooterSection;
//   customContent?: CustomContentSection;
//   [key: string]: TemplateSection | undefined;
// }

// // ==================== FRONTEND UI STATE TYPES ====================

// export interface EmailTemplateTableState {
//   searchQuery: string;
//   categoryFilter: EmailTemplateCategory | 'ALL';
//   statusFilter: 'ALL' | 'ENABLED' | 'DISABLED';
//   selectedTemplates: string[];
//   stats: TemplateStats;
// }

// export interface TemplateModalState {
//   showCreateModal: boolean;
//   showDeleteModal: boolean;
//   showBulkActionsModal: boolean;
//   showPreviewModal: boolean;
//   templateToDelete: string | null;
//   previewData: EmailPreview | null;
// }

// export interface TemplateEditorState {
//   template: EmailTemplate;
//   hasChanges: boolean;
//   validationErrors: string[];
//   validationWarnings: string[];
//   expandedSections: Record<string, boolean>;
// }

// export interface BulkTemplateAction {
//   action: 'enable' | 'disable' | 'delete';
//   templateKeys: string[];
//   confirmText?: string;
// }

// // ==================== FORM DATA TYPES ====================

// export interface CreateTemplateFormData {
//   name: string;
//   templateKey: string;
//   description?: string;
//   category: EmailTemplateCategory;
//   type: EmailTemplateType;
//   subject: string;
//   htmlContent?: string;
//   sections?: Record<string, any>;
//   variables?: string[];
//   metadata?: Record<string, any>;
// }

// // ==================== ENHANCED EMAIL TEST TYPES ====================

// export interface EnhancedEmailTestData {
//   testEmail: string;
//   templateKey?: string;
//   customTemplate?: EmailTemplate;
// }

// export interface EmailTestResponse {
//   messageId: string;
//   sentTo: string;
//   timestamp: string;
// }

// // ==================== TEMPLATE EXPORT/IMPORT TYPES ====================

// export interface TemplateExportData {
//   templates: Record<string, EmailTemplate>;
//   exportDate: string;
//   version: string;
//   metadata: {
//     systemName: string;
//     exportedBy?: string;
//     totalTemplates: number;
//   };
// }

// export interface TemplateImportResult {
//   imported: number;
//   updated: number;
//   skipped: number;
//   errors: Array<{
//     templateKey: string;
//     error: string;
//   }>;
// }

// // ==================== ERROR HANDLING TYPES ====================

// export interface TemplateError {
//   field?: string;
//   message: string;
//   code?: string;
//   type: 'validation' | 'permission' | 'not_found' | 'conflict' | 'server_error';
// }

// export interface TemplateOperationResult {
//   success: boolean;
//   template?: EmailTemplate;
//   error?: TemplateError;
//   message?: string;
// }

// // ==================== TEMPLATE ANALYTICS TYPES (FOR FUTURE USE) ====================

// export interface TemplateUsageStats {
//   templateKey: string;
//   timesUsed: number;
//   lastUsed?: string;
//   successRate?: number;
//   avgDeliveryTime?: number;
//   openRate?: number;
//   clickRate?: number;
// }

// export interface TemplatePerformanceMetrics {
//   totalEmailsSent: number;
//   templateUsage: Record<string, TemplateUsageStats>;
//   popularTemplates: string[];
//   recentActivity: Array<{
//     templateKey: string;
//     action: string;
//     timestamp: string;
//     userId?: string;
//   }>;
// }

// // ==================== DEFAULT VALUES AND CONSTANTS ====================

// export const EMAIL_TEMPLATE_DEFAULTS = {
//   SECTIONS: {
//     header: { enabled: true, title: "{{companyName}}", backgroundColor: "#f8f9fa" },
//     greeting: { enabled: true },
//     footer: { enabled: true, showCompanyInfo: true }
//   },
//   VARIABLES: {
//     QUOTATION: ["companyName", "clientName", "quotationNumber", "quotationTitle", "totalAmount"],
//     INVOICE: ["companyName", "clientName", "invoiceNumber", "totalAmount", "dueDate"],
//     USER: ["companyName", "firstName", "lastName", "email"],
//     CUSTOM: ["companyName", "recipientName"]
//   },
//   VALIDATION: {
//     NAME_MAX_LENGTH: 100,
//     DESCRIPTION_MAX_LENGTH: 500,
//     SUBJECT_MAX_LENGTH: 200,
//     TEMPLATE_KEY_MAX_LENGTH: 50,
//     TEMPLATE_KEY_MIN_LENGTH: 2
//   }
// } as const;

// // Category icons and colors for UI
// export const TEMPLATE_CATEGORY_CONFIG = {
//   QUOTATION: { icon: '📋', color: 'green', label: 'Quotation' },
//   INVOICE: { icon: '📄', color: 'orange', label: 'Invoice' },
//   USER: { icon: '👤', color: 'blue', label: 'User' },
//   NOTIFICATION: { icon: '🔔', color: 'purple', label: 'Notification' },
//   MARKETING: { icon: '📈', color: 'pink', label: 'Marketing' },
//   SYSTEM: { icon: '⚙️', color: 'gray', label: 'System' },
//   CUSTOM: { icon: '🎨', color: 'indigo', label: 'Custom' }
// } as const;

// // Template type colors for UI
// export const TEMPLATE_TYPE_CONFIG = {
//   QUOTATION_SENT: { color: 'green', priority: 1 },
//   QUOTATION_APPROVED: { color: 'blue', priority: 2 },
//   QUOTATION_REJECTED: { color: 'red', priority: 3 },
//   INVOICE_SENT: { color: 'orange', priority: 1 },
//   INVOICE_PAID: { color: 'green', priority: 2 },
//   INVOICE_OVERDUE: { color: 'red', priority: 3 },
//   USER_WELCOME: { color: 'purple', priority: 1 },
//   USER_PASSWORD_RESET: { color: 'yellow', priority: 2 },
//   NOTIFICATION_SYSTEM: { color: 'blue', priority: 1 },
//   NOTIFICATION_REMINDER: { color: 'yellow', priority: 2 },
//   CUSTOM: { color: 'gray', priority: 0 }
// } as const;


// ==================== ESSENTIAL EMAIL TEMPLATE TYPES ====================

export enum EmailTemplateCategory {
  QUOTATION = 'QUOTATION',
  INVOICE = 'INVOICE', 
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM'
}

export enum EmailTemplateType {
  QUOTATION_SENT = 'QUOTATION_SENT',
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',
  INVOICE_APPROVED = 'INVOICE_APPROVED', 
  INVOICE_SENT = 'INVOICE_SENT',
  USER_WELCOME = 'USER_WELCOME',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  CUSTOM = 'CUSTOM',
}

// Main EmailTemplate interface
export interface EmailTemplate {
  id?: string;
  templateKey: string;
  name: string;
  description?: string;
  category: EmailTemplateCategory;
  type: EmailTemplateType;
  enabled: boolean;
  isSystem: boolean;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  metadata?: Record<string, any>;
  version?: number;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Create/Update request types
export interface CreateTemplateData {
  templateKey: string;
  name: string;
  description?: string;
  category: EmailTemplateCategory;
  type: EmailTemplateType;
  subject: string;
  sections?: Record<string, any>;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: EmailTemplateCategory;
  type?: EmailTemplateType;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  enabled?: boolean;
  variables?: string[];
  metadata?: Record<string, any>;
  sections?: Record<string, any>;

}

// UI State types
export interface EmailTemplateState {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  selectedTemplate: EmailTemplate | null;
  showCreateModal: boolean;
  showDeleteModal: boolean;
  showPreviewModal: boolean;
  previewData: any;
  searchQuery: string;
  categoryFilter: EmailTemplateCategory | 'ALL';
}

// Category configuration for UI
export const TEMPLATE_CATEGORIES = {
  QUOTATION: { label: 'Quotation', color: 'green', icon: '📋' },
  INVOICE: { label: 'Invoice', color: 'orange', icon: '📄' },
  USER: { label: 'User', color: 'blue', icon: '👤' },
  SYSTEM: { label: 'System', color: 'gray', icon: '⚙️' },
  CUSTOM: { label: 'Custom', color: 'purple', icon: '🎨' }
} as const;

// Available variables for each template type
export const TEMPLATE_VARIABLES = {
  QUOTATION_SENT: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount', 'validUntil', 'companyName'],
  QUOTATION_APPROVED: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount', 'approvedDate', 'companyName'],
  INVOICE_SENT: ['clientName', 'invoiceNumber', 'invoiceType', 'totalAmount', 'dueDate', 'companyName'],
  INVOICE_APPROVED: ['clientName', 'invoiceNumber', 'invoiceType', 'totalAmount', 'approvedDate', 'companyName'],
  USER_WELCOME: ['firstName', 'lastName', 'email', 'role', 'companyName'],
  USER_PASSWORD_RESET: ['firstName', 'resetUrl', 'companyName'],
  CUSTOM: ['clientName', 'companyName', 'currentDate', 'currentYear']
} as const;

// Default HTML templates
export const DEFAULT_TEMPLATES = {
  basic: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; padding: 30px; text-align: center;">
        <h1 style="color: #333; margin: 0;">{{companyName}}</h1>
      </div>
      <div style="padding: 30px;">
        <h2>Hello {{clientName}},</h2>
        <p>This is your email content...</p>
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Details:</strong></p>
          <p>Add your content here with variables like {{variableName}}</p>
        </div>
        <p>Thank you!</p>
      </div>
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
      </div>
    </div>
  `,
  
  quotation: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #667eea; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0;">Quotation Update</h1>
      </div>
      <div style="padding: 30px;">
        <h2>Hello {{clientName}},</h2>
        <p>Your quotation <strong>{{quotationNumber}}</strong> for "<strong>{{quotationTitle}}</strong>" has been updated.</p>
        
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Quotation Details:</h3>
          <p><strong>Quotation Number:</strong> {{quotationNumber}}</p>
          <p><strong>Project:</strong> {{quotationTitle}}</p>
          <p><strong>Total Amount:</strong> {{totalAmount}}</p>
        </div>
        
        <p>Thank you for your business!</p>
      </div>
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
      </div>
    </div>
  `,
  
  invoice: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ff6b6b; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0;">Invoice Ready</h1>
      </div>
      <div style="padding: 30px;">
        <h2>Hello {{clientName}},</h2>
        <p>Please find your invoice attached. Payment is requested within the specified due date.</p>
        
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Invoice Details:</h3>
          <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
          <p><strong>Amount Due:</strong> {{totalAmount}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
        </div>
        
        <p>Thank you for your business!</p>
      </div>
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
      </div>
    </div>
  `
} as const;


// =============================================================================
// FILTER & SEARCH TYPES
// =============================================================================

export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters extends BaseFilters {
  role?: Role;
  isActive?: boolean;
}

export interface ClientFilters extends BaseFilters {
  isActive?: boolean;
  city?: string;
  country?: string;
}

export interface QuotationFilters extends BaseFilters {
  status?: QuotationStatus;
  clientId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// ENHANCED: Invoice filters with tax-related options
export interface InvoiceFilters extends BaseFilters {
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  isOverdue?: boolean;
  taxType?: InvoiceTaxType;
  minGstRate?: number;
  maxGstRate?: number;
  minPstRate?: number;
  maxPstRate?: number;
}

export interface NotificationFilters extends BaseFilters {
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

// =============================================================================
// BULK ACTION TYPES
// =============================================================================

export interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}

export interface BulkClientAction {
  clientIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}

export interface BulkQuotationAction {
  quotationIds: string[];
  action: 'approve' | 'reject' | 'delete';
}

export interface BulkInvoiceAction {
  invoiceIds: string[];
  action: 'send' | 'mark_paid' | 'cancel' | 'delete';
}

export interface BulkInvoiceActionResponse {
  affectedCount: number;
  failedIds?: string[];
  errors?: Array<{
    invoiceId: string;
    error: string;
  }>;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T | null;
}

export interface TableState<T> {
  items: T[];
  loading: boolean;
  error?: string | null;
  pagination: PaginationInfo;
  filters: Record<string, any>;
  selectedItems: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// PERMISSION TYPES
// =============================================================================

export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}

export interface UserPermissions {
  users: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    manage_permissions?: boolean;
  };
  clients: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  quotations: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
    read_all: boolean;
  };
  invoices: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    send: boolean;
    read_all: boolean;
    mark_paid: boolean;
    update_tax_rates: boolean; // NEW: Permission for updating tax rates
  };
}

// =============================================================================
// ENHANCED INVOICE-SPECIFIC UI STATE TYPES
// =============================================================================

export interface InvoiceTableState extends TableState<Invoice> {
  overdueCount: number;
  totalValue: number;
  paidValue: number;
  outstandingValue: number;
  // NEW: Tax-related state
  averageGstRate: number;
  averagePstRate: number;
  totalTaxCollected: number;
}

export interface InvoiceFormData {
  quotationId: string;
  type: InvoiceType;
  dueDate?: string;
  notes?: string;
  // NEW: Tax rate fields
  gstPercentage?: number;
  pstPercentage?: number;
}

export interface InvoiceUpdateFormData {
  status?: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  // NEW: Tax rate update fields
  gstPercentage?: number;
  pstPercentage?: number;
}

// =============================================================================
// AUTO-INVOICE GENERATION TYPES
// =============================================================================

export interface AutoInvoiceGenerationSettings {
  enabled: boolean;
  defaultType: InvoiceType;
  defaultDueDays: number;
  autoSendEmail: boolean;
  notifyUsers: string[];
  // NEW: Default tax settings
  defaultGstRate: number;
  defaultPstRate: number;
  useClientRegionalRates: boolean;
}

export interface InvoiceGenerationResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
  quotationId: string;
  quotationNumber: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface InvoicesPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    invoices: Invoice[];
    pagination: PaginationInfo;
  };
}

export interface InvoiceResponse {
  success: boolean;
  message: string;
  data: {
    invoice: Invoice;
  };
}

export interface InvoiceStatsResponse {
  success: boolean;
  message: string;
  data: InvoiceStatistics;
}

export interface InvoiceDashboardResponse {
  success: boolean;
  message: string;
  data: {
    summary: InvoiceDashboardSummary;
    recentInvoices: Invoice[];
  };
}

// NEW: Tax-specific response types
export interface TaxPresetsResponse {
  success: boolean;
  message: string;
  data: {
    presets: TaxPreset[];
  };
}

export interface TaxCalculationResponse {
  success: boolean;
  message: string;
  data: TaxCalculationResult;
}

export interface TaxValidationResponse {
  success: boolean;
  message: string;
  data: TaxValidationResult;
}

export interface RegionalTaxSuggestionsResponse {
  success: boolean;
  message: string;
  data: {
    suggestions: RegionalTaxSuggestion[];
  };
}

export interface TaxComparisonResponse {
  success: boolean;
  message: string;
  data: TaxComparisonReport;
}

////////////////////////////////////////
// role permissions mapping
////////////////////////////////////////
// Types for the API responses (add these to your types.ts file)
export interface RolePermissionSettings {
  roles: {
    enableRoleHierarchy: boolean;
    allowRoleOverrides: boolean;
    requireApprovalForRoleChanges: boolean;
    defaultUserRole: string;
    maxUsersPerRole: Record<string, number>;
    roleDescriptions: Record<string, string>;
  };
  permissions: {
    enableGranularPermissions: boolean;
    allowCustomPermissions: boolean;
    inheritanceEnabled: boolean;
    auditPermissionChanges: boolean;
    sessionPermissionCache: boolean;
    permissionTimeout: number;
  };
  auditSettings: {
    enableAuditLog: boolean;
    auditUserActions: boolean;
    auditRoleChanges: boolean;
    auditPermissionChanges: boolean;
    retentionDays: number;
    alertOnSuspiciousActivity: boolean;
    maxFailedAttempts: number;
  };
}

export interface RoleStatistics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  activeUsers: number;
  inactiveUsers: number;
  recentRoleChanges: number;
  pendingApprovals: number;
  securityAlerts: number;
}


// Types
export interface UserPermissionData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  rolePermissions: string[];      // Permissions from role (can't be removed)
  customPermissions: string[];    // Additional custom permissions (can be added/removed)
  allPermissions: string[];       // Combined list
}

export interface PermissionCategory {
  name: string;
  description: string;
  permissions: string[];
}

export interface AvailablePermissions {
  [key: string]: PermissionCategory;
}

// =============================================================================
// CONSTANTS AND UTILITY TYPES
// =============================================================================

export type InvoiceStatusColor = 'yellow' | 'blue' | 'green' | 'red' | 'gray';
export type InvoicePriority = 'low' | 'medium' | 'high' | 'urgent';

// NEW: Tax-related constants
export const INVOICE_TAX_TYPES = {
  NO_TAX: 'NO_TAX',
  GST_ONLY: 'GST_ONLY',
  PST_ONLY: 'PST_ONLY',
  GST_AND_PST: 'GST_AND_PST'
} as const;

export const DEFAULT_TAX_PRESETS = [
  {
    id: 'tax_exempt',
    name: 'Tax Exempt',
    description: 'No taxes applied',
    gstRate: 0,
    pstRate: 0,
    region: 'General'
  },
  {
    id: 'bc_canada',
    name: 'British Columbia, Canada',
    description: 'GST + PST for BC',
    gstRate: 5,
    pstRate: 7,
    region: 'Canada'
  },
  {
    id: 'alberta_canada',
    name: 'Alberta, Canada',
    description: 'GST only for Alberta',
    gstRate: 5,
    pstRate: 0,
    region: 'Canada'
  },
  {
    id: 'ontario_canada',
    name: 'Ontario, Canada',
    description: 'HST (combined) for Ontario',
    gstRate: 13,
    pstRate: 0,
    region: 'Canada'
  },
  {
    id: 'quebec_canada',
    name: 'Quebec, Canada',
    description: 'GST + QST for Quebec',
    gstRate: 5,
    pstRate: 9.975,
    region: 'Canada'
  }
];

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AppError {
  message: string;
  statusCode?: number;
  code?: string;
  field?: string;
  type: 'validation' | 'authentication' | 'authorization' | 'network' | 'server' | 'unknown';
}

// =============================================================================
// UTILITY FUNCTIONS TYPES
// =============================================================================

export interface TaxCalculationParams {
  subtotal: number;
  gstRate: number;
  pstRate: number;
  taxType: InvoiceTaxType;
}

export interface TaxBreakdownItem {
  label: string;
  amount: number;
  rate?: number;
  type: 'subtotal' | 'tax' | 'total';
}

export interface TaxSummary {
  subtotal: number;
  totalTax: number;
  total: number;
}