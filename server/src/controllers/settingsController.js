const { settingsService } = require('../services/settingsService');
const { deleteOldLogo } = require('../middleware/upload');
const path = require('path');

/**
 * @desc Get all system settings
 * @route GET /api/settings
 * @access Private (Admin only)
 */
const getAllSettings = async (req, res, next) => {
  try {
    console.log('📋 Getting all settings request');
    
    const settings = await settingsService.getAllSettings();
    console.log('📋 Retrieved settings successfully');

    res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
    
  } catch (error) {
    console.error('📋 Error getting settings:', error);
    next(error);
  }
};

const updateCompanySettings = async (req, res, next) => {
  let uploadedFilePath = null; // Track uploaded file for cleanup
  
  try {
    console.log('🏢 Company settings update request:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    const {
      name, address, city, state, zipCode, country, phone, email, website, taxId
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Get current settings FIRST
    const currentSettings = await settingsService.getCompanySettings();
    let logoPath = currentSettings?.logo || '';

    // Handle logo upload with proper transaction
    if (req.file) {
      uploadedFilePath = `/uploads/logos/${req.file.filename}`;
      console.log('📸 New file uploaded to:', uploadedFilePath);
      
      // Delete old logo BEFORE updating database
      if (currentSettings?.logo) {
        await deleteOldLogo(currentSettings.logo);
        console.log('🗑️ Deleted old logo:', currentSettings.logo);
      }
      
      logoPath = uploadedFilePath;
    }

    const updateData = {
      name,
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'United States',
      phone: phone || '',
      email: email || '',
      website: website || '',
      taxId: taxId || '',
      logo: logoPath
    };

    // Update database with the exact filename that was uploaded
    await settingsService.updateCategorySettings('company', updateData);
    
    console.log('🏢 Company settings updated successfully with logo:', logoPath);
    
    res.status(200).json({
      success: true,
      message: 'Company settings updated successfully',
      data: { 
        company: updateData,
        logoUrl: logoPath ? `${req.protocol}://${req.get('host')}${logoPath}` : null
      }
    });
  } catch (error) {
    console.error('🏢 Company settings update error:', error);
    
    // Cleanup uploaded file if database update failed
    if (uploadedFilePath) {
      await deleteOldLogo(uploadedFilePath);
      console.log('🧹 Cleaned up failed upload:', uploadedFilePath);
    }
    
    next(error);
  }
};

// New endpoint specifically for logo upload
const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided'
      });
    }

    // Get current settings to delete old logo
    const currentSettings = await settingsService.getCompanySettings();
    
    // Delete old logo if exists
    if (currentSettings?.logo) {
      await deleteOldLogo(currentSettings.logo);
    }

    // Set new logo path
    const logoPath = `/uploads/logos/${req.file.filename}`;
    
    // Update only the logo field
    await settingsService.setSettingByKey('company.logo', logoPath, 'company');

    console.log('📸 Company logo uploaded successfully:', logoPath);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoPath,
        logoUrl: `${req.protocol}://${req.get('host')}${logoPath}`
      }
    });
  } catch (error) {
    console.error('📸 Logo upload error:', error);
    next(error);
  }
};

// Delete company logo
const deleteCompanyLogo = async (req, res, next) => {
  try {
    const currentSettings = await settingsService.getCompanySettings();
    
    if (currentSettings?.logo) {
      // Delete file from filesystem
      await deleteOldLogo(currentSettings.logo);
      
      // Remove from database
      await settingsService.setSettingByKey('company.logo', '', 'company');
      
      console.log('🗑️ Company logo deleted successfully');
      
      res.status(200).json({
        success: true,
        message: 'Logo deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No logo found to delete'
      });
    }
  } catch (error) {
    console.error('🗑️ Logo deletion error:', error);
    next(error);
  }
};

/**
 * @desc Update email settings
 * @route POST /api/settings/email
 * @access Private (Admin only)
 */
const updateEmailSettings = async (req, res, next) => {
  try {
    console.log('📧 Email settings update request:', req.body);
    
    const {
      host,
      port,
      secure,
      username,
      password,
      fromName,
      fromEmail,
      replyTo
    } = req.body;

    // Validate required fields
    if (!host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Host, port, username, and password are required'
      });
    }

    // Validate port is a number
    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Port must be a valid number between 1 and 65535'
      });
    }

    // Validate email addresses if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (fromEmail && !emailRegex.test(fromEmail)) {
      return res.status(400).json({
        success: false,
        message: 'From email must be a valid email address'
      });
    }
    if (replyTo && !emailRegex.test(replyTo)) {
      return res.status(400).json({
        success: false,
        message: 'Reply-to must be a valid email address'
      });
    }

    // Use the settings service to update email settings
    await settingsService.updateCategorySettings('email', {
      host: host.trim(),
      port: portNumber,
      secure: Boolean(secure),
      username: username.trim(),
      password: password,
      fromName: fromName || '',
      fromEmail: fromEmail || username,
      replyTo: replyTo || username
    });

    console.log('📧 Email settings updated successfully');

    // Don't return password in response
    const responseData = { ...req.body };
    delete responseData.password;

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully',
      data: { email: responseData }
    });

  } catch (error) {
    console.error('📧 Email settings update error:', error);
    next(error);
  }
};

/**
 * @desc Update tax settings
 * @route POST /api/settings/tax
 * @access Private (Admin only)
 */
const updateTaxSettings = async (req, res, next) => {
  try {
    console.log('💰 Tax settings update request:', req.body);
    
    const {
      defaultGstRate,
      defaultPstRate,
      enableAutoTaxCalculation,
      taxExemptByDefault,
      requireTaxId
    } = req.body;

    // Validate tax rates
    if (defaultGstRate !== undefined && (isNaN(defaultGstRate) || defaultGstRate < 0 || defaultGstRate > 100)) {
      return res.status(400).json({
        success: false,
        message: 'GST rate must be a number between 0 and 100'
      });
    }

    if (defaultPstRate !== undefined && (isNaN(defaultPstRate) || defaultPstRate < 0 || defaultPstRate > 100)) {
      return res.status(400).json({
        success: false,
        message: 'PST rate must be a number between 0 and 100'
      });
    }

    // Use the settings service to update tax settings
    await settingsService.updateCategorySettings('tax', {
      defaultGstRate: parseFloat(defaultGstRate) || 5.0,
      defaultPstRate: parseFloat(defaultPstRate) || 7.0,
      enableAutoTaxCalculation: Boolean(enableAutoTaxCalculation),
      taxExemptByDefault: Boolean(taxExemptByDefault),
      requireTaxId: Boolean(requireTaxId)
    });

    console.log('💰 Tax settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Tax settings updated successfully',
      data: { tax: req.body }
    });

  } catch (error) {
    console.error('💰 Tax settings update error:', error);
    next(error);
  }
};

/**
 * @desc Update invoice settings
 * @route POST /api/settings/invoice
 * @access Private (Admin only)
 */
const updateInvoiceSettings = async (req, res, next) => {
  try {
    console.log('📄 Invoice settings update request:', req.body);
    
    const {
      autoGenerateOnApproval,
      autoSendEmail,
      defaultDueDays,
      defaultPaymentTerms,
      includeCompanyLogo,
      footerText,
      sequencePrefix,
      startingNumber
    } = req.body;

    // Validate due days
    if (defaultDueDays !== undefined && (isNaN(defaultDueDays) || defaultDueDays < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Default due days must be a positive number'
      });
    }

    // Validate starting number
    if (startingNumber !== undefined && (isNaN(startingNumber) || startingNumber < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Starting number must be a positive number'
      });
    }

    // Use the settings service to update invoice settings
    await settingsService.updateCategorySettings('invoice', {
      autoGenerateOnApproval: Boolean(autoGenerateOnApproval),
      autoSendEmail: Boolean(autoSendEmail),
      defaultDueDays: parseInt(defaultDueDays) || 30,
      defaultPaymentTerms: defaultPaymentTerms || 'Net 30 Days',
      includeCompanyLogo: Boolean(includeCompanyLogo),
      footerText: footerText || 'Thank you for your business!',
      sequencePrefix: sequencePrefix || 'INV-',
      startingNumber: parseInt(startingNumber) || 1000
    });

    console.log('📄 Invoice settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Invoice settings updated successfully',
      data: { invoice: req.body }
    });

  } catch (error) {
    console.error('📄 Invoice settings update error:', error);
    next(error);
  }
};

/**
 * @desc Update notification settings
 * @route POST /api/settings/notifications
 * @access Private (Admin only)
 */
const updateNotificationSettings = async (req, res, next) => {
  try {
    console.log('🔔 Notification settings update request:', req.body);
    
    const {
      emailNotifications,
      quotationApproved,
      invoiceGenerated,
      paymentReceived,
      overdueReminders,
      reminderDays
    } = req.body;

    // Validate reminder days array
    if (reminderDays && (!Array.isArray(reminderDays) || reminderDays.some(day => isNaN(day) || day < 0))) {
      return res.status(400).json({
        success: false,
        message: 'Reminder days must be an array of positive numbers'
      });
    }

    // Use the settings service to update notification settings
    await settingsService.updateCategorySettings('notifications', {
      emailNotifications: Boolean(emailNotifications),
      quotationApproved: Boolean(quotationApproved),
      invoiceGenerated: Boolean(invoiceGenerated),
      paymentReceived: Boolean(paymentReceived),
      overdueReminders: Boolean(overdueReminders),
      reminderDays: reminderDays || [7, 14, 30]
    });

    console.log('🔔 Notification settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: { notifications: req.body }
    });

  } catch (error) {
    console.error('🔔 Notification settings update error:', error);
    next(error);
  }
};

/**
 * @desc Update security settings
 * @route POST /api/settings/security
 * @access Private (Admin only)
 */
const updateSecuritySettings = async (req, res, next) => {
  try {
    console.log('🔒 Security settings update request:', req.body);
    
    const {
      sessionTimeout,
      passwordMinLength,
      requireStrongPasswords,
      enableTwoFactor,
      allowPasswordReset,
      maxLoginAttempts
    } = req.body;

    // Validate session timeout
    if (sessionTimeout !== undefined && (isNaN(sessionTimeout) || sessionTimeout < 5 || sessionTimeout > 480)) {
      return res.status(400).json({
        success: false,
        message: 'Session timeout must be between 5 and 480 minutes'
      });
    }

    // Validate password minimum length
    if (passwordMinLength !== undefined && (isNaN(passwordMinLength) || passwordMinLength < 4 || passwordMinLength > 128)) {
      return res.status(400).json({
        success: false,
        message: 'Password minimum length must be between 4 and 128 characters'
      });
    }

    // Validate max login attempts
    if (maxLoginAttempts !== undefined && (isNaN(maxLoginAttempts) || maxLoginAttempts < 3 || maxLoginAttempts > 20)) {
      return res.status(400).json({
        success: false,
        message: 'Max login attempts must be between 3 and 20'
      });
    }

    // Use the settings service to update security settings
    await settingsService.updateCategorySettings('security', {
      sessionTimeout: parseInt(sessionTimeout) || 30,
      passwordMinLength: parseInt(passwordMinLength) || 8,
      requireStrongPasswords: Boolean(requireStrongPasswords),
      enableTwoFactor: Boolean(enableTwoFactor),
      allowPasswordReset: Boolean(allowPasswordReset),
      maxLoginAttempts: parseInt(maxLoginAttempts) || 5
    });

    console.log('🔒 Security settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: { security: req.body }
    });

  } catch (error) {
    console.error('🔒 Security settings update error:', error);
    next(error);
  }
};

/**
 * @desc Test email configuration
 * @route POST /api/settings/test-email
 * @access Private (Admin only)
 */
const testEmail = async (req, res, next) => {
  try {
    console.log('📧 Email test request:', req.body);
    
    const { testEmail: testEmailAddress } = req.body;

    if (!testEmailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmailAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    // Get current email settings
    const emailSettings = await settingsService.getEmailSettings();
    
    if (!emailSettings.host || !emailSettings.username || !emailSettings.password) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration is incomplete. Please configure SMTP settings first.'
      });
    }

    // Here you would implement your email sending logic
    // For now, we'll simulate a successful test
    console.log('📧 Would send test email to:', testEmailAddress);
    console.log('📧 Using settings:', { 
      host: emailSettings.host, 
      port: emailSettings.port, 
      username: emailSettings.username 
    });

    // TODO: Implement actual email sending with nodemailer or your preferred email service
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        testEmail: testEmailAddress,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('📧 Email test error:', error);
    next(error);
  }
};

/**
 * @desc Initialize system settings with defaults
 * @route POST /api/settings/initialize
 * @access Private (Admin only)
 */
const initializeSettings = async (req, res, next) => {
  try {
    console.log('🚀 Initializing system settings');
    
    await settingsService.initializeDefaults();
    
    res.status(200).json({
      success: true,
      message: 'System settings initialized successfully'
    });
    
  } catch (error) {
    console.error('🚀 Settings initialization error:', error);
    next(error);
  }
};

module.exports = {
  getAllSettings,
  updateCompanySettings,
  updateEmailSettings,
  updateTaxSettings,
  updateInvoiceSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  // testEmail,
  initializeSettings,
  uploadCompanyLogo,
  deleteCompanyLogo
};