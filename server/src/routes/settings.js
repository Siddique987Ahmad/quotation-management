// const express = require('express');
// const { body } = require('express-validator');
// const { handleLogoUpload } = require('../middleware/upload');
// const { settingsService } = require('../services/settingsService');
// const { prisma } = require('../config/database');
// const {
//   getAllSettings,
//   updateCompanySettings,
//   updateEmailSettings,
//   updateTaxSettings,
//   updateInvoiceSettings,
//   updateNotificationSettings,
//   updateSecuritySettings,
//   uploadCompanyLogo,
//   deleteCompanyLogo
// } = require('../controllers/settingsController');
// const { renderDynamicTemplate } = require('../services/emailService');

// const { authenticateToken } = require('../middleware/auth');
// const { requireRole, requirePermission } = require('../middleware/permissions');
// const { handleValidationErrors } = require('../middleware/validation');
// const { ROLES, PERMISSIONS } = require('../config/constants');

// const router = express.Router();

// // Import role permission routes
// const rolePermissionRoutes = require('./rolePermissionRoutes');

// // All settings routes require authentication and admin permissions
// router.use(authenticateToken);
// router.use(requirePermission(PERMISSIONS.SETTINGS.READ));


// /**
//  * @route   GET /api/settings
//  * @desc    Get all system settings
//  * @access  Private (Admin only)
//  */
// router.get('/', getAllSettings);

// // GET company settings specifically
// router.get('/company', async (req, res, next) => {
//   try {
//     console.log('🏢 Getting company settings');
//     const companySettings = await settingsService.getCompanySettings();
    
//     res.status(200).json({
//       success: true,
//       message: 'Company settings retrieved successfully',
//       data: companySettings
//     });
//   } catch (error) {
//     console.error('🏢 Company settings get error:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/company
//  * @desc    Update company settings
//  * @access  Private (Admin only)
//  * @body    { name, address, city, state, zipCode, country, phone, email, website, taxId, logo }
//  */
// router.post('/company', 
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   handleLogoUpload, // Handle file upload first
//   [
//     body('name')
//       .trim()
//       .notEmpty()
//       .withMessage('Company name is required')
//       .isLength({ min: 2, max: 100 })
//       .withMessage('Company name must be between 2 and 100 characters'),
//     body('email')
//       .isEmail()
//       .withMessage('Valid email address is required')
//       .normalizeEmail(),
//     body('address')
//       .optional()
//       .trim()
//       .isLength({ max: 200 })
//       .withMessage('Address must not exceed 200 characters'),
//     body('city')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('City must not exceed 50 characters'),
//     body('state')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('State must not exceed 50 characters'),
//     body('zipCode')
//       .optional()
//       .trim()
//       .isLength({ max: 20 })
//       .withMessage('ZIP code must not exceed 20 characters'),
//     body('country')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('Country must not exceed 50 characters'),
//     body('phone')
//       .optional()
//       .trim()
//       .isMobilePhone('any', { strictMode: false })
//       .withMessage('Please provide a valid phone number'),
//     body('website')
//       .optional()
//       .trim()
//       .isURL({ require_protocol: true })
//       .withMessage('Please provide a valid website URL'),
//     body('taxId')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('Tax ID must not exceed 50 characters'),
//     handleValidationErrors
//   ], 
//   updateCompanySettings
// );

// // Dedicated logo upload endpoint
// router.post('/company/logo', requirePermission(PERMISSIONS.SETTINGS.UPDATE), handleLogoUpload, uploadCompanyLogo);

// // Delete logo endpoint
// router.delete('/company/logo', requirePermission(PERMISSIONS.SETTINGS.UPDATE), deleteCompanyLogo);

// /**
//  * @route   POST /api/settings/email
//  * @desc    Update email settings
//  * @access  Private (Admin only)
//  */
// router.post('/email', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('host')
//     .trim()
//     .notEmpty()
//     .withMessage('SMTP host is required')
//     .isLength({ min: 3, max: 100 })
//     .withMessage('Host must be between 3 and 100 characters'),
//   body('port')
//     .isInt({ min: 1, max: 65535 })
//     .withMessage('Port must be a valid number between 1 and 65535'),
//   body('secure')
//     .optional()
//     .isBoolean()
//     .withMessage('Secure must be true or false'),
//   body('username')
//     .trim()
//     .notEmpty()
//     .withMessage('Username is required')
//     .isLength({ min: 3, max: 100 })
//     .withMessage('Username must be between 3 and 100 characters'),
//   body('password')
//     .notEmpty()
//     .withMessage('Password is required')
//     .isLength({ min: 6, max: 100 })
//     .withMessage('Password must be between 6 and 100 characters'),
//   body('fromName')
//     .optional()
//     .trim()
//     .isLength({ max: 100 })
//     .withMessage('From name must not exceed 100 characters'),
//   body('fromEmail')
//     .optional()
//     .isEmail()
//     .withMessage('From email must be a valid email address')
//     .normalizeEmail(),
//   body('replyTo')
//     .optional()
//     .isEmail()
//     .withMessage('Reply-to must be a valid email address')
//     .normalizeEmail(),
//   handleValidationErrors
// ], updateEmailSettings);

// /**
//  * @route   POST /api/settings/tax
//  * @desc    Update tax settings
//  * @access  Private (Admin only)
//  */
// router.post('/tax', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('defaultGstRate')
//     .isFloat({ min: 0, max: 100 })
//     .withMessage('GST rate must be between 0 and 100'),
//   body('defaultPstRate')
//     .isFloat({ min: 0, max: 100 })
//     .withMessage('PST rate must be between 0 and 100'),
//   body('enableAutoTaxCalculation')
//     .optional()
//     .isBoolean()
//     .withMessage('Enable auto tax calculation must be true or false'),
//   body('taxExemptByDefault')
//     .optional()
//     .isBoolean()
//     .withMessage('Tax exempt by default must be true or false'),
//   body('requireTaxId')
//     .optional()
//     .isBoolean()
//     .withMessage('Require tax ID must be true or false'),
//   handleValidationErrors
// ], updateTaxSettings);

// /**
//  * @route   POST /api/settings/invoice
//  * @desc    Update invoice settings
//  * @access  Private (Admin only)
//  */
// router.post('/invoice', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('autoGenerateOnApproval')
//     .optional()
//     .isBoolean()
//     .withMessage('Auto generate on approval must be true or false'),
//   body('autoSendEmail')
//     .optional()
//     .isBoolean()
//     .withMessage('Auto send email must be true or false'),
//   body('defaultDueDays')
//     .optional()
//     .isInt({ min: 0, max: 365 })
//     .withMessage('Default due days must be between 0 and 365'),
//   body('defaultPaymentTerms')
//     .optional()
//     .trim()
//     .isLength({ max: 100 })
//     .withMessage('Payment terms must not exceed 100 characters'),
//   body('includeCompanyLogo')
//     .optional()
//     .isBoolean()
//     .withMessage('Include company logo must be true or false'),
//   body('footerText')
//     .optional()
//     .trim()
//     .isLength({ max: 500 })
//     .withMessage('Footer text must not exceed 500 characters'),
//   body('sequencePrefix')
//     .optional()
//     .trim()
//     .isLength({ max: 10 })
//     .withMessage('Sequence prefix must not exceed 10 characters')
//     .matches(/^[A-Z0-9-_]*$/)
//     .withMessage('Sequence prefix can only contain uppercase letters, numbers, hyphens, and underscores'),
//   body('startingNumber')
//     .optional()
//     .isInt({ min: 1, max: 999999 })
//     .withMessage('Starting number must be between 1 and 999999'),
//   handleValidationErrors
// ], updateInvoiceSettings);

// /**
//  * @route   POST /api/settings/notifications
//  * @desc    Update notification settings
//  * @access  Private (Admin only)
//  */
// router.post('/notifications', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('emailNotifications')
//     .optional()
//     .isBoolean()
//     .withMessage('Email notifications must be true or false'),
//   body('quotationApproved')
//     .optional()
//     .isBoolean()
//     .withMessage('Quotation approved must be true or false'),
//   body('invoiceGenerated')
//     .optional()
//     .isBoolean()
//     .withMessage('Invoice generated must be true or false'),
//   body('paymentReceived')
//     .optional()
//     .isBoolean()
//     .withMessage('Payment received must be true or false'),
//   body('overdueReminders')
//     .optional()
//     .isBoolean()
//     .withMessage('Overdue reminders must be true or false'),
//   body('reminderDays')
//     .optional()
//     .isArray()
//     .withMessage('Reminder days must be an array'),
//   body('reminderDays.*')
//     .optional()
//     .isInt({ min: 1, max: 365 })
//     .withMessage('Each reminder day must be between 1 and 365'),
//   handleValidationErrors
// ], updateNotificationSettings);

// /**
//  * @route   POST /api/settings/security
//  * @desc    Update security settings
//  * @access  Private (Admin only)
//  */
// router.post('/security', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('sessionTimeout')
//     .optional()
//     .isInt({ min: 5, max: 480 })
//     .withMessage('Session timeout must be between 5 and 480 minutes'),
//   body('passwordMinLength')
//     .optional()
//     .isInt({ min: 6, max: 50 })
//     .withMessage('Password minimum length must be between 6 and 50 characters'),
//   body('requireStrongPasswords')
//     .optional()
//     .isBoolean()
//     .withMessage('Require strong passwords must be true or false'),
//   body('enableTwoFactor')
//     .optional()
//     .isBoolean()
//     .withMessage('Enable two factor must be true or false'),
//   body('allowPasswordReset')
//     .optional()
//     .isBoolean()
//     .withMessage('Allow password reset must be true or false'),
//   body('maxLoginAttempts')
//     .optional()
//     .isInt({ min: 1, max: 20 })
//     .withMessage('Max login attempts must be between 1 and 20'),
//   handleValidationErrors
// ], updateSecuritySettings);

// // ==================== ENHANCED EMAIL TEMPLATE ROUTES ====================

// /**
//  * @route   GET /api/settings/email-templates
//  * @desc    Get all email templates (enhanced with full CRUD support)
//  * @access  Private (Admin+)
//  */
// router.get('/email-templates', [
//   requirePermission(PERMISSIONS.SETTINGS.READ)
// ], async (req, res, next) => {
//   try {
//     const templates = await settingsService.getEmailTemplates();
    
//     res.json({
//       success: true,
//       message: 'Email templates fetched successfully',
//       data: { 
//         templates,
//         count: Object.keys(templates).length 
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching email templates:', error);
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/settings/email-templates/:templateKey
//  * @desc    Get specific email template
//  * @access  Private (Admin+)
//  */
// router.get('/email-templates/:templateKey', [
//   requirePermission(PERMISSIONS.SETTINGS.READ)
// ], async (req, res, next) => {
//   try {
//     const { templateKey } = req.params;
//     const template = await settingsService.getEmailTemplate(templateKey);
    
//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: 'Template not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Template fetched successfully',
//       data: { template }
//     });
//   } catch (error) {
//     console.error(`Error fetching template ${req.params.templateKey}:`, error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates
//  * @desc    Create new email template
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates', [
//   requirePermission(PERMISSIONS.SETTINGS.CREATE),
//   body('templateKey')
//     .isString()
//     .notEmpty()
//     .matches(/^[a-zA-Z0-9_]+$/)
//     .withMessage('Template key can only contain letters, numbers, and underscores'),
//   body('name')
//     .isString()
//     .notEmpty()
//     .isLength({ min: 1, max: 100 })
//     .withMessage('Template name is required and must be 1-100 characters'),
//   body('description')
//     .optional()
//     .isString()
//     .isLength({ max: 500 })
//     .withMessage('Description must not exceed 500 characters'),
//   body('category')
//     .isIn(['QUOTATION', 'INVOICE', 'USER', 'NOTIFICATION', 'MARKETING', 'SYSTEM', 'CUSTOM'])
//     .withMessage('Invalid category'),
//   body('type')
//     .isIn(['QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_WELCOME', 'USER_PASSWORD_RESET', 'NOTIFICATION_SYSTEM', 'NOTIFICATION_REMINDER', 'CUSTOM'])
//     .withMessage('Invalid template type'),
//   body('subject')
//     .isString()
//     .notEmpty()
//     .isLength({ min: 1, max: 200 })
//     .withMessage('Subject is required and must be 1-200 characters'),
//   body('sections')
//     .optional()
//     .isObject()
//     .withMessage('Sections must be an object'),
//   body('variables')
//     .optional()
//     .isArray()
//     .withMessage('Variables must be an array'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateKey, name, description, category, type, subject, htmlContent, sections, variables, metadata } = req.body;
    
//     // Check if template key already exists
//     const existing = await settingsService.getEmailTemplate(templateKey);
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: 'Template with this key already exists'
//       });
//     }
    
//     const templateData = {
//       templateKey,
//       name,
//       description,
//       category,
//       type,
//       subject,
//       htmlContent,
//       sections: sections || {},
//       variables: variables || [],
//       metadata: metadata || {}
//     };
    
//     const template = await settingsService.createEmailTemplate(templateData, req.user.id);
    
//     res.status(201).json({
//       success: true,
//       message: 'Template created successfully',
//       data: { template }
//     });
//   } catch (error) {
//     console.error('Error creating email template:', error);
//     if (error.code === 'P2002') {
//       return res.status(400).json({
//         success: false,
//         message: 'Template key already exists'
//       });
//     }
//     next(error);
//   }
// });

// /**
//  * @route   PUT /api/settings/email-templates/:templateKey
//  * @desc    Update specific email template
//  * @access  Private (Admin+)
//  */
// router.put('/email-templates/:templateKey', [
//   requirePermission(PERMISSIONS.SETTINGS.READ),
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('name')
//     .optional()
//     .isString()
//     .isLength({ min: 1, max: 100 })
//     .withMessage('Template name must be 1-100 characters'),
//   body('description')
//     .optional()
//     .isString()
//     .isLength({ max: 500 })
//     .withMessage('Description must not exceed 500 characters'),
//   body('category')
//     .optional()
//     .isIn(['QUOTATION', 'INVOICE', 'USER', 'NOTIFICATION', 'MARKETING', 'SYSTEM', 'CUSTOM'])
//     .withMessage('Invalid category'),
//   body('type')
//     .optional()
//     .isIn(['QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_WELCOME', 'USER_PASSWORD_RESET', 'NOTIFICATION_SYSTEM', 'NOTIFICATION_REMINDER', 'CUSTOM'])
//     .withMessage('Invalid template type'),
//   body('subject')
//     .optional()
//     .isString()
//     .isLength({ min: 1, max: 200 })
//     .withMessage('Subject must be 1-200 characters'),
//   body('enabled')
//     .optional()
//     .isBoolean()
//     .withMessage('Enabled must be true or false'),
//   body('sections')
//     .optional()
//     .isObject()
//     .withMessage('Sections must be an object'),
//   body('variables')
//     .optional()
//     .isArray()
//     .withMessage('Variables must be an array'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateKey } = req.params;
    
//     // Check if template exists
//     const existing = await settingsService.getEmailTemplate(templateKey);
//     if (!existing) {
//       return res.status(404).json({
//         success: false,
//         message: 'Template not found'
//       });
//     }
    
//     // Prevent updating system templates' protected fields
//     if (existing.isSystem) {
//       const protectedFields = ['templateKey', 'isSystem', 'createdAt', 'createdBy'];
//       protectedFields.forEach(field => {
//         if (req.body.hasOwnProperty(field)) {
//           delete req.body[field];
//         }
//       });
//     }
    
//     const template = await settingsService.updateEmailTemplate(templateKey, req.body, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Template updated successfully',
//       data: { template }
//     });
//   } catch (error) {
//     console.error(`Error updating template ${req.params.templateKey}:`, error);
//     next(error);
//   }
// });

// /**
//  * @route   DELETE /api/settings/email-templates/:templateKey
//  * @desc    Delete specific email template
//  * @access  Private (Admin+)
//  */
// router.delete('/email-templates/:templateKey', [
//   requirePermission(PERMISSIONS.SETTINGS.DELETE)
// ], async (req, res, next) => {
//   try {
//     const { templateKey } = req.params;
    
//     await settingsService.deleteEmailTemplate(templateKey);
    
//     res.json({
//       success: true,
//       message: 'Template deleted successfully',
//       data: { deletedTemplate: templateKey }
//     });
//   } catch (error) {
//     console.error(`Error deleting template ${req.params.templateKey}:`, error);
//     if (error.message === 'Template not found') {
//       return res.status(404).json({
//         success: false,
//         message: 'Template not found'
//       });
//     }
//     if (error.message === 'Cannot delete system template') {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot delete system template'
//       });
//     }
//     next(error);
//   }
// });

// /**
//  * @route   DELETE /api/settings/email-templates/bulk
//  * @desc    Delete multiple email templates
//  * @access  Private (Admin+)
//  */
// router.delete('/email-templates/bulk', [
//   requirePermission(PERMISSIONS.SETTINGS.DELETE),
//   body('templateKeys')
//     .isArray({ min: 1 })
//     .withMessage('Template keys array is required'),
//   body('templateKeys.*')
//     .isString()
//     .notEmpty()
//     .withMessage('Each template key must be a non-empty string'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateKeys } = req.body;
    
//     const results = [];
//     const errors = [];
    
//     for (const templateKey of templateKeys) {
//       try {
//         await settingsService.deleteEmailTemplate(templateKey);
//         results.push(templateKey);
//       } catch (error) {
//         errors.push({
//           templateKey,
//           error: error.message
//         });
//       }
//     }
    
//     res.json({
//       success: true,
//       message: `Processed ${templateKeys.length} templates`,
//       data: {
//         deleted: results,
//         errors: errors.length > 0 ? errors : undefined,
//         deletedCount: results.length,
//         errorCount: errors.length
//       }
//     });
//   } catch (error) {
//     console.error('Error in bulk template deletion:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/:templateKey/duplicate
//  * @desc    Duplicate an existing email template
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates/:templateKey/duplicate', [
//   requirePermission(PERMISSIONS.SETTINGS.CREATE),
//   body('newTemplateKey')
//     .isString()
//     .notEmpty()
//     .matches(/^[a-zA-Z0-9_]+$/)
//     .withMessage('New template key can only contain letters, numbers, and underscores'),
//   body('newName')
//     .isString()
//     .notEmpty()
//     .isLength({ min: 1, max: 100 })
//     .withMessage('New template name is required and must be 1-100 characters'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateKey } = req.params;
//     const { newTemplateKey, newName } = req.body;
    
//     // Check if new template key already exists
//     const existing = await settingsService.getEmailTemplate(newTemplateKey);
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: 'Template with new key already exists'
//       });
//     }
    
//     const template = await settingsService.duplicateEmailTemplate(
//       templateKey, 
//       newTemplateKey, 
//       newName, 
//       req.user.id
//     );
    
//     res.status(201).json({
//       success: true,
//       message: 'Template duplicated successfully',
//       data: { template }
//     });
//   } catch (error) {
//     console.error(`Error duplicating template ${req.params.templateKey}:`, error);
//     if (error.message === 'Source template not found') {
//       return res.status(404).json({
//         success: false,
//         message: 'Source template not found'
//       });
//     }
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/:templateKey/restore
//  * @desc    Restore template to default settings
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates/:templateKey/restore', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE)
// ], async (req, res, next) => {
//   try {
//     const { templateKey } = req.params;
    
//     const template = await settingsService.restoreEmailTemplate(templateKey, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Template restored to default settings',
//       data: { template }
//     });
//   } catch (error) {
//     console.error(`Error restoring template ${req.params.templateKey}:`, error);
//     if (error.message === 'Template not found') {
//       return res.status(404).json({
//         success: false,
//         message: 'Template not found'
//       });
//     }
//     if (error.message === 'No default configuration available for this template') {
//       return res.status(400).json({
//         success: false,
//         message: 'No default configuration available for this template'
//       });
//     }
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/settings/email-templates/types
//  * @desc    Get available template types and their configurations
//  * @access  Private (Admin+)
//  */
// router.get('/email-templates/types', [
//   requirePermission(PERMISSIONS.SETTINGS.READ)
// ], async (req, res, next) => {
//   try {
//     const templateTypes = settingsService.getTemplateTypes();
    
//     res.json({
//       success: true,
//       message: 'Template types fetched successfully',
//       data: { templateTypes }
//     });
//   } catch (error) {
//     console.error('Error fetching template types:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/validate
//  * @desc    Validate email template structure
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates/validate', [
//   requirePermission(PERMISSIONS.SETTINGS.READ),
//   body('template').isObject().withMessage('Template must be an object'),
//   body('templateKey').optional().isString().withMessage('Template key must be a string'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { template, templateKey } = req.body;
//     const errors = [];
//     const warnings = [];
    
//     // Basic validation
//     if (!template.subject || template.subject.trim() === '') {
//       errors.push('Subject line is required');
//     }
    
//     if (!template.sections || Object.keys(template.sections).length === 0) {
//       warnings.push('No sections configured - template may appear empty');
//     }
    
//     // Validate sections
//     if (template.sections) {
//       Object.entries(template.sections).forEach(([sectionKey, section]) => {
//         if (section.enabled) {
//           if (sectionKey === 'header' && (!section.title || section.title.trim() === '')) {
//             errors.push('Header section requires a title when enabled');
//           }
//         }
//       });
//     }
    
//     // Variable validation
//     if (template.variables && Array.isArray(template.variables)) {
//       const subjectVariables = extractVariablesFromText(template.subject || '');
//       const requiredVars = template.variables.filter(v => v.required !== false);
//       const missingVars = requiredVars.filter(v => !subjectVariables.includes(v.name || v));
      
//       if (missingVars.length > 0) {
//         warnings.push(`Consider including required variables in subject: ${missingVars.map(v => v.name || v).join(', ')}`);
//       }
//     }
    
//     // Check for duplicate template key (if provided)
//     if (templateKey) {
//       const existing = await settingsService.getEmailTemplate(templateKey);
//       if (existing) {
//         errors.push('Template key already exists');
//       }
//     }
    
//     res.json({
//       success: true,
//       data: {
//         isValid: errors.length === 0,
//         errors,
//         warnings,
//         variablesFound: extractVariablesFromText(template.subject || ''),
//         sectionsCount: template.sections ? Object.keys(template.sections).length : 0
//       }
//     });
//   } catch (error) {
//     console.error('Error validating template:', error);
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/settings/email-templates/preview-data/:type
//  * @desc    Get available records for email template preview
//  * @access  Private (Admin+)
//  */
// router.get('/email-templates/preview-data/:type', [
//   requirePermission(PERMISSIONS.SETTINGS.READ)
// ], async (req, res, next) => {
//   try {
//     const { type } = req.params;
//     let data = [];
    
//     switch (type) {
//       case 'quotations':
//         data = await prisma.quotation.findMany({
//           select: {
//             id: true,
//             quotationNumber: true,
//             title: true,
//             status: true,
//             totalAmount: true,
//             createdAt: true,
//             client: {
//               select: {
//                 companyName: true,
//                 contactPerson: true
//               }
//             }
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 10
//         });
//         break;
        
//       case 'invoices':
//         data = await prisma.invoice.findMany({
//           select: {
//             id: true,
//             invoiceNumber: true,
//             type: true,
//             status: true,
//             totalAmount: true,
//             createdAt: true,
//             client: {
//               select: {
//                 companyName: true,
//                 contactPerson: true
//               }
//             }
//           },
//           orderBy: { createdAt: 'desc' },
//           take: 10
//         });
//         break;
        
//       case 'users':
//         data = await prisma.user.findMany({
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             role: true,
//             createdAt: true
//           },
//           where: { isActive: true },
//           orderBy: { createdAt: 'desc' },
//           take: 10
//         });
//         break;
        
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid type. Use: quotations, invoices, or users'
//         });
//     }
    
//     res.json({
//       success: true,
//       message: `${type} data fetched successfully`,
//       data: { 
//         records: data,
//         count: data.length,
//         type 
//       }
//     });
//   } catch (error) {
//     console.error(`Error fetching preview data for ${req.params.type}:`, error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/preview
//  * @desc    Preview email template with real database data
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates/preview', [
//   requirePermission(PERMISSIONS.SETTINGS.READ),
//   body('templateName').notEmpty().withMessage('Template name is required'),
//   body('template').isObject().withMessage('Template must be an object'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateName, template } = req.body;
    
//     let previewData = null;
    
//     // Get real data from database based on template type
//     switch (templateName) {
//       case 'quotation_approved':
//       case 'quotation_sent':
//         previewData = await getLatestQuotationForPreview();
//         break;
//       case 'invoice_sent':
//         previewData = await getLatestInvoiceForPreview();
//         break;
//       case 'user_created':
//         previewData = await getLatestUserForPreview();
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'Unknown template type'
//         });
//     }
    
//     if (!previewData) {
//       return res.status(404).json({
//         success: false,
//         message: `No ${templateName.split('_')[0]} data available for preview. Please create some data first.`
//       });
//     }
    
//     const companySettings = await settingsService.getCompanySettings();
//     const emailTemplate = renderDynamicTemplate(template, previewData, companySettings);
    
//     res.json({
//       success: true,
//       message: 'Template preview generated successfully',
//       data: { 
//         preview: emailTemplate,
//         sampleData: previewData,
//         templateName,
//         previewGeneratedAt: new Date().toISOString()
//       }
//     });
//   } catch (error) {
//     console.error('Email template preview error:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/preview/:recordId
//  * @desc    Preview email template with specific record
//  * @access  Private (Admin+)
//  */
// router.post('/email-templates/preview/:recordId', [
//   requirePermission(PERMISSIONS.SETTINGS.READ),
//   body('templateName').notEmpty().withMessage('Template name is required'),
//   body('template').isObject().withMessage('Template must be an object'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { recordId } = req.params;
//     const { templateName, template } = req.body;
    
//     let previewData = null;
    
//     // Get specific record data based on template type
//     switch (templateName) {
//       case 'quotation_approved':
//       case 'quotation_sent':
//         previewData = await getSpecificQuotationForPreview(recordId);
//         break;
//       case 'invoice_sent':
//         previewData = await getSpecificInvoiceForPreview(recordId);
//         break;
//       case 'user_created':
//         previewData = await getSpecificUserForPreview(recordId);
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'Unknown template type'
//         });
//     }
    
//     if (!previewData) {
//       return res.status(404).json({
//         success: false,
//         message: 'Record not found for preview'
//       });
//     }
    
//     const companySettings = await settingsService.getCompanySettings();
//     const emailTemplate = renderDynamicTemplate(template, previewData, companySettings);
    
//     res.json({
//       success: true,
//       message: 'Template preview generated successfully',
//       data: { 
//         preview: emailTemplate,
//         recordData: previewData,
//         recordId,
//         templateName
//       }
//     });
//   } catch (error) {
//     console.error('Email template preview with record error:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/email-templates/migrate
//  * @desc    Migrate email templates from JSON to database
//  * @access  Private (Super Admin only)
//  */
// router.post('/email-templates/migrate', [
//   requireRole(ROLES.SUPER_ADMIN)
// ], async (req, res, next) => {
//   try {
//     const result = await settingsService.migrateEmailTemplatesToTable();
    
//     res.json({
//       success: true,
//       message: 'Email template migration completed',
//       data: result
//     });
//   } catch (error) {
//     console.error('Email template migration error:', error);
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/settings/test-email
//  * @desc    Test email configuration
//  * @access  Private (Admin only)
//  */
// router.post('/test-email', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('testEmail').isEmail().withMessage('Valid test email is required'),
//   body('templateKey').optional().isString().withMessage('Template key must be a string'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { testEmail, templateKey } = req.body;
//     const { sendTestEmail } = require('../services/emailService');
    
//     let result;
//     if (templateKey) {
//       // Test with specific template
//       const template = await settingsService.getEmailTemplate(templateKey);
//       if (!template) {
//         return res.status(404).json({
//           success: false,
//           message: 'Template not found'
//         });
//       }
      
//       // Use the template service to send test email
//       result = await sendTestEmail(testEmail, template);
//     } else {
//       // Basic email test
//       result = await sendTestEmail(testEmail);
//     }
    
//     res.json({
//       success: true,
//       message: 'Test email sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Test email error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send test email',
//       error: error.message
//     });
//   }
// });

// // ==================== LEGACY EMAIL TEMPLATE ROUTES (for backward compatibility) ====================

// /**
//  * @route   PUT /api/settings/email-templates
//  * @desc    Update email templates (legacy bulk update)
//  * @access  Private (Admin+)
//  */
// router.put('/email-templates', [
//   requirePermission(PERMISSIONS.SETTINGS.UPDATE),
//   body('templates').isObject().withMessage('Templates must be an object'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templates } = req.body;
    
//     // For backward compatibility, update using legacy method
//     await settingsService.updateEmailTemplateSettingsLegacy(templates);
    
//     res.json({
//       success: true,
//       message: 'Email templates updated successfully (legacy mode)',
//       data: { templates }
//     });
//   } catch (error) {
//     console.error('Error updating email templates (legacy):', error);
//     next(error);
//   }
// });

// // ==================== HELPER FUNCTIONS FOR EMAIL TEMPLATES ====================

// // Helper functions to get real data for email previews
// const getLatestQuotationForPreview = async () => {
//   try {
//     const quotation = await prisma.quotation.findFirst({
//       include: {
//         client: {
//           select: {
//             companyName: true,
//             contactPerson: true,
//             email: true
//           }
//         },
//         user: {
//           select: {
//             firstName: true,
//             lastName: true
//           }
//         }
//       },
//       orderBy: { createdAt: 'desc' }
//     });
    
//     if (!quotation) return null;
    
//     return formatQuotationDataForEmail(quotation);
//   } catch (error) {
//     console.error('Error getting quotation for preview:', error);
//     return null;
//   }
// };

// const getSpecificQuotationForPreview = async (id) => {
//   try {
//     const quotation = await prisma.quotation.findUnique({
//       where: { id },
//       include: {
//         client: {
//           select: {
//             companyName: true,
//             contactPerson: true,
//             email: true
//           }
//         },
//         user: {
//           select: {
//             firstName: true,
//             lastName: true
//           }
//         }
//       }
//     });
    
//     if (!quotation) return null;
    
//     return formatQuotationDataForEmail(quotation);
//   } catch (error) {
//     console.error('Error getting specific quotation for preview:', error);
//     return null;
//   }
// };

// const getLatestInvoiceForPreview = async () => {
//   try {
//     const invoice = await prisma.invoice.findFirst({
//       include: {
//         client: {
//           select: {
//             companyName: true,
//             contactPerson: true,
//             email: true
//           }
//         },
//         quotation: {
//           select: {
//             quotationNumber: true,
//             title: true
//           }
//         },
//         user: {
//           select: {
//             firstName: true,
//             lastName: true
//           }
//         }
//       },
//       orderBy: { createdAt: 'desc' }
//     });
    
//     if (!invoice) return null;
    
//     return formatInvoiceDataForEmail(invoice);
//   } catch (error) {
//     console.error('Error getting invoice for preview:', error);
//     return null;
//   }
// };

// const getSpecificInvoiceForPreview = async (id) => {
//   try {
//     const invoice = await prisma.invoice.findUnique({
//       where: { id },
//       include: {
//         client: {
//           select: {
//             companyName: true,
//             contactPerson: true,
//             email: true
//           }
//         },
//         quotation: {
//           select: {
//             quotationNumber: true,
//             title: true
//           }
//         },
//         user: {
//           select: {
//             firstName: true,
//             lastName: true
//           }
//         }
//       }
//     });
    
//     if (!invoice) return null;
    
//     return formatInvoiceDataForEmail(invoice);
//   } catch (error) {
//     console.error('Error getting specific invoice for preview:', error);
//     return null;
//   }
// };

// const getLatestUserForPreview = async () => {
//   try {
//     const user = await prisma.user.findFirst({
//       where: { isActive: true },
//       orderBy: { createdAt: 'desc' }
//     });
    
//     if (!user) return null;
    
//     return formatUserDataForEmail(user);
//   } catch (error) {
//     console.error('Error getting user for preview:', error);
//     return null;
//   }
// };

// const getSpecificUserForPreview = async (id) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id }
//     });
    
//     if (!user) return null;
    
//     return formatUserDataForEmail(user);
//   } catch (error) {
//     console.error('Error getting specific user for preview:', error);
//     return null;
//   }
// };

// // Data formatting functions
// const formatQuotationDataForEmail = (quotation) => {
//   // Helper to get clean client name (avoid phone numbers)
//   const getClientName = (clientData) => {
//     const isPhoneNumber = (str) => {
//       if (!str) return false;
//       const cleaned = str.replace(/[\s\-\(\)\+]/g, '');
//       return /^\d{8,}$/.test(cleaned);
//     };

//     if (clientData.contactPerson && !isPhoneNumber(clientData.contactPerson)) {
//       return clientData.contactPerson.trim();
//     }
    
//     return clientData.companyName || 'Valued Client';
//   };

//   return {
//     clientName: getClientName(quotation.client),
//     clientCompany: quotation.client.companyName,
//     quotationNumber: quotation.quotationNumber,
//     quotationTitle: quotation.title,
//     description: quotation.description,
//     subtotal: formatCurrency(quotation.subtotal),
//     gstPercentage: quotation.gstPercentage?.toString() || '0',
//     gstAmount: formatCurrency(quotation.gstAmount || 0),
//     pstPercentage: quotation.pstPercentage?.toString() || '0', 
//     pstAmount: formatCurrency(quotation.pstAmount || 0),
//     totalTaxAmount: formatCurrency(quotation.combinedTaxAmount || 0),
//     totalAmount: formatCurrency(quotation.totalAmount),
//     validUntil: quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : null,
//     notes: quotation.notes,
//     taxationType: determineTaxationType(quotation),
//     // Dynamic fields from formData
//     dynamicFields: quotation.formData ? Object.entries(quotation.formData)
//       .filter(([key, value]) => !['createdAt', 'updatedAt', 'id', 'clientId', 'userId'].includes(key) && 
//                                 value !== null && value !== undefined && value !== '')
//       .map(([key, value]) => ({
//         label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
//         value: value
//       })) : []
//   };
// };

// const formatInvoiceDataForEmail = (invoice) => {
//   return {
//     clientName: invoice.client.contactPerson || invoice.client.companyName,
//     clientCompany: invoice.client.companyName,
//     invoiceNumber: invoice.invoiceNumber,
//     invoiceType: invoice.type.replace(/_/g, ' '),
//     subtotal: formatCurrency(invoice.subtotal),
//     gstPercentage: invoice.gstPercentage?.toString() || '0',
//     gstAmount: formatCurrency(invoice.gstAmount || 0),
//     pstPercentage: invoice.pstPercentage?.toString() || '0',
//     pstAmount: formatCurrency(invoice.pstAmount || 0),
//     totalTaxAmount: formatCurrency(invoice.combinedTaxAmount || 0),
//     totalAmount: formatCurrency(invoice.totalAmount),
//     dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified',
//     paidDate: invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : null,
//     quotationTitle: invoice.quotation?.title || 'N/A',
//     quotationNumber: invoice.quotation?.quotationNumber || 'N/A',
//     status: invoice.status,
//     isOverdue: invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
//   };
// };

// const formatUserDataForEmail = (user) => {
//   return {
//     firstName: user.firstName,
//     lastName: user.lastName,
//     email: user.email,
//     role: user.role.replace(/_/g, ' '),
//     createdDate: new Date(user.createdAt).toLocaleDateString()
//   };
// };

// // Helper functions
// const formatCurrency = (amount) => {
//   if (amount === null || amount === undefined) return '$0.00';
  
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     minimumFractionDigits: 2,
//   }).format(numAmount);
// };

// const determineTaxationType = (quotation) => {
//   const gstAmount = parseFloat(quotation.gstAmount || 0);
//   const pstAmount = parseFloat(quotation.pstAmount || 0);
  
//   if (gstAmount > 0 && pstAmount > 0) return 'both';
//   if (gstAmount > 0) return 'gst';
//   if (pstAmount > 0) return 'pst';
//   return 'none';
// };

// const extractVariablesFromText = (text) => {
//   const regex = /\{\{(\w+)\}\}/g;
//   const variables = [];
//   let match;
  
//   while ((match = regex.exec(text)) !== null) {
//     variables.push(match[1]);
//   }
  
//   return [...new Set(variables)]; // Remove duplicates
// };

// // Mount role permission routes
// router.use('/role-permissions', rolePermissionRoutes);

// module.exports = router;


const express = require('express');
const { body } = require('express-validator');
const { handleLogoUpload } = require('../middleware/upload');
const { settingsService } = require('../services/settingsService');
const {
  getAllSettings,
  updateCompanySettings,
  updateEmailSettings,
  updateTaxSettings,
  updateInvoiceSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  uploadCompanyLogo,
  deleteCompanyLogo
} = require('../controllers/settingsController');

const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { ROLES, PERMISSIONS } = require('../config/constants');

const router = express.Router();

// Import role permission routes
const rolePermissionRoutes = require('./rolePermissionRoutes');
const emailTemplateRoutes = require('./emailTemplateRoutes');

/**
 * @route   GET /api/settings/company
 * @desc    Get company settings
 * @access  Private (Admin only)
 */
router.get('/company', async (req, res, next) => {
  try {
    console.log('🏢 Getting company settings');
    const companySettings = await settingsService.getCompanySettings();
    
    res.status(200).json({
      success: true,
      message: 'Company settings retrieved successfully',
      data: companySettings
    });
  } catch (error) {
    console.error('🏢 Company settings get error:', error);
    next(error);
  }
});

// All settings routes require authentication and admin permissions
router.use(authenticateToken);
router.use(requirePermission(PERMISSIONS.SETTINGS.READ));

/**
 * @route   GET /api/settings
 * @desc    Get all system settings
 * @access  Private (Admin only)
 */
router.get('/', getAllSettings);


/**
 * @route   POST /api/settings/company
 * @desc    Update company settings
 * @access  Private (Admin only)
 */
router.post('/company', 
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  handleLogoUpload,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email address is required')
      .normalizeEmail(),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City must not exceed 50 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('State must not exceed 50 characters'),
    body('zipCode')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('ZIP code must not exceed 20 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Country must not exceed 50 characters'),
    body('phone')
      .optional()
      .trim()
      .isMobilePhone('any', { strictMode: false })
      .withMessage('Please provide a valid phone number'),
    body('website')
      .optional()
      .trim()
      .isURL({ require_protocol: true })
      .withMessage('Please provide a valid website URL'),
    body('taxId')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tax ID must not exceed 50 characters'),
    handleValidationErrors
  ], 
  updateCompanySettings
);

/**
 * @route   POST /api/settings/company/logo
 * @desc    Upload company logo
 * @access  Private (Admin only)
 */
router.post('/company/logo', 
  requirePermission(PERMISSIONS.SETTINGS.UPDATE), 
  handleLogoUpload, 
  uploadCompanyLogo
);

/**
 * @route   DELETE /api/settings/company/logo
 * @desc    Delete company logo
 * @access  Private (Admin only)
 */
router.delete('/company/logo', 
  requirePermission(PERMISSIONS.SETTINGS.UPDATE), 
  deleteCompanyLogo
);

/**
 * @route   POST /api/settings/email
 * @desc    Update email settings
 * @access  Private (Admin only)
 */
router.post('/email', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('host')
    .trim()
    .notEmpty()
    .withMessage('SMTP host is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Host must be between 3 and 100 characters'),
  body('port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be a valid number between 1 and 65535'),
  body('secure')
    .optional()
    .isBoolean()
    .withMessage('Secure must be true or false'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('fromName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('From name must not exceed 100 characters'),
  body('fromEmail')
    .optional()
    .isEmail()
    .withMessage('From email must be a valid email address')
    .normalizeEmail(),
  body('replyTo')
    .optional()
    .isEmail()
    .withMessage('Reply-to must be a valid email address')
    .normalizeEmail(),
  handleValidationErrors
], updateEmailSettings);

/**
 * @route   POST /api/settings/tax
 * @desc    Update tax settings
 * @access  Private (Admin only)
 */
router.post('/tax', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('defaultGstRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('defaultPstRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('PST rate must be between 0 and 100'),
  body('enableAutoTaxCalculation')
    .optional()
    .isBoolean()
    .withMessage('Enable auto tax calculation must be true or false'),
  body('taxExemptByDefault')
    .optional()
    .isBoolean()
    .withMessage('Tax exempt by default must be true or false'),
  body('requireTaxId')
    .optional()
    .isBoolean()
    .withMessage('Require tax ID must be true or false'),
  handleValidationErrors
], updateTaxSettings);

/**
 * @route   POST /api/settings/invoice
 * @desc    Update invoice settings
 * @access  Private (Admin only)
 */
router.post('/invoice', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('autoGenerateOnApproval')
    .optional()
    .isBoolean()
    .withMessage('Auto generate on approval must be true or false'),
  body('autoSendEmail')
    .optional()
    .isBoolean()
    .withMessage('Auto send email must be true or false'),
  body('defaultDueDays')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Default due days must be between 0 and 365'),
  body('defaultPaymentTerms')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Payment terms must not exceed 100 characters'),
  body('includeCompanyLogo')
    .optional()
    .isBoolean()
    .withMessage('Include company logo must be true or false'),
  body('footerText')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Footer text must not exceed 500 characters'),
  body('sequencePrefix')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Sequence prefix must not exceed 10 characters')
    .matches(/^[A-Z0-9-_]*$/)
    .withMessage('Sequence prefix can only contain uppercase letters, numbers, hyphens, and underscores'),
  body('startingNumber')
    .optional()
    .isInt({ min: 1, max: 999999 })
    .withMessage('Starting number must be between 1 and 999999'),
  handleValidationErrors
], updateInvoiceSettings);

/**
 * @route   POST /api/settings/notifications
 * @desc    Update notification settings
 * @access  Private (Admin only)
 */
router.post('/notifications', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be true or false'),
  body('quotationApproved')
    .optional()
    .isBoolean()
    .withMessage('Quotation approved must be true or false'),
  body('invoiceGenerated')
    .optional()
    .isBoolean()
    .withMessage('Invoice generated must be true or false'),
  body('paymentReceived')
    .optional()
    .isBoolean()
    .withMessage('Payment received must be true or false'),
  body('overdueReminders')
    .optional()
    .isBoolean()
    .withMessage('Overdue reminders must be true or false'),
  body('reminderDays')
    .optional()
    .isArray()
    .withMessage('Reminder days must be an array'),
  body('reminderDays.*')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Each reminder day must be between 1 and 365'),
  handleValidationErrors
], updateNotificationSettings);

/**
 * @route   POST /api/settings/security
 * @desc    Update security settings
 * @access  Private (Admin only)
 */
router.post('/security', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('sessionTimeout')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Session timeout must be between 5 and 480 minutes'),
  body('passwordMinLength')
    .optional()
    .isInt({ min: 6, max: 50 })
    .withMessage('Password minimum length must be between 6 and 50 characters'),
  body('requireStrongPasswords')
    .optional()
    .isBoolean()
    .withMessage('Require strong passwords must be true or false'),
  body('enableTwoFactor')
    .optional()
    .isBoolean()
    .withMessage('Enable two factor must be true or false'),
  body('allowPasswordReset')
    .optional()
    .isBoolean()
    .withMessage('Allow password reset must be true or false'),
  body('maxLoginAttempts')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max login attempts must be between 1 and 20'),
  handleValidationErrors
], updateSecuritySettings);

/**
 * @route   POST /api/settings/test-email
 * @desc    Test email configuration
 * @access  Private (Admin only)
 */
router.post('/test-email', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('testEmail').isEmail().withMessage('Valid test email is required'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { testEmail } = req.body;
    const { sendTestEmail } = require('../services/emailService');
    
    const result = await sendTestEmail(testEmail);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Mount sub-routes
router.use('/role-permissions', rolePermissionRoutes);
router.use('/email-templates', emailTemplateRoutes);

module.exports = router;