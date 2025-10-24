const nodemailer = require('nodemailer');
const { settingsService } = require('./settingsService');
const { prisma } = require('../config/database');

// Email transporter
let transporter;

// Initialize email transporter with database settings
const initializeTransporter = async () => {
  try {
    const emailSettings = await settingsService.getEmailSettings();
    
    const config = {
      host: emailSettings.host || 'smtp.gmail.com',
      port: emailSettings.port || 587,
      secure: emailSettings.secure || false,
      auth: {
        user: emailSettings.username,
        pass: emailSettings.password
      }
    };

    // Development fallback
    if (process.env.NODE_ENV === 'development' && !emailSettings.username) {
      config.host = 'smtp.ethereal.email';
      config.port = 587;
      config.secure = false;
      config.auth = {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.password'
      };
      console.log('⚠️  Using Ethereal Email for development. Configure email settings in System Settings.');
    }

    transporter = nodemailer.createTransport(config);

    // Verify transporter
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error);
    return null;
  }
};

// Get or create transporter
const getTransporter = async () => {
  return await initializeTransporter();
};

// Get email template from database
const getEmailTemplate = async (templateKey) => {
  try {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        templateKey: templateKey,
        enabled: true
      }
    });

    if (!template) {
      console.warn(`Email template '${templateKey}' not found in database`);
      return null;
    }

    return template;
  } catch (error) {
    console.error(`Error fetching email template '${templateKey}':`, error);
    return null;
  }
};

// Replace template variables with actual data
const replaceVariables = (content, data, companyData) => {
  if (!content) return '';

  let result = content;
  
  // Replace company variables
  if (companyData) {
    result = result.replace(/\{\{companyName\}\}/g, companyData.name || 'Your Company');
    result = result.replace(/\{\{companyAddress\}\}/g, companyData.address || '');
    result = result.replace(/\{\{companyPhone\}\}/g, companyData.phone || '');
    result = result.replace(/\{\{companyEmail\}\}/g, companyData.email || '');
    result = result.replace(/\{\{companyWebsite\}\}/g, companyData.website || '');
  }

  // Replace data variables
  if (data) {
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = data[key] !== null && data[key] !== undefined ? data[key] : '';
      result = result.replace(regex, value);
    });
  }

  // Replace current year
  result = result.replace(/\{\{currentYear\}\}/g, new Date().getFullYear());
  
  // Replace current date
  result = result.replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString());

  return result;
};

// Convert HTML to plain text (simple conversion)
const htmlToText = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Render email template with data
const renderEmailTemplate = async (templateKey, data) => {
  try {
    // Get template from database
    const template = await getEmailTemplate(templateKey);
    if (!template) {
      throw new Error(`Email template '${templateKey}' not found or disabled`);
    }

    // Get company settings
    const companyData = await settingsService.getCompanySettings();

    // Replace variables in subject and content
    const subject = replaceVariables(template.subject, data, companyData);
    const htmlContent = replaceVariables(template.htmlContent, data, companyData);
    const textContent = template.textContent ? 
      replaceVariables(template.textContent, data, companyData) : 
      htmlToText(htmlContent);

    return {
      subject,
      html: htmlContent,
      text: textContent,
      template: template
    };

  } catch (error) {
    console.error(`Error rendering email template '${templateKey}':`, error);
    throw error;
  }
};

// Core send email function
const sendEmail = async (to, templateKey, data, options = {}) => {
  try {
    const emailTransporter = await getTransporter();
    if (!emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    // Get email settings
    const emailSettings = await settingsService.getEmailSettings();
    const companyData = await settingsService.getCompanySettings();

    // Render template
    const renderedTemplate = await renderEmailTemplate(templateKey, data);

    const mailOptions = {
      from: {
        name: emailSettings.fromName || companyData.name || 'Quotation Management System',
        address: emailSettings.fromEmail || emailSettings.username
      },
      to,
      subject: options.subject || renderedTemplate.subject,
      html: renderedTemplate.html,
      text: renderedTemplate.text,
      replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
      ...options
    };

    const info = await emailTransporter.sendMail(mailOptions);

    console.log(`📧 Email sent: ${templateKey} to ${to} | Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentTo: to,
      template: renderedTemplate.template.name
    };

  } catch (error) {
    console.error(`❌ Failed to send email '${templateKey}' to ${to}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// ===============================================
// BUSINESS-SPECIFIC EMAIL FUNCTIONS
// ===============================================

// Send quotation approved email
const sendQuotationApprovedEmail = async (quotationData, clientData) => {
  // Helper to safely convert Prisma Decimals
  const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return parseFloat(value) || defaultValue;
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //   }).format(toNumber(amount));
  // };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(Number(amount || 0));
  };
  

  const getClientName = (clientData) => {
    if (clientData.contactPerson && !(/^\d{8,}$/.test(clientData.contactPerson.replace(/[\s\-\(\)\+]/g, '')))) {
      return clientData.contactPerson.trim();
    }
    return clientData.companyName || 'Valued Client';
  };

  const templateData = {
    clientName: getClientName(clientData),
    quotationNumber: quotationData.quotationNumber || 'N/A',
    quotationTitle: quotationData.title || 'Untitled Project',
    description: quotationData.description || '',
    validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : '',
    notes: quotationData.notes || '',
    
    // Financial data
    subtotal: formatCurrency(quotationData.subtotal),
    gstPercentage: toNumber(quotationData.gstPercentage).toFixed(2),
    pstPercentage: toNumber(quotationData.pstPercentage).toFixed(2),
    gstAmount: formatCurrency(quotationData.gstAmount),
    pstAmount: formatCurrency(quotationData.pstAmount),
    totalTaxAmount: formatCurrency(quotationData.combinedTaxAmount),
    totalAmount: formatCurrency(quotationData.totalAmount),
    approvedDate: new Date().toLocaleDateString()
  };

  return await sendEmail(clientData.email, 'quotation_approved', templateData);
};

// Send quotation email with PDF
const sendQuotationEmail = async (quotationData, clientData, pdfBuffer) => {
  const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return parseFloat(value) || defaultValue;
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //   }).format(toNumber(amount));
  // };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(Number(amount || 0));
  };
  

  const getClientName = (clientData) => {
    if (clientData.contactPerson && !(/^\d{8,}$/.test(clientData.contactPerson.replace(/[\s\-\(\)\+]/g, '')))) {
      return clientData.contactPerson.trim();
    }
    return clientData.companyName || 'Valued Client';
  };

  const templateData = {
    clientName: getClientName(clientData),
    quotationNumber: quotationData.quotationNumber || 'N/A',
    quotationTitle: quotationData.title || 'Untitled Project',
    description: quotationData.description || '',
    totalAmount: formatCurrency(quotationData.totalAmount),
    validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : '',
    notes: quotationData.notes || '',
    sentDate: new Date().toLocaleDateString()
  };

  const emailOptions = {
    attachments: [
      {
        filename: `quotation-${quotationData.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return await sendEmail(clientData.email, 'quotation_sent', templateData, emailOptions);
};

// Send quotation email to department contacts AND client
const sendQuotationEmailToDepartment = async (quotationData, targetDepartments, pdfBuffer) => {
  const results = [];
  const failedEmails = [];
  
  // Helper function to convert values to numbers
  const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return parseFloat(value) || defaultValue;
  };

  // Helper function to format currency
  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //   }).format(toNumber(amount));
  // };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(Number(amount || 0));
  };
  

  // Helper function to get client name
  const getClientName = (client) => {
    if (client.contactPerson && client.contactPerson.trim()) {
      return `${client.contactPerson} (${client.companyName})`;
    }
    return client.companyName;
  };
  
  // Send emails to departments
  for (const department of targetDepartments) {
    try {
      console.log(`📧 Sending quotation email to department: ${department.name} (${department.email})`);
      
      // Prepare template data for department email
      const templateData = {
        quotationNumber: quotationData.quotationNumber,
        clientName: quotationData.client.companyName,
        clientContact: quotationData.client.contactPerson,
        clientEmail: quotationData.client.email,
        departmentName: department.name,
        departmentContact: department.contactPerson,
        totalAmount: formatCurrency(quotationData.totalAmount),
        validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : '',
        notes: quotationData.notes || '',
        sentDate: new Date().toLocaleDateString()
      };

      const emailOptions = {
        attachments: [
          {
            filename: `quotation-${quotationData.quotationNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      // Send email to department contact
      const emailResult = await sendEmail(department.email, 'quotation_sent', templateData, emailOptions);
      
      results.push({
        departmentId: department.id,
        departmentName: department.name,
        email: department.email,
        type: 'department',
        success: true,
        messageId: emailResult.messageId
      });
      
      console.log(`✅ Email sent successfully to department ${department.name} (${department.email})`);
      
    } catch (error) {
      console.error(`❌ Failed to send email to department ${department.name} (${department.email}):`, error.message);
      failedEmails.push({
        departmentId: department.id,
        departmentName: department.name,
        email: department.email,
        type: 'department',
        error: error.message
      });
    }
  }

  // Also send email to client
  if (quotationData.client.email && quotationData.client.email.trim() !== '') {
    try {
      console.log(`📧 Sending quotation email to client: ${quotationData.client.companyName} (${quotationData.client.email})`);
      
      // Prepare template data for client email
      const clientTemplateData = {
        clientName: getClientName(quotationData.client),
        quotationNumber: quotationData.quotationNumber,
        quotationTitle: quotationData.title || 'Untitled Project',
        description: quotationData.description || '',
        totalAmount: formatCurrency(quotationData.totalAmount),
        validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : '',
        notes: quotationData.notes || '',
        sentDate: new Date().toLocaleDateString()
      };

      const clientEmailOptions = {
        attachments: [
          {
            filename: `quotation-${quotationData.quotationNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      // Send email to client
      const clientEmailResult = await sendEmail(quotationData.client.email, 'quotation_sent', clientTemplateData, clientEmailOptions);
      
      results.push({
        clientId: quotationData.client.id,
        clientName: quotationData.client.companyName,
        email: quotationData.client.email,
        type: 'client',
        success: true,
        messageId: clientEmailResult.messageId
      });
      
      console.log(`✅ Email sent successfully to client ${quotationData.client.companyName} (${quotationData.client.email})`);
      
    } catch (error) {
      console.error(`❌ Failed to send email to client ${quotationData.client.companyName} (${quotationData.client.email}):`, error.message);
      failedEmails.push({
        clientId: quotationData.client.id,
        clientName: quotationData.client.companyName,
        email: quotationData.client.email,
        type: 'client',
        error: error.message
      });
    }
  }
  
  return {
    successfulEmails: results,
    failedEmails: failedEmails,
    totalSent: results.length,
    totalFailed: failedEmails.length
  };
};

// Send invoice email with PDF
const sendInvoiceEmail = async (invoiceData, clientData, quotationData, pdfBuffer, taxType = 'GST_AND_PST') => {
  const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return parseFloat(value) || defaultValue;
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //   }).format(toNumber(amount));
  // };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(Number(amount || 0));
  };
  

  const getClientName = (clientData) => {
    if (clientData.contactPerson && !(/^\d{8,}$/.test(clientData.contactPerson.replace(/[\s\-\(\)\+]/g, '')))) {
      return clientData.contactPerson.trim();
    }
    return clientData.companyName || 'Valued Client';
  };

  const templateData = {
    clientName: getClientName(clientData),
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceType: invoiceData.type.replace(/_/g, ' '),
    quotationNumber: quotationData?.quotationNumber || 'N/A',
    quotationTitle: quotationData?.title || 'N/A',
    
    // Financial data
    subtotal: formatCurrency(invoiceData.subtotal),
    gstPercentage: toNumber(invoiceData.gstPercentage).toFixed(2),
    pstPercentage: toNumber(invoiceData.pstPercentage).toFixed(2),
    gstAmount: formatCurrency(invoiceData.gstAmount),
    pstAmount: formatCurrency(invoiceData.pstAmount),
    totalAmount: formatCurrency(invoiceData.totalAmount),
    
    dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'Not specified',
    taxType: taxType.replace(/_/g, ' '),
    sentDate: new Date().toLocaleDateString()
  };

  const taxTypeSuffix = taxType.toLowerCase().replace(/_/g, '-');
  const attachmentFilename = `invoice-${invoiceData.invoiceNumber}-${taxTypeSuffix}.pdf`;

  const emailOptions = {
    attachments: [
      {
        filename: attachmentFilename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return await sendEmail(clientData.email, 'invoice_sent', templateData, emailOptions);
};

// Send user welcome email
const sendUserWelcomeEmail = async (userData) => {
  const templateData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    fullName: `${userData.firstName} ${userData.lastName}`,
    email: userData.email,
    role: userData.role.replace(/_/g, ' '),
    createdDate: new Date().toLocaleDateString()
  };

  return await sendEmail(userData.email, 'user_welcome', templateData);
};

// Send password reset email
// const sendPasswordResetEmail = async (email, resetToken, userFirstName = 'User') => {
//   try {
//     const emailTransporter = await getTransporter();
//     if (!emailTransporter) {
//       throw new Error('Email transporter not configured');
//     }

//     const [emailSettings, companySettings] = await Promise.all([
//       settingsService.getEmailSettings(),
//       settingsService.getCompanySettings()
//     ]);

//     // Build reset URL
//     let baseUrl;
//     if (process.env.NODE_ENV === 'development') {
//       baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     } else {
//       baseUrl = companySettings.website || process.env.FRONTEND_URL || 'https://qodixlab.com';
//     }
    
//     const resetUrl = `${baseUrl}/forgot-password?token=${resetToken}`;
    
//     const templateData = {
//       firstName: userFirstName,
//       resetUrl: resetUrl,
//       resetToken: resetToken
//     };

//     return await sendEmail(email, 'password_reset', templateData);
    
//   } catch (error) {
//     console.error(`Failed to send password reset email to ${email}:`, error.message);
//     throw new Error(`Password reset email sending failed: ${error.message}`);
//   }
// };

// FIXED: Password reset email with inline fallback (same pattern as quotation emails)
const sendPasswordResetEmail = async (email, resetToken, userFirstName = 'User') => {
  try {
    console.log(`📧 Preparing password reset email for ${email}...`);

    // Get email settings and company settings
    const { settingsService } = require('./settingsService');
    const nodemailer = require('nodemailer');
    const { prisma } = require('../config/database');

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

    // Smart URL detection - automatically choose localhost or server
    let baseUrl;
    
    // Auto-detect if we're running on localhost or server
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let isLocalhost = false;
    let serverIP = null;
    
    // Check if we're running on localhost (127.0.0.1 or localhost)
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && iface.address === '127.0.0.1') {
          isLocalhost = true;
          break;
        }
      }
      if (isLocalhost) break;
    }
    
    // If not localhost, find the server's external IP
    if (!isLocalhost) {
      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
            serverIP = iface.address;
            break;
          }
        }
        if (serverIP) break;
      }
    }
    
    // Priority 1: If FRONTEND_URL is explicitly set and not localhost, use it
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
      baseUrl = process.env.FRONTEND_URL;
      console.log('🌐 Using explicit FRONTEND_URL:', baseUrl);
    }
    // Priority 2: Auto-detect based on environment
    else if (isLocalhost || process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
      console.log('🏠 Localhost detected - using:', baseUrl);
    }
    // Priority 3: Server environment - use detected IP or fallback
    else {
      if (serverIP) {
        baseUrl = `http://${serverIP}:3000`;
        console.log('🖥️ Server detected - using IP:', baseUrl);
    } else {
        // Fallback to your known server IP
        baseUrl = 'http://148.230.82.188:3000';
        console.log('🔄 Using fallback server IP:', baseUrl);
      }
    }
    
    // Ensure baseUrl doesn't end with slash
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const resetUrl = `${baseUrl}/forgot-password?token=${resetToken}`;
    console.log('🔗 Generated reset URL:', resetUrl);

    // Prepare template data
    const templateData = {
      firstName: userFirstName,
      resetUrl: resetUrl,
      resetToken: resetToken,
      companyName: companySettings.name || 'Your Company',
      currentYear: new Date().getFullYear()
    };

    // PRIORITY 1: Try to get password_reset template from database
    let emailSubject = `Reset Your Password - ${templateData.companyName}`;
    let emailHtml = '';
    let usedDatabaseTemplate = false;

    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          templateKey: 'password_reset',
          enabled: true
        }
      });

      if (template) {
        console.log('✅ Using database template for password reset');
        
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
      console.warn('⚠️ Database password_reset template not found, using fallback');
      
      // PRIORITY 2: Fallback template
      emailSubject = `Reset Your Password - ${templateData.companyName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #f59e0b; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${templateData.firstName},</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              We received a request to reset your password for your ${templateData.companyName} account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${templateData.resetUrl}" 
                 style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏰ This link expires in 1 hour</strong> for your security. If you don't reset your password within this time, you'll need to request a new reset link.
              </p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                <strong>If the button doesn't work, copy and paste this link into your browser:</strong>
              </p>
              <p style="color: #3b82f6; margin: 0; font-size: 14px; word-break: break-all;">
                ${templateData.resetUrl}
              </p>
            </div>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
              <p style="color: #dc2626; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged, and no further action is required.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              If you have any questions or need assistance, please contact our support team.
            </p>
            
            <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
              <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
              <p style="color: #f59e0b; margin: 5px 0 0 0; font-weight: bold;">${templateData.companyName} Security Team</p>
            </div>
          </div>
          
          <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">&copy; ${templateData.currentYear} ${templateData.companyName}. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated security email.</p>
          </div>
        </div>
      `;
    }

    // Send password reset email
    const mailOptions = {
      from: {
        name: emailSettings.fromName || companySettings.name || 'Password Reset Service',
        address: emailSettings.fromEmail || emailSettings.username || process.env.EMAIL_FROM
      },
      to: email,
      subject: emailSubject,
      html: emailHtml,
      replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Password reset email sent successfully to ${email} (${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentTo: email,
      templateSource: usedDatabaseTemplate ? 'database' : 'fallback'
    };

  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
    throw new Error(`Password reset email sending failed: ${error.message}`);
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Send test email
const sendTestEmail = async (to) => {
  const templateData = {
    firstName: 'Test User',
    testMessage: 'This is a test email to verify your email configuration.',
    sentDate: new Date().toLocaleDateString()
  };

  return await sendEmail(to, 'test_email', templateData);
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    await transporter.verify();
    return { success: true, message: 'Email connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send bulk emails
const sendBulkEmails = async (recipients, templateKey, baseTemplateData = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const templateData = {
        ...baseTemplateData,
        ...recipient // recipient data overrides base data
      };
      
      const result = await sendEmail(recipient.email, templateKey, templateData);
      results.push({ email: recipient.email, success: true, result });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }

  return results;
};

module.exports = {
  // Core functions
  initializeTransporter,
  sendEmail,
  
  // Business functions
  sendQuotationApprovedEmail,
  sendQuotationEmail,
  sendQuotationEmailToDepartment,
  sendInvoiceEmail,
  sendUserWelcomeEmail,
  sendPasswordResetEmail,
  
  // Utility functions
  sendTestEmail,
  testEmailConnection,
  sendBulkEmails,
  
  // Template functions (for admin UI)
  getEmailTemplate,
  renderEmailTemplate,
  replaceVariables
};