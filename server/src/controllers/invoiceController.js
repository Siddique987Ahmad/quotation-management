const { prisma } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, MESSAGES, PAGINATION, INVOICE_STATUS, INVOICE_TYPES } = require('../config/constants');
const { sendInvoiceEmail: sendInvoiceEmailService } = require('../services/emailService');
const { generateInvoicePDF, downloadPDFResponse } = require('../services/pdfService');
  const { hasPermission } = require('../middleware/permissions');

// Enhanced invoice tax type constants
const INVOICE_TAX_TYPES = {
  NO_TAX: 'NO_TAX',
  GST_ONLY: 'GST_ONLY',
  PST_ONLY: 'PST_ONLY',
  GST_AND_PST: 'GST_AND_PST'
};

// ENHANCED: Send invoice email with specific tax calculation
// const sendInvoiceEmailWithTax = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { 
//     taxType = 'GST_AND_PST', 
//     customGstRate, 
//     customPstRate 
//   } = req.body;

//   // Validate tax type
//   if (!Object.values(INVOICE_TAX_TYPES).includes(taxType)) {
//     throw new AppError('Invalid tax type', STATUS_CODES.BAD_REQUEST);
//   }

//   // Build where clause based on user permissions
//   const where = { id };
//   const { hasPermission } = require('../middleware/permissions');
//   if (!hasPermission(req.user.role, 'invoices:read_all')) {
//     where.userId = req.user.id;
//   }

//   // Check if invoice exists
//   const invoice = await prisma.invoice.findFirst({
//     where,
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       quotation: {
//         select: {
//           quotationNumber: true,
//           title: true,
//           description: true,
//           notes: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   if (!invoice) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   if (!invoice.client.email) {
//     throw new AppError('Client email not found', STATUS_CODES.BAD_REQUEST);
//   }

//   try {
//     // Use custom rates if provided, otherwise use invoice's saved rates
//     const gstRate = customGstRate !== undefined ? parseFloat(customGstRate) : parseFloat(invoice.gstPercentage);
//     const pstRate = customPstRate !== undefined ? parseFloat(customPstRate) : parseFloat(invoice.pstPercentage);

//     // Create a modified invoice object with custom tax calculations
//     const modifiedInvoice = {
//       ...invoice,
//       gstPercentage: gstRate,
//       pstPercentage: pstRate
//     };

//     // Calculate tax amounts based on selected type and rates
//     const taxCalculations = calculateTaxAmounts(invoice.subtotal, gstRate, pstRate, taxType);
//     modifiedInvoice.gstAmount = taxCalculations.gstAmount;
//     modifiedInvoice.pstAmount = taxCalculations.pstAmount;
//     modifiedInvoice.combinedTaxAmount = taxCalculations.combinedTaxAmount;
//     modifiedInvoice.totalAmount = taxCalculations.totalAmount;

//     // Generate PDF with specific tax configuration
//     const { generateInvoicePDF } = require('../services/pdfService');
//     const pdfResult = await generateInvoicePDF(
//       modifiedInvoice,
//       invoice.client,
//       invoice.quotation,
//       {
//         name: process.env.COMPANY_NAME || 'Your Company',
//         address: process.env.COMPANY_ADDRESS || '123 Business Street',
//         city: process.env.COMPANY_CITY || 'City',
//         state: process.env.COMPANY_STATE || 'State',
//         zip: process.env.COMPANY_ZIP || '12345',
//         phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
//         email: process.env.EMAIL_FROM || 'info@company.com'
//       },
//       taxType
//     );

//     // Send email with the tax-specific invoice PDF
//     const { sendInvoiceEmailWithTaxPDF } = require('../services/emailService');
//     await sendInvoiceEmailWithTaxPDF(
//       modifiedInvoice, 
//       invoice.client, 
//       invoice.quotation, 
//       pdfResult.pdf, 
//       taxType,
//       {
//         gstRate,
//         pstRate,
//         taxCalculations
//       }
//     );
    
//     // Update invoice status
//     const updatedInvoice = await prisma.invoice.update({
//       where: { id },
//       data: {
//         status: INVOICE_STATUS.SENT,
//         emailSent: true,
//         emailSentAt: new Date(),
//         updatedAt: new Date()
//       }
//     });

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `Invoice sent successfully with ${taxType.replace('_', ' ')} calculation`,
//       data: { 
//         invoice: updatedInvoice,
//         taxType,
//         taxDetails: {
//           gstRate,
//           pstRate,
//           gstAmount: taxCalculations.gstAmount,
//           pstAmount: taxCalculations.pstAmount,
//           totalAmount: taxCalculations.totalAmount
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     throw new AppError('Failed to send invoice email with tax configuration', STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

// ENHANCED: Send invoice email with specific tax calculation
// const sendInvoiceEmailWithTax = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { 
//     taxType = 'GST_AND_PST', 
//     customGstRate, 
//     customPstRate 
//   } = req.body;

//   // Validate tax type
//   if (!Object.values(INVOICE_TAX_TYPES).includes(taxType)) {
//     throw new AppError('Invalid tax type', STATUS_CODES.BAD_REQUEST);
//   }

//   // Build where clause based on user permissions
//   const where = { id };
//   const { hasPermission } = require('../middleware/permissions');
//   if (!hasPermission(req.user.role, 'invoices:read_all')) {
//     where.userId = req.user.id;
//   }

//   // Check if invoice exists
//   const invoice = await prisma.invoice.findFirst({
//     where,
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       quotation: {
//         select: {
//           quotationNumber: true,
//           title: true,
//           description: true,
//           notes: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   if (!invoice) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   if (!invoice.client.email) {
//     throw new AppError('Client email not found', STATUS_CODES.BAD_REQUEST);
//   }

//   try {
//     // Use custom rates if provided, otherwise use invoice's saved rates
//     const gstRate = customGstRate !== undefined ? parseFloat(customGstRate) : parseFloat(invoice.gstPercentage);
//     const pstRate = customPstRate !== undefined ? parseFloat(customPstRate) : parseFloat(invoice.pstPercentage);

//     // Create a modified invoice object with custom tax calculations
//     const modifiedInvoice = {
//       ...invoice,
//       gstPercentage: gstRate,
//       pstPercentage: pstRate
//     };

//     // Calculate tax amounts based on selected type and rates
//     const taxCalculations = calculateTaxAmounts(invoice.subtotal, gstRate, pstRate, taxType);
//     modifiedInvoice.gstAmount = taxCalculations.gstAmount;
//     modifiedInvoice.pstAmount = taxCalculations.pstAmount;
//     modifiedInvoice.combinedTaxAmount = taxCalculations.combinedTaxAmount;
//     modifiedInvoice.totalAmount = taxCalculations.totalAmount;

//     // Generate PDF with specific tax configuration - FIXED: Only 4 parameters now
//     const { generateInvoicePDF } = require('../services/pdfService');
//     const pdfResult = await generateInvoicePDF(
//       modifiedInvoice,
//       invoice.client,
//       invoice.quotation,
//       taxType  // Company data is now loaded from database automatically
//     );

//     // Send email with the tax-specific invoice PDF
//     const { sendInvoiceEmailWithTaxPDF } = require('../services/emailService');
//     await sendInvoiceEmailWithTaxPDF(
//       modifiedInvoice, 
//       invoice.client, 
//       invoice.quotation, 
//       pdfResult.pdf, 
//       taxType,
//       {
//         gstRate,
//         pstRate,
//         taxCalculations
//       }
//     );
    
//     // Update invoice status
//     const updatedInvoice = await prisma.invoice.update({
//       where: { id },
//       data: {
//         status: INVOICE_STATUS.SENT,
//         emailSent: true,
//         emailSentAt: new Date(),
//         updatedAt: new Date()
//       }
//     });

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `Invoice sent successfully with ${taxType.replace('_', ' ')} calculation`,
//       data: { 
//         invoice: updatedInvoice,
//         taxType,
//         taxDetails: {
//           gstRate,
//           pstRate,
//           gstAmount: taxCalculations.gstAmount,
//           pstAmount: taxCalculations.pstAmount,
//           totalAmount: taxCalculations.totalAmount
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     throw new AppError('Failed to send invoice email with tax configuration', STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

// FIXED: Tax-specific invoice email with inline template handling
const sendInvoiceEmailWithTax = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    taxType = 'GST_AND_PST',
    customGstRate,
    customPstRate
  } = req.body;

  // Validate tax type
  if (!Object.values(INVOICE_TAX_TYPES).includes(taxType)) {
    throw new AppError('Invalid tax type', STATUS_CODES.BAD_REQUEST);
  }

  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  // Check if invoice exists
  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      client: {
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      },
      quotation: {
        select: {
          quotationNumber: true,
          title: true,
          description: true,
          notes: true
        }
      },
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!invoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  if (!invoice.client.email) {
    throw new AppError('Client email not found', STATUS_CODES.BAD_REQUEST);
  }

  try {
    console.log(`📧 Sending tax-specific invoice email (${taxType}) for ${invoice.invoiceNumber} to ${invoice.client.email}...`);

    // Use custom rates if provided, otherwise use invoice's saved rates
    const gstRate = customGstRate !== undefined ? parseFloat(customGstRate) : parseFloat(invoice.gstPercentage);
    const pstRate = customPstRate !== undefined ? parseFloat(customPstRate) : parseFloat(invoice.pstPercentage);

    // Calculate tax amounts based on selected type and rates
    const taxCalculations = calculateTaxAmounts(invoice.subtotal, gstRate, pstRate, taxType);

    // Create a modified invoice object with custom tax calculations
    const modifiedInvoice = {
      ...invoice,
      gstPercentage: gstRate,
      pstPercentage: pstRate,
      gstAmount: taxCalculations.gstAmount,
      pstAmount: taxCalculations.pstAmount,
      combinedTaxAmount: taxCalculations.combinedTaxAmount,
      totalAmount: taxCalculations.totalAmount
    };

    // Generate PDF with specific tax configuration
    const { generateInvoicePDF } = require('../services/pdfService');
    const pdfResult = await generateInvoicePDF(
      modifiedInvoice,
      invoice.client,
      invoice.quotation,
      taxType
    );

    if (!pdfResult || !pdfResult.pdf) {
      throw new Error('Failed to generate invoice PDF');
    }

    console.log(`✅ Generated PDF for ${taxType} invoice`);

    // INLINE EMAIL SENDING WITH TAX-SPECIFIC TEMPLATE
    const { settingsService } = require('../services/settingsService');
    const nodemailer = require('nodemailer');

    // Get email and company settings
    const [emailSettings, companySettings] = await Promise.all([
      settingsService.getEmailSettings(),
      settingsService.getCompanySettings()
    ]);

    // Initialize email transporter
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

    const getTaxTypeDescription = (type) => {
      const descriptions = {
        'GST_ONLY': 'GST Only',
        'PST_ONLY': 'PST Only', 
        'GST_AND_PST': 'GST + PST',
        'NO_TAX': 'Tax Exempt'
      };
      return descriptions[type] || type.replace('_', ' ');
    };

    // Prepare enhanced template data for tax-specific invoice
    const templateData = {
      clientName: getClientName(invoice.client),
      clientCompany: invoice.client.companyName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.type.replace(/_/g, ' '),
      quotationNumber: invoice.quotation?.quotationNumber || 'N/A',
      quotationTitle: invoice.quotation?.title || 'N/A',
      subtotal: formatCurrency(invoice.subtotal),
      
      // Tax-specific data
      taxType: getTaxTypeDescription(taxType),
      taxTypeRaw: taxType,
      gstPercentage: gstRate.toFixed(2),
      pstPercentage: pstRate.toFixed(2),
      gstAmount: formatCurrency(taxCalculations.gstAmount),
      pstAmount: formatCurrency(taxCalculations.pstAmount),
      totalTaxAmount: formatCurrency(taxCalculations.combinedTaxAmount),
      totalAmount: formatCurrency(taxCalculations.totalAmount),
      
      // Other data
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified',
      sentDate: new Date().toLocaleDateString(),
      companyName: companySettings.name || 'Your Company',
      currentYear: new Date().getFullYear(),
      
      // Tax breakdown display flags
      showGST: ['GST_ONLY', 'GST_AND_PST'].includes(taxType),
      showPST: ['PST_ONLY', 'GST_AND_PST'].includes(taxType),
      showNoTax: taxType === 'NO_TAX'
    };

    // PRIORITY 1: Try to get tax-specific template from database
    let emailSubject = `Invoice ${templateData.invoiceNumber} - ${templateData.taxType} Calculation`;
    let emailHtml = '';
    let usedDatabaseTemplate = false;

    try {
      // Look for tax-specific template first, then fallback to general invoice_sent
      const templateKey = `invoice_sent_${taxType.toLowerCase()}`;
      let template = await prisma.emailTemplate.findFirst({
        where: {
          templateKey: templateKey,
          enabled: true
        }
      });

      // Fallback to general invoice_sent template
      if (!template) {
        template = await prisma.emailTemplate.findFirst({
          where: {
            templateKey: 'invoice_sent',
            enabled: true
          }
        });
      }

      if (template) {
        console.log(`✅ Using database template: ${template.templateKey}`);
        
        emailSubject = template.subject;
        emailHtml = template.htmlContent;
        
        // Replace template variables
        Object.keys(templateData).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          emailSubject = emailSubject.replace(regex, templateData[key]);
          emailHtml = emailHtml.replace(regex, templateData[key]);
        });
        
        usedDatabaseTemplate = true;
      } else {
        throw new Error('Template not found');
      }
    } catch (templateError) {
      console.warn(`⚠️ Database template not found for ${taxType}, using enhanced fallback`);
      
      // PRIORITY 2: Enhanced tax-specific fallback template
      emailSubject = `Invoice ${templateData.invoiceNumber} - ${templateData.taxType} Calculation`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #dc2626; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📄 Invoice - ${templateData.taxType}</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${templateData.clientName},</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Please find your invoice with <strong>${templateData.taxType}</strong> tax calculation attached. Payment is requested within the specified due date.
            </p>
            
            <div style="background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">
                <strong>🏷️ Tax Configuration:</strong> This invoice has been calculated using ${templateData.taxType} tax structure as requested.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Invoice Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Invoice Type:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.invoiceType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Tax Configuration:</td>
                  <td style="padding: 8px 0; color: #f59e0b; font-weight: 600;">${templateData.taxType}</td>
                </tr>
                ${templateData.quotationNumber !== 'N/A' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Related Quotation:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationNumber}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: bold; color: #374151;">Subtotal:</td>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 16px;">${templateData.subtotal}</td>
                </tr>
                ${templateData.showGST ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">GST (${templateData.gstPercentage}%):</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.gstAmount}</td>
                </tr>
                ` : ''}
                ${templateData.showPST ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">PST (${templateData.pstPercentage}%):</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.pstAmount}</td>
                </tr>
                ` : ''}
                ${templateData.showNoTax ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Tax Status:</td>
                  <td style="padding: 8px 0; color: #059669; font-weight: 600;">Tax Exempt</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: bold; color: #374151; font-size: 18px;">Total Amount Due:</td>
                  <td style="padding: 12px 0; color: #dc2626; font-weight: bold; font-size: 20px;">${templateData.totalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Due Date:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${templateData.dueDate}</td>
                </tr>
              </table>
            </div>
            
            ${!templateData.showNoTax ? `
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0284c7;">
              <h4 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">Tax Breakdown Summary:</h4>
              <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                This invoice includes <strong>${templateData.taxType}</strong> calculations. 
                ${templateData.showGST && templateData.showPST ? `Total tax: ${templateData.totalTaxAmount}` : ''}
                ${templateData.showGST && !templateData.showPST ? `GST only: ${templateData.gstAmount}` : ''}
                ${!templateData.showGST && templateData.showPST ? `PST only: ${templateData.pstAmount}` : ''}
              </p>
            </div>
            ` : `
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                <strong>✓ Tax Exempt Status:</strong> This invoice is processed without tax charges as requested.
              </p>
            </div>
            `}
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
              <p style="color: #dc2626; margin: 0; font-weight: 500;">
                <strong>💰 Payment Instructions:</strong> Please review the attached ${templateData.taxType.toLowerCase()} invoice and process payment by the due date.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
              Thank you for your business! This invoice has been customized with your requested tax configuration.
            </p>
            
            <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
              <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
              <p style="color: #dc2626; margin: 5px 0 0 0; font-weight: bold;">${templateData.companyName} Billing Department</p>
            </div>
          </div>
          
          <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">&copy; ${templateData.currentYear} ${templateData.companyName}. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Invoice sent on ${templateData.sentDate} with ${templateData.taxType} calculation</p>
          </div>
        </div>
      `;
    }

    // Create attachment filename with tax type
    const attachmentFilename = `invoice-${invoice.invoiceNumber}-${taxType.toLowerCase().replace('_', '-')}.pdf`;

    // Send tax-specific invoice email
    const mailOptions = {
      from: {
        name: emailSettings.fromName || companySettings.name || 'Invoice Management System',
        address: emailSettings.fromEmail || emailSettings.username || process.env.EMAIL_FROM
      },
      to: invoice.client.email,
      subject: emailSubject,
      html: emailHtml,
      replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfResult.pdf,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Tax-specific invoice email sent successfully to ${invoice.client.email} (${info.messageId})`);

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: INVOICE_STATUS.SENT,
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Invoice sent successfully with ${taxType.replace('_', ' ')} calculation`,
      data: {
        invoice: updatedInvoice,
        taxType,
        taxDetails: {
          gstRate,
          pstRate,
          gstAmount: taxCalculations.gstAmount,
          pstAmount: taxCalculations.pstAmount,
          totalAmount: taxCalculations.totalAmount
        },
        emailDetails: {
          sentTo: invoice.client.email,
          messageId: info.messageId,
          templateSource: usedDatabaseTemplate ? 'database' : 'fallback',
          attachmentFilename
        }
      }
    });

  } catch (error) {
    console.error('❌ Tax-specific invoice email sending error:', error);
    throw new AppError('Failed to send invoice email with tax configuration', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});
const generateInvoiceNumber = async (type) => {
  try {
    // Get invoice settings for prefix and starting number
    const { settingsService } = require('../services/settingsService');
    const invoiceSettings = await settingsService.getInvoiceSettings();
    
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Count invoices of this type in current month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const count = await prisma.invoice.count({
      where: {
        type,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Use settings for prefix and starting number
    const prefix = invoiceSettings.sequencePrefix || 'INV-';
    const startingNumber = invoiceSettings.startingNumber || 1000;
    
    const sequence = String(startingNumber + count).padStart(4, '0');
    const typePrefix = type.replace('TAX_INVOICE_', prefix.replace('-', ''));
    
    console.log(`Generated invoice number with settings - Prefix: ${prefix}, Starting: ${startingNumber}`);
    
    return `${typePrefix}-${year}${month}-${sequence}`;
  } catch (error) {
    console.error('Error generating invoice number with settings, using defaults:', error);
    
    // Fallback to original logic if settings fail
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.invoice.count({
      where: {
        type,
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lte: new Date(year, new Date().getMonth() + 1, 0)
        }
      }
    });

    const sequence = String(count + 1).padStart(4, '0');
    const typePrefix = type.replace('TAX_INVOICE_', 'INV');
    return `${typePrefix}-${year}${month}-${sequence}`;
  }
};

// Calculate tax amounts with custom rates
const calculateTaxAmounts = (subtotal, gstRate = 0, pstRate = 0, taxType = 'GST_AND_PST') => {
  const sub = parseFloat(subtotal);
  const gstRateNum = parseFloat(gstRate);
  const pstRateNum = parseFloat(pstRate);
  
  let gstAmount = 0;
  let pstAmount = 0;
  let combinedTaxAmount = 0;
  let totalAmount = sub;

  switch (taxType) {
    case INVOICE_TAX_TYPES.GST_ONLY:
      gstAmount = (sub * gstRateNum) / 100;
      combinedTaxAmount = gstAmount;
      totalAmount = sub + gstAmount;
      break;
      
    case INVOICE_TAX_TYPES.PST_ONLY:
      pstAmount = (sub * pstRateNum) / 100;
      combinedTaxAmount = pstAmount;
      totalAmount = sub + pstAmount;
      break;
      
    case INVOICE_TAX_TYPES.GST_AND_PST:
      gstAmount = (sub * gstRateNum) / 100;
      pstAmount = (sub * pstRateNum) / 100;
      combinedTaxAmount = gstAmount + pstAmount;
      totalAmount = sub + gstAmount + pstAmount;
      break;
      
    case INVOICE_TAX_TYPES.NO_TAX:
    default:
      // No taxes applied
      break;
  }

  return {
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    pstAmount: parseFloat(pstAmount.toFixed(2)),
    combinedTaxAmount: parseFloat(combinedTaxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

// Get all invoices with pagination and filtering
const getInvoices = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    status = '',
    type = '',
    clientId = '',
    userId = '',
    startDate = '',
    endDate = ''
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const where = {};

  // For regular users, only show their own invoices unless they have READ_ALL permission
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }
  else if (userId) {
  // only admins/managers can filter by userId
  where.userId = userId;
}

  // Search in invoice number, client company name
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { 
        client: { 
          companyName: { contains: search, mode: 'insensitive' }
        }
      }
    ];
  }

  // Filter by status
  if (status && Object.values(INVOICE_STATUS).includes(status)) {
    where.status = status;
  }

  // Filter by type
  if (type && Object.values(INVOICE_TYPES).includes(type)) {
    where.type = type;
  }

  // Filter by client
  if (clientId) {
    where.clientId = clientId;
  }

  // Filter by user (only for admins/managers)
  if (userId && hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = userId;
  }

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Build orderBy clause
  const orderBy = {};
  if (sortBy === 'client') {
    orderBy.client = { companyName: sortOrder };
  } else if (sortBy === 'user') {
    orderBy.user = { firstName: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  // Get invoices with pagination
  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        subtotal: true,
        taxPercentage: true,
        taxAmount: true,
        gstPercentage: true,
        gstAmount: true,
        pstPercentage: true,
        pstAmount: true,
        combinedTaxAmount: true,
        totalAmount: true,
        dueDate: true,
        paidDate: true,
        emailSent: true,
        emailSentAt: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            title: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    }),
    prisma.invoice.count({ where })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      invoices,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPreviousPage
      }
    }
  });
});

// Get invoice by ID with detailed information
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          taxId: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      quotation: {
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          description: true,
          formData: true,
          validUntil: true,
          notes: true
        }
      }
    }
  });

  if (!invoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: { invoice }
  });
});


// const autoGenerateInvoiceForQuotation = async (quotationId, userId = null, type = INVOICE_TYPES.TAX_INVOICE_1, gstRate = null, pstRate = null) => {
//   try {
//     // ✅ Get both tax and invoice settings from database
//     const { settingsService } = require('../services/settingsService');
//     const [taxSettings, invoiceSettings] = await Promise.all([
//       settingsService.getTaxSettings(),
//       settingsService.getInvoiceSettings()
//     ]);

//     // Use settings for tax rates if not provided
//     if (gstRate === null || pstRate === null) {
//       gstRate = gstRate ?? taxSettings.defaultGstRate ?? 5;
//       pstRate = pstRate ?? taxSettings.defaultPstRate ?? 7;
//       console.log(`Using tax settings - GST: ${gstRate}%, PST: ${pstRate}%`);
//     }

//     // ✅ Use settings for due date
//     const dueDays = invoiceSettings.defaultDueDays || 30;
//     console.log(`Using invoice settings - Due Days: ${dueDays}`);

//     // Get quotation details
//     const quotation = await prisma.quotation.findUnique({
//       where: { id: quotationId },
//       include: {
//         client: {
//           select: { id: true, companyName: true, email: true }
//         }
//       }
//     });

//     if (!quotation) {
//       throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
//     }

//     if (quotation.status !== 'APPROVED') {
//       throw new AppError('Can only create invoices from approved quotations', STATUS_CODES.BAD_REQUEST);
//     }

//     // Check if invoice already exists for this quotation with this type
//     const existingInvoice = await prisma.invoice.findFirst({
//       where: { quotationId, type }
//     });

//     if (existingInvoice) {
//       console.log(`Invoice already exists for quotation ${quotation.quotationNumber} with type ${type}`);
//       return existingInvoice;
//     }

//     // ✅ Generate invoice number using settings
//     const invoiceNumber = await generateInvoiceNumberWithSettings(type, invoiceSettings);

//     // ✅ Calculate due date using settings instead of hardcoded 30 days
//     const dueDate = new Date();
//     dueDate.setDate(dueDate.getDate() + dueDays);

//     // Use the quotation creator's userId if no specific userId provided
//     const creatorUserId = userId || quotation.userId;

//     // Calculate tax amounts with database settings
//     const taxCalculations = calculateTaxAmounts(quotation.subtotal, gstRate, pstRate, 'GST_AND_PST');

//     // Create invoice
//     const invoice = await prisma.invoice.create({
//       data: {
//         invoiceNumber,
//         quotationId,
//         clientId: quotation.clientId,
//         userId: creatorUserId,
//         type,
//         subtotal: quotation.subtotal,
//         // Legacy fields for backward compatibility
//         taxPercentage: gstRate + pstRate,
//         taxAmount: taxCalculations.combinedTaxAmount,
//         // New GST fields
//         gstPercentage: gstRate,
//         gstAmount: taxCalculations.gstAmount,
//         // New PST fields
//         pstPercentage: pstRate,
//         pstAmount: taxCalculations.pstAmount,
//         // Combined fields
//         combinedTaxAmount: taxCalculations.combinedTaxAmount,
//         totalAmount: taxCalculations.totalAmount,
//         status: INVOICE_STATUS.PENDING,
//         dueDate, // ✅ Now uses settings
//         emailSent: false
//       },
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

//     console.log(`Auto-generated invoice ${invoiceNumber} for quotation ${quotation.quotationNumber} with ${dueDays} days due date`);

//     // ✅ Auto-send email if enabled in settings
//     if (invoiceSettings.autoSendEmail && invoice.client.email) {
//       try {
//         const { sendInvoiceEmail: sendInvoiceEmailService } = require('../services/emailService');
//         await sendInvoiceEmailService(invoice, invoice.client, invoice.quotation);
        
//         // Update invoice to mark as sent
//         await prisma.invoice.update({
//           where: { id: invoice.id },
//           data: {
//             status: INVOICE_STATUS.SENT,
//             emailSent: true,
//             emailSentAt: new Date()
//           }
//         });
        
//         console.log(`Auto-sent invoice ${invoiceNumber} to ${invoice.client.email}`);
//       } catch (emailError) {
//         console.error('Failed to auto-send invoice email:', emailError);
//       }
//     }
    
//     return invoice;
//   } catch (error) {
//     console.error('Error auto-generating invoice:', error);
//     throw error;
//   }
// };

const autoGenerateInvoiceForQuotation = async (
  quotationId, 
  userId = null, 
  type = INVOICE_TYPES.TAX_INVOICE_1, 
  gstRate = null, 
  pstRate = null,
  skipAutoEmail = false  // ✅ NEW: Skip auto-email for bulk operations
) => {
  try {
    // Get both tax and invoice settings from database
    const { settingsService } = require('../services/settingsService');
    const [taxSettings, invoiceSettings] = await Promise.all([
      settingsService.getTaxSettings(),
      settingsService.getInvoiceSettings()
    ]);

    // Use settings for tax rates if not provided
    if (gstRate === null || pstRate === null) {
      gstRate = gstRate ?? taxSettings.defaultGstRate ?? 5;
      pstRate = pstRate ?? taxSettings.defaultPstRate ?? 7;
      console.log(`Using tax settings - GST: ${gstRate}%, PST: ${pstRate}%`);
    }

    // Use settings for due date
    const dueDays = invoiceSettings.defaultDueDays || 30;
    console.log(`Using invoice settings - Due Days: ${dueDays}`);

    // Get quotation details
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        client: {
          select: { id: true, companyName: true, email: true }
        }
      }
    });

    if (!quotation) {
      throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
    }

    if (quotation.status !== 'APPROVED') {
      throw new AppError('Can only create invoices from approved quotations', STATUS_CODES.BAD_REQUEST);
    }

    // Check if invoice already exists for this quotation with this type
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quotationId, type }
    });

    if (existingInvoice) {
      console.log(`Invoice already exists for quotation ${quotation.quotationNumber} with type ${type}`);
      return existingInvoice;
    }

    // Generate invoice number using settings
    const invoiceNumber = await generateInvoiceNumberWithSettings(type, invoiceSettings);

    // Calculate due date using settings
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Use the quotation creator's userId if no specific userId provided
    const creatorUserId = userId || quotation.userId;

    // Calculate tax amounts with database settings
    const taxCalculations = calculateTaxAmounts(quotation.subtotal, gstRate, pstRate, 'GST_AND_PST');

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quotationId,
        clientId: quotation.clientId,
        userId: creatorUserId,
        type,
        subtotal: quotation.subtotal,
        // Legacy fields for backward compatibility
        taxPercentage: gstRate + pstRate,
        taxAmount: taxCalculations.combinedTaxAmount,
        // New GST fields
        gstPercentage: gstRate,
        gstAmount: taxCalculations.gstAmount,
        // New PST fields
        pstPercentage: pstRate,
        pstAmount: taxCalculations.pstAmount,
        // Combined fields
        combinedTaxAmount: taxCalculations.combinedTaxAmount,
        totalAmount: taxCalculations.totalAmount,
        status: INVOICE_STATUS.PENDING,
        dueDate,
        emailSent: false
      },
      include: {
        client: {
          select: {
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        quotation: {
          select: {
            quotationNumber: true,
            title: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`Auto-generated invoice ${invoiceNumber} for quotation ${quotation.quotationNumber} with ${dueDays} days due date`);

    // ✅ UPDATED: Only auto-send email if not skipped
    if (!skipAutoEmail && invoiceSettings.autoSendEmail && invoice.client.email) {
      try {
        const { sendInvoiceEmail: sendInvoiceEmailService } = require('../services/emailService');
        await sendInvoiceEmailService(invoice, invoice.client, invoice.quotation);
        
        // Update invoice to mark as sent
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: INVOICE_STATUS.SENT,
            emailSent: true,
            emailSentAt: new Date()
          }
        });
        
        console.log(`Auto-sent invoice ${invoiceNumber} to ${invoice.client.email}`);
      } catch (emailError) {
        console.error('Failed to auto-send invoice email:', emailError);
      }
    } else if (skipAutoEmail) {
      console.log(`Skipping auto-send for invoice ${invoiceNumber} (bulk operation)`);
    }
    
    return invoice;
  } catch (error) {
    console.error('Error auto-generating invoice:', error);
    throw error;
  }
};

const createInvoiceFromQuotation = async ({ quotationId, type, userId, gstRate = null, pstRate = null }) => {
  // ✅ Get invoice settings for due date and other settings
  const { settingsService } = require('../services/settingsService');
  const [taxSettings, invoiceSettings] = await Promise.all([
    settingsService.getTaxSettings(),
    settingsService.getInvoiceSettings()
  ]);

  // Get tax settings if not provided
  if (gstRate === null || pstRate === null) {
    gstRate = gstRate ?? taxSettings.defaultGstRate ?? 5;
    pstRate = pstRate ?? taxSettings.defaultPstRate ?? 7;
  }

  const dueDays = invoiceSettings.defaultDueDays || 30;
  console.log(`Using invoice settings - Due Days: ${dueDays}`);

  // Get quotation details
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: {
        select: { id: true, companyName: true, email: true }
      }
    }
  });

  if (!quotation) {
    throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
  }

  if (quotation.status !== 'APPROVED') {
    throw new AppError('Can only create invoices from approved quotations', STATUS_CODES.BAD_REQUEST);
  }

  // Check if invoice of this type already exists for this quotation
  const existingInvoice = await prisma.invoice.findFirst({
    where: { quotationId, type }
  });

  if (existingInvoice) {
    throw new AppError(`${type} invoice already exists for this quotation`, STATUS_CODES.CONFLICT);
  }

  // ✅ Generate invoice number using settings
  const invoiceNumber = await generateInvoiceNumberWithSettings(type, invoiceSettings);

  // ✅ Calculate due date using settings
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  // Calculate tax amounts with provided or default rates
  const taxCalculations = calculateTaxAmounts(quotation.subtotal, gstRate, pstRate, 'GST_AND_PST');

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      quotationId,
      clientId: quotation.clientId,
      userId,
      type,
      subtotal: quotation.subtotal,
      // Legacy fields for backward compatibility
      taxPercentage: gstRate + pstRate,
      taxAmount: taxCalculations.combinedTaxAmount,
      // New GST fields
      gstPercentage: gstRate,
      gstAmount: taxCalculations.gstAmount,
      // New PST fields
      pstPercentage: pstRate,
      pstAmount: taxCalculations.pstAmount,
      // Combined fields
      combinedTaxAmount: taxCalculations.combinedTaxAmount,
      totalAmount: taxCalculations.totalAmount,
      status: INVOICE_STATUS.PENDING,
      dueDate, // ✅ Now uses settings
      emailSent: false
    },
    include: {
      client: {
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      },
      quotation: {
        select: {
          quotationNumber: true,
          title: true
        }
      }
    }
  });

  return invoice;
};


// const generateInvoiceNumberWithSettings = async (type, invoiceSettings = null) => {
//   // Get invoice settings if not provided
//   if (!invoiceSettings) {
//     const { settingsService } = require('../services/settingsService');
//     invoiceSettings = await settingsService.getInvoiceSettings();
//   }

//   const year = new Date().getFullYear();
//   const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
//   // Count invoices of this type in current month
//   const startOfMonth = new Date(year, new Date().getMonth(), 1);
//   const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
  
//   const count = await prisma.invoice.count({
//     where: {
//       type,
//       createdAt: {
//         gte: startOfMonth,
//         lte: endOfMonth
//       }
//     }
//   });

//   // ✅ Use settings for starting number and prefix
//   const startingNumber = invoiceSettings.startingNumber || 1000;
//   const prefix = invoiceSettings.sequencePrefix || 'INV-';
  
//   const sequence = String(startingNumber + count).padStart(4, '0');
//   const typePrefix = type.replace('TAX_INVOICE_', prefix.replace('-', ''));
  
//   return `${typePrefix}-${year}${month}-${sequence}`;
// };

// 4. ✅ UPDATE the original generateInvoiceNumber to use settings (REPLACE THE EXISTING FUNCTION)

// const generateInvoiceNumber = async (type) => {
//   return generateInvoiceNumberWithSettings(type);
// };

const generateInvoiceNumberWithSettings = async (type, invoiceSettings = null) => {
  // Get invoice settings if not provided
  if (!invoiceSettings) {
    const { settingsService } = require('../services/settingsService');
    invoiceSettings = await settingsService.getInvoiceSettings();
  }

  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Use timestamp + random for uniqueness during bulk operations
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  // Count invoices of this type in current month
  const startOfMonth = new Date(year, new Date().getMonth(), 1);
  const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
  
  const count = await prisma.invoice.count({
    where: {
      type,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  // Use settings for starting number and prefix
  const startingNumber = invoiceSettings.startingNumber || 1000;
  const prefix = invoiceSettings.sequencePrefix || 'INV-';
  
  // Add timestamp suffix to ensure uniqueness
  const sequence = String(startingNumber + count).padStart(4, '0');
  const typePrefix = type.replace('TAX_INVOICE_', prefix.replace('-', ''));
  
  // Add timestamp and random to make it unique
  return `${typePrefix}-${year}${month}-${sequence}${random}`;
};

const shouldAutoGenerateInvoice = async () => {
  try {
    const { settingsService } = require('../services/settingsService');
    const invoiceSettings = await settingsService.getInvoiceSettings();
    return invoiceSettings.autoGenerateOnApproval !== false; // Default to true
  } catch (error) {
    console.error('Failed to check auto-generation setting:', error);
    return true; // Default to enabled
  }
};

const getInvoiceGenerationSettings = async () => {
  try {
    const { settingsService } = require('../services/settingsService');
    const [invoiceSettings, taxSettings] = await Promise.all([
      settingsService.getInvoiceSettings(),
      settingsService.getTaxSettings()
    ]);
    
    return {
      dueDays: invoiceSettings.defaultDueDays || 30,
      gstRate: taxSettings.defaultGstRate || 5,
      pstRate: taxSettings.defaultPstRate || 7,
      autoSendEmail: invoiceSettings.autoSendEmail || false,
      autoGenerateOnApproval: invoiceSettings.autoGenerateOnApproval !== false, // Default true
      paymentTerms: invoiceSettings.defaultPaymentTerms || 'Net 30 Days',
      footerText: invoiceSettings.footerText || 'Thank you for your business!',
      prefix: invoiceSettings.sequencePrefix || 'INV-',
      startingNumber: invoiceSettings.startingNumber || 1000
    };
  } catch (error) {
    console.error('Failed to get invoice generation settings, using defaults:', error);
    return {
      dueDays: 30,
      gstRate: 5,
      pstRate: 7,
      autoSendEmail: false,
      autoGenerateOnApproval: true,
      paymentTerms: 'Net 30 Days',
      footerText: 'Thank you for your business!',
      prefix: 'INV-',
      startingNumber: 1000
    };
  }
};


const createInvoice = asyncHandler(async (req, res) => {
  const { 
    quotationId, 
    type, 
    dueDate, 
    gstPercentage, 
    pstPercentage 
  } = req.body;

  // Validate invoice type
  if (!Object.values(INVOICE_TYPES).includes(type)) {
    throw new AppError('Invalid invoice type', STATUS_CODES.BAD_REQUEST);
  }

  // Get tax settings if rates not provided
  let gstRate = gstPercentage;
  let pstRate = pstPercentage;

  if (gstRate === undefined || pstRate === undefined) {
    const { settingsService } = require('../services/settingsService');
    const taxSettings = await settingsService.getTaxSettings();
    gstRate = gstRate ?? taxSettings.defaultGstRate ?? 5;
    pstRate = pstRate ?? taxSettings.defaultPstRate ?? 7;
    
    console.log(`Using default tax settings - GST: ${gstRate}%, PST: ${pstRate}%`);
  }

  // Validate tax rates
  gstRate = parseFloat(gstRate);
  pstRate = parseFloat(pstRate);
  
  if (gstRate < 0 || gstRate > 100) {
    throw new AppError('GST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
  }
  
  if (pstRate < 0 || pstRate > 100) {
    throw new AppError('PST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
  }

  // Check if quotation exists and is approved
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { 
      id: true, 
      status: true, 
      quotationNumber: true,
      clientId: true,
      subtotal: true
    }
  });

  if (!quotation) {
    throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
  }

  if (quotation.status !== 'APPROVED') {
    throw new AppError('Can only create invoices from approved quotations', STATUS_CODES.BAD_REQUEST);
  }

  // Check if invoice of this type already exists for this quotation
  const existingInvoice = await prisma.invoice.findFirst({
    where: { quotationId, type }
  });

  if (existingInvoice) {
    throw new AppError(`${type} invoice already exists for this quotation`, STATUS_CODES.CONFLICT);
  }

  // Create invoice with tax rates
  const invoiceData = {
    quotationId,
    type,
    userId: req.user.id,
    gstRate,
    pstRate
  };

  const invoice = await createInvoiceFromQuotation(invoiceData);

  // If custom due date was provided, update the invoice
  if (dueDate) {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { dueDate: new Date(dueDate) },
      include: {
        client: {
          select: {
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        quotation: {
          select: {
            quotationNumber: true,
            title: true
          }
        }
      }
    });
    
    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.CREATED,
      data: { 
        invoice: updatedInvoice,
        appliedTaxRates: {
          gst: gstRate,
          pst: pstRate,
          source: gstPercentage !== undefined ? 'provided' : 'settings'
        }
      }
    });
  } else {
    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.CREATED,
      data: { 
        invoice,
        appliedTaxRates: {
          gst: gstRate,
          pst: pstRate,
          source: gstPercentage !== undefined ? 'provided' : 'settings'
        }
      }
    });
  }
});

const getTaxSettingsForInvoice = async () => {
  try {
    const { settingsService } = require('../services/settingsService');
    const taxSettings = await settingsService.getTaxSettings();
    return {
      gstRate: taxSettings.defaultGstRate ?? 5,
      pstRate: taxSettings.defaultPstRate ?? 7,
      autoCalculation: taxSettings.enableAutoTaxCalculation ?? true
    };
  } catch (error) {
    console.error('Failed to get tax settings, using defaults:', error);
    return {
      gstRate: 5,
      pstRate: 7,
      autoCalculation: true
    };
  }
};

// Update invoice - Enhanced with dynamic tax rates
const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    dueDate, 
    paidDate, 
    gstPercentage, 
    pstPercentage 
  } = req.body;

  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  // Check if invoice exists and user has permission
  const existingInvoice = await prisma.invoice.findFirst({
    where,
    select: { 
      id: true, 
      status: true, 
      invoiceNumber: true, 
      paidDate: true,
      subtotal: true,
      gstPercentage: true,
      pstPercentage: true
    }
  });

  if (!existingInvoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Prepare update data
  const updateData = {
    updatedAt: new Date()
  };

  if (status !== undefined) {
    if (!Object.values(INVOICE_STATUS).includes(status)) {
      throw new AppError('Invalid invoice status', STATUS_CODES.BAD_REQUEST);
    }
    updateData.status = status;
    
    // Set paid date automatically when status is PAID
    if (status === INVOICE_STATUS.PAID && !existingInvoice.paidDate) {
      updateData.paidDate = new Date();
    }
    
    // Clear paid date if status is not PAID
    if (status !== INVOICE_STATUS.PAID && existingInvoice.paidDate) {
      updateData.paidDate = null;
    }
  }

  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (paidDate !== undefined) {
    updateData.paidDate = paidDate ? new Date(paidDate) : null;
    
    // If paidDate is set, automatically set status to PAID
    if (paidDate && status !== INVOICE_STATUS.PAID) {
      updateData.status = INVOICE_STATUS.PAID;
    }
  }

  // Handle tax rate updates
  if (gstPercentage !== undefined || pstPercentage !== undefined) {
    const newGstRate = gstPercentage !== undefined ? parseFloat(gstPercentage) : existingInvoice.gstPercentage;
    const newPstRate = pstPercentage !== undefined ? parseFloat(pstPercentage) : existingInvoice.pstPercentage;
    
    // Validate tax rates
    if (newGstRate < 0 || newGstRate > 100) {
      throw new AppError('GST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
    }
    
    if (newPstRate < 0 || newPstRate > 100) {
      throw new AppError('PST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
    }

    // Recalculate tax amounts with new rates
    const taxCalculations = calculateTaxAmounts(
      existingInvoice.subtotal, 
      newGstRate, 
      newPstRate, 
      'GST_AND_PST'
    );

    // Update tax fields
    updateData.gstPercentage = newGstRate;
    updateData.gstAmount = taxCalculations.gstAmount;
    updateData.pstPercentage = newPstRate;
    updateData.pstAmount = taxCalculations.pstAmount;
    updateData.combinedTaxAmount = taxCalculations.combinedTaxAmount;
    updateData.totalAmount = taxCalculations.totalAmount;
    
    // Update legacy fields for backward compatibility
    updateData.taxPercentage = newGstRate + newPstRate;
    updateData.taxAmount = taxCalculations.combinedTaxAmount;
  }

  // Update invoice
  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      },
      quotation: {
        select: {
          quotationNumber: true,
          title: true
        }
      }
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.UPDATED,
    data: { invoice: updatedInvoice }
  });
});

// Send invoice via email
// const sendInvoiceEmail = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   // Build where clause based on user permissions
//   const where = { id };
//   const { hasPermission } = require('../middleware/permissions');
//   if (!hasPermission(req.user.role, 'invoices:read_all')) {
//     where.userId = req.user.id;
//   }

//   // Check if invoice exists
//   const invoice = await prisma.invoice.findFirst({
//     where,
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       quotation: {
//         select: {
//           quotationNumber: true,
//           title: true
//         }
//       }
//     }
//   });

//   if (!invoice) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   if (!invoice.client.email) {
//     throw new AppError('Client email not found', STATUS_CODES.BAD_REQUEST);
//   }

//   try {
//     // Send email using email service
//     await sendInvoiceEmailService(invoice, invoice.client, invoice.quotation);
    
//     // Update invoice status
//     const updatedInvoice = await prisma.invoice.update({
//       where: { id },
//       data: {
//         status: INVOICE_STATUS.SENT,
//         emailSent: true,
//         emailSentAt: new Date(),
//         updatedAt: new Date()
//       }
//     });

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: 'Invoice sent successfully',
//       data: { invoice: updatedInvoice }
//     });

//   } catch (error) {
//     console.error('Email sending error:', error);
//     throw new AppError('Failed to send invoice email', STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

const sendInvoiceEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  // Check if invoice exists
  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      client: {
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      },
      quotation: {
        select: {
          quotationNumber: true,
          title: true
        }
      }
    }
  });

  if (!invoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  if (!invoice.client.email) {
    throw new AppError('Client email not found', STATUS_CODES.BAD_REQUEST);
  }

  try {
    console.log(`📧 Sending invoice email for ${invoice.invoiceNumber} to ${invoice.client.email}...`);

    // INLINE EMAIL SENDING - Same pattern as quotation emails
    const { settingsService } = require('../services/settingsService');
    const nodemailer = require('nodemailer');

    // Get email and company settings
    const [emailSettings, companySettings] = await Promise.all([
      settingsService.getEmailSettings(),
      settingsService.getCompanySettings()
    ]);

    // Initialize email transporter
    const transporter = nodemailer.createTransport({  // ✅ Fixed method name
      host: emailSettings.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: emailSettings.port || process.env.EMAIL_PORT || 587,
      secure: emailSettings.secure || process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailSettings.username || process.env.EMAIL_USER,
        pass: emailSettings.password || process.env.EMAIL_PASS
      }
    });

    // Helper functions for data formatting
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

    // Prepare template data
    const templateData = {
      clientName: getClientName(invoice.client),
      clientCompany: invoice.client.companyName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.type.replace(/_/g, ' '),
      quotationNumber: invoice.quotation?.quotationNumber || 'N/A',
      quotationTitle: invoice.quotation?.title || 'N/A',
      subtotal: formatCurrency(invoice.subtotal),
      gstPercentage: toNumber(invoice.gstPercentage).toFixed(2),
      pstPercentage: toNumber(invoice.pstPercentage).toFixed(2),
      gstAmount: formatCurrency(invoice.gstAmount || 0),
      pstAmount: formatCurrency(invoice.pstAmount || 0),
      totalAmount: formatCurrency(invoice.totalAmount),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified',
      sentDate: new Date().toLocaleDateString(),
      companyName: companySettings.name || 'Your Company',
      currentYear: new Date().getFullYear()
    };

    // PRIORITY 1: Try to get invoice_sent template from database
    let emailSubject = `Invoice ${templateData.invoiceNumber} - Payment Required`;
    let emailHtml = '';
    let usedDatabaseTemplate = false;

    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          templateKey: 'invoice_sent',
          enabled: true
        }
      });

      if (template) {
        console.log(`✅ Using database template for invoice ${invoice.invoiceNumber}`);
        
        emailSubject = template.subject;
        emailHtml = template.htmlContent;
        
        // Replace template variables
        Object.keys(templateData).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          emailSubject = emailSubject.replace(regex, templateData[key]);
          emailHtml = emailHtml.replace(regex, templateData[key]);
        });
        
        usedDatabaseTemplate = true;
      } else {
        throw new Error('Template not found');
      }
    } catch (templateError) {
      console.warn(`⚠️ Database template not found for invoice ${invoice.invoiceNumber}, using fallback`);
      
      // PRIORITY 2: Professional fallback template
      emailSubject = `Invoice ${templateData.invoiceNumber} - Payment Required`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #dc2626; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📄 Invoice Ready</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${templateData.clientName},</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              Please find your invoice attached. Payment is requested within the specified due date.
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Invoice Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Invoice Type:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.invoiceType}</td>
                </tr>
                ${templateData.quotationNumber !== 'N/A' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Related Quotation:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationNumber}</td>
                </tr>
                ` : ''}
                ${templateData.quotationTitle !== 'N/A' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Project:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationTitle}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subtotal:</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.subtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">GST (${templateData.gstPercentage}%):</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.gstAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">PST (${templateData.pstPercentage}%):</td>
                  <td style="padding: 8px 0; color: #6b7280;">${templateData.pstAmount}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-weight: bold; color: #374151; font-size: 18px;">Total Amount Due:</td>
                  <td style="padding: 12px 0; color: #dc2626; font-weight: bold; font-size: 20px;">${templateData.totalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Due Date:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${templateData.dueDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
              <p style="color: #dc2626; margin: 0; font-weight: 500;">
                <strong>💰 Payment Instructions:</strong> Please review the attached invoice and process payment by the due date. Contact us if you have any questions about the charges or payment methods.
              </p>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0284c7;">
              <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                <strong>📎 Invoice Attachment:</strong> The detailed invoice is attached as a PDF document. Please save this for your records.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
              Thank you for your business! If you have any questions about this invoice, please don't hesitate to contact us.
            </p>
            
            <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
              <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
              <p style="color: #dc2626; margin: 5px 0 0 0; font-weight: bold;">${templateData.companyName} Billing Department</p>
            </div>
          </div>
          
          <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">&copy; ${templateData.currentYear} ${templateData.companyName}. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Invoice sent on ${templateData.sentDate}</p>
          </div>
        </div>
      `;
    }

    // Send invoice email
    const mailOptions = {
      from: {
        name: emailSettings.fromName || companySettings.name || 'Invoice Management System',
        address: emailSettings.fromEmail || emailSettings.username || process.env.EMAIL_FROM
      },
      to: invoice.client.email,
      subject: emailSubject,
      html: emailHtml,
      replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Invoice email sent successfully to ${invoice.client.email} (${info.messageId})`);

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: INVOICE_STATUS.SENT,
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Invoice sent successfully to ${invoice.client.email}`,
      data: { 
        invoice: updatedInvoice,
        emailDetails: {
          sentTo: invoice.client.email,
          messageId: info.messageId,
          templateSource: usedDatabaseTemplate ? 'database' : 'fallback'
        }
      }
    });

  } catch (error) {
    console.error('❌ Invoice email sending error:', error);
    throw new AppError('Failed to send invoice email', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Delete invoice
const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  // Check if invoice exists
  const existingInvoice = await prisma.invoice.findFirst({
    where,
    select: { 
      id: true, 
      status: true,
      invoiceNumber: true
    }
  });

  if (!existingInvoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Check if invoice can be deleted
  if (existingInvoice.status === INVOICE_STATUS.PAID) {
    throw new AppError('Cannot delete paid invoice', STATUS_CODES.BAD_REQUEST);
  }

  // Delete invoice
  await prisma.invoice.delete({
    where: { id }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.DELETED,
    data: { invoiceNumber: existingInvoice.invoiceNumber }
  });
});

// Get invoice statistics
const getInvoiceStatistics = asyncHandler(async (req, res) => {
  // Build where clause based on user permissions
  const where = {};
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  const [statusStats, typeStats, monthlyStats, overdueCount] = await Promise.all([
    // Statistics by status
    prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
      _sum: { totalAmount: true }
    }),

    // Statistics by type
    prisma.invoice.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
      _sum: { totalAmount: true }
    }),

    // Monthly statistics (last 12 months)
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        SUM("totalAmount") as total_amount,
        AVG("totalAmount") as avg_amount
      FROM invoices 
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
      ${!hasPermission(req.user.role, 'invoices:read_all') ? prisma.$queryRaw`AND "userId" = ${req.user.id}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,

    // Overdue invoices count
    prisma.invoice.count({
      where: {
        ...where,
        status: { notIn: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
        dueDate: { lt: new Date() }
      }
    })
  ]);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      statusStatistics: statusStats,
      typeStatistics: typeStats,
      monthlyStatistics: monthlyStats,
      overdueCount: overdueCount
    }
  });
});

const generateInvoicePDFController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    taxType = 'GST_AND_PST',
    customGstRate,
    customPstRate
  } = req.query;

  // Validate tax type
  if (!Object.values(INVOICE_TAX_TYPES).includes(taxType)) {
    throw new AppError('Invalid tax type', STATUS_CODES.BAD_REQUEST);
  }

  // Build where clause based on user permissions
  const where = { id };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  // Get invoice with full details
  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      client: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      quotation: {
        select: {
          quotationNumber: true,
          title: true,
          description: true,
          notes: true
        }
      }
    }
  });

  if (!invoice) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  try {
    // Use custom rates if provided, otherwise use invoice's saved rates
    const gstRate = customGstRate ? parseFloat(customGstRate) : parseFloat(invoice.gstPercentage);
    const pstRate = customPstRate ? parseFloat(customPstRate) : parseFloat(invoice.pstPercentage);

    // Create a modified invoice object with custom tax calculations for PDF
    const modifiedInvoice = {
      ...invoice,
      gstPercentage: gstRate,
      pstPercentage: pstRate
    };

    // Calculate tax amounts based on selected type and rates
    const taxCalculations = calculateTaxAmounts(invoice.subtotal, gstRate, pstRate, taxType);
    modifiedInvoice.gstAmount = taxCalculations.gstAmount;
    modifiedInvoice.pstAmount = taxCalculations.pstAmount;
    modifiedInvoice.combinedTaxAmount = taxCalculations.combinedTaxAmount;
    modifiedInvoice.totalAmount = taxCalculations.totalAmount;

    // Generate PDF - Company data is now loaded from database automatically
    const pdfResult = await generateInvoicePDF(
      modifiedInvoice,
      invoice.client,
      invoice.quotation,
      taxType  // Only 4 parameters now, company data loaded from settings
    );

    // Send PDF as download
    downloadPDFResponse(res, pdfResult.pdf, pdfResult.filename);

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new AppError('Failed to generate PDF', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Get tax rate presets
const getTaxPresets = asyncHandler(async (req, res) => {
  const taxPresets = [
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
    },
    {
      id: 'us_sales_tax',
      name: 'US Sales Tax (Average)',
      description: 'Average US sales tax rate',
      gstRate: 0,
      pstRate: 8.5,
      region: 'United States'
    },
    {
      id: 'uk_vat',
      name: 'UK VAT',
      description: 'Standard UK VAT rate',
      gstRate: 20,
      pstRate: 0,
      region: 'United Kingdom'
    },
    {
      id: 'custom_low',
      name: 'Low Tax Rate',
      description: 'Custom low tax configuration',
      gstRate: 3,
      pstRate: 2,
      region: 'Custom'
    },
    {
      id: 'custom_high',
      name: 'High Tax Rate',
      description: 'Custom high tax configuration',
      gstRate: 10,
      pstRate: 8,
      region: 'Custom'
    }
  ];

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Tax presets fetched successfully',
    data: { presets: taxPresets }
  });
});

// Bulk update tax rates
const bulkUpdateTaxRates = asyncHandler(async (req, res) => {
  const { invoiceIds, gstPercentage, pstPercentage } = req.body;

  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    throw new AppError('Invoice IDs array is required', STATUS_CODES.BAD_REQUEST);
  }

  const gstRate = parseFloat(gstPercentage);
  const pstRate = parseFloat(pstPercentage);
  
  if (gstRate < 0 || gstRate > 100) {
    throw new AppError('GST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
  }
  
  if (pstRate < 0 || pstRate > 100) {
    throw new AppError('PST rate must be between 0 and 100', STATUS_CODES.BAD_REQUEST);
  }

  // Build where clause based on user permissions
  const where = { id: { in: invoiceIds } };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  try {
    // Get all invoices to update
    const invoices = await prisma.invoice.findMany({
      where,
      select: { id: true, subtotal: true }
    });

    const updatePromises = invoices.map(invoice => {
      const taxCalculations = calculateTaxAmounts(
        invoice.subtotal, 
        gstRate, 
        pstRate, 
        'GST_AND_PST'
      );

      return prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          gstPercentage: gstRate,
          gstAmount: taxCalculations.gstAmount,
          pstPercentage: pstRate,
          pstAmount: taxCalculations.pstAmount,
          combinedTaxAmount: taxCalculations.combinedTaxAmount,
          totalAmount: taxCalculations.totalAmount,
          taxPercentage: gstRate + pstRate, // Legacy compatibility
          taxAmount: taxCalculations.combinedTaxAmount, // Legacy compatibility
          updatedAt: new Date()
        }
      });
    });

    await Promise.all(updatePromises);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Tax rates updated for ${invoices.length} invoices successfully`,
      data: { updatedCount: invoices.length }
    });

  } catch (error) {
    console.error('Bulk tax rate update error:', error);
    throw new AppError('Failed to update tax rates', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Bulk actions for invoices
const bulkInvoiceActions = asyncHandler(async (req, res) => {
  const { invoiceIds, action } = req.body;

  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    throw new AppError('Invoice IDs array is required', STATUS_CODES.BAD_REQUEST);
  }

  if (!['send', 'mark_paid', 'cancel', 'delete'].includes(action)) {
    throw new AppError('Invalid action. Must be send, mark_paid, cancel, or delete', STATUS_CODES.BAD_REQUEST);
  }

  // Build where clause based on user permissions
  const where = { id: { in: invoiceIds } };
  const { hasPermission } = require('../middleware/permissions');
  if (!hasPermission(req.user.role, 'invoices:read_all')) {
    where.userId = req.user.id;
  }

  let result;
  let actionMessage = '';

  try {
    switch (action) {
      case 'send':
        result = await prisma.invoice.updateMany({
          where: {
            ...where,
            status: { notIn: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] }
          },
          data: {
            status: INVOICE_STATUS.SENT,
            emailSent: true,
            emailSentAt: new Date(),
            updatedAt: new Date()
          }
        });
        actionMessage = 'sent';
        break;

      case 'mark_paid':
        result = await prisma.invoice.updateMany({
          where: {
            ...where,
            status: { not: INVOICE_STATUS.PAID }
          },
          data: {
            status: INVOICE_STATUS.PAID,
            paidDate: new Date(),
            updatedAt: new Date()
          }
        });
        actionMessage = 'marked as paid';
        break;

      case 'cancel':
        result = await prisma.invoice.updateMany({
          where: {
            ...where,
            status: { not: INVOICE_STATUS.PAID }
          },
          data: {
            status: INVOICE_STATUS.CANCELLED,
            updatedAt: new Date()
          }
        });
        actionMessage = 'cancelled';
        break;

      case 'delete':
        result = await prisma.invoice.deleteMany({
          where: {
            ...where,
            status: { not: INVOICE_STATUS.PAID }
          }
        });
        actionMessage = 'deleted';
        break;
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `${result.count} invoices ${actionMessage} successfully`,
      data: { affectedCount: result.count }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    throw new AppError(`Failed to perform bulk ${action}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  createInvoiceFromQuotation,
  autoGenerateInvoiceForQuotation,
  updateInvoice,
  sendInvoiceEmail,
  deleteInvoice,
  getInvoiceStatistics,
  generateInvoicePDFController,
  getTaxPresets,
  bulkUpdateTaxRates,
  bulkInvoiceActions,
  calculateTaxAmounts,
  sendInvoiceEmailWithTax,
  INVOICE_TAX_TYPES
};