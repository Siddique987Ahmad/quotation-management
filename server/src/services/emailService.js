// const nodemailer = require('nodemailer');
// const fs = require('fs').promises;
// const path = require('path');
// const { EMAIL } = require('../config/constants');
// const { settingsService } = require('./settingsService');

// // Email transporter configuration
// let transporter;

// // Initialize email transporter with database settings
// const initializeTransporter = async () => {
//   try {
//     // Get email settings from database
//     const emailSettings = await settingsService.getEmailSettings();
    
//     const config = {
//       host: emailSettings.host || 'smtp.gmail.com',
//       port: emailSettings.port || 587,
//       secure: emailSettings.secure || false,
//       auth: {
//         user: emailSettings.username,
//         pass: emailSettings.password
//       }
//     };

//     // For development, use different configurations if no settings exist
//     if (process.env.NODE_ENV === 'development' && !emailSettings.username) {
//       config.host = 'smtp.ethereal.email';
//       config.port = 587;
//       config.secure = false;
//       config.auth = {
//         user: 'ethereal.user@ethereal.email',
//         pass: 'ethereal.password'
//       };
//       console.log('⚠️  Using Ethereal Email for development. Configure email settings in System Settings.');
//     }

//     transporter = nodemailer.createTransport(config);

//     // Verify transporter configuration
//     transporter.verify((error, success) => {
//       if (error) {
//         console.error('❌ Email transporter verification failed:', error.message);
//       } else {
//         console.log('✅ Email server is ready to send messages');
//       }
//     });

//     return transporter;
//   } catch (error) {
//     console.error('❌ Failed to initialize email transporter:', error);
//     return null;
//   }
// };

// // Get or create transporter with fresh settings
// const getTransporter = async () => {
//   // Always reinitialize to get fresh settings
//   return await initializeTransporter();
// };

// // Email templates with dynamic company settings
// const getEmailTemplate = async(templateName, data, companySettings = {}) => {

//   try {
//     // Get dynamic template settings
//     const templateSettings = await settingsService.getEmailTemplateSettingsLegacy();
//     const template = templateSettings[templateName];
    
//     if (!template || !template.enabled) {
//       // Fallback to your existing hardcoded templates
//       return getHardcodedTemplate(templateName, data, companySettings);
//     }
    
//     return renderDynamicTemplate(template, data, companySettings);
//   } catch (error) {
//     console.error('Error loading dynamic template:', error);
//     return getHardcodedTemplate(templateName, data, companySettings);
//   }
// };

// const renderDynamicTemplate = (template, data, companySettings) => {
//   const currentYear = new Date().getFullYear();
//   const companyName = companySettings.name || 'Your Company';
  
//   let html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';
  
//   // Render each section based on template config
//   const sections = template.sections;
  
//   if (sections.header?.enabled) {
//     html += renderHeaderSection(sections.header, companyName);
//   }
  
//   html += '<div style="padding: 30px; background: #f8f9fa;">';
  
//   if (sections.greeting?.enabled) {
//     html += `<h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>`;
//   }
  
//   if (sections.quotationDetails?.enabled) {
//     html += renderQuotationDetailsSection(sections.quotationDetails, data);
//   }
  
//   if (sections.invoiceDetails?.enabled) {
//     html += renderInvoiceDetailsSection(sections.invoiceDetails, data);
//   }
  
//   if (sections.financialSummary?.enabled) {
//     html += renderFinancialSummarySection(sections.financialSummary, data);
//   }
  
//   if (sections.dynamicFields?.enabled && data.dynamicFields) {
//     html += renderDynamicFieldsSection(data.dynamicFields);
//   }
  
//   if (sections.notes?.enabled && data.notes) {
//     html += renderNotesSection(data.notes);
//   }
  
//   if (sections.nextSteps?.enabled) {
//     html += renderNextStepsSection();
//   }
  
//   if (sections.projectDescription?.enabled && data.description) {
//     html += renderProjectDescriptionSection(data.description);
//   }
  
//   if (sections.paymentInstructions?.enabled) {
//     html += renderPaymentInstructionsSection();
//   }
  
//   if (sections.attachmentNote?.enabled) {
//     html += renderAttachmentNoteSection();
//   }
  
//   html += '</div>';
  
//   if (sections.footer?.enabled) {
//     html += renderFooterSection(sections.footer, companySettings, currentYear);
//   }
  
//   html += '</div>';
  
//   return {
//     subject: replaceVariables(template.subject, data),
//     html,
//     text: convertHtmlToText(html)
//   };
// };

// // Helper functions for rendering sections
// // const renderHeaderSection = (config, companyName) => `
// //   <div style="background: ${config.backgroundColor || '#667eea'}; padding: 30px; text-align: center;">
// //     <h1 style="color: white; margin: 0; font-size: 28px;">${config.title}</h1>
// //   </div>
// // `;
// const renderHeaderSection = (headerConfig, companyName) => {
//   const title = headerConfig.title?.replace('{{companyName}}', companyName) || companyName;
//   const backgroundColor = headerConfig.backgroundColor || '#667eea';
  
//   return `
//     <div style="background: ${backgroundColor}; color: white; padding: 30px; text-align: center; margin-bottom: 0;">
//       <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${title}</h1>
//     </div>
//   `;
// };

// // Add these missing helper functions to your emailService.js file

// const renderDynamicFieldsSection = (dynamicFields) => {
//   if (!dynamicFields || dynamicFields.length === 0) return '';
  
//   let html = '<div style="background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
//   html += '<h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Additional Details</h3>';
//   html += '<table style="width: 100%; border-collapse: collapse;">';
  
//   dynamicFields.forEach(field => {
//     html += `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">${field.label}:</td><td style="padding: 8px 0;">${field.value}</td></tr>`;
//   });
  
//   html += '</table></div>';
//   return html;
// };

// const renderNotesSection = (notes) => {
//   return `
//     <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff;">
//       <h4 style="color: #333; margin-bottom: 10px;">Notes</h4>
//       <p style="color: #555; line-height: 1.6; margin: 0;">${notes}</p>
//     </div>
//   `;
// };

// const renderNextStepsSection = () => {
//   return `
//     <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
//       <h4 style="color: #155724; margin-bottom: 10px;">Next Steps</h4>
//       <p style="color: #155724; line-height: 1.6; margin: 0;">
//         We will now generate an invoice for this approved quotation. You will receive the invoice via email shortly.
//       </p>
//     </div>
//   `;
// };

// const renderProjectDescriptionSection = (description) => {
//   return `
//     <div style="background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
//       <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Project Description</h3>
//       <p style="color: #555; line-height: 1.6; margin: 0;">${description}</p>
//     </div>
//   `;
// };

// const renderPaymentInstructionsSection = () => {
//   return `
//     <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
//       <h4 style="color: #856404; margin-bottom: 10px;">Payment Instructions</h4>
//       <p style="color: #856404; line-height: 1.6; margin: 0;">
//         Please remit payment within the specified due date. Payment can be made via bank transfer or check.
//       </p>
//     </div>
//   `;
// };

// const renderAttachmentNoteSection = () => {
//   return `
//     <div style="background: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
//       <h4 style="color: #155724; margin-bottom: 10px;">Attachment</h4>
//       <p style="color: #155724; line-height: 1.6; margin: 0;">
//         Please find the detailed quotation PDF attached to this email.
//       </p>
//     </div>
//   `;
// };
// const renderQuotationDetailsSection = (config, data) => {
//   let html = `
//     <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//       <h3 style="color: #333; margin-top: 0;">Quotation Details:</h3>
//       <table style="width: 100%; border-collapse: collapse;">
//   `;
  
//   const fields = config.fields;
  
//   if (fields.quotationNumber) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Quotation Number:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationNumber}</td></tr>`;
//   }
  
//   if (fields.quotationTitle) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Project Title:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationTitle}</td></tr>`;
//   }
  
//   if (fields.description && data.description) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Description:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.description}</td></tr>`;
//   }
  
//   if (fields.validUntil && data.validUntil) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.validUntil}</td></tr>`;
//   }
  
//   if (fields.approvedDate) {
//     html += `<tr><td style="padding: 10px 0; color: #666;"><strong>Approved Date:</strong></td><td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td></tr>`;
//   }
  
//   html += '</table></div>';
//   return html;
// };

// const renderInvoiceDetailsSection = (config, data) => {
//   let html = `
//     <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
//       <h3 style="color: #333; margin-top: 0;">Invoice Details:</h3>
//       <table style="width: 100%; border-collapse: collapse;">
//   `;
  
//   const fields = config.fields;
  
//   if (fields.invoiceNumber) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.invoiceNumber}</td></tr>`;
//   }
  
//   if (fields.invoiceType) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Type:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.invoiceType}</td></tr>`;
//   }
  
//   if (fields.totalAmount) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Amount Due:</strong></td><td style="padding: 10px 0; color: #ff6b6b; border-bottom: 1px solid #eee; font-weight: bold; font-size: 20px;">${data.totalAmount}</td></tr>`;
//   }
  
//   if (fields.dueDate) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.dueDate}</td></tr>`;
//   }
  
//   if (fields.quotationTitle) {
//     html += `<tr><td style="padding: 10px 0; color: #666;"><strong>Related Project:</strong></td><td style="padding: 10px 0; color: #333;">${data.quotationTitle}</td></tr>`;
//   }
  
//   html += '</table></div>';
//   return html;
// };

// const renderFinancialSummarySection = (config, data) => {
//   let html = `
//     <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//       <h3 style="color: #333; margin-top: 0;">Financial Summary:</h3>
//       <table style="width: 100%; border-collapse: collapse;">
//   `;
  
//   if (config.showSubtotal) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Subtotal:</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.subtotal}</td></tr>`;
//   }
  
//   if (config.showGstBreakdown && data.gstAmount && parseFloat(data.gstAmount.replace(/[$,]/g, '')) > 0) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>GST (${data.gstPercentage}%):</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.gstAmount}</td></tr>`;
//   }
  
//   if (config.showPstBreakdown && data.pstAmount && parseFloat(data.pstAmount.replace(/[$,]/g, '')) > 0) {
//     html += `<tr><td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>PST (${data.pstPercentage}%):</strong></td><td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.pstAmount}</td></tr>`;
//   }
  
//   if (config.showTotal) {
//     html += `<tr style="background: #f8f9fa;"><td style="padding: 15px 10px; color: #333; font-weight: bold; font-size: 18px;"><strong>Total Amount:</strong></td><td style="padding: 15px 10px; color: #28a745; font-weight: bold; font-size: 20px;">${data.totalAmount}</td></tr>`;
//   }
  
//   html += '</table></div>';
//   return html;
// };

// // const renderNextStepsSection = () => `
// //   <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //     <h3 style="color: #1976d2; margin-top: 0;">📧 What Happens Next?</h3>
// //     <p style="color: #333; margin: 10px 0;">Your approved quotation will now be processed as follows:</p>
// //     <ul style="color: #333; padding-left: 20px;">
// //       <li>Tax invoices are being generated based on your selected tax configuration</li>
// //       <li>You will receive separate emails with PDF invoices attached</li>
// //       <li>Payment instructions will be included with each invoice</li>
// //     </ul>
// //   </div>
// // `;

// const renderFooterSection = (config, companySettings, currentYear) => `
//   <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//     <p style="margin: 0;">© ${currentYear} ${companySettings.name || 'Your Company'}. All rights reserved.</p>
//     ${config.showCompanyInfo ? `
//       ${companySettings.address ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${companySettings.address}</p>` : ''}
//       ${companySettings.email ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Email: ${companySettings.email}</p>` : ''}
//       ${companySettings.phone ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Phone: ${companySettings.phone}</p>` : ''}
//     ` : ''}
//   </div>
// `;

// const replaceVariables = (template, data) => {
//   let result = template;
//   Object.keys(data).forEach(key => {
//     const regex = new RegExp(`{{${key}}}`, 'g');
//     result = result.replace(regex, data[key] || '');
//   });
//   return result;
// };

// const convertHtmlToText = (html) => {
//   // Simple HTML to text conversion
//   return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
// };
// const getHardcodedTemplate = (templateName, data, companySettings) => {
//   const companyName = companySettings.name || 'Your Company';
//   const currentYear = new Date().getFullYear();
  
//   const templates = {
//     // Quotation approved template
//     // quotation_approved: {
//     //   subject: `Quotation ${data.quotationNumber} Approved - Invoice Generated`,
//     //   html: `
//     //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//     //       <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
//     //         <h1 style="color: white; margin: 0; font-size: 28px;">Quotation Approved!</h1>
//     //       </div>
          
//     //       <div style="padding: 30px; background: #f8f9fa;">
//     //         <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>
            
//     //         <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
//     //           <p style="font-size: 16px; color: #333; margin: 0;">
//     //             Great news! Your quotation <strong>${data.quotationNumber}</strong> for 
//     //             "<strong>${data.quotationTitle}</strong>" has been approved.
//     //           </p>
//     //         </div>
            
//     //         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//     //           <h3 style="color: #333; margin-top: 0;">Quotation Details:</h3>
//     //           <table style="width: 100%; border-collapse: collapse;">
//     //             <tr>
//     //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Quotation Number:</strong></td>
//     //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationNumber}</td>
//     //             </tr>
//     //             <tr>
//     //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Project:</strong></td>
//     //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationTitle}</td>
//     //             </tr>
//     //             <tr>
//     //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td>
//     //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee; font-weight: bold; font-size: 18px;">$${data.totalAmount}</td>
//     //             </tr>
//     //             <tr>
//     //               <td style="padding: 10px 0; color: #666;"><strong>Approved Date:</strong></td>
//     //               <td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td>
//     //             </tr>
//     //           </table>
//     //         </div>
            
//     //         <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
//     //           <h3 style="color: #1976d2; margin-top: 0;">📧 Invoices Generated</h3>
//     //           <p style="color: #333; margin: 10px 0;">
//     //             Three tax invoices have been automatically generated and will be sent to you separately:
//     //           </p>
//     //           <ul style="color: #333; padding-left: 20px;">
//     //             <li>Tax Invoice Type 1</li>
//     //             <li>Tax Invoice Type 2</li>
//     //             <li>Tax Invoice Type 3</li>
//     //           </ul>
//     //         </div>
            
//     //         <div style="text-align: center; margin: 30px 0;">
//     //           <p style="color: #666;">
//     //             If you have any questions, please don't hesitate to contact us.
//     //           </p>
//     //           <p style="color: #333; font-weight: bold;">
//     //             Thank you for your business!
//     //           </p>
//     //         </div>
//     //       </div>
          
//     //       <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//     //         <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//     //         ${companySettings.address ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${companySettings.address}</p>` : ''}
//     //       </div>
//     //     </div>
//     //   `,
//     //   text: `
//     //     Quotation Approved!
        
//     //     Hello ${data.clientName},
        
//     //     Great news! Your quotation ${data.quotationNumber} for "${data.quotationTitle}" has been approved.
        
//     //     Quotation Details:
//     //     - Quotation Number: ${data.quotationNumber}
//     //     - Project: ${data.quotationTitle}
//     //     - Total Amount: $${data.totalAmount}
//     //     - Approved Date: ${new Date().toLocaleDateString()}
        
//     //     Three tax invoices have been automatically generated and will be sent to you separately.
        
//     //     If you have any questions, please don't hesitate to contact us.
        
//     //     Thank you for your business!
        
//     //     ${companyName}
//     //     ${companySettings.address || ''}
//     //   `
//     // },
// // quotation_approved: {
// //   subject: `Quotation ${data.quotationNumber} Approved - Invoice Generated`,
// //   html: `
// //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
// //       <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
// //         <h1 style="color: white; margin: 0; font-size: 28px;">Quotation Approved!</h1>
// //       </div>
      
// //       <div style="padding: 30px; background: #f8f9fa;">
// //         <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>
        
// //         <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
// //           <p style="font-size: 16px; color: #333; margin: 0;">
// //             Great news! Your quotation <strong>${data.quotationNumber}</strong> for 
// //             "<strong>${data.quotationTitle}</strong>" has been approved.
// //           </p>
// //         </div>
        
// //         <!-- Basic Quotation Details -->
// //         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //           <h3 style="color: #333; margin-top: 0;">Quotation Details:</h3>
// //           <table style="width: 100%; border-collapse: collapse;">
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Quotation Number:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationNumber}</td>
// //             </tr>
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Project Title:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationTitle}</td>
// //             </tr>
// //             ${data.description ? `
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Description:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.description}</td>
// //             </tr>
// //             ` : ''}
// //             ${data.validUntil ? `
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.validUntil}</td>
// //             </tr>
// //             ` : ''}
// //             <tr>
// //               <td style="padding: 10px 0; color: #666;"><strong>Approved Date:</strong></td>
// //               <td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td>
// //             </tr>
// //           </table>
// //         </div>

// //         <!-- Financial Breakdown -->
// //         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //           <h3 style="color: #333; margin-top: 0;">Financial Summary:</h3>
// //           <table style="width: 100%; border-collapse: collapse;">
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Subtotal:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${data.subtotal}</td>
// //             </tr>
            
// //             ${data.taxationType && data.taxationType !== 'none' ? `
// //               ${data.taxationType === 'gst' || data.taxationType === 'both' ? `
// //               <tr>
// //                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>GST (${data.gstPercentage}%):</strong></td>
// //                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${data.gstAmount}</td>
// //               </tr>
// //               ` : ''}
              
// //               ${data.taxationType === 'pst' || data.taxationType === 'both' ? `
// //               <tr>
// //                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>PST (${data.pstPercentage}%):</strong></td>
// //                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${data.pstAmount}</td>
// //               </tr>
// //               ` : ''}
              
// //               <tr>
// //                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Total Tax:</strong></td>
// //                 <td style="padding: 10px 0; color: #2563eb; border-bottom: 1px solid #eee; font-weight: bold;">$${data.totalTaxAmount}</td>
// //               </tr>
// //             ` : `
// //               <tr>
// //                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Tax Status:</strong></td>
// //                 <td style="padding: 10px 0; color: #28a745; border-bottom: 1px solid #eee; font-weight: bold;">Tax Exempt</td>
// //               </tr>
// //             `}
            
// //             <tr style="background: #f8f9fa;">
// //               <td style="padding: 15px 10px; color: #333; font-weight: bold; font-size: 18px;"><strong>Total Amount:</strong></td>
// //               <td style="padding: 15px 10px; color: #28a745; font-weight: bold; font-size: 20px;">$${data.totalAmount}</td>
// //             </tr>
// //           </table>
// //         </div>

// //         <!-- Dynamic Fields (if any) -->
// //         ${data.dynamicFields && data.dynamicFields.length > 0 ? `
// //         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //           <h3 style="color: #333; margin-top: 0;">Additional Information:</h3>
// //           <table style="width: 100%; border-collapse: collapse;">
// //             ${data.dynamicFields.map(field => `
// //             <tr>
// //               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; vertical-align: top;"><strong>${field.label}:</strong></td>
// //               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${field.value || 'Not specified'}</td>
// //             </tr>
// //             `).join('')}
// //           </table>
// //         </div>
// //         ` : ''}

// //         <!-- Notes (if any) -->
// //         ${data.notes ? `
// //         <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //           <h3 style="color: #92400e; margin-top: 0;">Additional Notes:</h3>
// //           <p style="color: #a16207; margin: 0; line-height: 1.6;">${data.notes}</p>
// //         </div>
// //         ` : ''}
        
// //         <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
// //           <h3 style="color: #1976d2; margin-top: 0;">📧 What Happens Next?</h3>
// //           <p style="color: #333; margin: 10px 0;">
// //             Your approved quotation will now be processed as follows:
// //           </p>
// //           <ul style="color: #333; padding-left: 20px;">
// //             <li>Tax invoices are being generated based on your selected tax configuration</li>
// //             <li>You will receive separate emails with PDF invoices attached</li>
// //             <li>Payment instructions will be included with each invoice</li>
// //           </ul>
// //         </div>
        
// //         <div style="text-align: center; margin: 30px 0;">
// //           <p style="color: #666;">
// //             If you have any questions about this quotation or the invoicing process, please don't hesitate to contact us.
// //           </p>
// //           <p style="color: #333; font-weight: bold;">
// //             Thank you for choosing our services!
// //           </p>
// //         </div>
// //       </div>
      
// //       <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
// //         <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
// //         ${companySettings.address ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${companySettings.address}</p>` : ''}
// //         ${companySettings.email ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Email: ${companySettings.email}</p>` : ''}
// //         ${companySettings.phone ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Phone: ${companySettings.phone}</p>` : ''}
// //       </div>
// //     </div>
// //   `,
// //   text: `
// //     Quotation Approved!
    
// //     Hello ${data.clientName},
    
// //     Great news! Your quotation ${data.quotationNumber} for "${data.quotationTitle}" has been approved.
    
// //     Quotation Details:
// //     - Quotation Number: ${data.quotationNumber}
// //     - Project Title: ${data.quotationTitle}
// //     ${data.description ? `- Description: ${data.description}` : ''}
// //     ${data.validUntil ? `- Valid Until: ${data.validUntil}` : ''}
// //     - Approved Date: ${new Date().toLocaleDateString()}
    
// //     Financial Summary:
// //     - Subtotal: $${data.subtotal}
// //     ${data.taxationType && data.taxationType !== 'none' ? `
// //     ${data.taxationType === 'gst' || data.taxationType === 'both' ? `- GST (${data.gstPercentage}%): $${data.gstAmount}` : ''}
// //     ${data.taxationType === 'pst' || data.taxationType === 'both' ? `- PST (${data.pstPercentage}%): $${data.pstAmount}` : ''}
// //     - Total Tax: $${data.totalTaxAmount}
// //     ` : '- Tax Status: Tax Exempt'}
// //     - Total Amount: $${data.totalAmount}
    
// //     ${data.dynamicFields && data.dynamicFields.length > 0 ? `
// //     Additional Information:
// //     ${data.dynamicFields.map(field => `- ${field.label}: ${field.value || 'Not specified'}`).join('\n    ')}
// //     ` : ''}
    
// //     ${data.notes ? `Additional Notes: ${data.notes}` : ''}
    
// //     What Happens Next:
// //     - Tax invoices are being generated based on your selected tax configuration
// //     - You will receive separate emails with PDF invoices attached
// //     - Payment instructions will be included with each invoice
    
// //     If you have any questions about this quotation or the invoicing process, please don't hesitate to contact us.
    
// //     Thank you for choosing our services!
    
// //     ${companyName}
// //     ${companySettings.address || ''}
// //     ${companySettings.email ? `Email: ${companySettings.email}` : ''}
// //     ${companySettings.phone ? `Phone: ${companySettings.phone}` : ''}
// //   `
// // },

// // Fixed quotation_approved email template - remove double dollar signs
// quotation_approved: {
//   subject: `Quotation ${data.quotationNumber} Approved - Invoice Generated`,
//   html: `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
//         <h1 style="color: white; margin: 0; font-size: 28px;">Quotation Approved!</h1>
//       </div>
      
//       <div style="padding: 30px; background: #f8f9fa;">
//         <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>
        
//         <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
//           <p style="font-size: 16px; color: #333; margin: 0;">
//             Great news! Your quotation <strong>${data.quotationNumber}</strong> for 
//             "<strong>${data.quotationTitle}</strong>" has been approved.
//           </p>
//         </div>
        
//         <!-- Basic Quotation Details -->
//         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="color: #333; margin-top: 0;">Quotation Details:</h3>
//           <table style="width: 100%; border-collapse: collapse;">
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Quotation Number:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationNumber}</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Project Title:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationTitle}</td>
//             </tr>
//             ${data.description ? `
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Description:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.description}</td>
//             </tr>
//             ` : ''}
//             ${data.validUntil ? `
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.validUntil}</td>
//             </tr>
//             ` : ''}
//             <tr>
//               <td style="padding: 10px 0; color: #666;"><strong>Approved Date:</strong></td>
//               <td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td>
//             </tr>
//           </table>
//         </div>

//         <!-- Financial Breakdown -->
//         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="color: #333; margin-top: 0;">Financial Summary:</h3>
//           <table style="width: 100%; border-collapse: collapse;">
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Subtotal:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.subtotal}</td>
//             </tr>
            
//             ${data.taxationType && data.taxationType !== 'none' ? `
//               ${data.taxationType === 'gst' || data.taxationType === 'both' ? `
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>GST (${data.gstPercentage}%):</strong></td>
//                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.gstAmount}</td>
//               </tr>
//               ` : ''}
              
//               ${data.taxationType === 'pst' || data.taxationType === 'both' ? `
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>PST (${data.pstPercentage}%):</strong></td>
//                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.pstAmount}</td>
//               </tr>
//               ` : ''}
              
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Total Tax:</strong></td>
//                 <td style="padding: 10px 0; color: #2563eb; border-bottom: 1px solid #eee; font-weight: bold;">${data.totalTaxAmount}</td>
//               </tr>
//             ` : `
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Tax Status:</strong></td>
//                 <td style="padding: 10px 0; color: #28a745; border-bottom: 1px solid #eee; font-weight: bold;">Tax Exempt</td>
//               </tr>
//             `}
            
//             <tr style="background: #f8f9fa;">
//               <td style="padding: 15px 10px; color: #333; font-weight: bold; font-size: 18px;"><strong>Total Amount:</strong></td>
//               <td style="padding: 15px 10px; color: #28a745; font-weight: bold; font-size: 20px;">${data.totalAmount}</td>
//             </tr>
//           </table>
//         </div>

//         <!-- Dynamic Fields (if any) -->
//         ${data.dynamicFields && data.dynamicFields.length > 0 ? `
//         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="color: #333; margin-top: 0;">Additional Information:</h3>
//           <table style="width: 100%; border-collapse: collapse;">
//             ${data.dynamicFields.map(field => `
//             <tr>
//               <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee; vertical-align: top;"><strong>${field.label}:</strong></td>
//               <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${field.value || 'Not specified'}</td>
//             </tr>
//             `).join('')}
//           </table>
//         </div>
//         ` : ''}

//         <!-- Notes (if any) -->
//         ${data.notes ? `
//         <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="color: #92400e; margin-top: 0;">Additional Notes:</h3>
//           <p style="color: #a16207; margin: 0; line-height: 1.6;">${data.notes}</p>
//         </div>
//         ` : ''}
        
//         <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="color: #1976d2; margin-top: 0;">📧 What Happens Next?</h3>
//           <p style="color: #333; margin: 10px 0;">
//             Your approved quotation will now be processed as follows:
//           </p>
//           <ul style="color: #333; padding-left: 20px;">
//             <li>Tax invoices are being generated based on your selected tax configuration</li>
//             <li>You will receive separate emails with PDF invoices attached</li>
//             <li>Payment instructions will be included with each invoice</li>
//           </ul>
//         </div>
        
//         <div style="text-align: center; margin: 30px 0;">
//           <p style="color: #666;">
//             If you have any questions about this quotation or the invoicing process, please don't hesitate to contact us.
//           </p>
//           <p style="color: #333; font-weight: bold;">
//             Thank you for choosing our services!
//           </p>
//         </div>
//       </div>
      
//       <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//         <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//         ${companySettings.address ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${companySettings.address}</p>` : ''}
//         ${companySettings.email ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Email: ${companySettings.email}</p>` : ''}
//         ${companySettings.phone ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Phone: ${companySettings.phone}</p>` : ''}
//       </div>
//     </div>
//   `,
//   text: `
//     Quotation Approved!
    
//     Hello ${data.clientName},
    
//     Great news! Your quotation ${data.quotationNumber} for "${data.quotationTitle}" has been approved.
    
//     Quotation Details:
//     - Quotation Number: ${data.quotationNumber}
//     - Project Title: ${data.quotationTitle}
//     ${data.description ? `- Description: ${data.description}` : ''}
//     ${data.validUntil ? `- Valid Until: ${data.validUntil}` : ''}
//     - Approved Date: ${new Date().toLocaleDateString()}
    
//     Financial Summary:
//     - Subtotal: ${data.subtotal}
//     ${data.taxationType && data.taxationType !== 'none' ? `
//     ${data.taxationType === 'gst' || data.taxationType === 'both' ? `- GST (${data.gstPercentage}%): ${data.gstAmount}` : ''}
//     ${data.taxationType === 'pst' || data.taxationType === 'both' ? `- PST (${data.pstPercentage}%): ${data.pstAmount}` : ''}
//     - Total Tax: ${data.totalTaxAmount}
//     ` : '- Tax Status: Tax Exempt'}
//     - Total Amount: ${data.totalAmount}
    
//     ${data.dynamicFields && data.dynamicFields.length > 0 ? `
//     Additional Information:
//     ${data.dynamicFields.map(field => `- ${field.label}: ${field.value || 'Not specified'}`).join('\n    ')}
//     ` : ''}
    
//     ${data.notes ? `Additional Notes: ${data.notes}` : ''}
    
//     What Happens Next:
//     - Tax invoices are being generated based on your selected tax configuration
//     - You will receive separate emails with PDF invoices attached
//     - Payment instructions will be included with each invoice
    
//     If you have any questions about this quotation or the invoicing process, please don't hesitate to contact us.
    
//     Thank you for choosing our services!
    
//     ${companyName}
//     ${companySettings.address || ''}
//     ${companySettings.email ? `Email: ${companySettings.email}` : ''}
//     ${companySettings.phone ? `Phone: ${companySettings.phone}` : ''}
//   `
// },
//     // Invoice sent template
//     invoice_sent: {
//       subject: `Invoice ${data.invoiceNumber} - Payment Required`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
//             <h1 style="color: white; margin: 0; font-size: 28px;">Invoice Ready</h1>
//           </div>
          
//           <div style="padding: 30px; background: #f8f9fa;">
//             <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>
            
//             <p style="font-size: 16px; color: #333; line-height: 1.6;">
//               Please find your invoice details below. Payment is requested within the specified due date.
//             </p>
            
//             <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
//               <h3 style="color: #333; margin-top: 0;">Invoice Details:</h3>
//               <table style="width: 100%; border-collapse: collapse;">
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.invoiceNumber}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Type:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.invoiceType}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Amount Due:</strong></td>
//                   <td style="padding: 10px 0; color: #ff6b6b; border-bottom: 1px solid #eee; font-weight: bold; font-size: 20px;">$${data.totalAmount}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.dueDate}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666;"><strong>Related Project:</strong></td>
//                   <td style="padding: 10px 0; color: #333;">${data.quotationTitle}</td>
//                 </tr>
//               </table>
//             </div>
            
//             ${data.dueDate && new Date(data.dueDate) < new Date(Date.now() + 7*24*60*60*1000) ? 
//               `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
//                 <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ This invoice is due within 7 days. Please arrange payment as soon as possible.</p>
//               </div>` : ''
//             }
            
//             <div style="text-align: center; margin: 30px 0;">
//               <p style="color: #666;">
//                 For payment instructions or questions, please contact us.
//               </p>
//             </div>
//           </div>
          
//           <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//             <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//             ${companySettings.phone ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Phone: ${companySettings.phone}</p>` : ''}
//           </div>
//         </div>
//       `,
//       text: `
//         Invoice Ready
        
//         Hello ${data.clientName},
        
//         Please find your invoice details below. Payment is requested within the specified due date.
        
//         Invoice Details:
//         - Invoice Number: ${data.invoiceNumber}
//         - Invoice Type: ${data.invoiceType}
//         - Amount Due: $${data.totalAmount}
//         - Due Date: ${data.dueDate}
//         - Related Project: ${data.quotationTitle}
        
//         For payment instructions or questions, please contact us.
        
//         ${companyName}
//         ${companySettings.phone ? `Phone: ${companySettings.phone}` : ''}
//       `
//     },

//     // User created template
//     user_created: {
//       subject: `Welcome to ${companyName}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
//             <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
//           </div>
          
//           <div style="padding: 30px; background: #f8f9fa;">
//             <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName},</h2>
            
//             <p style="font-size: 16px; color: #333; line-height: 1.6;">
//               Your account has been created successfully in our Quotation Management System.
//             </p>
            
//             <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
//               <h3 style="color: #333; margin-top: 0;">Account Details:</h3>
//               <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
//               <p><strong>Email:</strong> ${data.email}</p>
//               <p><strong>Role:</strong> ${data.role}</p>
//             </div>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${companySettings.website || '#'}" 
//                  style="background: #667eea; color: white; padding: 12px 30px; 
//                         text-decoration: none; border-radius: 5px; display: inline-block;">
//                 Access System
//               </a>
//             </div>
//           </div>
          
//           <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//             <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//           </div>
//         </div>
//       `,
//       text: `
//         Welcome to ${companyName}!
        
//         Hello ${data.firstName},
        
//         Your account has been created successfully.
        
//         Account Details:
//         - Name: ${data.firstName} ${data.lastName}
//         - Email: ${data.email}
//         - Role: ${data.role}
        
//         You can now access the system.
        
//         ${companyName}
//       `
//     },

//     // Quotation sent template
//     quotation_sent: {
//       subject: `Quotation ${data.quotationNumber} - ${data.quotationTitle}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
//             <h1 style="color: white; margin: 0; font-size: 28px;">New Quotation</h1>
//           </div>
          
//           <div style="padding: 30px; background: #f8f9fa;">
//             <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.clientName},</h2>
            
//             <p style="font-size: 16px; color: #333; line-height: 1.6;">
//               Please find your quotation attached. We look forward to working with you on this project.
//             </p>
            
//             <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
//               <h3 style="color: #333; margin-top: 0;">Quotation Details:</h3>
//               <table style="width: 100%; border-collapse: collapse;">
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Quotation Number:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationNumber}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Project:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.quotationTitle}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td>
//                   <td style="padding: 10px 0; color: #059669; border-bottom: 1px solid #eee; font-weight: bold; font-size: 18px;">$${data.totalAmount}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td>
//                   <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${data.validUntil || 'See quotation for details'}</td>
//                 </tr>
//                 <tr>
//                   <td style="padding: 10px 0; color: #666;"><strong>Date:</strong></td>
//                   <td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td>
//                 </tr>
//               </table>
//             </div>
            
//             ${data.description ? `
//               <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
//                 <h3 style="color: #065f46; margin-top: 0;">Project Description:</h3>
//                 <p style="color: #047857; margin: 0; line-height: 1.6;">${data.description}</p>
//               </div>
//             ` : ''}
            
//             ${data.notes ? `
//               <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
//                 <h3 style="color: #1e40af; margin-top: 0;">Additional Notes:</h3>
//                 <p style="color: #1e3a8a; margin: 0; line-height: 1.6;">${data.notes}</p>
//               </div>
//             ` : ''}
            
//             <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
//               <p style="color: #856404; margin: 0; font-weight: bold; text-align: center;">
//                 📎 Please find the detailed quotation attached as a PDF
//               </p>
//             </div>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <p style="color: #666;">
//                 If you have any questions or would like to discuss this quotation, please don't hesitate to contact us.
//               </p>
//               <p style="color: #333; font-weight: bold;">
//                 Thank you for considering our services!
//               </p>
//             </div>
//           </div>
          
//           <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//             <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//             ${companySettings.email ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Email: ${companySettings.email}</p>` : ''}
//             ${companySettings.website ? `<p style="margin: 5px 0 0 0; font-size: 12px;">Website: ${companySettings.website}</p>` : ''}
//           </div>
//         </div>
//       `,
//       text: `
//         New Quotation
        
//         Hello ${data.clientName},
        
//         Please find your quotation attached. We look forward to working with you on this project.
        
//         Quotation Details:
//         - Quotation Number: ${data.quotationNumber}
//         - Project: ${data.quotationTitle}
//         - Total Amount: $${data.totalAmount}
//         - Valid Until: ${data.validUntil || 'See quotation for details'}
//         - Date: ${new Date().toLocaleDateString()}
        
//         ${data.description ? `Project Description: ${data.description}` : ''}
//         ${data.notes ? `Additional Notes: ${data.notes}` : ''}
        
//         Please find the detailed quotation attached as a PDF.
        
//         If you have any questions, please don't hesitate to contact us.
        
//         Thank you for considering our services!
        
//         ${companyName}
//         ${companySettings.email ? `Email: ${companySettings.email}` : ''}
//         ${companySettings.website ? `Website: ${companySettings.website}` : ''}
//       `
//     },

//     // Password reset template
//     password_reset: {
//       subject: 'Password Reset Request',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 30px; text-align: center;">
//             <h1 style="color: #2d3436; margin: 0; font-size: 28px;">Password Reset</h1>
//           </div>
          
//           <div style="padding: 30px; background: #f8f9fa;">
//             <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.firstName},</h2>
            
//             <p style="font-size: 16px; color: #333; line-height: 1.6;">
//               You requested to reset your password. Click the button below to reset it:
//             </p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${data.resetLink}" 
//                  style="background: #e17055; color: white; padding: 12px 30px; 
//                         text-decoration: none; border-radius: 5px; display: inline-block;">
//                 Reset Password
//               </a>
//             </div>
            
//             <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
//               <p style="color: #856404; margin: 0;">
//                 ⚠️ This link will expire in 1 hour for security reasons.
//               </p>
//             </div>
            
//             <p style="color: #666; font-size: 14px;">
//               If you didn't request this, please ignore this email.
//             </p>
//           </div>
          
//           <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//             <p style="margin: 0;">© ${currentYear} ${companyName}. All rights reserved.</p>
//           </div>
//         </div>
//       `,
//       text: `
//         Password Reset Request
        
//         Hello ${data.firstName},
        
//         You requested to reset your password.
        
//         Reset Link: ${data.resetLink}
        
//         This link will expire in 1 hour for security reasons.
        
//         If you didn't request this, please ignore this email.
        
//         ${companyName}
//       `
//     }
//   };


//   return templates[templateName];
// };

// // Enhanced send email function that gets settings from database
// const sendEmail = async (to, templateName, templateData, options = {}) => {
//   try {
//     const emailTransporter = await getTransporter();
//     if (!emailTransporter) {
//       throw new Error('Email transporter not configured');
//     }

//     // Get current email and company settings
//     const [emailSettings, companySettings] = await Promise.all([
//       settingsService.getEmailSettings(),
//       settingsService.getCompanySettings()
//     ]);

//     const template = getEmailTemplate(templateName, templateData, companySettings);

//     if (!template) {
//       throw new Error(`Email template '${templateName}' not found`);
//     }

//     const mailOptions = {
//       from: {
//         name: emailSettings.fromName || companySettings.name || 'Quotation Management System',
//         address: emailSettings.fromEmail || emailSettings.username
//       },
//       to,
//       subject: options.subject || template.subject,
//       html: template.html,
//       text: template.text,
//       replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
//       ...options
//     };

//     const info = await emailTransporter.sendMail(mailOptions);

//     console.log(`Email sent successfully to ${to} | Message ID: ${info.messageId}`);
    
//     return {
//       success: true,
//       messageId: info.messageId,
//       sentTo: to
//     };

//   } catch (error) {
//     console.error(`Failed to send email to ${to}:`, error.message);
//     throw new Error(`Email sending failed: ${error.message}`);
//   }
// };

// // Send quotation approved email
// // const sendQuotationApprovedEmail = async (quotationData, clientData) => {
// //   const templateData = {
// //     clientName: clientData.contactPerson || clientData.companyName,
// //     quotationNumber: quotationData.quotationNumber,
// //     quotationTitle: quotationData.title,
// //     totalAmount: quotationData.totalAmount
// //   };

// //   return await sendEmail(
// //     clientData.email,
// //     'quotation_approved',
// //     templateData
// //   );
// // };

// // Fixed function to properly handle data types and formatting
// // const sendQuotationApprovedEmail = async (quotationData, clientData) => {
// //   // Helper function to convert Prisma Decimal to number safely
// //   const decimalToNumber = (decimal, defaultValue = 0) => {
// //     if (!decimal) return defaultValue;
    
// //     // If it's already a number
// //     if (typeof decimal === 'number') return decimal;
    
// //     // If it's a string
// //     if (typeof decimal === 'string') {
// //       const parsed = parseFloat(decimal);
// //       return isNaN(parsed) ? defaultValue : parsed;
// //     }
    
// //     // If it's a Prisma Decimal object
// //     if (decimal && typeof decimal === 'object' && decimal.toNumber) {
// //       return decimal.toNumber();
// //     }
    
// //     // If it's a Prisma Decimal object (alternative method)
// //     if (decimal && typeof decimal === 'object' && decimal.toString) {
// //       const parsed = parseFloat(decimal.toString());
// //       return isNaN(parsed) ? defaultValue : parsed;
// //     }
    
// //     return defaultValue;
// //   };

// //   // Helper function to format currency
// //   const formatCurrency = (amount) => {
// //     const numAmount = decimalToNumber(amount, 0);
// //     return new Intl.NumberFormat('en-US', {
// //       style: 'currency',
// //       currency: 'USD',
// //       minimumFractionDigits: 2,
// //     }).format(numAmount);
// //   };

// //   // Get proper client name (avoid phone numbers)
// //   const getClientName = (clientData) => {
// //     // Check if contactPerson looks like a phone number
// //     const isPhoneNumber = (str) => {
// //       if (!str) return false;
// //       // Remove common phone number characters and check if it's mostly digits
// //       const cleaned = str.replace(/[\s\-\(\)\+]/g, '');
// //       return /^\d{8,}$/.test(cleaned); // 8 or more digits = likely phone number
// //     };

// //     // Try different name fields, avoid phone numbers
// //     if (clientData.contactPerson && !isPhoneNumber(clientData.contactPerson)) {
// //       return clientData.contactPerson.trim();
// //     }
    
// //     if (clientData.companyName && clientData.companyName.trim()) {
// //       return clientData.companyName.trim();
// //     }
    
// //     if (clientData.firstName && clientData.lastName) {
// //       return `${clientData.firstName} ${clientData.lastName}`.trim();
// //     }
    
// //     if (clientData.firstName) {
// //       return clientData.firstName.trim();
// //     }
    
// //     // If contactPerson is a phone number, use company name or fallback
// //     return clientData.companyName || 'Valued Client';
// //   };

// //   // Convert all decimal fields to numbers
// //   const subtotal = decimalToNumber(quotationData.subtotal);
// //   const gstPercentage = decimalToNumber(quotationData.gstPercentage);
// //   const pstPercentage = decimalToNumber(quotationData.pstPercentage);
// //   const taxPercentage = decimalToNumber(quotationData.taxPercentage); // Legacy support
  
// //   // Get tax amounts (use existing calculated amounts from DB if available)
// //   const gstAmount = decimalToNumber(quotationData.gstAmount);
// //   const pstAmount = decimalToNumber(quotationData.pstAmount);
// //   const combinedTaxAmount = decimalToNumber(quotationData.combinedTaxAmount);
// //   const totalAmount = decimalToNumber(quotationData.totalAmount);

// //   // Determine tax type based on actual amounts/percentages
// //   let taxationType = 'none';
// //   if (gstPercentage > 0 && pstPercentage > 0) {
// //     taxationType = 'both';
// //   } else if (gstPercentage > 0) {
// //     taxationType = 'gst';
// //   } else if (pstPercentage > 0) {
// //     taxationType = 'pst';
// //   } else if (taxPercentage > 0) {
// //     // Legacy support - assume GST if old taxPercentage is used
// //     taxationType = 'gst';
// //   }

// //   // Process dynamic fields from formData JSON
// //   const dynamicFields = [];
// //   if (quotationData.formData && typeof quotationData.formData === 'object') {
// //     for (const [key, value] of Object.entries(quotationData.formData)) {
// //       // Skip system fields and empty values
// //       if (!['createdAt', 'updatedAt', 'id', 'clientId', 'userId'].includes(key) && 
// //           value !== null && value !== undefined && value !== '') {
// //         dynamicFields.push({
// //           label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
// //           value: value
// //         });
// //       }
// //     }
// //   }

// //   const templateData = {
// //     clientName: getClientName(clientData),
// //     quotationNumber: quotationData.quotationNumber || 'N/A',
// //     quotationTitle: quotationData.title || 'Untitled Project',
// //     description: quotationData.description || null,
// //     validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : null,
// //     notes: quotationData.notes || null,
    
// //     // Financial details (all properly converted from Decimal)
// //     subtotal: formatCurrency(subtotal),
// //     taxationType: taxationType,
// //     gstPercentage: gstPercentage.toFixed(2),
// //     pstPercentage: pstPercentage.toFixed(2),
    
// //     // Tax amounts (use calculated amounts from database)
// //     gstAmount: formatCurrency(gstAmount),
// //     pstAmount: formatCurrency(pstAmount),
// //     totalTaxAmount: formatCurrency(combinedTaxAmount),
// //     totalAmount: formatCurrency(totalAmount),
    
// //     // Dynamic fields
// //     dynamicFields: dynamicFields.length > 0 ? dynamicFields : null
// //   };

// //   // Debug logging (remove in production)
// //   console.log('Prisma Data Debug:', {
// //     subtotal: { original: quotationData.subtotal, converted: subtotal },
// //     totalAmount: { original: quotationData.totalAmount, converted: totalAmount },
// //     clientName: { 
// //       contactPerson: clientData.contactPerson, 
// //       companyName: clientData.companyName,
// //       resolved: templateData.clientName 
// //     }
// //   });

// //   return await sendEmail(
// //     clientData.email,
// //     'quotation_approved',
// //     templateData
// //   );
// // };


// const sendQuotationApprovedEmail = async (quotationData, clientData) => {
//   // Helper function to convert any value to a proper number
//   const toNumber = (value, defaultValue = 0) => {
//     if (value === null || value === undefined) return defaultValue;
    
//     // If it's already a number
//     if (typeof value === 'number') return value;
    
//     // If it's a string
//     if (typeof value === 'string') {
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? defaultValue : parsed;
//     }
    
//     // If it's a Prisma Decimal object with toNumber method
//     if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
//       return value.toNumber();
//     }
    
//     // If it's a Prisma Decimal object with toString method
//     if (value && typeof value === 'object' && typeof value.toString === 'function') {
//       const parsed = parseFloat(value.toString());
//       return isNaN(parsed) ? defaultValue : parsed;
//     }
    
//     // Try direct conversion as fallback
//     const parsed = parseFloat(value);
//     return isNaN(parsed) ? defaultValue : parsed;
//   };

//   // Helper function to format currency
//   const formatCurrency = (amount) => {
//     const numAmount = toNumber(amount, 0);
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//     }).format(numAmount);
//   };

//   // Get proper client name
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

//   // Convert all values to proper numbers
//   const subtotal = toNumber(quotationData.subtotal);
//   const gstPercentage = toNumber(quotationData.gstPercentage);
//   const pstPercentage = toNumber(quotationData.pstPercentage);
//   const gstAmount = toNumber(quotationData.gstAmount);
//   const pstAmount = toNumber(quotationData.pstAmount);
//   const combinedTaxAmount = toNumber(quotationData.combinedTaxAmount);
//   const totalAmount = toNumber(quotationData.totalAmount);

//   // Debug converted values
//   console.log('=== CONVERTED VALUES DEBUG ===');
//   console.log('Subtotal:', subtotal, '(formatted:', formatCurrency(subtotal), ')');
//   console.log('GST:', { percentage: gstPercentage, amount: gstAmount });
//   console.log('PST:', { percentage: pstPercentage, amount: pstAmount });
//   console.log('Total Amount:', totalAmount, '(formatted:', formatCurrency(totalAmount), ')');

//   // Determine tax type based on actual amounts AND percentages
//   let taxationType = 'none';
  
//   if ((gstAmount > 0 || gstPercentage > 0) && (pstAmount > 0 || pstPercentage > 0)) {
//     taxationType = 'both';
//   } else if (gstAmount > 0 || gstPercentage > 0) {
//     taxationType = 'gst';
//   } else if (pstAmount > 0 || pstPercentage > 0) {
//     taxationType = 'pst';
//   }

//   console.log('Determined tax type:', taxationType);

//   // Process dynamic fields
//   const dynamicFields = [];
//   if (quotationData.formData && typeof quotationData.formData === 'object') {
//     for (const [key, value] of Object.entries(quotationData.formData)) {
//       if (!['createdAt', 'updatedAt', 'id', 'clientId', 'userId'].includes(key) && 
//           value !== null && value !== undefined && value !== '') {
//         dynamicFields.push({
//           label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
//           value: value
//         });
//       }
//     }
//   }

//   const templateData = {
//     clientName: getClientName(clientData),
//     quotationNumber: quotationData.quotationNumber || 'N/A',
//     quotationTitle: quotationData.title || 'Untitled Project',
//     description: quotationData.description || null,
//     validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : null,
//     notes: quotationData.notes || null,
    
//     // Financial details - all properly converted
//     subtotal: formatCurrency(subtotal),
//     taxationType: taxationType,
//     gstPercentage: gstPercentage.toFixed(2),
//     pstPercentage: pstPercentage.toFixed(2),
    
//     // Tax amounts - properly formatted
//     gstAmount: formatCurrency(gstAmount),
//     pstAmount: formatCurrency(pstAmount),
//     totalTaxAmount: formatCurrency(combinedTaxAmount),
//     totalAmount: formatCurrency(totalAmount),
    
//     // Dynamic fields
//     dynamicFields: dynamicFields.length > 0 ? dynamicFields : null
//   };

//   console.log('=== FINAL TEMPLATE DATA ===');
//   console.log('Subtotal:', templateData.subtotal);
//   console.log('Tax Type:', templateData.taxationType);
//   console.log('GST Amount:', templateData.gstAmount);
//   console.log('PST Amount:', templateData.pstAmount);
//   console.log('Total Amount:', templateData.totalAmount);
//   console.log('============================');

//   return await sendEmail(
//     clientData.email,
//     'quotation_approved',
//     templateData
//   );
// };

// // Send invoice email
// const sendInvoiceEmail = async (invoiceData, clientData, quotationData) => {
//   const templateData = {
//     clientName: clientData.contactPerson || clientData.companyName,
//     invoiceNumber: invoiceData.invoiceNumber,
//     invoiceType: invoiceData.type.replace(/_/g, ' '),
//     totalAmount: invoiceData.totalAmount,
//     dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'Not specified',
//     quotationTitle: quotationData?.title || 'N/A'
//   };

//   return await sendEmail(
//     clientData.email,
//     'invoice_sent',
//     templateData
//   );
// };

// // Send welcome email to new user
// const sendUserWelcomeEmail = async (userData) => {
//   const templateData = {
//     firstName: userData.firstName,
//     lastName: userData.lastName,
//     email: userData.email,
//     role: userData.role.replace(/_/g, ' ')
//   };

//   return await sendEmail(
//     userData.email,
//     'user_created',
//     templateData
//   );
// };

// // Send password reset email
// // const sendPasswordResetEmail = async (userData, resetToken) => {
// //   const companySettings = await settingsService.getCompanySettings();
// //   const resetLink = `${companySettings.website || process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
// //   const templateData = {
// //     firstName: userData.firstName,
// //     resetLink
// //   };

// //   return await sendEmail(
// //     userData.email,
// //     'password_reset',
// //     templateData
// //   );
// // };

// // Send password reset email

// // FIXED: Send password reset email using the proper email infrastructure
// // const sendPasswordResetEmail = async (email, resetToken, userFirstName = 'User') => {
// //   try {
// //     // Use the same transporter as other email functions
// //     const emailTransporter = await getTransporter();
// //     if (!emailTransporter) {
// //       throw new Error('Email transporter not configured');
// //     }

// //     // Get current email and company settings like other functions
// //     const [emailSettings, companySettings] = await Promise.all([
// //       settingsService.getEmailSettings(),
// //       settingsService.getCompanySettings()
// //     ]);

// //     // Build reset URL using company website or fallback
// //     const resetUrl = `${companySettings.website || process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password?token=${resetToken}`;
    
// //     const currentYear = new Date().getFullYear();
// //     const companyName = companySettings.name || 'QuoteFlow';

// //     const mailOptions = {
// //       from: {
// //         name: emailSettings.fromName || companyName,
// //         address: emailSettings.fromEmail || emailSettings.username
// //       },
// //       to: email,
// //       subject: `Reset Your Password - ${companyName}`,
// //       replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
// //       html: `
// //         <!DOCTYPE html>
// //         <html>
// //           <head>
// //             <meta charset="utf-8">
// //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //             <title>Reset Your Password</title>
// //             <style>
// //               body {
// //                 font-family: 'Helvetica Neue', Arial, sans-serif;
// //                 line-height: 1.6;
// //                 color: #333;
// //                 max-width: 600px;
// //                 margin: 0 auto;
// //                 padding: 20px;
// //                 background-color: #f4f4f4;
// //               }
// //               .email-container {
// //                 background: white;
// //                 padding: 40px;
// //                 border-radius: 10px;
// //                 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
// //               }
// //               .header {
// //                 text-align: center;
// //                 margin-bottom: 30px;
// //               }
// //               .logo {
// //                 background: #3B82F6;
// //                 color: white;
// //                 width: 60px;
// //                 height: 60px;
// //                 border-radius: 12px;
// //                 display: inline-flex;
// //                 align-items: center;
// //                 justify-content: center;
// //                 font-size: 24px;
// //                 font-weight: bold;
// //                 margin-bottom: 20px;
// //               }
// //               .title {
// //                 color: #1F2937;
// //                 font-size: 28px;
// //                 font-weight: bold;
// //                 margin: 0;
// //               }
// //               .content {
// //                 margin: 30px 0;
// //               }
// //               .greeting {
// //                 font-size: 18px;
// //                 color: #374151;
// //                 margin-bottom: 20px;
// //               }
// //               .message {
// //                 color: #6B7280;
// //                 margin-bottom: 30px;
// //                 line-height: 1.7;
// //               }
// //               .reset-button {
// //                 display: inline-block;
// //                 background: #3B82F6;
// //                 color: white;
// //                 padding: 15px 30px;
// //                 text-decoration: none;
// //                 border-radius: 8px;
// //                 font-weight: 600;
// //                 font-size: 16px;
// //                 text-align: center;
// //                 margin: 20px 0;
// //               }
// //               .reset-button:hover {
// //                 background: #2563EB;
// //               }
// //               .alternative-link {
// //                 background: #F3F4F6;
// //                 padding: 15px;
// //                 border-radius: 8px;
// //                 margin: 20px 0;
// //                 word-break: break-all;
// //                 font-family: monospace;
// //                 font-size: 14px;
// //                 color: #6B7280;
// //               }
// //               .footer {
// //                 margin-top: 40px;
// //                 padding-top: 20px;
// //                 border-top: 1px solid #E5E7EB;
// //                 font-size: 14px;
// //                 color: #9CA3AF;
// //                 text-align: center;
// //               }
// //               .security-note {
// //                 background: #FEF3C7;
// //                 border-left: 4px solid #F59E0B;
// //                 padding: 15px;
// //                 margin: 20px 0;
// //                 border-radius: 4px;
// //               }
// //               .security-note h4 {
// //                 margin: 0 0 10px 0;
// //                 color: #92400E;
// //                 font-size: 16px;
// //               }
// //               .security-note p {
// //                 margin: 0;
// //                 color: #A16207;
// //                 font-size: 14px;
// //               }
// //             </style>
// //           </head>
// //           <body>
// //             <div class="email-container">
// //               <div class="header">
// //                 <div class="logo">${companyName.substring(0, 2).toUpperCase()}</div>
// //                 <h1 class="title">Password Reset Request</h1>
// //               </div>
              
// //               <div class="content">
// //                 <div class="greeting">Hello ${userFirstName},</div>
                
// //                 <div class="message">
// //                   We received a request to reset the password for your ${companyName} account. If you made this request, click the button below to reset your password:
// //                 </div>
                
// //                 <div style="text-align: center;">
// //                   <a href="${resetUrl}" class="reset-button">Reset My Password</a>
// //                 </div>
                
// //                 <div class="message">
// //                   If the button doesn't work, you can copy and paste the following link into your web browser:
// //                 </div>
                
// //                 <div class="alternative-link">
// //                   ${resetUrl}
// //                 </div>
                
// //                 <div class="security-note">
// //                   <h4>Security Notice</h4>
// //                   <p>This password reset link will expire in 1 hour for your security. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
// //                 </div>
                
// //                 <div class="message">
// //                   If you're having trouble accessing your account or didn't request this password reset, please contact our support team.
// //                 </div>
// //               </div>
              
// //               <div class="footer">
// //                 <p>
// //                   <strong>${companyName}</strong><br>
// //                   ${companySettings.address ? companySettings.address + '<br>' : ''}
// //                   ${companySettings.email ? 'Email: ' + companySettings.email + '<br>' : ''}
// //                   ${companySettings.phone ? 'Phone: ' + companySettings.phone + '<br>' : ''}
// //                 </p>
// //                 <p style="margin-top: 10px; font-size: 12px;">
// //                   © ${currentYear} ${companyName}. All rights reserved.
// //                 </p>
// //                 <p style="margin-top: 10px; font-size: 12px;">
// //                   This is an automated email, please do not reply to this message.
// //                 </p>
// //               </div>
// //             </div>
// //           </body>
// //         </html>
// //       `,
// //       text: `
// // Hello ${userFirstName},

// // We received a request to reset the password for your ${companyName} account.

// // To reset your password, click the following link:
// // ${resetUrl}

// // This link will expire in 1 hour for your security.

// // If you didn't request a password reset, please ignore this email.

// // If you're having trouble, please contact support.

// // Best regards,
// // ${companyName} Team

// // ${companySettings.address || ''}
// // ${companySettings.email ? 'Email: ' + companySettings.email : ''}
// // ${companySettings.phone ? 'Phone: ' + companySettings.phone : ''}

// // ---
// // This is an automated email, please do not reply to this message.
// // © ${currentYear} ${companyName}. All rights reserved.
// //       `
// //     };

// //     const info = await emailTransporter.sendMail(mailOptions);
    
// //     console.log(`Password reset email sent successfully to ${email} | Message ID: ${info.messageId}`);
    
// //     return {
// //       success: true,
// //       messageId: info.messageId,
// //       sentTo: email
// //     };
    
// //   } catch (error) {
// //     console.error(`Failed to send password reset email to ${email}:`, error.message);
// //     throw new Error(`Password reset email sending failed: ${error.message}`);
// //   }
// // };

// // FIXED: Send password reset email using the proper email infrastructure
// const sendPasswordResetEmail = async (email, resetToken, userFirstName = 'User') => {
//   try {
//     // Use the same transporter as other email functions
//     const emailTransporter = await getTransporter();
//     if (!emailTransporter) {
//       throw new Error('Email transporter not configured');
//     }

//     // Get current email and company settings like other functions
//     const [emailSettings, companySettings] = await Promise.all([
//       settingsService.getEmailSettings(),
//       settingsService.getCompanySettings()
//     ]);

//     // Build reset URL - prioritize environment over database settings
//     // In development: use FRONTEND_URL or localhost
//     // In production: use company website or FRONTEND_URL
//     let baseUrl;
    
//     if (process.env.NODE_ENV === 'development') {
//       // Development: prioritize FRONTEND_URL (localhost) over company website
//       baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     } else {
//       // Production: prioritize company website over FRONTEND_URL
//       baseUrl = companySettings.website || process.env.FRONTEND_URL || 'https://qodixlab.com';
//     }
    
//     const resetUrl = `${baseUrl}/forgot-password?token=${resetToken}`;
    
//     console.log('Generated reset URL:', resetUrl);
//     console.log('Environment:', process.env.NODE_ENV);
//     console.log('Company website:', companySettings.website);
//     console.log('FRONTEND_URL env:', process.env.FRONTEND_URL);
    
//     const currentYear = new Date().getFullYear();
//     const companyName = companySettings.name || 'QuoteFlow';

//     const mailOptions = {
//       from: {
//         name: emailSettings.fromName || companyName,
//         address: emailSettings.fromEmail || emailSettings.username
//       },
//       to: email,
//       subject: `Reset Your Password - ${companyName}`,
//       replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
//       html: `
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <meta charset="utf-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Reset Your Password</title>
//             <style>
//               body {
//                 font-family: 'Helvetica Neue', Arial, sans-serif;
//                 line-height: 1.6;
//                 color: #333;
//                 max-width: 600px;
//                 margin: 0 auto;
//                 padding: 20px;
//                 background-color: #f4f4f4;
//               }
//               .email-container {
//                 background: white;
//                 padding: 40px;
//                 border-radius: 10px;
//                 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//               }
//               .header {
//                 text-align: center;
//                 margin-bottom: 30px;
//               }
//               .logo {
//                 background: #3B82F6;
//                 color: white;
//                 width: 60px;
//                 height: 60px;
//                 border-radius: 12px;
//                 display: inline-flex;
//                 align-items: center;
//                 justify-content: center;
//                 font-size: 24px;
//                 font-weight: bold;
//                 margin-bottom: 20px;
//               }
//               .title {
//                 color: #1F2937;
//                 font-size: 28px;
//                 font-weight: bold;
//                 margin: 0;
//               }
//               .content {
//                 margin: 30px 0;
//               }
//               .greeting {
//                 font-size: 18px;
//                 color: #374151;
//                 margin-bottom: 20px;
//               }
//               .message {
//                 color: #6B7280;
//                 margin-bottom: 30px;
//                 line-height: 1.7;
//               }
//               .reset-button {
//                 display: inline-block;
//                 background: #3B82F6;
//                 color: white;
//                 padding: 15px 30px;
//                 text-decoration: none;
//                 border-radius: 8px;
//                 font-weight: 600;
//                 font-size: 16px;
//                 text-align: center;
//                 margin: 20px 0;
//               }
//               .reset-button:hover {
//                 background: #2563EB;
//               }
//               .alternative-link {
//                 background: #F3F4F6;
//                 padding: 15px;
//                 border-radius: 8px;
//                 margin: 20px 0;
//                 word-break: break-all;
//                 font-family: monospace;
//                 font-size: 14px;
//                 color: #6B7280;
//               }
//               .footer {
//                 margin-top: 40px;
//                 padding-top: 20px;
//                 border-top: 1px solid #E5E7EB;
//                 font-size: 14px;
//                 color: #9CA3AF;
//                 text-align: center;
//               }
//               .security-note {
//                 background: #FEF3C7;
//                 border-left: 4px solid #F59E0B;
//                 padding: 15px;
//                 margin: 20px 0;
//                 border-radius: 4px;
//               }
//               .security-note h4 {
//                 margin: 0 0 10px 0;
//                 color: #92400E;
//                 font-size: 16px;
//               }
//               .security-note p {
//                 margin: 0;
//                 color: #A16207;
//                 font-size: 14px;
//               }
//             </style>
//           </head>
//           <body>
//             <div class="email-container">
//               <div class="header">
//                 <div class="logo">${companyName.substring(0, 2).toUpperCase()}</div>
//                 <h1 class="title">Password Reset Request</h1>
//               </div>
              
//               <div class="content">
//                 <div class="greeting">Hello ${userFirstName},</div>
                
//                 <div class="message">
//                   We received a request to reset the password for your ${companyName} account. If you made this request, click the button below to reset your password:
//                 </div>
                
//                 <div style="text-align: center;">
//                   <a href="${resetUrl}" class="reset-button">Reset My Password</a>
//                 </div>
                
//                 <div class="message">
//                   If the button doesn't work, you can copy and paste the following link into your web browser:
//                 </div>
                
//                 <div class="alternative-link">
//                   ${resetUrl}
//                 </div>
                
//                 <div class="security-note">
//                   <h4>Security Notice</h4>
//                   <p>This password reset link will expire in 1 hour for your security. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
//                 </div>
                
//                 <div class="message">
//                   If you're having trouble accessing your account or didn't request this password reset, please contact our support team.
//                 </div>
//               </div>
              
//               <div class="footer">
//                 <p>
//                   <strong>${companyName}</strong><br>
//                   ${companySettings.address ? companySettings.address + '<br>' : ''}
//                   ${companySettings.email ? 'Email: ' + companySettings.email + '<br>' : ''}
//                   ${companySettings.phone ? 'Phone: ' + companySettings.phone + '<br>' : ''}
//                 </p>
//                 <p style="margin-top: 10px; font-size: 12px;">
//                   © ${currentYear} ${companyName}. All rights reserved.
//                 </p>
//                 <p style="margin-top: 10px; font-size: 12px;">
//                   This is an automated email, please do not reply to this message.
//                 </p>
//               </div>
//             </div>
//           </body>
//         </html>
//       `,
//       text: `
// Hello ${userFirstName},

// We received a request to reset the password for your ${companyName} account.

// To reset your password, click the following link:
// ${resetUrl}

// This link will expire in 1 hour for your security.

// If you didn't request a password reset, please ignore this email.

// If you're having trouble, please contact support.

// Best regards,
// ${companyName} Team

// ${companySettings.address || ''}
// ${companySettings.email ? 'Email: ' + companySettings.email : ''}
// ${companySettings.phone ? 'Phone: ' + companySettings.phone : ''}

// ---
// This is an automated email, please do not reply to this message.
// © ${currentYear} ${companyName}. All rights reserved.
//       `
//     };

//     const info = await emailTransporter.sendMail(mailOptions);
    
//     console.log(`Password reset email sent successfully to ${email} | Message ID: ${info.messageId}`);
    
//     return {
//       success: true,
//       messageId: info.messageId,
//       sentTo: email
//     };
    
//   } catch (error) {
//     console.error(`Failed to send password reset email to ${email}:`, error.message);
//     throw new Error(`Password reset email sending failed: ${error.message}`);
//   }
// };

// // Send quotation email with PDF
// const sendQuotationEmail = async (quotationData, clientData, pdfBuffer) => {
//   const templateData = {
//     clientName: clientData.contactPerson || clientData.companyName,
//     quotationNumber: quotationData.quotationNumber,
//     quotationTitle: quotationData.title,
//     totalAmount: quotationData.totalAmount,
//     validUntil: quotationData.validUntil ? new Date(quotationData.validUntil).toLocaleDateString() : null,
//     description: quotationData.description,
//     notes: quotationData.notes
//   };

//   const emailOptions = {
//     attachments: [
//       {
//         filename: `quotation-${quotationData.quotationNumber}.pdf`,
//         content: pdfBuffer,
//         contentType: 'application/pdf'
//       }
//     ]
//   };

//   return await sendEmail(
//     clientData.email,
//     'quotation_sent',
//     templateData,
//     emailOptions
//   );
// };

// // Enhanced invoice email template with tax details
// const getInvoiceEmailTemplateWithTax = (templateData, taxType, taxDetails) => {
//   const getTaxTypeDescription = (type) => {
//     const descriptions = {
//       NO_TAX: 'Tax Exempt',
//       GST_ONLY: `GST Only (${taxDetails.gstRate}%)`,
//       PST_ONLY: `PST Only (${taxDetails.pstRate}%)`,
//       GST_AND_PST: `GST (${taxDetails.gstRate}%) + PST (${taxDetails.pstRate}%)`
//     };
//     return descriptions[type] || 'Standard Tax';
//   };

//   const renderTaxBreakdown = () => {
//     let breakdown = `
//       <tr>
//         <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Subtotal:</strong></td>
//         <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${templateData.subtotal}</td>
//       </tr>
//     `;

//     if (taxType === 'GST_ONLY' || taxType === 'GST_AND_PST') {
//       breakdown += `
//         <tr>
//           <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>GST (${taxDetails.gstRate}%):</strong></td>
//           <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${taxDetails.gstAmount}</td>
//         </tr>
//       `;
//     }

//     if (taxType === 'PST_ONLY' || taxType === 'GST_AND_PST') {
//       breakdown += `
//         <tr>
//           <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>PST (${taxDetails.pstRate}%):</strong></td>
//           <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">$${taxDetails.pstAmount}</td>
//         </tr>
//       `;
//     }

//     if (taxType === 'NO_TAX') {
//       breakdown += `
//         <tr>
//           <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Tax Status:</strong></td>
//           <td style="padding: 10px 0; color: #28a745; border-bottom: 1px solid #eee; font-weight: bold;">Tax Exempt</td>
//         </tr>
//       `;
//     }

//     return breakdown;
//   };

//   return {
//     subject: `Invoice ${templateData.invoiceNumber} - ${getTaxTypeDescription(taxType)}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
//           <h1 style="color: white; margin: 0; font-size: 28px;">Invoice Ready</h1>
//           <div style="color: #fff3cd; font-size: 14px; margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-block;">
//             ${getTaxTypeDescription(taxType)}
//           </div>
//         </div>
        
//         <div style="padding: 30px; background: #f8f9fa;">
//           <h2 style="color: #333; margin-bottom: 20px;">Hello ${templateData.clientName},</h2>
          
//           <p style="font-size: 16px; color: #333; line-height: 1.6;">
//             Please find your invoice with <strong>${getTaxTypeDescription(taxType)}</strong> calculation attached. 
//             Payment is requested within the specified due date.
//           </p>
          
//           <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
//             <h3 style="color: #333; margin-top: 0;">Invoice Details:</h3>
//             <table style="width: 100%; border-collapse: collapse;">
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td>
//                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${templateData.invoiceNumber}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Invoice Type:</strong></td>
//                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${templateData.invoiceType}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Tax Configuration:</strong></td>
//                 <td style="padding: 10px 0; color: #2563eb; border-bottom: 1px solid #eee; font-weight: bold;">${getTaxTypeDescription(taxType)}</td>
//               </tr>
//               ${renderTaxBreakdown()}
//               <tr style="background: #f8f9fa;">
//                 <td style="padding: 15px 10px; color: #333; font-weight: bold; font-size: 18px;"><strong>Total Amount Due:</strong></td>
//                 <td style="padding: 15px 10px; color: #ff6b6b; font-weight: bold; font-size: 20px;">$${templateData.totalAmount}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td>
//                 <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${templateData.dueDate}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 10px 0; color: #666;"><strong>Related Project:</strong></td>
//                 <td style="padding: 10px 0; color: #333;">${templateData.quotationTitle}</td>
//               </tr>
//             </table>
//           </div>
          
//           <div style="background: #e8f4fd; border: 1px solid #b3d7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
//             <p style="color: #0369a1; margin: 0; font-weight: bold; text-align: center;">
//               📎 Invoice PDF with ${getTaxTypeDescription(taxType)} is attached
//             </p>
//           </div>
          
//           ${templateData.dueDate && new Date(templateData.dueDate) < new Date(Date.now() + 7*24*60*60*1000) ? 
//             `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
//               <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ This invoice is due within 7 days. Please arrange payment as soon as possible.</p>
//             </div>` : ''
//           }
          
//           <div style="text-align: center; margin: 30px 0;">
//             <p style="color: #666;">
//               For payment instructions or questions about the tax calculation, please contact us.
//             </p>
//             <p style="color: #333; font-weight: bold;">
//               Thank you for your business!
//             </p>
//           </div>
//         </div>
        
//         <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
//           <p style="margin: 0;">© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
//         </div>
//       </div>
//     `,
//     text: `
//       Invoice Ready - ${getTaxTypeDescription(taxType)}
      
//       Hello ${templateData.clientName},
      
//       Please find your invoice with ${getTaxTypeDescription(taxType)} calculation attached.
//       Payment is requested within the specified due date.
      
//       Invoice Details:
//       - Invoice Number: ${templateData.invoiceNumber}
//       - Invoice Type: ${templateData.invoiceType}
//       - Tax Configuration: ${getTaxTypeDescription(taxType)}
//       ${taxType !== 'NO_TAX' ? `
//       - Subtotal: $${templateData.subtotal}
//       ${taxType === 'GST_ONLY' || taxType === 'GST_AND_PST' ? `- GST (${taxDetails.gstRate}%): $${taxDetails.gstAmount}` : ''}
//       ${taxType === 'PST_ONLY' || taxType === 'GST_AND_PST' ? `- PST (${taxDetails.pstRate}%): $${taxDetails.pstAmount}` : ''}
//       ` : '- Tax Status: Tax Exempt'}
//       - Total Amount Due: $${templateData.totalAmount}
//       - Due Date: ${templateData.dueDate}
//       - Related Project: ${templateData.quotationTitle}
      
//       Invoice PDF with ${getTaxTypeDescription(taxType)} is attached.
      
//       For payment instructions or questions about the tax calculation, please contact us.
      
//       Thank you for your business!
//     `
//   };
// };

// // Send invoice email with tax PDF
// const sendInvoiceEmailWithTaxPDF = async (invoiceData, clientData, quotationData, pdfBuffer, taxType, taxDetails) => {
//   const templateData = {
//     clientName: clientData.contactPerson || clientData.companyName,
//     invoiceNumber: invoiceData.invoiceNumber,
//     invoiceType: invoiceData.type.replace(/_/g, ' '),
//     subtotal: parseFloat(invoiceData.subtotal).toFixed(2),
//     totalAmount: parseFloat(invoiceData.totalAmount).toFixed(2),
//     dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'Not specified',
//     quotationTitle: quotationData?.title || 'N/A'
//   };

//   const template = getInvoiceEmailTemplateWithTax(templateData, taxType, {
//     gstRate: parseFloat(taxDetails.gstRate).toFixed(2),
//     pstRate: parseFloat(taxDetails.pstRate).toFixed(2),
//     gstAmount: parseFloat(taxDetails.taxCalculations.gstAmount).toFixed(2),
//     pstAmount: parseFloat(taxDetails.taxCalculations.pstAmount).toFixed(2)
//   });

//   const taxTypeSuffix = taxType.toLowerCase().replace(/_/g, '-');
//   const attachmentFilename = `invoice-${invoiceData.invoiceNumber}-${taxTypeSuffix}.pdf`;

//   const emailOptions = {
//     subject: template.subject,
//     html: template.html,
//     text: template.text,
//     attachments: [
//       {
//         filename: attachmentFilename,
//         content: pdfBuffer,
//         contentType: 'application/pdf'
//       }
//     ]
//   };

//   return await sendEmail(
//     clientData.email,
//     'custom_template',
//     templateData,
//     emailOptions
//   );
// };

// // Enhanced send email function for custom templates
// const sendEmailEnhanced = async (to, templateNameOrCustom, templateData, options = {}) => {
//   try {
//     const emailTransporter = await getTransporter();
//     if (!emailTransporter) {
//       throw new Error('Email transporter not configured');
//     }

//     // Get current email and company settings
//     const [emailSettings, companySettings] = await Promise.all([
//       settingsService.getEmailSettings(),
//       settingsService.getCompanySettings()
//     ]);

//     let template;

//     // Check if it's a custom template (for tax-specific emails)
//     if (templateNameOrCustom === 'custom_template') {
//       template = {
//         subject: options.subject,
//         html: options.html,
//         text: options.text
//       };
//     } else {
//       template = getEmailTemplate(templateNameOrCustom, templateData, companySettings);
//     }

//     if (!template) {
//       throw new Error(`Email template '${templateNameOrCustom}' not found`);
//     }

//     const mailOptions = {
//       from: {
//         name: emailSettings.fromName || companySettings.name || 'Quotation Management System',
//         address: emailSettings.fromEmail || emailSettings.username
//       },
//       to,
//       subject: options.subject || template.subject,
//       html: template.html,
//       text: template.text,
//       replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username,
//       ...options
//     };

//     const info = await emailTransporter.sendMail(mailOptions);

//     console.log(`Email sent successfully to ${to} | Message ID: ${info.messageId}`);
    
//     return {
//       success: true,
//       messageId: info.messageId,
//       sentTo: to
//     };

//   } catch (error) {
//     console.error(`Failed to send email to ${to}:`, error.message);
//     throw new Error(`Email sending failed: ${error.message}`);
//   }
// };

// // Send bulk emails
// const sendBulkEmails = async (recipients, templateName, templateData) => {
//   const results = [];
  
//   for (const recipient of recipients) {
//     try {
//       const result = await sendEmail(recipient.email, templateName, {
//         ...templateData,
//         firstName: recipient.firstName || recipient.contactPerson,
//         ...recipient
//       });
//       results.push({ email: recipient.email, success: true, result });
//     } catch (error) {
//       results.push({ email: recipient.email, success: false, error: error.message });
//     }
//   }

//   return results;
// };

// // Test email connection with current settings
// const testEmailConnection = async () => {
//   try {
//     const transporter = await getTransporter();
//     if (!transporter) {
//       throw new Error('Email transporter not configured');
//     }
//     await transporter.verify();
//     return { success: true, message: 'Email connection successful' };
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// };

// // Send test email with current settings
// const sendTestEmail = async (to) => {
//   const companySettings = await settingsService.getCompanySettings();
  
//   const templateData = {
//     firstName: 'Test User',
//     lastName: 'System',
//     email: to,
//     role: 'TEST'
//   };

//   return await sendEmail(to, 'user_created', templateData, {
//     subject: `Test Email - ${companySettings.name || 'Quotation Management System'}`
//   });
// };



// // Email queue processing
// let emailQueue = [];
// let isProcessing = false;

// const addToEmailQueue = (emailData) => {
//   emailQueue.push({
//     id: Date.now() + Math.random(),
//     ...emailData,
//     attempts: 0,
//     maxAttempts: 3,
//     createdAt: new Date()
//   });

//   processEmailQueue();
// };

// const processEmailQueue = async () => {
//   if (isProcessing || emailQueue.length === 0) return;

//   isProcessing = true;

//   while (emailQueue.length > 0) {
//     const emailItem = emailQueue.shift();
    
//     try {
//       await sendEmail(emailItem.to, emailItem.templateName, emailItem.templateData, emailItem.options);
//       console.log(`📧 Queued email sent successfully: ${emailItem.id}`);
//     } catch (error) {
//       emailItem.attempts++;
      
//       if (emailItem.attempts < emailItem.maxAttempts) {
//         emailQueue.push(emailItem); // Retry later
//         console.log(`⚠️  Email failed, retrying (${emailItem.attempts}/${emailItem.maxAttempts}): ${emailItem.id}`);
//       } else {
//         console.error(`❌ Email failed permanently after ${emailItem.maxAttempts} attempts: ${emailItem.id}`);
//       }
//     }

//     // Small delay between emails to avoid rate limiting
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }

//   isProcessing = false;
// };
// module.exports = {
//   initializeTransporter,
//   sendEmail,
//   sendQuotationApprovedEmail,
//   sendInvoiceEmail,
//   sendUserWelcomeEmail,
//   sendPasswordResetEmail,
//   sendQuotationEmail,
//   sendInvoiceEmailWithTaxPDF,
//   getInvoiceEmailTemplateWithTax,
//   sendEmailEnhanced,
//   sendBulkEmails,
//   testEmailConnection,
//   sendTestEmail,
//   addToEmailQueue,
//   processEmailQueue,
//   getEmailTemplate,
//   renderDynamicTemplate,
//   renderHeaderSection,
//   renderQuotationDetailsSection,
//   renderInvoiceDetailsSection,
//   renderFinancialSummarySection,
//   renderNextStepsSection,           // Keep this one
//   renderFooterSection,
//   replaceVariables,
//   convertHtmlToText,
//   renderDynamicFieldsSection,       // New addition
//   renderNotesSection,               // New addition
//   renderProjectDescriptionSection,  // New addition
//   renderPaymentInstructionsSection, // New addition
//   renderAttachmentNoteSection,      // New addition
// };


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

// Send invoice email with PDF
const sendInvoiceEmail = async (invoiceData, clientData, quotationData, pdfBuffer, taxType = 'GST_AND_PST') => {
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

    // Build reset URL
    let baseUrl;
    if (process.env.NODE_ENV === 'development') {
      baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    } else {
      baseUrl = companySettings.website || process.env.FRONTEND_URL || 'https://qodixlab.com';
    }
    
    const resetUrl = `${baseUrl}/forgot-password?token=${resetToken}`;

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