// const { prisma } = require('../config/database');

// class SettingsService {
//   constructor() {
//     this.cache = new Map();
//     this.cacheExpiry = new Map();
//     this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
//   }

//   // ==================== EXISTING SYSTEM SETTINGS METHODS ====================

//   /**
//    * Get setting by key with caching and proper JSON parsing
//    */
//   async getSettingByKey(key) {
//     try {
//       // Check cache first
//       if (this.cache.has(key)) {
//         const expiry = this.cacheExpiry.get(key);
//         if (expiry && Date.now() < expiry) {
//           console.log(`Cache hit for key: ${key}`);
//           return this.cache.get(key);
//         }
//       }

//       console.log(`Fetching from database: ${key}`);
      
//       // Fetch from database
//       const setting = await prisma.systemSettings.findUnique({
//         where: { key }
//       });
      
//       let value = null;
//       if (setting && setting.value !== null) {
//         try {
//           // Parse JSON value - Prisma Json fields return objects directly in most cases
//           value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
//           console.log(`Parsed value for ${key}:`, value);
//         } catch (e) {
//           // If parsing fails, use raw value
//           value = setting.value;
//           console.log(`Failed to parse JSON for ${key}, using raw value:`, value);
//         }
//       }
      
//       // Cache the result
//       this.cache.set(key, value);
//       this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
      
//       return value;
//     } catch (error) {
//       console.error(`Error getting setting ${key}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Set setting with proper JSON handling and clear cache
//    */
//   async setSettingByKey(key, value, category = null) {
//     try {
//       console.log(`Setting ${key} to:`, value, `(category: ${category})`);
      
//       const result = await prisma.systemSettings.upsert({
//         where: { key },
//         update: { 
//           value: value,
//           category,
//           updatedAt: new Date()
//         },
//         create: { 
//           key, 
//           value: value,
//           category 
//         }
//       });
      
//       console.log(`Database result for ${key}:`, result);
      
//       // Clear cache for this key and all settings
//       this.clearCacheKey(key);
//       console.log(`Cache cleared for ${key}`);
      
//       return result;
//     } catch (error) {
//       console.error(`Error setting ${key}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Get all settings grouped by category with proper JSON handling
//    */
//   async getAllSettings() {
//     const cacheKey = '_all_settings_';
    
//     // Check cache first
//     if (this.cache.has(cacheKey)) {
//       const expiry = this.cacheExpiry.get(cacheKey);
//       if (expiry && Date.now() < expiry) {
//         console.log('Cache hit for all settings');
//         return this.cache.get(cacheKey);
//       }
//     }

//     try {
//       console.log('Fetching all settings from database');
//       const settings = await prisma.systemSettings.findMany();
//       console.log(`Found ${settings.length} settings in database`);
      
//       const grouped = {
//         company: {},
//         email: {},
//         tax: {},
//         invoice: {},
//         notifications: {},
//         security: {}
//       };

//       // Parse and group settings
//       settings.forEach(setting => {
//         console.log(`Processing setting: ${setting.key}`, setting.value);
        
//         const [category, field] = setting.key.split('.');
//         if (grouped[category]) {
//           // Prisma Json fields return objects directly, but handle string case too
//           let parsedValue = setting.value;
//           if (typeof setting.value === 'string') {
//             try {
//               parsedValue = JSON.parse(setting.value);
//             } catch (e) {
//               parsedValue = setting.value;
//             }
//           }
//           grouped[category][field] = parsedValue;
//           console.log(`Set ${category}.${field} =`, parsedValue);
//         } else {
//           console.log(`Unknown category: ${category} for key: ${setting.key}`);
//         }
//       });

//       // Set defaults for missing settings
//       const defaults = this.getDefaultSettings();

//       // Merge defaults with existing settings
//       Object.keys(defaults).forEach(category => {
//         grouped[category] = { ...defaults[category], ...grouped[category] };
//         console.log(`Merged defaults for ${category}:`, grouped[category]);
//       });

//       // Cache the result
//       this.cache.set(cacheKey, grouped);
//       this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

//       console.log('All settings processed and cached');
//       return grouped;
//     } catch (error) {
//       console.error('Error getting all settings:', error);
//       throw error;
//     }
//   }

//   getDefaultSettings() {
//     return {
//       company: {
//         name: process.env.COMPANY_NAME || '',
//         address: process.env.COMPANY_ADDRESS || '',
//         city: process.env.COMPANY_CITY || '',
//         state: process.env.COMPANY_STATE || '',
//         zipCode: process.env.COMPANY_ZIP || '',
//         country: 'United States',
//         phone: process.env.COMPANY_PHONE || '',
//         email: process.env.EMAIL_FROM || '',
//         website: process.env.COMPANY_WEBSITE || '',
//         taxId: process.env.COMPANY_TAX_ID || '',
//         logo: ''
//       },
//       email: {
//         host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//         port: parseInt(process.env.EMAIL_PORT) || 587,
//         secure: process.env.EMAIL_SECURE === 'true',
//         username: process.env.EMAIL_USER || '',
//         password: process.env.EMAIL_PASS || '',
//         fromName: process.env.EMAIL_FROM_NAME || '',
//         fromEmail: process.env.EMAIL_FROM || '',
//         replyTo: process.env.EMAIL_REPLY_TO || ''
//       },
//       tax: {
//         defaultGstRate: 5.0,
//         defaultPstRate: 7.0,
//         enableAutoTaxCalculation: true,
//         taxExemptByDefault: false,
//         requireTaxId: false
//       },
//       invoice: {
//         autoGenerateOnApproval: true,
//         autoSendEmail: true,
//         defaultDueDays: 30,
//         defaultPaymentTerms: 'Net 30 Days',
//         includeCompanyLogo: true,
//         footerText: 'Thank you for your business!',
//         sequencePrefix: 'INV-',
//         startingNumber: 1000
//       },
//       notifications: {
//         emailNotifications: true,
//         quotationApproved: true,
//         invoiceGenerated: true,
//         paymentReceived: true,
//         overdueReminders: true,
//         reminderDays: [7, 14, 30]
//       },
//       security: {
//         sessionTimeout: 30,
//         passwordMinLength: 8,
//         requireStrongPasswords: true,
//         enableTwoFactor: false,
//         allowPasswordReset: true,
//         maxLoginAttempts: 5
//       }
//     };
//   }

//   // ==================== EMAIL TEMPLATE CRUD METHODS ====================

//   /**
//    * Get all email templates from dedicated table
//    */
//   // async getEmailTemplates() {
//   //   try {
//   //     const templates = await prisma.emailTemplate.findMany({
//   //       include: {
//   //         creator: {
//   //           select: {
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true
//   //           }
//   //         },
//   //         updater: {
//   //           select: {
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true
//   //           }
//   //         }
//   //       },
//   //       orderBy: [
//   //         { isSystem: 'desc' },
//   //         { category: 'asc' },
//   //         { name: 'asc' }
//   //       ]
//   //     });

//   //     // Convert to object format for backward compatibility
//   //     const templateObject = {};
//   //     templates.forEach(template => {
//   //       templateObject[template.templateKey] = {
//   //         id: template.id,
//   //         key: template.templateKey,
//   //         name: template.name,
//   //         description: template.description,
//   //         category: template.category,
//   //         type: template.type,
//   //         enabled: template.enabled,
//   //         isSystem: template.isSystem,
//   //         subject: template.subject,
//   //         htmlContent: template.htmlContent,
//   //         sections: template.sections,
//   //         variables: template.variables,
//   //         metadata: template.metadata,
//   //         version: template.version,
//   //         creator: template.creator,
//   //         updater: template.updater,
//   //         createdAt: template.createdAt,
//   //         updatedAt: template.updatedAt
//   //       };
//   //     });

//   //     return templateObject;
//   //   } catch (error) {
//   //     console.error('Error fetching email templates:', error);
//   //     // Fallback to legacy method if table doesn't exist
//   //     return await this.getEmailTemplateSettingsLegacy();
//   //   }
//   // }


//   async getEmailTemplates() {
//   try {
//     const templates = await prisma.emailTemplate.findMany({
//       include: {
//         creator: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         },
//         updater: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: [
//         { isSystem: 'desc' },
//         { category: 'asc' },
//         { name: 'asc' }
//       ]
//     });

//     // Convert to object format for backward compatibility
//     const templateObject = {};
//     templates.forEach(template => {
//       templateObject[template.templateKey] = {
//         id: template.id,
//         templateKey: template.templateKey, // ← Change this from "key" to "templateKey"
//         name: template.name,
//         description: template.description,
//         category: template.category,
//         type: template.type,
//         enabled: template.enabled,
//         isSystem: template.isSystem,
//         subject: template.subject,
//         htmlContent: template.htmlContent,
//         sections: template.sections,
//         variables: template.variables,
//         metadata: template.metadata,
//         version: template.version,
//         creator: template.creator,
//         updater: template.updater,
//         createdAt: template.createdAt,
//         updatedAt: template.updatedAt
//       };
//     });

//     return templateObject;
//   } catch (error) {
//     console.error('Error fetching email templates:', error);
//     // Fallback to legacy method if table doesn't exist
//     return await this.getEmailTemplateSettingsLegacy();
//   }
// }

//   /**
//    * Get specific email template by key
//    */
//   async getEmailTemplate(templateKey) {
//     try {
//       const template = await prisma.emailTemplate.findUnique({
//         where: { templateKey },
//         include: {
//           creator: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           },
//           updater: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           }
//         }
//       });

//       return template;
//     } catch (error) {
//       console.error(`Error fetching email template ${templateKey}:`, error);
//       return null;
//     }
//   }

//   /**
//    * Create new email template
//    */
//   async createEmailTemplate(templateData, createdBy) {
//     try {
//       const template = await prisma.emailTemplate.create({
//         data: {
//           templateKey: templateData.templateKey,
//           name: templateData.name,
//           description: templateData.description,
//           category: templateData.category,
//           type: templateData.type,
//           enabled: templateData.enabled ?? true,
//           isSystem: false, // User-created templates are never system templates
//           subject: templateData.subject,
//           htmlContent: templateData.htmlContent,
//           sections: templateData.sections || {},
//           variables: templateData.variables || [],
//           metadata: templateData.metadata || {},
//           createdBy
//         },
//         include: {
//           creator: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           }
//         }
//       });

//       // Clear template cache
//       this.clearTemplateCache();

//       return template;
//     } catch (error) {
//       console.error('Error creating email template:', error);
//       throw error;
//     }
//   }

//   /**
//    * Update email template
//    */
//   // async updateEmailTemplate(templateKey, templateData, updatedBy) {
//   //   try {
//   //     const template = await prisma.emailTemplate.update({
//   //       where: { templateKey },
//   //       data: {
//   //         name: templateData.name,
//   //         description: templateData.description,
//   //         category: templateData.category,
//   //         type: templateData.type,
//   //         enabled: templateData.enabled,
//   //         subject: templateData.subject,
//   //         htmlContent: templateData.htmlContent,
//   //         sections: templateData.sections,
//   //         variables: templateData.variables,
//   //         metadata: templateData.metadata,
//   //         version: { increment: 1 },
//   //         updatedBy,
//   //         updatedAt: new Date()
//   //       },
//   //       include: {
//   //         creator: {
//   //           select: {
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true
//   //           }
//   //         },
//   //         updater: {
//   //           select: {
//   //             firstName: true,
//   //             lastName: true,
//   //             email: true
//   //           }
//   //         }
//   //       }
//   //     });

//   //     // Clear template cache
//   //     this.clearTemplateCache();

//   //     return template;
//   //   } catch (error) {
//   //     console.error(`Error updating email template ${templateKey}:`, error);
//   //     throw error;
//   //   }
//   // }

//   async updateEmailTemplate(templateKey, templateData, updatedBy) {
//   try {
//     // Remove null/undefined so Prisma doesn't try to set NOT NULL fields to null
//     const cleanData = Object.fromEntries(
//       Object.entries(templateData).filter(([_, v]) => v !== undefined && v !== null)
//     );

//     const template = await prisma.emailTemplate.update({
//       where: { templateKey },
//       data: {
//         ...cleanData,
//         version: { increment: 1 },
//         updatedBy,
//         updatedAt: new Date()
//       },
//       include: {
//         creator: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         },
//         updater: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       }
//     });

//     // Clear template cache
//     this.clearTemplateCache();

//     return template;
//   } catch (error) {
//     console.error(`Error updating email template ${templateKey}:`, error);
//     throw error;
//   }
// }



//   /**
//    * Delete email template
//    */
//   async deleteEmailTemplate(templateKey) {
//     try {
//       // Check if template exists and is not a system template
//       const template = await prisma.emailTemplate.findUnique({
//         where: { templateKey }
//       });

//       if (!template) {
//         throw new Error('Template not found');
//       }

//       if (template.isSystem) {
//         throw new Error('Cannot delete system template');
//       }

//       await prisma.emailTemplate.delete({
//         where: { templateKey }
//       });

//       // Clear template cache
//       this.clearTemplateCache();

//       return true;
//     } catch (error) {
//       console.error(`Error deleting email template ${templateKey}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Duplicate email template
//    */
//   async duplicateEmailTemplate(sourceTemplateKey, newTemplateKey, newName, createdBy) {
//     try {
//       const sourceTemplate = await prisma.emailTemplate.findUnique({
//         where: { templateKey: sourceTemplateKey }
//       });

//       if (!sourceTemplate) {
//         throw new Error('Source template not found');
//       }

//       const duplicatedTemplate = await prisma.emailTemplate.create({
//         data: {
//           templateKey: newTemplateKey,
//           name: newName,
//           description: `Copy of ${sourceTemplate.name}`,
//           category: sourceTemplate.category,
//           type: sourceTemplate.type,
//           enabled: sourceTemplate.enabled,
//           isSystem: false,
//           subject: sourceTemplate.subject,
//           htmlContent: sourceTemplate.htmlContent,
//           sections: sourceTemplate.sections,
//           variables: sourceTemplate.variables,
//           metadata: sourceTemplate.metadata,
//           createdBy
//         },
//         include: {
//           creator: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           }
//         }
//       });

//       // Clear template cache
//       this.clearTemplateCache();

//       return duplicatedTemplate;
//     } catch (error) {
//       console.error(`Error duplicating email template ${sourceTemplateKey}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Restore template to default
//    */
//   async restoreEmailTemplate(templateKey, updatedBy) {
//     try {
//       const defaultTemplates = this.getDefaultEmailTemplates();
//       const defaultTemplate = defaultTemplates[templateKey];

//       if (!defaultTemplate) {
//         throw new Error('No default configuration available for this template');
//       }

//       const template = await prisma.emailTemplate.update({
//         where: { templateKey },
//         data: {
//           subject: defaultTemplate.subject,
//           sections: defaultTemplate.sections,
//           variables: defaultTemplate.variables || [],
//           metadata: defaultTemplate.metadata || {},
//           version: { increment: 1 },
//           updatedBy,
//           updatedAt: new Date()
//         },
//         include: {
//           creator: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           },
//           updater: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           }
//         }
//       });

//       // Clear template cache
//       this.clearTemplateCache();

//       return template;
//     } catch (error) {
//       console.error(`Error restoring email template ${templateKey}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Get template types with their configurations
//    */
//   getTemplateTypes() {
//     return [
//       {
//         type: 'QUOTATION_SENT',
//         label: 'Quotation Sent',
//         description: 'Sent when quotation is emailed to client',
//         category: 'QUOTATION',
//         requiredVariables: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount'],
//         optionalVariables: ['description', 'validUntil', 'notes', 'subtotal', 'gstAmount', 'pstAmount'],
//         defaultSections: ['header', 'greeting', 'quotationDetails', 'financialSummary', 'footer']
//       },
//       {
//         type: 'QUOTATION_APPROVED',
//         label: 'Quotation Approved',
//         description: 'Sent when quotation is approved',
//         category: 'QUOTATION',
//         requiredVariables: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount'],
//         optionalVariables: ['description', 'validUntil', 'notes', 'subtotal', 'gstAmount', 'pstAmount'],
//         defaultSections: ['header', 'greeting', 'quotationDetails', 'financialSummary', 'nextSteps', 'footer']
//       },
//       {
//         type: 'INVOICE_SENT',
//         label: 'Invoice Sent',
//         description: 'Sent when invoice is emailed to client',
//         category: 'INVOICE',
//         requiredVariables: ['clientName', 'invoiceNumber', 'totalAmount', 'dueDate'],
//         optionalVariables: ['invoiceType', 'subtotal', 'gstAmount', 'pstAmount', 'quotationTitle'],
//         defaultSections: ['header', 'greeting', 'invoiceDetails', 'financialSummary', 'footer']
//       },
//       {
//         type: 'USER_WELCOME',
//         label: 'User Welcome',
//         description: 'Welcome email for new users',
//         category: 'USER',
//         requiredVariables: ['firstName', 'email'],
//         optionalVariables: ['lastName', 'role', 'companyName'],
//         defaultSections: ['header', 'greeting', 'content', 'footer']
//       },
//       {
//         type: 'CUSTOM',
//         label: 'Custom Template',
//         description: 'Fully customizable template',
//         category: 'CUSTOM',
//         requiredVariables: [],
//         optionalVariables: [],
//         defaultSections: ['header', 'content', 'footer']
//       }
//     ];
//   }

//   // ==================== LEGACY SUPPORT METHODS ====================

//   /**
//    * Legacy method for backward compatibility
//    */
//   async getEmailTemplateSettingsLegacy() {
//     try {
//       const templates = await this.getSettingByKey('emailTemplates');
//       return templates || this.getDefaultEmailTemplates();
//     } catch (error) {
//       console.error('Error getting email template settings:', error);
//       return this.getDefaultEmailTemplates();
//     }
//   }

//   /**
//    * Legacy method for backward compatibility
//    */
//   async updateEmailTemplateSettingsLegacy(templates) {
//     try {
//       await this.setSettingByKey('emailTemplates', templates, 'email');
//       return templates;
//     } catch (error) {
//       console.error('Error updating email template settings:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get default email templates (for backward compatibility and initialization)
//    */
//   getDefaultEmailTemplates() {
//     return {
//       quotation_approved: {
//         enabled: true,
//         subject: "Quotation {{quotationNumber}} Approved - Invoice Generated",
//         sections: {
//           header: { 
//             enabled: true, 
//             title: "Quotation Approved!",
//             backgroundColor: "#667eea"
//           },
//           greeting: { enabled: true },
//           quotationDetails: { 
//             enabled: true,
//             fields: {
//               quotationNumber: true,
//               quotationTitle: true,
//               description: false,
//               validUntil: false,
//               approvedDate: true
//             }
//           },
//           financialSummary: {
//             enabled: true,
//             showSubtotal: true,
//             showGstBreakdown: true,
//             showPstBreakdown: true,
//             showTotal: true
//           },
//           dynamicFields: { enabled: false },
//           notes: { enabled: false },
//           nextSteps: { enabled: true },
//           footer: { 
//             enabled: true, 
//             showCompanyInfo: true 
//           }
//         }
//       },
//       invoice_sent: {
//         enabled: true,
//         subject: "Invoice {{invoiceNumber}} - Payment Required",
//         sections: {
//           header: { 
//             enabled: true, 
//             title: "Invoice Ready",
//             backgroundColor: "#ff6b6b"
//           },
//           greeting: { enabled: true },
//           invoiceDetails: {
//             enabled: true,
//             fields: {
//               invoiceNumber: true,
//               invoiceType: true,
//               totalAmount: true,
//               dueDate: true,
//               quotationTitle: true
//             }
//           },
//           financialBreakdown: { enabled: false },
//           paymentInstructions: { enabled: true },
//           footer: { enabled: true }
//         }
//       },
//       quotation_sent: {
//         enabled: true,
//         subject: "Quotation {{quotationNumber}} - {{quotationTitle}}",
//         sections: {
//           header: { 
//             enabled: true, 
//             title: "New Quotation",
//             backgroundColor: "#059669"
//           },
//           greeting: { enabled: true },
//           quotationDetails: {
//             enabled: true,
//             fields: {
//               quotationNumber: true,
//               quotationTitle: true,
//               totalAmount: true,
//               validUntil: true,
//               description: false
//             }
//           },
//           projectDescription: { enabled: true },
//           additionalNotes: { enabled: true },
//           attachmentNote: { enabled: true },
//           footer: { enabled: true }
//         }
//       },
//       user_created: {
//         enabled: true,
//         subject: "Welcome to {{companyName}}",
//         sections: {
//           header: { 
//             enabled: true, 
//             title: "Welcome!",
//             backgroundColor: "#667eea"
//           },
//           greeting: { enabled: true },
//           accountDetails: { enabled: true },
//           accessInstructions: { enabled: true },
//           footer: { enabled: true }
//         }
//       }
//     };
//   }

//   // ==================== MIGRATION METHODS ====================

//   /**
//    * Migrate email templates from JSON storage to dedicated table
//    */
//   async migrateEmailTemplatesToTable() {
//     try {
//       console.log('Starting email template migration...');
      
//       // Get existing templates from JSON storage
//       const legacyTemplates = await this.getEmailTemplateSettingsLegacy();
      
//       const migratedCount = 0;
//       const errors = [];

//       for (const [templateKey, templateData] of Object.entries(legacyTemplates)) {
//         try {
//           // Check if template already exists in new table
//           const existing = await this.getEmailTemplate(templateKey);
          
//           if (!existing) {
//             // Determine category and type from template key
//             const { category, type } = this.determineTemplateTypeFromKey(templateKey);
            
//             await prisma.emailTemplate.create({
//               data: {
//                 templateKey,
//                 name: this.humanizeTemplateKey(templateKey),
//                 description: `Migrated from legacy system: ${templateKey}`,
//                 category,
//                 type,
//                 enabled: templateData.enabled ?? true,
//                 isSystem: true, // Mark migrated templates as system templates
//                 subject: templateData.subject,
//                 sections: templateData.sections || {},
//                 variables: this.extractVariablesFromTemplate(templateData),
//                 metadata: {
//                   migratedAt: new Date().toISOString(),
//                   originalKey: templateKey
//                 },
//                 createdBy: 'system', // Would need to be a valid user ID
//                 version: 1
//               }
//             });
            
//             migratedCount++;
//             console.log(`Migrated template: ${templateKey}`);
//           } else {
//             console.log(`Template already exists: ${templateKey}`);
//           }
//         } catch (error) {
//           console.error(`Error migrating template ${templateKey}:`, error);
//           errors.push(`${templateKey}: ${error.message}`);
//         }
//       }

//       console.log(`Migration completed. Migrated ${migratedCount} templates.`);
//       if (errors.length > 0) {
//         console.log('Migration errors:', errors);
//       }

//       return {
//         migratedCount,
//         errors
//       };
//     } catch (error) {
//       console.error('Email template migration failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Helper method to determine template category and type from key
//    */
//   determineTemplateTypeFromKey(templateKey) {
//     if (templateKey.includes('quotation')) {
//       if (templateKey.includes('approved')) {
//         return { category: 'QUOTATION', type: 'QUOTATION_APPROVED' };
//       } else if (templateKey.includes('sent')) {
//         return { category: 'QUOTATION', type: 'QUOTATION_SENT' };
//       }
//       return { category: 'QUOTATION', type: 'QUOTATION_SENT' };
//     } else if (templateKey.includes('invoice')) {
//       return { category: 'INVOICE', type: 'INVOICE_SENT' };
//     } else if (templateKey.includes('user')) {
//       return { category: 'USER', type: 'USER_WELCOME' };
//     } else {
//       return { category: 'CUSTOM', type: 'CUSTOM' };
//     }
//   }

//   /**
//    * Helper method to create human-readable names from template keys
//    */
//   humanizeTemplateKey(templateKey) {
//     return templateKey
//       .split('_')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }

//   /**
//    * Helper method to extract variables from template content
//    */
//   extractVariablesFromTemplate(templateData) {
//     const variables = new Set();
//     const regex = /\{\{(\w+)\}\}/g;
    
//     // Extract from subject
//     if (templateData.subject) {
//       let match;
//       while ((match = regex.exec(templateData.subject)) !== null) {
//         variables.add(match[1]);
//       }
//     }
    
//     // Extract from sections (simplified)
//     if (templateData.sections) {
//       const sectionString = JSON.stringify(templateData.sections);
//       let match;
//       while ((match = regex.exec(sectionString)) !== null) {
//         variables.add(match[1]);
//       }
//     }
    
//     return Array.from(variables);
//   }

//   // ==================== CACHE MANAGEMENT ====================

//   /**
//    * Clear template-related cache
//    */
//   clearTemplateCache() {
//     const templateKeys = Array.from(this.cache.keys()).filter(key => 
//       key.includes('template') || key.includes('_all_settings_')
//     );
    
//     templateKeys.forEach(key => {
//       this.cache.delete(key);
//       this.cacheExpiry.delete(key);
//     });
    
//     console.log('Template cache cleared');
//   }

//   /**
//    * Clear cache (call this when settings are updated)
//    */
//   clearCache() {
//     console.log('Clearing all cache');
//     this.cache.clear();
//     this.cacheExpiry.clear();
//   }

//   /**
//    * Clear specific cache entry
//    */
//   clearCacheKey(key) {
//     console.log(`Clearing cache for key: ${key}`);
//     this.cache.delete(key);
//     this.cacheExpiry.delete(key);
//     // Also clear the all settings cache
//     this.cache.delete('_all_settings_');
//     this.cacheExpiry.delete('_all_settings_');
//   }

//   // ==================== OTHER SETTINGS METHODS (KEEP EXISTING) ====================

//   async getSettingsByCategory(category) {
//     try {
//       console.log(`Getting settings for category: ${category}`);
      
//       const settings = await prisma.systemSettings.findMany({
//         where: { 
//           key: {
//             startsWith: `${category}.`
//           }
//         }
//       });

//       console.log(`Found ${settings.length} settings for category ${category}`);

//       const result = {};
//       settings.forEach(setting => {
//         const field = setting.key.replace(`${category}.`, '');
//         let value = setting.value;
//         if (typeof setting.value === 'string') {
//           try {
//             value = JSON.parse(setting.value);
//           } catch (e) {
//             value = setting.value;
//           }
//         }
//         result[field] = value;
//       });

//       console.log(`Category ${category} settings:`, result);
//       return result;
//     } catch (error) {
//       console.error(`Error getting settings for category ${category}:`, error);
//       throw error;
//     }
//   }

//   async updateCategorySettings(category, settingsObject) {
//     try {
//       console.log(`Bulk updating ${category} settings:`, settingsObject);
      
//       const updates = Object.entries(settingsObject).map(([field, value]) => {
//         const key = `${category}.${field}`;
//         return this.setSettingByKey(key, value, category);
//       });
      
//       const results = await Promise.all(updates);
//       console.log(`Bulk update completed for ${category}`);
      
//       return results;
//     } catch (error) {
//       console.error(`Error bulk updating ${category} settings:`, error);
//       throw error;
//     }
//   }

//   async getCompanySettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.company;
//   }

//   async getEmailSettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.email;
//   }

//   async getTaxSettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.tax;
//   }

//   async getInvoiceSettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.invoice;
//   }

//   async getNotificationSettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.notifications;
//   }

//   async getSecuritySettings() {
//     const allSettings = await this.getAllSettings();
//     return allSettings.security;
//   }

//   /**
//    * Initialize default settings
//    */
//   async initializeDefaults() {
//     try {
//       console.log('Initializing default settings...');
      
//       const existingSettings = await prisma.systemSettings.findMany();
//       const existingKeys = existingSettings.map(s => s.key);

//       const defaultSettings = {
//         'company.name': process.env.COMPANY_NAME || '',
//         'company.address': process.env.COMPANY_ADDRESS || '',
//         'company.city': process.env.COMPANY_CITY || '',
//         'company.state': process.env.COMPANY_STATE || '',
//         'company.zipCode': process.env.COMPANY_ZIP || '',
//         'company.country': 'United States',
//         'company.phone': process.env.COMPANY_PHONE || '',
//         'company.email': process.env.EMAIL_FROM || '',
//         'company.website': process.env.COMPANY_WEBSITE || '',
//         'company.taxId': process.env.COMPANY_TAX_ID || '',
//         'company.logo': '',
        
//         'email.host': process.env.EMAIL_HOST || 'smtp.gmail.com',
//         'email.port': parseInt(process.env.EMAIL_PORT) || 587,
//         'email.secure': process.env.EMAIL_SECURE === 'true',
//         'email.username': process.env.EMAIL_USER || '',
//         'email.password': process.env.EMAIL_PASS || '',
//         'email.fromName': process.env.EMAIL_FROM_NAME || '',
//         'email.fromEmail': process.env.EMAIL_FROM || '',
//         'email.replyTo': process.env.EMAIL_REPLY_TO || '',
        
//         'tax.defaultGstRate': 5.0,
//         'tax.defaultPstRate': 7.0,
//         'tax.enableAutoTaxCalculation': true,
//         'tax.taxExemptByDefault': false,
//         'tax.requireTaxId': false,
        
//         'invoice.autoGenerateOnApproval': true,
//         'invoice.autoSendEmail': true,
//         'invoice.defaultDueDays': 30,
//         'invoice.defaultPaymentTerms': 'Net 30 Days',
//         'invoice.includeCompanyLogo': true,
//         'invoice.footerText': 'Thank you for your business!',
//         'invoice.sequencePrefix': 'INV-',
//         'invoice.startingNumber': 1000,
        
//         'notifications.emailNotifications': true,
//         'notifications.quotationApproved': true,
//         'notifications.invoiceGenerated': true,
//         'notifications.paymentReceived': true,
//         'notifications.overdueReminders': true,
//         'notifications.reminderDays': [7, 14, 30],
        
//         'security.sessionTimeout': 30,
//         'security.passwordMinLength': 8,
//         'security.requireStrongPasswords': true,
//         'security.enableTwoFactor': false,
//         'security.allowPasswordReset': true,
//         'security.maxLoginAttempts': 5
//       };

//       const settingsToCreate = [];
//       Object.entries(defaultSettings).forEach(([key, value]) => {
//         if (!existingKeys.includes(key)) {
//           const [category] = key.split('.');
//           settingsToCreate.push({
//             key,
//             value,
//             category
//           });
//         }
//       });

//       if (settingsToCreate.length > 0) {
//         await prisma.systemSettings.createMany({
//           data: settingsToCreate,
//           skipDuplicates: true
//         });
//         console.log(`Created ${settingsToCreate.length} default settings`);
//       }

//       await this.initializeEmailTemplateDefaults();

//       // Clear cache after initialization
//       this.clearCache();
      
//       console.log('Default settings initialized successfully');
//       return true;
//     } catch (error) {
//       console.error('Error initializing default settings:', error);
//       throw error;
//     }
//   }

//   /**
//    * Initialize email template defaults
//    */
//   async initializeEmailTemplateDefaults() {
//     try {
//       const existing = await this.getSettingByKey('emailTemplates');
//       if (!existing) {
//         const defaults = this.getDefaultEmailTemplates();
//         await this.setSettingByKey('emailTemplates', defaults, 'email');
//         console.log('Email template defaults initialized');
//       }
//     } catch (error) {
//       console.error('Error initializing email template defaults:', error);
//     }
//   }

//   /**
//    * Test database connection
//    */
//   async testConnection() {
//     try {
//       await prisma.systemSettings.findFirst();
//       console.log('Database connection test successful');
//       return true;
//     } catch (error) {
//       console.error('Database connection test failed:', error);
//       return false;
//     }
//   }
// }

// // Create singleton instance
// const settingsService = new SettingsService();

// module.exports = {
//   settingsService,
//   SettingsService
// };



const { prisma } = require('../config/database');

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  // ==================== EXISTING SYSTEM SETTINGS METHODS (KEEP UNCHANGED) ====================

  /**
   * Get setting by key with caching and proper JSON parsing
   */
  async getSettingByKey(key) {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() < expiry) {
          console.log(`Cache hit for key: ${key}`);
          return this.cache.get(key);
        }
      }

      console.log(`Fetching from database: ${key}`);
      
      // Fetch from database
      const setting = await prisma.systemSettings.findUnique({
        where: { key }
      });
      
      let value = null;
      if (setting && setting.value !== null) {
        try {
          // Parse JSON value - Prisma Json fields return objects directly in most cases
          value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          console.log(`Parsed value for ${key}:`, value);
        } catch (e) {
          // If parsing fails, use raw value
          value = setting.value;
          console.log(`Failed to parse JSON for ${key}, using raw value:`, value);
        }
      }
      
      // Cache the result
      this.cache.set(key, value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
      
      return value;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set setting with proper JSON handling and clear cache
   */
  async setSettingByKey(key, value, category = null) {
    try {
      console.log(`Setting ${key} to:`, value, `(category: ${category})`);
      
      const result = await prisma.systemSettings.upsert({
        where: { key },
        update: { 
          value: value,
          category,
          updatedAt: new Date()
        },
        create: { 
          key, 
          value: value,
          category 
        }
      });
      
      console.log(`Database result for ${key}:`, result);
      
      // Clear cache for this key and all settings
      this.clearCacheKey(key);
      console.log(`Cache cleared for ${key}`);
      
      return result;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all settings grouped by category with proper JSON handling
   */
  async getAllSettings() {
    const cacheKey = '_all_settings_';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && Date.now() < expiry) {
        console.log('Cache hit for all settings');
        return this.cache.get(cacheKey);
      }
    }

    try {
      console.log('Fetching all settings from database');
      const settings = await prisma.systemSettings.findMany();
      console.log(`Found ${settings.length} settings in database`);
      
      const grouped = {
        company: {},
        email: {},
        tax: {},
        invoice: {},
        notifications: {},
        security: {}
      };

      // Parse and group settings
      settings.forEach(setting => {
        console.log(`Processing setting: ${setting.key}`, setting.value);
        
        const [category, field] = setting.key.split('.');
        if (grouped[category]) {
          // Prisma Json fields return objects directly, but handle string case too
          let parsedValue = setting.value;
          if (typeof setting.value === 'string') {
            try {
              parsedValue = JSON.parse(setting.value);
            } catch (e) {
              parsedValue = setting.value;
            }
          }
          grouped[category][field] = parsedValue;
          console.log(`Set ${category}.${field} =`, parsedValue);
        } else {
          console.log(`Unknown category: ${category} for key: ${setting.key}`);
        }
      });

      // Set defaults for missing settings
      const defaults = this.getDefaultSettings();

      // Merge defaults with existing settings
      Object.keys(defaults).forEach(category => {
        grouped[category] = { ...defaults[category], ...grouped[category] };
        console.log(`Merged defaults for ${category}:`, grouped[category]);
      });

      // Cache the result
      this.cache.set(cacheKey, grouped);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      console.log('All settings processed and cached');
      return grouped;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  }

  getDefaultSettings() {
    return {
      company: {
        name: process.env.COMPANY_NAME || '',
        address: process.env.COMPANY_ADDRESS || '',
        city: process.env.COMPANY_CITY || '',
        state: process.env.COMPANY_STATE || '',
        zipCode: process.env.COMPANY_ZIP || '',
        country: 'United States',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.EMAIL_FROM || '',
        website: process.env.COMPANY_WEBSITE || '',
        taxId: process.env.COMPANY_TAX_ID || '',
        logo: ''
      },
      email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        username: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASS || '',
        fromName: process.env.EMAIL_FROM_NAME || '',
        fromEmail: process.env.EMAIL_FROM || '',
        replyTo: process.env.EMAIL_REPLY_TO || ''
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
        defaultPaymentTerms: 'Net 30 Days',
        includeCompanyLogo: true,
        footerText: 'Thank you for your business!',
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
      }
    };
  }

  // ==================== SIMPLIFIED EMAIL TEMPLATE METHODS ====================

  /**
   * Get all email templates from database - SIMPLIFIED
   */
  async getEmailTemplates() {
    try {
      const templates = await prisma.emailTemplate.findMany({
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true }
          },
          updater: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: [
          { isSystem: 'desc' },
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return templates;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  /**
   * Get specific email template by key - SIMPLIFIED
   */
  async getEmailTemplate(templateKey) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { templateKey },
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true }
          },
          updater: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      return template;
    } catch (error) {
      console.error(`Error fetching email template ${templateKey}:`, error);
      return null;
    }
  }

  /**
   * Create email template - SIMPLIFIED
   */
  async createEmailTemplate(templateData, createdBy) {
    try {
      const template = await prisma.emailTemplate.create({
        data: {
          templateKey: templateData.templateKey,
          name: templateData.name,
          description: templateData.description || '',
          category: templateData.category || 'CUSTOM',
          type: templateData.type || 'CUSTOM',
          enabled: templateData.enabled !== false,
          isSystem: false,
          subject: templateData.subject,
          htmlContent: templateData.htmlContent || '',
          textContent: templateData.textContent || '',
          variables: templateData.variables || [],
          metadata: templateData.metadata || {},
          sections: templateData.sections || {},   // ✅ FIX
          createdBy
        }
      });

      this.clearTemplateCache();
      return template;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Update email template - SIMPLIFIED
   */
  async updateEmailTemplate(templateKey, templateData, updatedBy) {
    try {
      const updateData = {};
      
      // Only update provided fields
      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.description !== undefined) updateData.description = templateData.description;
      if (templateData.category !== undefined) updateData.category = templateData.category;
      if (templateData.type !== undefined) updateData.type = templateData.type;
      if (templateData.enabled !== undefined) updateData.enabled = templateData.enabled;
      if (templateData.subject !== undefined) updateData.subject = templateData.subject;
      if (templateData.htmlContent !== undefined) updateData.htmlContent = templateData.htmlContent;
      if (templateData.textContent !== undefined) updateData.textContent = templateData.textContent;
      if (templateData.variables !== undefined) updateData.variables = templateData.variables;
      if (templateData.metadata !== undefined) updateData.metadata = templateData.metadata;
      if (templateData.sections !== undefined) updateData.sections = templateData.sections; // ✅ FIX
      updateData.updatedBy = updatedBy;
      updateData.updatedAt = new Date();
      updateData.version = { increment: 1 };

      const template = await prisma.emailTemplate.update({
        where: { templateKey },
        data: updateData
      });

      this.clearTemplateCache();
      return template;
    } catch (error) {
      console.error(`Error updating email template ${templateKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete email template - SIMPLIFIED
   */
  async deleteEmailTemplate(templateKey) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { templateKey }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      if (template.isSystem) {
        throw new Error('Cannot delete system template');
      }

      await prisma.emailTemplate.delete({
        where: { templateKey }
      });

      this.clearTemplateCache();
      return true;
    } catch (error) {
      console.error(`Error deleting email template ${templateKey}:`, error);
      throw error;
    }
  }

  /**
   * Duplicate email template - SIMPLIFIED
   */
  async duplicateEmailTemplate(sourceTemplateKey, newTemplateKey, newName, createdBy) {
    try {
      const sourceTemplate = await prisma.emailTemplate.findUnique({
        where: { templateKey: sourceTemplateKey }
      });

      if (!sourceTemplate) {
        throw new Error('Source template not found');
      }

      const duplicatedTemplate = await prisma.emailTemplate.create({
        data: {
          templateKey: newTemplateKey,
          name: newName,
          description: `Copy of ${sourceTemplate.name}`,
          category: sourceTemplate.category,
          type: sourceTemplate.type,
          enabled: sourceTemplate.enabled,
          isSystem: false,
          subject: sourceTemplate.subject,
          htmlContent: sourceTemplate.htmlContent,
          textContent: sourceTemplate.textContent,
          variables: sourceTemplate.variables,
          metadata: sourceTemplate.metadata,
          sections: sourceTemplate.sections, // ✅ FIX
          createdBy
        }
      });

      this.clearTemplateCache();
      return duplicatedTemplate;
    } catch (error) {
      console.error(`Error duplicating email template ${sourceTemplateKey}:`, error);
      throw error;
    }
  }

  /**
   * Seed default email templates - SIMPLIFIED
   */
  async seedDefaultEmailTemplates(createdBy = 'system') {
    try {
      const defaultTemplates = [
        {
          templateKey: 'quotation_approved',
          name: 'Quotation Approved',
          description: 'Email sent when quotation is approved',
          category: 'QUOTATION',
          type: 'QUOTATION_APPROVED',
          subject: 'Quotation {{quotationNumber}} Approved - Invoice Generated',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #667eea; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0;">Quotation Approved!</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Hello {{clientName}},</h2>
                <p>Great news! Your quotation <strong>{{quotationNumber}}</strong> for "<strong>{{quotationTitle}}</strong>" has been approved.</p>
                
                <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3>Quotation Details:</h3>
                  <p><strong>Quotation Number:</strong> {{quotationNumber}}</p>
                  <p><strong>Project:</strong> {{quotationTitle}}</p>
                  <p><strong>Total Amount:</strong> {{totalAmount}}</p>
                  <p><strong>Approved Date:</strong> {{approvedDate}}</p>
                </div>
                
                <p>Thank you for your business!</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount', 'approvedDate', 'companyName', 'currentYear']
        },
        {
          templateKey: 'quotation_sent',
          name: 'Quotation Sent',
          description: 'Email sent when quotation is emailed to client',
          category: 'QUOTATION', 
          type: 'QUOTATION_SENT',
          subject: 'Quotation {{quotationNumber}} - {{quotationTitle}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #059669; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0;">New Quotation</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Hello {{clientName}},</h2>
                <p>Please find your quotation attached. We look forward to working with you.</p>
                
                <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3>Quotation Details:</h3>
                  <p><strong>Quotation Number:</strong> {{quotationNumber}}</p>
                  <p><strong>Project:</strong> {{quotationTitle}}</p>
                  <p><strong>Total Amount:</strong> {{totalAmount}}</p>
                  <p><strong>Valid Until:</strong> {{validUntil}}</p>
                </div>
                
                <p>If you have any questions, please contact us.</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['clientName', 'quotationNumber', 'quotationTitle', 'totalAmount', 'validUntil', 'companyName', 'currentYear']
        },
        {
          templateKey: 'invoice_sent',
          name: 'Invoice Sent',
          description: 'Email sent when invoice is emailed to client',
          category: 'INVOICE',
          type: 'INVOICE_SENT',
          subject: 'Invoice {{invoiceNumber}} - Payment Required',
          htmlContent: `
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
                  <p><strong>Invoice Type:</strong> {{invoiceType}}</p>
                  <p><strong>Amount Due:</strong> {{totalAmount}}</p>
                  <p><strong>Due Date:</strong> {{dueDate}}</p>
                </div>
                
                <p>Thank you for your business!</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['clientName', 'invoiceNumber', 'invoiceType', 'totalAmount', 'dueDate', 'companyName', 'currentYear']
        },
        {
          templateKey: 'user_welcome',
          name: 'User Welcome',
          description: 'Welcome email for new users',
          category: 'USER',
          type: 'USER_WELCOME',
          subject: 'Welcome to {{companyName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #667eea; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0;">Welcome!</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Hello {{firstName}},</h2>
                <p>Your account has been created successfully.</p>
                
                <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3>Account Details:</h3>
                  <p><strong>Name:</strong> {{fullName}}</p>
                  <p><strong>Email:</strong> {{email}}</p>
                  <p><strong>Role:</strong> {{role}}</p>
                </div>
                
                <p>Welcome to the team!</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['firstName', 'fullName', 'email', 'role', 'companyName', 'currentYear']
        },
        {
          templateKey: 'password_reset',
          name: 'Password Reset',
          description: 'Password reset email',
          category: 'USER',
          type: 'USER_PASSWORD_RESET',
          subject: 'Reset Your Password - {{companyName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f59e0b; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0;">Password Reset</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Hello {{firstName}},</h2>
                <p>You requested to reset your password. Click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{resetUrl}}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                </div>
                
                <p style="color: #666;">This link will expire in 1 hour. If you didn't request this, ignore this email.</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['firstName', 'resetUrl', 'companyName', 'currentYear']
        },
        {
          templateKey: 'test_email',
          name: 'Test Email',
          description: 'Test email for configuration verification',
          category: 'SYSTEM',
          type: 'CUSTOM',
          subject: 'Test Email - {{companyName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #10b981; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0;">Test Email</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Hello {{firstName}},</h2>
                <p>{{testMessage}}</p>
                <p>If you received this email, your email configuration is working correctly!</p>
                <p><strong>Sent Date:</strong> {{sentDate}}</p>
              </div>
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          `,
          variables: ['firstName', 'testMessage', 'sentDate', 'companyName', 'currentYear']
        }
      ];

      let createdCount = 0;
      
      for (const templateData of defaultTemplates) {
        try {
          const existing = await this.getEmailTemplate(templateData.templateKey);
          
          if (!existing) {
            await prisma.emailTemplate.create({
              data: {
                ...templateData,
                isSystem: true,
                enabled: true,
                createdBy: createdBy
              }
            });
            createdCount++;
            console.log(`Created default template: ${templateData.templateKey}`);
          } else {
            console.log(`Template already exists: ${templateData.templateKey}`);
          }
        } catch (error) {
          console.error(`Error creating template ${templateData.templateKey}:`, error);
        }
      }

      this.clearTemplateCache();
      console.log(`Seeded ${createdCount} default email templates`);
      
      return { createdCount, totalTemplates: defaultTemplates.length };
    } catch (error) {
      console.error('Error seeding default email templates:', error);
      throw error;
    }
  }

  /**
   * Clear template cache
   */
  clearTemplateCache() {
    const templateKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes('template') || key.includes('_all_settings_')
    );
    
    templateKeys.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
    
    console.log('Template cache cleared');
  }

  // ==================== OTHER SETTINGS METHODS (KEEP ALL UNCHANGED) ====================

  /**
   * Clear cache (call this when settings are updated)
   */
  clearCache() {
    console.log('Clearing all cache');
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheKey(key) {
    console.log(`Clearing cache for key: ${key}`);
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    // Also clear the all settings cache
    this.cache.delete('_all_settings_');
    this.cacheExpiry.delete('_all_settings_');
  }

  async getSettingsByCategory(category) {
    try {
      console.log(`Getting settings for category: ${category}`);
      
      const settings = await prisma.systemSettings.findMany({
        where: { 
          key: {
            startsWith: `${category}.`
          }
        }
      });

      console.log(`Found ${settings.length} settings for category ${category}`);

      const result = {};
      settings.forEach(setting => {
        const field = setting.key.replace(`${category}.`, '');
        let value = setting.value;
        if (typeof setting.value === 'string') {
          try {
            value = JSON.parse(setting.value);
          } catch (e) {
            value = setting.value;
          }
        }
        result[field] = value;
      });

      console.log(`Category ${category} settings:`, result);
      return result;
    } catch (error) {
      console.error(`Error getting settings for category ${category}:`, error);
      throw error;
    }
  }

  async updateCategorySettings(category, settingsObject) {
    try {
      console.log(`Bulk updating ${category} settings:`, settingsObject);
      
      const updates = Object.entries(settingsObject).map(([field, value]) => {
        const key = `${category}.${field}`;
        return this.setSettingByKey(key, value, category);
      });
      
      const results = await Promise.all(updates);
      console.log(`Bulk update completed for ${category}`);
      
      return results;
    } catch (error) {
      console.error(`Error bulk updating ${category} settings:`, error);
      throw error;
    }
  }

  async getCompanySettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.company;
  }

  async getEmailSettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.email;
  }

  async getTaxSettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.tax;
  }

  async getInvoiceSettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.invoice;
  }

  async getNotificationSettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.notifications;
  }

  async getSecuritySettings() {
    const allSettings = await this.getAllSettings();
    return allSettings.security;
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults() {
    try {
      console.log('Initializing default settings...');
      
      const existingSettings = await prisma.systemSettings.findMany();
      const existingKeys = existingSettings.map(s => s.key);

      const defaultSettings = {
        'company.name': process.env.COMPANY_NAME || '',
        'company.address': process.env.COMPANY_ADDRESS || '',
        'company.city': process.env.COMPANY_CITY || '',
        'company.state': process.env.COMPANY_STATE || '',
        'company.zipCode': process.env.COMPANY_ZIP || '',
        'company.country': 'United States',
        'company.phone': process.env.COMPANY_PHONE || '',
        'company.email': process.env.EMAIL_FROM || '',
        'company.website': process.env.COMPANY_WEBSITE || '',
        'company.taxId': process.env.COMPANY_TAX_ID || '',
        'company.logo': '',
        
        'email.host': process.env.EMAIL_HOST || 'smtp.gmail.com',
        'email.port': parseInt(process.env.EMAIL_PORT) || 587,
        'email.secure': process.env.EMAIL_SECURE === 'true',
        'email.username': process.env.EMAIL_USER || '',
        'email.password': process.env.EMAIL_PASS || '',
        'email.fromName': process.env.EMAIL_FROM_NAME || '',
        'email.fromEmail': process.env.EMAIL_FROM || '',
        'email.replyTo': process.env.EMAIL_REPLY_TO || '',
        
        'tax.defaultGstRate': 5.0,
        'tax.defaultPstRate': 7.0,
        'tax.enableAutoTaxCalculation': true,
        'tax.taxExemptByDefault': false,
        'tax.requireTaxId': false,
        
        'invoice.autoGenerateOnApproval': true,
        'invoice.autoSendEmail': true,
        'invoice.defaultDueDays': 30,
        'invoice.defaultPaymentTerms': 'Net 30 Days',
        'invoice.includeCompanyLogo': true,
        'invoice.footerText': 'Thank you for your business!',
        'invoice.sequencePrefix': 'INV-',
        'invoice.startingNumber': 1000,
        
        'notifications.emailNotifications': true,
        'notifications.quotationApproved': true,
        'notifications.invoiceGenerated': true,
        'notifications.paymentReceived': true,
        'notifications.overdueReminders': true,
        'notifications.reminderDays': [7, 14, 30],
        
        'security.sessionTimeout': 30,
        'security.passwordMinLength': 8,
        'security.requireStrongPasswords': true,
        'security.enableTwoFactor': false,
        'security.allowPasswordReset': true,
        'security.maxLoginAttempts': 5
      };

      const settingsToCreate = [];
      Object.entries(defaultSettings).forEach(([key, value]) => {
        if (!existingKeys.includes(key)) {
          const [category] = key.split('.');
          settingsToCreate.push({
            key,
            value,
            category
          });
        }
      });

      if (settingsToCreate.length > 0) {
        await prisma.systemSettings.createMany({
          data: settingsToCreate,
          skipDuplicates: true
        });
        console.log(`Created ${settingsToCreate.length} default settings`);
      }

      // Seed default email templates
      await this.seedDefaultEmailTemplates();

      // Clear cache after initialization
      this.clearCache();
      
      console.log('Default settings initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      await prisma.systemSettings.findFirst();
      console.log('Database connection test successful');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService();

module.exports = {
  settingsService,
  SettingsService
};