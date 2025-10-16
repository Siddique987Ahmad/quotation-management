const express = require('express');
const { body } = require('express-validator');
const { settingsService } = require('../services/settingsService');
const { prisma } = require('../config/database');

const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { ROLES, PERMISSIONS } = require('../config/constants');

const router = express.Router();

// All email template routes require authentication and admin permissions
router.use(authenticateToken);
router.use(requirePermission(PERMISSIONS.SETTINGS.READ));

// ==================== EMAIL TEMPLATE CRUD ROUTES ====================

/**
 * @route   GET /api/settings/email-templates
 * @desc    Get all email templates
 * @access  Private (Admin+)
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await settingsService.getEmailTemplates();
    
    res.json({
      success: true,
      message: 'Email templates fetched successfully',
      data: { 
        templates,
        count: templates.length 
      }
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    next(error);
  }
});

/**
 * @route   GET /api/settings/email-templates/:templateKey
 * @desc    Get specific email template
 * @access  Private (Admin+)
 */
router.get('/:templateKey', async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    const template = await settingsService.getEmailTemplate(templateKey);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Template fetched successfully',
      data: { template }
    });
  } catch (error) {
    console.error(`Error fetching template ${req.params.templateKey}:`, error);
    next(error);
  }
});

/**
 * @route   POST /api/settings/email-templates
 * @desc    Create new email template
 * @access  Private (Admin+)
 */
router.post('/', [
  requirePermission(PERMISSIONS.SETTINGS.CREATE),
  body('templateKey')
    .isString()
    .notEmpty()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Template key can only contain letters, numbers, and underscores'),
  body('name')
    .isString()
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name is required and must be 1-100 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .isIn(['QUOTATION', 'INVOICE', 'USER', 'NOTIFICATION', 'MARKETING', 'SYSTEM', 'CUSTOM'])
    .withMessage('Invalid category'),
  body('type')
    .isIn(['QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_APPROVED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_WELCOME', 'USER_PASSWORD_RESET', 'NOTIFICATION_SYSTEM', 'NOTIFICATION_REMINDER', 'CUSTOM'])
    .withMessage('Invalid template type'),
  body('subject')
    .isString()
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be 1-200 characters'),
  body('htmlContent')
    .isString()
    .notEmpty()
    .withMessage('HTML content is required'),
  body('textContent')
    .optional()
    .isString()
    .withMessage('Text content must be a string'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKey, name, description, category, type, subject, htmlContent, textContent, variables, metadata } = req.body;
    
    // Check if template key already exists
    const existing = await settingsService.getEmailTemplate(templateKey);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Template with this key already exists'
      });
    }
    
    const templateData = {
      templateKey,
      name,
      description,
      category,
      type,
      subject,
      htmlContent,
      textContent,
      variables: variables || [],
      metadata: metadata || {}
    };
    
    const template = await settingsService.createEmailTemplate(templateData, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Template key already exists'
      });
    }
    next(error);
  }
});

/**
 * @route   PUT /api/settings/email-templates/:templateKey
 * @desc    Update specific email template
 * @access  Private (Admin+)
 */
router.put('/:templateKey', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be 1-100 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['QUOTATION', 'INVOICE', 'USER', 'NOTIFICATION', 'MARKETING', 'SYSTEM', 'CUSTOM'])
    .withMessage('Invalid category'),
  body('type')
    .optional()
    .isIn(['QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_WELCOME', 'USER_PASSWORD_RESET', 'NOTIFICATION_SYSTEM', 'NOTIFICATION_REMINDER', 'CUSTOM'])
    .withMessage('Invalid template type'),
  body('subject')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be 1-200 characters'),
  body('htmlContent')
    .optional()
    .isString()
    .withMessage('HTML content must be a string'),
  body('textContent')
    .optional()
    .isString()
    .withMessage('Text content must be a string'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be true or false'),
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    
    // Check if template exists
    const existing = await settingsService.getEmailTemplate(templateKey);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Prevent updating system templates' protected fields
    if (existing.isSystem) {
      const protectedFields = ['templateKey', 'isSystem', 'createdAt', 'createdBy'];
      protectedFields.forEach(field => {
        if (req.body.hasOwnProperty(field)) {
          delete req.body[field];
        }
      });
    }
    
    const template = await settingsService.updateEmailTemplate(templateKey, req.body, req.user.id);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    console.error(`Error updating template ${req.params.templateKey}:`, error);
    next(error);
  }
});

/**
 * @route   DELETE /api/settings/email-templates/:templateKey
 * @desc    Delete specific email template
 * @access  Private (Admin+)
 */
router.delete('/:templateKey', [
  requirePermission(PERMISSIONS.SETTINGS.DELETE)
], async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    
    await settingsService.deleteEmailTemplate(templateKey);
    
    res.json({
      success: true,
      message: 'Template deleted successfully',
      data: { deletedTemplate: templateKey }
    });
  } catch (error) {
    console.error(`Error deleting template ${req.params.templateKey}:`, error);
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    if (error.message === 'Cannot delete system template') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system template'
      });
    }
    next(error);
  }
});

/**
 * @route   POST /api/settings/email-templates/bulk-delete
 * @desc    Delete multiple email templates
 * @access  Private (Admin+)
 */
router.post('/bulk-delete', [
  requirePermission(PERMISSIONS.SETTINGS.DELETE),
  body('templateKeys')
    .isArray({ min: 1 })
    .withMessage('Template keys array is required'),
  body('templateKeys.*')
    .isString()
    .notEmpty()
    .withMessage('Each template key must be a non-empty string'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKeys } = req.body;
    
    const results = [];
    const errors = [];
    
    for (const templateKey of templateKeys) {
      try {
        await settingsService.deleteEmailTemplate(templateKey);
        results.push(templateKey);
      } catch (error) {
        errors.push({
          templateKey,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${templateKeys.length} templates`,
      data: {
        deleted: results,
        errors: errors.length > 0 ? errors : undefined,
        deletedCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('Error in bulk template deletion:', error);
    next(error);
  }
});

/**
 * @route   POST /api/settings/email-templates/:templateKey/duplicate
 * @desc    Duplicate an existing email template
 * @access  Private (Admin+)
 */
router.post('/:templateKey/duplicate', [
  requirePermission(PERMISSIONS.SETTINGS.CREATE),
  body('newTemplateKey')
    .isString()
    .notEmpty()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('New template key can only contain letters, numbers, and underscores'),
  body('newName')
    .isString()
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('New template name is required and must be 1-100 characters'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    const { newTemplateKey, newName } = req.body;
    
    // Check if new template key already exists
    const existing = await settingsService.getEmailTemplate(newTemplateKey);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Template with new key already exists'
      });
    }
    
    const template = await settingsService.duplicateEmailTemplate(
      templateKey, 
      newTemplateKey, 
      newName, 
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: { template }
    });
  } catch (error) {
    console.error(`Error duplicating template ${req.params.templateKey}:`, error);
    if (error.message === 'Source template not found') {
      return res.status(404).json({
        success: false,
        message: 'Source template not found'
      });
    }
    next(error);
  }
});

/**
 * @route   POST /api/settings/email-templates/:templateKey/toggle
 * @desc    Toggle template enabled/disabled
 * @access  Private (Admin+)
 */
router.post('/:templateKey/toggle', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE)
], async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    
    const existing = await settingsService.getEmailTemplate(templateKey);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const template = await settingsService.updateEmailTemplate(
      templateKey, 
      { enabled: !existing.enabled }, 
      req.user.id
    );
    
    res.json({
      success: true,
      message: `Template ${template.enabled ? 'enabled' : 'disabled'} successfully`,
      data: { template }
    });
  } catch (error) {
    console.error(`Error toggling template ${req.params.templateKey}:`, error);
    next(error);
  }
});

// ==================== EMAIL TEMPLATE UTILITY ROUTES ====================

/**
 * @route   POST /api/settings/email-templates/seed-defaults
 * @desc    Seed default email templates
 * @access  Private (Super Admin only)
 */
router.post('/seed-defaults', [
  requireRole(ROLES.SUPER_ADMIN)
], async (req, res, next) => {
  try {
    const result = await settingsService.seedDefaultEmailTemplates(req.user.id);
    
    res.json({
      success: true,
      message: 'Default templates seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error seeding default templates:', error);
    next(error);
  }
});

/**
 * @route   GET /api/settings/email-templates/variables/:templateKey
 * @desc    Get available variables for a template type
 * @access  Private (Admin+)
 */
router.get('/variables/:templateKey', async (req, res, next) => {
  try {
    const { templateKey } = req.params;
    
    // Define available variables for each template type
    const templateVariables = {
      'quotation_approved': [
        'clientName', 'clientCompany', 'quotationNumber', 'quotationTitle', 
        'description', 'subtotal', 'gstPercentage', 'gstAmount', 
        'pstPercentage', 'pstAmount', 'totalTaxAmount', 'totalAmount',
        'validUntil', 'notes', 'approvedDate', 'companyName', 'currentYear', 'currentDate'
      ],
      'quotation_sent': [
        'clientName', 'clientCompany', 'quotationNumber', 'quotationTitle', 
        'description', 'totalAmount', 'validUntil', 'notes', 'sentDate',
        'companyName', 'currentYear', 'currentDate'
      ],
      'invoice_sent': [
        'clientName', 'clientCompany', 'invoiceNumber', 'invoiceType', 
        'subtotal', 'gstPercentage', 'gstAmount', 'pstPercentage', 'pstAmount',
        'totalAmount', 'dueDate', 'quotationTitle', 'quotationNumber',
        'companyName', 'currentYear', 'currentDate'
      ],
      'user_welcome': [
        'firstName', 'lastName', 'fullName', 'email', 'role', 'createdDate',
        'companyName', 'currentYear', 'currentDate'
      ],
      'password_reset': [
        'firstName', 'resetUrl', 'resetToken', 'companyName', 'currentYear', 'currentDate'
      ],
      'test_email': [
        'firstName', 'testMessage', 'sentDate', 'companyName', 'currentYear', 'currentDate'
      ]
    };
    
    const variables = templateVariables[templateKey] || [];
    
    res.json({
      success: true,
      message: 'Template variables fetched successfully',
      data: { 
        templateKey,
        variables,
        count: variables.length
      }
    });
  } catch (error) {
    console.error(`Error fetching variables for ${req.params.templateKey}:`, error);
    next(error);
  }
});

/**
 * @route   GET /api/settings/email-templates/preview-data/:type
 * @desc    Get sample data for email template preview
 * @access  Private (Admin+)
 */
router.get('/preview-data/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    let data = [];
    
    switch (type) {
      case 'quotations':
        data = await prisma.quotation.findMany({
          select: {
            id: true,
            quotationNumber: true,
            title: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            client: {
              select: {
                companyName: true,
                contactPerson: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        break;
        
      case 'invoices':
        data = await prisma.invoice.findMany({
          select: {
            id: true,
            invoiceNumber: true,
            type: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            client: {
              select: {
                companyName: true,
                contactPerson: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        break;
        
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
          },
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Use: quotations, invoices, or users'
        });
    }
    
    res.json({
      success: true,
      message: `${type} data fetched successfully`,
      data: { 
        records: data,
        count: data.length,
        type 
      }
    });
  } catch (error) {
    console.error(`Error fetching preview data for ${req.params.type}:`, error);
    next(error);
  }
});

/**
 * @route   POST /api/settings/email-templates/preview
 * @desc    Preview email template with sample data
 * @access  Private (Admin+)
 */
// router.post('/preview', [
//   requirePermission(PERMISSIONS.SETTINGS.READ),
//   body('templateKey').notEmpty().withMessage('Template key is required'),
//   body('recordId').optional().isString().withMessage('Record ID must be a string'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { templateKey, recordId } = req.body;
    
//     // Get the template
//     const template = await settingsService.getEmailTemplate(templateKey);
//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         message: 'Template not found'
//       });
//     }
    
//     // Get sample data for preview
//     let sampleData = null;
    
//     if (recordId) {
//       // Use specific record
//       sampleData = await getSpecificRecordForPreview(templateKey, recordId);
//     } else {
//       // Use latest record
//       sampleData = await getLatestRecordForPreview(templateKey);
//     }
    
//     if (!sampleData) {
//       return res.status(404).json({
//         success: false,
//         message: `No sample data available for template type: ${templateKey}`
//       });
//     }
    
//     // Get company settings for template variables
//     const companySettings = await settingsService.getCompanySettings();
    
//     // Render template with sample data
//     const { renderEmailTemplate } = require('../services/emailService');
//     const renderedTemplate = await renderEmailTemplate(templateKey, sampleData);
    
//     res.json({
//       success: true,
//       message: 'Template preview generated successfully',
//       data: { 
//         template: { html: renderedTemplate },   // wrap string
//         sampleData,
//         templateKey,
//         recordId: recordId || 'latest'
//       }
//     });
//   } catch (error) {
//     console.error('Template preview error:', error);
//     next(error);
//   }
// });

router.post('/preview', [
  requirePermission(PERMISSIONS.SETTINGS.READ),
  body('templateKey').notEmpty().withMessage('Template key is required'),
  body('recordId').optional().isString().withMessage('Record ID must be a string'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKey, recordId } = req.body;
    
    // Get the template
    const template = await settingsService.getEmailTemplate(templateKey);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    let renderedHtml = template.htmlContent || '';
    let sampleData = null;
    let usedSampleData = false;

    try {
      // Try to get sample data for preview
      if (recordId) {
        sampleData = await getSpecificRecordForPreview(templateKey, recordId);
      } else {
        sampleData = await getLatestRecordForPreview(templateKey);
      }

      if (sampleData) {
        // Get company settings for template variables
        const companySettings = await settingsService.getCompanySettings();
        
        // Render template with sample data
        const { renderEmailTemplate } = require('../services/emailService');
        renderedHtml = await renderEmailTemplate(templateKey, sampleData);
        usedSampleData = true;
      }
    } catch (renderError) {
      console.warn('Failed to render template with sample data:', renderError);
      // Fall back to original template with placeholder variables highlighted
      renderedHtml = template.htmlContent || '';
    }

    // If no sample data, show template with variable placeholders highlighted
    if (!usedSampleData && renderedHtml) {
      // Highlight template variables for preview
      renderedHtml = renderedHtml.replace(
        /\{\{(\w+)\}\}/g, 
        '<span style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 0.875em;">{{$1}}</span>'
      );
    }

    res.json({
      success: true,
      message: 'Template preview generated successfully',
      data: {
        template: {
          html: renderedHtml,
          subject: template.subject,
          text: template.textContent || null,
          variables: template.variables || []
        },
        sampleData: sampleData || null,
        templateKey,
        recordId: recordId || (sampleData ? 'latest' : 'no-data'),
        usedSampleData,
        warnings: sampleData ? [] : ['No sample data available - showing template with placeholder variables']
      }
    });
    
  } catch (error) {
    console.error('Template preview error:', error);
    
    // Try to return basic template info even if preview fails
    try {
      const template = await settingsService.getEmailTemplate(req.body.templateKey);
      if (template) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate preview, showing basic template',
          data: {
            template: {
              html: template.htmlContent || '<p>Template content not available</p>',
              subject: template.subject,
              text: template.textContent || null
            },
            error: error.message
          }
        });
      }
    } catch (fallbackError) {
      // If even the fallback fails, return error
      console.error('Fallback template fetch failed:', fallbackError);
    }
    
    next(error);
  }
});
/**
 * @route   POST /api/settings/email-templates/test-send
 * @desc    Send test email using template
 * @access  Private (Admin+)
 */
router.post('/test-send', [
  requirePermission(PERMISSIONS.SETTINGS.UPDATE),
  body('templateKey').notEmpty().withMessage('Template key is required'),
  body('testEmail').isEmail().withMessage('Valid test email is required'),
  body('recordId').optional().isString().withMessage('Record ID must be a string'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { templateKey, testEmail, recordId } = req.body;
    
    // Get sample data
    let sampleData;
    if (recordId) {
      sampleData = await getSpecificRecordForPreview(templateKey, recordId);
    } else {
      sampleData = await getLatestRecordForPreview(templateKey);
    }
    
    if (!sampleData) {
      return res.status(404).json({
        success: false,
        message: `No sample data available for template type: ${templateKey}`
      });
    }
    
    // Send test email
    const { sendEmail } = require('../services/emailService');
    const result = await sendEmail(testEmail, templateKey, sampleData);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: { 
        result,
        templateKey,
        sentTo: testEmail,
        usedData: recordId ? 'specific record' : 'latest record'
      }
    });
  } catch (error) {
    console.error('Test email send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

// Get latest record for preview based on template type
const getLatestRecordForPreview = async (templateKey) => {
  try {
    switch (templateKey) {
      case 'quotation_approved':
      case 'quotation_sent':
        return await getLatestQuotationForPreview();
      case 'invoice_sent':
        return await getLatestInvoiceForPreview();
      case 'user_welcome':
        return await getLatestUserForPreview();
      default:
        return getDefaultSampleData(templateKey);
    }
  } catch (error) {
    console.error('Error getting latest record for preview:', error);
    return null;
  }
};

// Get specific record for preview
const getSpecificRecordForPreview = async (templateKey, recordId) => {
  try {
    switch (templateKey) {
      case 'quotation_approved':
      case 'quotation_sent':
        return await getSpecificQuotationForPreview(recordId);
      case 'invoice_sent':
        return await getSpecificInvoiceForPreview(recordId);
      case 'user_welcome':
        return await getSpecificUserForPreview(recordId);
      default:
        return getDefaultSampleData(templateKey);
    }
  } catch (error) {
    console.error('Error getting specific record for preview:', error);
    return null;
  }
};

// Helper functions to get real data for previews
const getLatestQuotationForPreview = async () => {
  const quotation = await prisma.quotation.findFirst({
    include: {
      client: { select: { companyName: true, contactPerson: true, email: true } },
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return quotation ? formatQuotationDataForEmail(quotation) : null;
};

const getSpecificQuotationForPreview = async (id) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: { select: { companyName: true, contactPerson: true, email: true } },
      user: { select: { firstName: true, lastName: true } }
    }
  });
  
  return quotation ? formatQuotationDataForEmail(quotation) : null;
};

const getLatestInvoiceForPreview = async () => {
  const invoice = await prisma.invoice.findFirst({
    include: {
      client: { select: { companyName: true, contactPerson: true, email: true } },
      quotation: { select: { quotationNumber: true, title: true } },
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return invoice ? formatInvoiceDataForEmail(invoice) : null;
};

const getSpecificInvoiceForPreview = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { companyName: true, contactPerson: true, email: true } },
      quotation: { select: { quotationNumber: true, title: true } },
      user: { select: { firstName: true, lastName: true } }
    }
  });
  
  return invoice ? formatInvoiceDataForEmail(invoice) : null;
};

const getLatestUserForPreview = async () => {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  
  return user ? formatUserDataForEmail(user) : null;
};

const getSpecificUserForPreview = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  return user ? formatUserDataForEmail(user) : null;
};

// Data formatting functions
const formatQuotationDataForEmail = (quotation) => {
  const getClientName = (clientData) => {
    const isPhoneNumber = (str) => {
      if (!str) return false;
      const cleaned = str.replace(/[\s\-\(\)\+]/g, '');
      return /^\d{8,}$/.test(cleaned);
    };

    if (clientData.contactPerson && !isPhoneNumber(clientData.contactPerson)) {
      return clientData.contactPerson.trim();
    }
    
    return clientData.companyName || 'Valued Client';
  };

  return {
    clientName: getClientName(quotation.client),
    clientCompany: quotation.client.companyName,
    quotationNumber: quotation.quotationNumber,
    quotationTitle: quotation.title,
    description: quotation.description,
    subtotal: formatCurrency(quotation.subtotal),
    gstPercentage: quotation.gstPercentage?.toString() || '0',
    gstAmount: formatCurrency(quotation.gstAmount || 0),
    pstPercentage: quotation.pstPercentage?.toString() || '0', 
    pstAmount: formatCurrency(quotation.pstAmount || 0),
    totalTaxAmount: formatCurrency(quotation.combinedTaxAmount || 0),
    totalAmount: formatCurrency(quotation.totalAmount),
    validUntil: quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '',
    notes: quotation.notes || '',
    approvedDate: new Date().toLocaleDateString()
  };
};

const formatInvoiceDataForEmail = (invoice) => {
  return {
    clientName: invoice.client.contactPerson || invoice.client.companyName,
    clientCompany: invoice.client.companyName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.type.replace(/_/g, ' '),
    subtotal: formatCurrency(invoice.subtotal),
    gstPercentage: invoice.gstPercentage?.toString() || '0',
    gstAmount: formatCurrency(invoice.gstAmount || 0),
    pstPercentage: invoice.pstPercentage?.toString() || '0',
    pstAmount: formatCurrency(invoice.pstAmount || 0),
    totalAmount: formatCurrency(invoice.totalAmount),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified',
    quotationTitle: invoice.quotation?.title || 'N/A',
    quotationNumber: invoice.quotation?.quotationNumber || 'N/A',
  };
};

const formatUserDataForEmail = (user) => {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role.replace(/_/g, ' '),
    createdDate: new Date(user.createdAt).toLocaleDateString()
  };
};

// Get default sample data for templates
const getDefaultSampleData = (templateKey) => {
  const defaultData = {
    password_reset: {
      firstName: 'John',
      resetUrl: 'https://example.com/reset-password?token=abc123',
      resetToken: 'abc123'
    },
    test_email: {
      firstName: 'Test User',
      testMessage: 'This is a test email to verify your configuration.',
      sentDate: new Date().toLocaleDateString()
    }
  };

  return defaultData[templateKey] || null;
};

// Helper functions
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

module.exports = router;