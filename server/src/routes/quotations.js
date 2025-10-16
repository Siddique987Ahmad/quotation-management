const express = require('express');
const { body } = require('express-validator');
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  getQuotationStatistics,
  duplicateQuotation,
  bulkQuotationActions,
  getQuotationWithInvoices
} = require('../controllers/quotationController');

const { authenticateToken } = require('../middleware/auth');
const { 
  requirePermission,
  requireAnyPermission,
  canAccessResource 
} = require('../middleware/permissions');
const { applyUserFilter } = require('../middleware/userFiltering'); // NEW
const { 
  validateQuotation, 
  validatePagination, 
  validateUUIDParam,
  handleValidationErrors 
} = require('../middleware/validation');
const { PERMISSIONS, QUOTATION_STATUS } = require('../config/constants');
const { generateQuotationPDF, downloadPDFResponse } = require('../services/pdfService');

const router = express.Router();

// All quotation routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/quotations
 * @desc    Get all quotations with pagination and filtering (filtered by user if needed)
 * @access  Private (Users can see own, Managers+ can see all)
 * @query   page, limit, sortBy, sortOrder, search, status, clientId, userId, startDate, endDate
 */
router.get('/', [
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations'), // NEW: Apply user filtering
  validatePagination
], getQuotations);

/**
 * @route   GET /api/quotations/statistics
 * @desc    Get quotation statistics and analytics (filtered by user if needed)
 * @access  Private (Users see own stats, Managers+ see all)
 */
router.get('/statistics', [
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations') // NEW: Apply user filtering
], getQuotationStatistics);

/**
 * @route   GET /api/quotations/dashboard/summary
 * @desc    Get quotations summary for dashboard (filtered by user if needed)
 * @access  Private
 */
router.get('/dashboard/summary', [
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations') // NEW: Apply user filtering
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { buildUserFilteredWhere } = require('../middleware/userFiltering'); // NEW

    // CRITICAL FIX: Apply user filtering to dashboard summary
    let where = {};
    where = buildUserFilteredWhere(req, where);

    const [
      totalQuotations,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      thisMonthCount,
      totalValue,
      recentQuotations
    ] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.count({ 
        where: { ...where, status: QUOTATION_STATUS.PENDING } 
      }),
      prisma.quotation.count({ 
        where: { ...where, status: QUOTATION_STATUS.APPROVED } 
      }),
      prisma.quotation.count({ 
        where: { ...where, status: QUOTATION_STATUS.REJECTED } 
      }),
      prisma.quotation.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.quotation.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.quotation.findMany({
        where,
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          client: {
            select: {
              companyName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: {
        summary: {
          total: totalQuotations,
          pending: pendingQuotations,
          approved: approvedQuotations,
          rejected: rejectedQuotations,
          thisMonth: thisMonthCount,
          totalValue: totalValue._sum.totalAmount || 0
        },
        recentQuotations
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/quotations/:id
 * @desc    Get quotation by ID with detailed information
 * @access  Private (Owner or Manager+)
 */
router.get('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
  // NOTE: Individual access control is handled in controller with canAccessRecord
], getQuotationById);

/**
 * @route   GET /api/quotations/:id/pdf
 * @desc    Generate and download quotation PDF
 * @access  Private (Owner or Manager+)
 * @query   includeTax=true|false (default: true)
 */
router.get('/:id/pdf', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
  // NOTE: Individual access control is handled in controller with canAccessRecord
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeTax = 'true' } = req.query; // Default to including tax
    const includesTax = includeTax === 'true';
    
    const { prisma } = require('../config/database');
    const { canAccessRecord } = require('../middleware/userFiltering'); // NEW

    // Get quotation with full details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // CRITICAL FIX: Check if user can access this quotation
    const canAccess = await canAccessRecord(req, quotation.userId);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create a modified quotation object based on tax inclusion
    // const processedQuotation = {
    //   ...quotation,
    //   taxPercentage: includesTax ? quotation.taxPercentage : 0,
    //   taxAmount: includesTax ? quotation.taxAmount : 0,
    //   totalAmount: includesTax ? quotation.totalAmount : quotation.subtotal
    // };

    const processedQuotation = {
  ...quotation,
  gstPercentage: includesTax ? quotation.gstPercentage : 0,
  pstPercentage: includesTax ? quotation.pstPercentage : 0,
  gstAmount: includesTax ? quotation.gstAmount : 0,
  pstAmount: includesTax ? quotation.pstAmount : 0,
  taxAmount: includesTax ? quotation.taxAmount : 0, // Total tax (GST + PST)
  totalAmount: includesTax ? quotation.totalAmount : quotation.subtotal
};

    // Generate PDF with processed data
    const pdfResult = await generateQuotationPDF(
      processedQuotation,
      quotation.client,
      quotation.user,
      {
        name: process.env.COMPANY_NAME || 'Your Company',
        address: process.env.COMPANY_ADDRESS || '123 Business Street',
        city: process.env.COMPANY_CITY || 'City',
        state: process.env.COMPANY_STATE || 'State',
        zip: process.env.COMPANY_ZIP || '12345',
        phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
        email: process.env.EMAIL_FROM || 'info@company.com'
      }
    );

    // Modify filename to indicate tax status
    const filename = `quotation-${quotation.quotationNumber}${includesTax ? '-with-tax' : '-without-tax'}.pdf`;

    // Send PDF as download
    downloadPDFResponse(res, pdfResult.pdf, filename);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/quotations/:id/send-email
 * @desc    Send quotation via email to client
 * @access  Private (Owner or Manager+)
 */
// router.post('/:id/send-email', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.QUOTATIONS.READ)
//   // NOTE: Individual access control is handled in controller with canAccessRecord
// ], async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { prisma } = require('../config/database');
//     const { canAccessRecord } = require('../middleware/userFiltering'); // NEW
//     const { generateQuotationPDF } = require('../services/pdfService');
//     const { sendQuotationEmail } = require('../services/emailService');

//     // Get quotation with full details
//     const quotation = await prisma.quotation.findUnique({
//       where: { id },
//       include: {
//         client: true,
//         user: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       }
//     });

//     if (!quotation) {
//       return res.status(404).json({
//         success: false,
//         message: 'Quotation not found'
//       });
//     }

//     // CRITICAL FIX: Check if user can access this quotation
//     const canAccess = await canAccessRecord(req, quotation.userId);
//     if (!canAccess) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Check if client has email
//     if (!quotation.client.email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Client email not found. Please update client information.'
//       });
//     }

//     // Generate PDF
//     const pdfResult = await generateQuotationPDF(
//       quotation,
//       quotation.client,
//       quotation.user,
//       {
//         name: process.env.COMPANY_NAME || 'Your Company',
//         address: process.env.COMPANY_ADDRESS || '123 Business Street',
//         city: process.env.COMPANY_CITY || 'City',
//         state: process.env.COMPANY_STATE || 'State',
//         zip: process.env.COMPANY_ZIP || '12345',
//         phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
//         email: process.env.EMAIL_FROM || 'info@company.com'
//       }
//     );

//     // Send email with PDF attachment
//     const emailResult = await sendQuotationEmail(
//       quotation,
//       quotation.client,
//       pdfResult.pdf
//     );

//     // Update quotation to mark as sent (optional)
//     await prisma.quotation.update({
//       where: { id },
//       data: {
//         emailSent: true,
//         emailSentAt: new Date(),
//         updatedAt: new Date()
//       }
//     });

//     res.status(200).json({
//       success: true,
//       message: `Quotation sent successfully to ${quotation.client.email}`,
//       data: {
//         emailSent: true,
//         sentTo: quotation.client.email,
//         messageId: emailResult.messageId
//       }
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send quotation email',
//       error: error.message
//     });
//   }
// });

router.post('/:id/send-email', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prisma } = require('../config/database');
    const { canAccessRecord } = require('../middleware/userFiltering');
    const { generateQuotationPDF } = require('../services/pdfService');
    const { sendEmail, getTransporter } = require('../services/emailService');
    const { settingsService } = require('../services/settingsService');

    console.log(`🔄 Starting email send for quotation: ${id}`);

    // Get quotation with full details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    console.log(`✅ Quotation found: ${quotation.quotationNumber}`);

    // Check access permissions
    const canAccess = await canAccessRecord(req, quotation.userId);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if client has email
    if (!quotation.client.email) {
      return res.status(400).json({
        success: false,
        message: 'Client email not found. Please update client information.'
      });
    }

    console.log(`📧 Client email found: ${quotation.client.email}`);

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfResult = await generateQuotationPDF(
      quotation,
      quotation.client,
      quotation.user,
      {
        name: process.env.COMPANY_NAME || 'Your Company',
        address: process.env.COMPANY_ADDRESS || '123 Business Street',
        city: process.env.COMPANY_CITY || 'City',
        state: process.env.COMPANY_STATE || 'State',
        zip: process.env.COMPANY_ZIP || '12345',
        phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
        email: process.env.EMAIL_FROM || 'info@company.com'
      }
    );

    if (!pdfResult || !pdfResult.pdf) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    console.log('✅ PDF generated successfully');

    // PRIORITY 1: Try using your existing email template system
    console.log('📋 Checking for database email template...');
    let emailResult = null;
    let usedDatabaseTemplate = false;

    try {
      // Check if quotation_sent template exists and is enabled
      const template = await prisma.emailTemplate.findFirst({
        where: {
          templateKey: 'quotation_sent',
          enabled: true
        }
      });

      if (template) {
        console.log('✅ Found database template: quotation_sent');
        
        // Use your existing sendQuotationEmail function
        const { sendQuotationEmail } = require('../services/emailService');
        emailResult = await sendQuotationEmail(
          quotation,
          quotation.client,
          pdfResult.pdf
        );
        usedDatabaseTemplate = true;
        console.log('✅ Email sent using database template');
        
      } else {
        console.warn('⚠️ No enabled quotation_sent template found in database');
        throw new Error('No database template available');
      }

    } catch (templateError) {
      console.warn('⚠️ Database template method failed:', templateError.message);
      
      // PRIORITY 2: Create template on-the-fly if none exists
      try {
        console.log('🔧 Creating missing quotation_sent template...');
        
        const templateData = {
          templateKey: 'quotation_sent',
          name: 'Quotation Sent',
          description: 'Email sent when quotation is sent to client',
          category: 'QUOTATION',
          type: 'QUOTATION_SENT',
          enabled: true,
          isSystem: true,
          subject: 'Quotation {{quotationNumber}} - {{quotationTitle}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #059669; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">New Quotation</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #374151; margin: 0 0 20px 0;">Hello {{clientName}},</h2>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                  Thank you for your interest in our services. Please find your quotation attached for your review.
                </p>
                
                <div style="background: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #059669;">
                  <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Quotation Details:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Quotation Number:</td>
                      <td style="padding: 8px 0; color: #6b7280;">{{quotationNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Project:</td>
                      <td style="padding: 8px 0; color: #6b7280;">{{quotationTitle}}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Total Amount:</td>
                      <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">{{totalAmount}}</td>
                    </tr>
                    {{#if validUntil}}
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Valid Until:</td>
                      <td style="padding: 8px 0; color: #6b7280;">{{validUntil}}</td>
                    </tr>
                    {{/if}}
                  </table>
                </div>
                
                {{#if description}}
                <div style="margin: 25px 0;">
                  <h4 style="color: #374151; margin: 0 0 10px 0;">Project Description:</h4>
                  <p style="color: #6b7280; line-height: 1.6; margin: 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                    {{description}}
                  </p>
                </div>
                {{/if}}
                
                {{#if notes}}
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                  <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Important Notes:</h4>
                  <p style="color: #1e40af; margin: 0; line-height: 1.6;">{{notes}}</p>
                </div>
                {{/if}}
                
                <div style="margin: 30px 0; padding: 20px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
                  <p style="color: #a16207; margin: 0; font-size: 14px;">
                    <strong>📎 Please find the detailed quotation attached as a PDF.</strong>
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
                  If you have any questions or need clarification, please don't hesitate to contact us. We look forward to working with you!
                </p>
                
                <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                  <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
                  <p style="color: #059669; margin: 5px 0 0 0; font-weight: bold;">{{companyName}}</p>
                </div>
              </div>
              
              <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">Sent on {{sentDate}}</p>
              </div>
            </div>
          `,
          variables: ['clientName', 'quotationNumber', 'quotationTitle', 'description', 'totalAmount', 'validUntil', 'notes', 'sentDate', 'companyName', 'currentYear'],
          sections: {},
          createdBy: req.user?.id || 'system'
        };

        // Check if template already exists
        const existingTemplate = await prisma.emailTemplate.findUnique({
          where: { templateKey: 'quotation_sent' }
        });

        if (!existingTemplate) {
          // Create the template only if it doesn't exist
          await settingsService.createEmailTemplate(templateData, req.user?.id || 'system');
          console.log('✅ Created quotation_sent template');
        } else {
          console.log('✅ Using existing quotation_sent template');
        }

        // Now try sending email again with the newly created template
        const { sendQuotationEmail } = require('../services/emailService');
        emailResult = await sendQuotationEmail(
          quotation,
          quotation.client,
          pdfResult.pdf
        );
        usedDatabaseTemplate = true;
        console.log('✅ Email sent using newly created template');

      } catch (createTemplateError) {
        console.error('❌ Failed to create template, falling back to basic email:', createTemplateError.message);
        
        // PRIORITY 3: Last resort - basic email without template system
        const nodemailer = require('nodemailer');
        
        // Get email settings and company settings
        const [emailSettings, companySettings] = await Promise.all([
          settingsService.getEmailSettings(),
          settingsService.getCompanySettings()
        ]);

        // Initialize transporter
        const transporter = nodemailer.createTransport({
          host: emailSettings.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: emailSettings.port || process.env.EMAIL_PORT || 587,
          secure: emailSettings.secure || process.env.EMAIL_SECURE === 'true',
          auth: {
            user: emailSettings.username || process.env.EMAIL_USER,
            pass: emailSettings.password || process.env.EMAIL_PASS
          }
        });

        // Helper functions
        const toNumber = (value, defaultValue = 0) => {
          if (value === null || value === undefined) return defaultValue;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') return parseFloat(value) || defaultValue;
          if (value && typeof value.toNumber === 'function') return value.toNumber();
          return parseFloat(value) || defaultValue;
        };

        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          }).format(toNumber(amount));
        };

        const getClientName = (clientData) => {
          if (clientData.contactPerson && !(/^\d{8,}$/.test(clientData.contactPerson.replace(/[\s\-\(\)\+]/g, '')))) {
            return clientData.contactPerson.trim();
          }
          return clientData.companyName || 'Valued Client';
        };

        // Simple fallback email
        const clientName = getClientName(quotation.client);
        const totalAmount = formatCurrency(quotation.totalAmount);

        const mailOptions = {
          from: {
            name: emailSettings.fromName || companySettings.name || 'Quotation Management System',
            address: emailSettings.fromEmail || emailSettings.username || process.env.EMAIL_FROM
          },
          to: quotation.client.email,
          subject: `Quotation ${quotation.quotationNumber} - ${quotation.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hello ${clientName},</h2>
              <p>Please find your quotation attached for your review.</p>
              <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3>Quotation Details:</h3>
                <p><strong>Quotation Number:</strong> ${quotation.quotationNumber}</p>
                <p><strong>Project:</strong> ${quotation.title}</p>
                <p><strong>Total Amount:</strong> ${totalAmount}</p>
                ${quotation.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>` : ''}
              </div>
              <p>If you have any questions, please contact us.</p>
              <p>Best regards,<br>${companySettings.name || 'Your Company'}</p>
            </div>
          `,
          replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
          attachments: [
            {
              filename: `quotation-${quotation.quotationNumber}.pdf`,
              content: pdfResult.pdf,
              contentType: 'application/pdf'
            }
          ]
        };

        // Send fallback email
        const info = await transporter.sendMail(mailOptions);
        emailResult = {
          success: true,
          messageId: info.messageId,
          sentTo: quotation.client.email
        };
        
        console.log('✅ Email sent using basic fallback method');
      }
    }

    if (!emailResult) {
      throw new Error('All email sending methods failed');
    }

    // Update quotation status
    console.log('💾 Updating quotation status...');
    await prisma.quotation.update({
      where: { id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Quotation email process completed successfully');

    res.status(200).json({
      success: true,
      message: `Quotation sent successfully to ${quotation.client.email}`,
      data: {
        emailSent: true,
        sentTo: quotation.client.email,
        messageId: emailResult.messageId || emailResult.result?.messageId,
        quotationNumber: quotation.quotationNumber,
        templateSource: usedDatabaseTemplate ? 'database' : 'fallback'
      }
    });

  } catch (error) {
    console.error('❌ EMAIL SENDING ERROR:', {
      message: error.message,
      stack: error.stack,
      quotationId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send quotation email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Email sending failed'
    });
  }
});

/**
 * @route   POST /api/quotations
 * @desc    Create new quotation
 * @access  Private (User+)
 * @body    { title, description?, clientId, subtotal, taxPercentage?, validUntil?, notes?, formData? }
 */
router.post('/', [
  requirePermission(PERMISSIONS.QUOTATIONS.CREATE),
  validateQuotation.create
], createQuotation);

/**
 * @route   PUT /api/quotations/:id
 * @desc    Update quotation
 * @access  Private (Owner or Manager+)
 */
router.put('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.UPDATE),
  validateQuotation.update
  // NOTE: Individual access control is handled in controller with canAccessRecord
], updateQuotation);

/**
 * @route   PATCH /api/quotations/:id/status
 * @desc    Update quotation status
 * @access  Private (PENDING: Owner+, APPROVE/REJECT: Manager+)
 * @body    { status }
 */
router.patch('/:id/status', [
  validateUUIDParam('id'),
  body('status')
    .isIn(Object.values(QUOTATION_STATUS))
    .withMessage('Invalid quotation status'),
  handleValidationErrors,
  // Dynamic permission check based on status
  (req, res, next) => {
    const { status } = req.body;
    
    if (status === QUOTATION_STATUS.PENDING) {
      // Users can mark their own quotations as pending
      return requirePermission(PERMISSIONS.QUOTATIONS.UPDATE)(req, res, next);
    } else if (status === QUOTATION_STATUS.APPROVED || status === QUOTATION_STATUS.REJECTED) {
      // Only managers+ can approve or reject
      return requireAnyPermission([
        PERMISSIONS.QUOTATIONS.APPROVE,
        PERMISSIONS.QUOTATIONS.REJECT
      ])(req, res, next);
    } else {
      // For other statuses, require update permission
      return requirePermission(PERMISSIONS.QUOTATIONS.UPDATE)(req, res, next);
    }
  }
  // NOTE: Individual access control is handled in controller with canAccessRecord
], updateQuotationStatus);

/**
 * @route   GET /api/quotations/:id/with-invoices
 * @desc    Get quotation with related invoices
 * @access  Private (Owner or Manager+)
 */
router.get('/:id/with-invoices', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
  // NOTE: Individual access control is handled in controller with canAccessRecord
], getQuotationWithInvoices);

/**
 * @route   POST /api/quotations/:id/duplicate
 * @desc    Duplicate quotation
 * @access  Private (Owner or Manager+)
 */
router.post('/:id/duplicate', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.CREATE)
  // NOTE: Individual access control is handled in controller with canAccessRecord
], duplicateQuotation);

/**
 * @route   DELETE /api/quotations/:id
 * @desc    Delete quotation
 * @access  Private (Owner or Manager+)
 */
router.delete('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.DELETE)
  // NOTE: Individual access control is handled in controller with canAccessRecord
], deleteQuotation);

// Additional utility routes

/**
 * @route   GET /api/quotations/client/:clientId
 * @desc    Get all quotations for a specific client (filtered by user if needed)
 * @access  Private
 */
router.get('/client/:clientId', [
  validateUUIDParam('clientId'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations') // NEW: Apply user filtering
], async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { prisma } = require('../config/database');
    const { buildUserFilteredWhere } = require('../middleware/userFiltering'); // NEW

    // CRITICAL FIX: Apply user filtering
    let where = { clientId };
    where = buildUserFilteredWhere(req, where);

    const quotations = await prisma.quotation.findMany({
      where,
      select: {
        id: true,
        quotationNumber: true,
        title: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Client quotations fetched successfully',
      data: { quotations }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/quotations/status/:status
 * @desc    Get quotations by status (filtered by user if needed)
 * @access  Private
 */
router.get('/status/:status', [
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations'), // NEW: Apply user filtering
  validatePagination
], async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!Object.values(QUOTATION_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotation status'
      });
    }

    const { prisma } = require('../config/database');
    const { buildUserFilteredWhere } = require('../middleware/userFiltering'); // NEW

    // CRITICAL FIX: Apply user filtering
    let where = { status };
    where = buildUserFilteredWhere(req, where);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [quotations, totalCount] = await Promise.all([
      prisma.quotation.findMany({
        where,
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          client: {
            select: {
              companyName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.quotation.count({ where })
    ]);

    res.json({
      success: true,
      message: `${status} quotations fetched successfully`,
      data: {
        quotations,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/quotations/bulk-action
 * @desc    Perform bulk actions on quotations (filtered by user if needed)
 * @access  Private (Manager+)
 * @body    { quotationIds: string[], action: 'approve' | 'reject' | 'delete' }
 */
router.post('/bulk-action', [
  requireAnyPermission([
    PERMISSIONS.QUOTATIONS.APPROVE,
    PERMISSIONS.QUOTATIONS.REJECT,
    PERMISSIONS.QUOTATIONS.DELETE
  ]),
  applyUserFilter('quotations'), // NEW: Apply user filtering for bulk actions
  body('quotationIds')
    .isArray({ min: 1 })
    .withMessage('At least one quotation ID is required'),
  body('quotationIds.*')
    .isUUID()
    .withMessage('Invalid quotation ID format'),
  body('action')
    .isIn(['approve', 'reject', 'delete'])
    .withMessage('Invalid action. Must be approve, reject, or delete'),
  handleValidationErrors
], bulkQuotationActions); // Use the updated controller function

/**
 * @route   GET /api/quotations/export/csv
 * @desc    Export quotations data as CSV (filtered by user if needed)
 * @access  Private (Manager+)
 */
router.get('/export/csv', [
  requirePermission(PERMISSIONS.QUOTATIONS.READ),
  applyUserFilter('quotations') // NEW: Apply user filtering
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { buildUserFilteredWhere } = require('../middleware/userFiltering'); // NEW

    // CRITICAL FIX: Apply user filtering to export
    let where = {};
    where = buildUserFilteredWhere(req, where);

    const quotations = await prisma.quotation.findMany({
      where,
      select: {
        quotationNumber: true,
        title: true,
        description: true,
        status: true,
        subtotal: true,
        taxPercentage: true,
        taxAmount: true,
        totalAmount: true,
        validUntil: true,
        createdAt: true,
        client: {
          select: {
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to CSV format
    const csvData = quotations.map(quotation => ({
      'Quotation Number': quotation.quotationNumber,
      'Title': quotation.title,
      'Description': quotation.description || '',
      'Client Company': quotation.client.companyName,
      'Client Contact': quotation.client.contactPerson,
      'Client Email': quotation.client.email,
      'Status': quotation.status,
      'Subtotal': quotation.subtotal,
      'Tax %': quotation.taxPercentage,
      'Tax Amount': quotation.taxAmount,
      'Total Amount': quotation.totalAmount,
      'Valid Until': quotation.validUntil ? quotation.validUntil.toISOString().split('T')[0] : '',
      'Created By': `${quotation.user.firstName} ${quotation.user.lastName}`,
      'Created Date': quotation.createdAt.toISOString().split('T')[0]
    }));

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quotations.csv');

    // Simple CSV generation
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => 
          `"${(row[header] || '').toString().replace(/"/g, '""')}"`)
        .join(',')
      )
    ].join('\n');

    res.send(csvContent);

  } catch (error) {
    next(error);
  }
});

module.exports = router;