// System Settings Types
export type SettingsSectionId = 'company' | 'email' | 'tax' | 'invoice' | 'notifications' | 'security'| 'rolePermissions';

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

export interface SystemSettings {
  company: CompanySettings;
  email: EmailSettings;
  tax: TaxSettings;
  invoice: InvoiceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface SystemSettingsPageState {
  activeSection: SettingsSectionId | '';
  settings: SystemSettings;
  initialSettings: SystemSettings | null;
  unsavedChanges: boolean;
  saving: boolean;
  testingEmail: boolean;
  loading: boolean;
  error: string | null;
  testEmailAddress: string;
  toast: ToastMessage | null;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface SettingsSectionConfig {
  id: SettingsSectionId;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface RoleSettings {
  enableRoleHierarchy: boolean;
  allowRoleOverrides: boolean;
  requireApprovalForRoleChanges: boolean;
  defaultUserRole: string;
  maxUsersPerRole: Record<string, number>;
  roleDescriptions: Record<string, string>;
}

export interface PermissionSettings {
  enableGranularPermissions: boolean;
  allowCustomPermissions: boolean;
  inheritanceEnabled: boolean;
  auditPermissionChanges: boolean;
  sessionPermissionCache: boolean;
  permissionTimeout: number;
}

export interface AuditSettings {
  enableAuditLog: boolean;
  auditUserActions: boolean;
  auditRoleChanges: boolean;
  auditPermissionChanges: boolean;
  retentionDays: number;
  alertOnSuspiciousActivity: boolean;
  maxFailedAttempts: number;
}

export interface RolePermissionSettings {
  roles: RoleSettings;
  permissions: PermissionSettings;
  auditSettings: AuditSettings;
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


