import React, { useState, useEffect } from 'react';
import { rolePermissionAPI, handleApiError,settingsAPI } from '../../services/api';
import { Icons } from '../../components/Icons/Icons';

// Import components
import SystemSettingsPageHeader from './components/SystemSettingsPageHeader';
import SettingsSection from './components/SettingsSection';
import CompanySettingsComponent from './components/CompanySettings';
import EmailSettingsComponent from './components/EmailSettings';
import TaxSettingsComponent from './components/TaxSettings';
import InvoiceSettingsComponent from './components/InvoiceSettings';
import SecuritySettingsComponent from './components/SecuritySettings';
import { LoadingSkeleton, ErrorComponent, Toast, SettingsFooter } from './components/CommonComponents';

// Import types
import {
  SystemSettings,
  SystemSettingsPageState,
  SettingsSectionId,
  SettingsSectionConfig,
  CompanySettings,
  EmailSettings,
  TaxSettings,
  InvoiceSettings,
  NotificationSettings,
  SecuritySettings,
  RolePermissionSettings // NEW
} from './types';

// Enhanced SystemSettings interface
interface EnhancedSystemSettings extends SystemSettings {
  rolePermissions: RolePermissionSettings;
}

// Enhanced page state
interface EnhancedSystemSettingsPageState extends Omit<SystemSettingsPageState, 'settings' | 'initialSettings'> {
  settings: EnhancedSystemSettings;
  initialSettings: EnhancedSystemSettings | null;
}

// Enhanced section ID type
type EnhancedSettingsSectionId = SettingsSectionId | 'rolePermissions';

const SystemSettingsPage: React.FC = () => {
  const [state, setState] = useState<EnhancedSystemSettingsPageState>({
    activeSection: '',
    settings: {
      company: {
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        logo: ''
      },
      email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromName: '',
        fromEmail: '',
        replyTo: ''
      },
      tax: {
        defaultGstRate: 5.0,
        defaultPstRate: 7.0,
        enableAutoTaxCalculation: true,
        taxExemptByDefault: false,
        requireTaxId: false
      },
      invoice: {
        autoGenerateOnApproval: true,
        autoSendEmail: true,
        defaultDueDays: 30,
        defaultPaymentTerms: '',
        includeCompanyLogo: true,
        footerText: '',
        sequencePrefix: 'INV-',
        startingNumber: 1000
      },
      notifications: {
        emailNotifications: true,
        quotationApproved: true,
        invoiceGenerated: true,
        paymentReceived: true,
        overdueReminders: true,
        reminderDays: [7, 14, 30]
      },
      security: {
        sessionTimeout: 30,
        passwordMinLength: 8,
        requireStrongPasswords: true,
        enableTwoFactor: false,
        allowPasswordReset: true,
        maxLoginAttempts: 5
      },
      // NEW: Role Permission Settings
      rolePermissions: {
        roles: {
          enableRoleHierarchy: true,
          allowRoleOverrides: false,
          requireApprovalForRoleChanges: true,
          defaultUserRole: 'USER',
          maxUsersPerRole: {
            'SUPER_ADMIN': 2,
            'ADMIN': 5,
            'MANAGER': 10,
            'USER': 1000
          },
          roleDescriptions: {
            'SUPER_ADMIN': 'Full system access with all administrative privileges',
            'ADMIN': 'Administrative access with user and system management capabilities',
            'MANAGER': 'Management access with team oversight and approval capabilities',
            'USER': 'Standard user access for daily operations and client management'
          }
        },
        permissions: {
          enableGranularPermissions: true,
          allowCustomPermissions: false,
          inheritanceEnabled: true,
          auditPermissionChanges: true,
          sessionPermissionCache: true,
          permissionTimeout: 60
        },
        auditSettings: {
          enableAuditLog: true,
          auditUserActions: true,
          auditRoleChanges: true,
          auditPermissionChanges: true,
          retentionDays: 90,
          alertOnSuspiciousActivity: true,
          maxFailedAttempts: 5
        }
      }
    },
    initialSettings: null,
    unsavedChanges: false,
    saving: false,
    testingEmail: false,
    loading: true,
    error: null,
    testEmailAddress: '',
    toast: null
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    if (state.initialSettings) {
      const hasChanges = JSON.stringify(state.settings) !== JSON.stringify(state.initialSettings);
      setState(prev => ({ ...prev, unsavedChanges: hasChanges }));
    }
  }, [state.settings, state.initialSettings]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setState(prev => ({ ...prev, toast: { message, type } }));
  };

  const loadSettings = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Load base settings
      const baseResponse = await settingsAPI.getAll();
      
      // Load role permission settings
      let rolePermissionSettings = state.settings.rolePermissions;
      try {
        const rolePermissionResponse = await rolePermissionAPI.getSettings();
        if (rolePermissionResponse.data.success && rolePermissionResponse.data.data) {
          rolePermissionSettings = rolePermissionResponse.data.data;
        }
      } catch (error) {
        console.warn('Role permission settings not available, using defaults:', error);
      }

      if (baseResponse.data.success && baseResponse.data.data) {
        const settingsData: EnhancedSystemSettings = {
          company: baseResponse.data.data.company || state.settings.company,
          email: baseResponse.data.data.email || state.settings.email,
          tax: baseResponse.data.data.tax || state.settings.tax,
          invoice: baseResponse.data.data.invoice || state.settings.invoice,
          notifications: baseResponse.data.data.notifications || state.settings.notifications,
          security: baseResponse.data.data.security || state.settings.security,
          rolePermissions: rolePermissionSettings
        };
        
        setState(prev => ({
          ...prev,
          settings: settingsData,
          initialSettings: settingsData,
          loading: false
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      console.error('Failed to load settings:', error);
    }
  };

  const updateSettings = <T extends keyof EnhancedSystemSettings>(
    section: T,
    field: keyof EnhancedSystemSettings[T],
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [section]: {
          ...prev.settings[section],
          [field]: value
        }
      }
    }));
  };

  const updateRolePermissionSettings = (
    subsection: keyof RolePermissionSettings,
    field: string,
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        rolePermissions: {
          ...prev.settings.rolePermissions,
          [subsection]: {
            ...prev.settings.rolePermissions[subsection],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSaveSection = async () => {
    if (!state.unsavedChanges || !state.activeSection) return;

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      let response;
      
      switch (state.activeSection) {
        case 'company':
          response = await settingsAPI.updateCompany(state.settings.company);
          break;
        case 'email':
          response = await settingsAPI.updateEmail(state.settings.email);
          break;
        case 'tax':
          response = await settingsAPI.updateTax(state.settings.tax);
          break;
        case 'invoice':
          response = await settingsAPI.updateInvoice(state.settings.invoice);
          break;
        case 'notifications':
          response = await settingsAPI.updateNotifications(state.settings.notifications);
          break;
        case 'security':
          response = await settingsAPI.updateSecurity(state.settings.security);
          break;
        case 'rolePermissions':
          // Save all role permission subsections
          await Promise.all([
            rolePermissionAPI.updateRoleSettings(state.settings.rolePermissions.roles),
            rolePermissionAPI.updatePermissionSettings(state.settings.rolePermissions.permissions),
            rolePermissionAPI.updateAuditSettings(state.settings.rolePermissions.auditSettings)
          ]);
          response = { data: { success: true } };
          break;
        default:
          throw new Error('Invalid section');
      }

      if (response.data.success) {
        setState(prev => ({
          ...prev,
          initialSettings: prev.settings,
          unsavedChanges: false,
          saving: false
        }));
        showToast(`${state.activeSection.charAt(0).toUpperCase() + state.activeSection.slice(1)} settings saved successfully!`, 'success');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, error: errorMessage, saving: false }));
      showToast(`Failed to save ${state.activeSection} settings: ${errorMessage}`, 'error');
    }
  };

  const handleSaveAll = async () => {
    if (!state.unsavedChanges) return;

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      await Promise.all([
        settingsAPI.updateCompany(state.settings.company),
        settingsAPI.updateEmail(state.settings.email),
        settingsAPI.updateTax(state.settings.tax),
        settingsAPI.updateInvoice(state.settings.invoice),
        settingsAPI.updateNotifications(state.settings.notifications),
        settingsAPI.updateSecurity(state.settings.security),
        // Role permission settings
        rolePermissionAPI.updateRoleSettings(state.settings.rolePermissions.roles),
        rolePermissionAPI.updatePermissionSettings(state.settings.rolePermissions.permissions),
        rolePermissionAPI.updateAuditSettings(state.settings.rolePermissions.auditSettings)
      ]);

      setState(prev => ({
        ...prev,
        initialSettings: prev.settings,
        unsavedChanges: false,
        saving: false
      }));
      showToast('All settings saved successfully!', 'success');
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({ ...prev, error: errorMessage, saving: false }));
      showToast(`Failed to save settings: ${errorMessage}`, 'error');
    }
  };

  const handleTestEmail = async () => {
    if (!state.testEmailAddress.trim()) {
      showToast('Please enter a test email address', 'warning');
      return;
    }

    setState(prev => ({ ...prev, testingEmail: true, error: null }));

    // try {
    //   const response = await settingsAPI.testEmail({ testEmail: state.testEmailAddress.trim() });
      
    //   if (response.data.success) {
    //     showToast(`Email test successful! Test email sent to ${state.testEmailAddress}`, 'success');
    //   } else {
    //     showToast('Email test failed. Please check your configuration.', 'error');
    //   }
    // } catch (error) {
    //   const errorMessage = handleApiError(error);
    //   setState(prev => ({ ...prev, error: errorMessage }));
    //   showToast(`Email test failed: ${errorMessage}`, 'error');
    // } finally {
    //   setState(prev => ({ ...prev, testingEmail: false }));
    // }
  };

  const handleDiscardChanges = () => {
    if (state.initialSettings) {
      setState(prev => ({
        ...prev,
        settings: prev.initialSettings!,
        unsavedChanges: false
      }));
      showToast('Changes discarded', 'warning');
    }
  };

  const handleSectionToggle = (sectionId: EnhancedSettingsSectionId) => {
    setState(prev => ({
      ...prev,
      activeSection: prev.activeSection === sectionId ? '' : sectionId
    }));
  };

  if (state.loading) {
    return <LoadingSkeleton />;
  }

  if (state.error && !state.settings) {
    return <ErrorComponent error={state.error} onRetry={loadSettings} />;
  }

  const sections: Array<SettingsSectionConfig & { id: EnhancedSettingsSectionId }> = [
    {
      id: 'company',
      icon: <Icons.Building />,
      title: 'Company Information',
      description: 'Configure your company details and branding'
    },
    {
      id: 'email',
      icon: <Icons.Mail />,
      title: 'Email Configuration',
      description: 'Set up SMTP settings for sending emails'
    },
    {
      id: 'tax',
      icon: <Icons.Calculator />,
      title: 'Tax Settings',
      description: 'Configure default tax rates and calculations'
    },
    {
      id: 'invoice',
      icon: <Icons.Document />,
      title: 'Invoice Settings',
      description: 'Customize invoice generation and formatting'
    },
    // {
    //   id: 'security',
    //   icon: <Icons.Shield />,
    //   title: 'Security Settings',
    //   description: 'Manage security policies and requirements'
    // },
    // NEW: Role and Permission Settings
    {
      id: 'rolePermissions',
      icon: <Icons.Users />,
      title: 'Roles & Permissions',
      description: 'Configure user roles, permissions, and access control'
    },
   
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notifications */}
      {state.toast && (
        <Toast 
          toast={state.toast}
          onClose={() => setState(prev => ({ ...prev, toast: null }))}
        />
      )}

      {/* Header */}
      <SystemSettingsPageHeader
        unsavedChanges={state.unsavedChanges}
        saving={state.saving}
        error={state.error}
        onDiscardChanges={handleDiscardChanges}
        onSaveSection={handleSaveSection}
        onSaveAll={handleSaveAll}
      />

      {/* Settings Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <SettingsSection
            key={section.id}
            icon={section.icon}
            title={section.title}
            description={section.description}
            isActive={state.activeSection === section.id}
            onClick={() => handleSectionToggle(section.id)}
          >
            {/* Company Settings */}
            {section.id === 'company' && (
              <CompanySettingsComponent
                settings={state.settings.company}
                onUpdate={(field, value) => updateSettings('company', field, value)}
              />
            )}

            {/* Email Settings */}
            {section.id === 'email' && (
              <EmailSettingsComponent
                settings={state.settings.email}
                testEmailAddress={state.testEmailAddress}
                testingEmail={state.testingEmail}
                onUpdate={(field, value) => updateSettings('email', field, value)}
                onTestEmailAddressChange={(value) => setState(prev => ({ ...prev, testEmailAddress: value }))}
                onTestEmail={handleTestEmail}
              />
            )}

            {/* Tax Settings */}
            {section.id === 'tax' && (
              <TaxSettingsComponent
                settings={state.settings.tax}
                onUpdate={(field, value) => updateSettings('tax', field, value)}
              />
            )}

            {/* Invoice Settings */}
            {section.id === 'invoice' && (
              <InvoiceSettingsComponent
                settings={state.settings.invoice}
                onUpdate={(field, value) => updateSettings('invoice', field, value)}
              />
            )}

            {/* Security Settings */}
            {/* {section.id === 'security' && (
              <SecuritySettingsComponent
                settings={state.settings.security}
                onUpdate={(field, value) => updateSettings('security', field, value)}
              />
            )} */}

            {/* NEW: Role and Permission Settings */}
            {/* {section.id === 'rolePermissions' && (
              <RolePermissionSettingsComponent
                settings={state.settings.rolePermissions}
                onUpdate={updateRolePermissionSettings}
              />
            )} */}
          </SettingsSection>
        ))}
      </div>

      {/* Footer */}
      <SettingsFooter />
    </div>
  );
};

export default SystemSettingsPage;