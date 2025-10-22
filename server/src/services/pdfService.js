const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { settingsService } = require('./settingsService');

// Initialize browser instance
let browser;

// Get or create browser instance
const getBrowser = async () => {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
  }
  return browser;
};

// Close browser
const closeBrowser = async () => {
  if (browser && browser.isConnected()) {
    await browser.close();
    browser = null;
  }
};


// Generate HTML for invoice with dynamic company settings
const generateInvoiceHTML = async (invoiceData, clientData, quotationData, taxType = 'GST_AND_PST') => {
  // Get current company settings from database
  const companyData = await settingsService.getCompanySettings();
  
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';
  };

  const formatCurrency = (amount) => {
    return `₨${parseFloat(amount || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getInvoiceTypeLabel = (type) => {
    return type.replace(/TAX_INVOICE_/, 'Tax Invoice Type ').replace(/_/g, ' ');
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#fbbf24',
      SENT: '#3b82f6',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      CANCELLED: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  // Helper function to get logo URL (absolute URL or inline data URI)
  const getLogoUrl = () => {
    try {
      if (!companyData.logo) {
        return null;
      }

      // If already an absolute URL, return as-is
      if (/^https?:\/\//i.test(companyData.logo)) {
        return companyData.logo;
      }

      // Try to read local logo file and convert to data URI
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Construct absolute path to logo
        const logoPath = path.resolve(process.cwd(), 'public', 'uploads', 'logos', companyData.logo);
        
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const logoBase64 = logoBuffer.toString('base64');
          const mimeType = path.extname(companyData.logo).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
          return `data:${mimeType};base64,${logoBase64}`;
        }
      } catch (fileError) {
        console.log('Could not read local logo file:', fileError.message);
      }

      // Fallback: construct absolute HTTP URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/logos/${companyData.logo}`;
    } catch (error) {
      console.error('Error getting logo URL:', error);
      return null;
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                background: #fff;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                padding-bottom: 15px;
            }
            
            .logo-section {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                flex: 1;
            }
            
            .logo {
                width: 150px;
                height: auto;
                margin: 0 0 8px 0;
                border: none;
            }
            
            .logo-placeholder {
                width: 150px;
                height: 60px;
                border: 2px dashed #ccc;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 8px;
                background: #f9f9f9;
            }
            
            .invoice-ref {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
            
            .company-details {
                text-align: right;
                flex: 1;
            }
            
            .company-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #1f2937;
            }
            
            .company-info {
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                text-align: right;
                font-weight: 600;
            }
            
            .company-info div {
                margin-bottom: 4px;
            }
            
            .invoice-title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                margin: 15px 0;
                color: #1f2937;
            }
            
            .invoice-number {
                font-size: 16px;
                color: #2563eb;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                background: ${getStatusColor(invoiceData.status)};
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-top: 10px;
            }
            
            .billing-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            
            .billing-section {
                flex: 1;
                margin-right: 40px;
            }
            
            .billing-section:last-child {
                margin-right: 0;
            }
            
            .billing-section h3 {
                color: #1f2937;
                margin-bottom: 15px;
                font-size: 16px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
            }
            
            .billing-section p {
                margin-bottom: 5px;
                color: #4b5563;
            }
            
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .invoice-table th {
                background: #f3f4f6;
                padding: 15px;
                text-align: left;
                font-weight: bold;
                color: #374151;
                border-bottom: 2px solid #d1d5db;
            }
            
            .invoice-table td {
                padding: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .invoice-table tr:nth-child(even) {
                background: #f9fafb;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 40px;
            }
            
            .totals-table {
                width: 300px;
                border-collapse: collapse;
            }
            
            .totals-table td {
                padding: 4px 8px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 9px;
            }
            
            .totals-table .total-row {
                font-weight: bold;
                font-size: 16px;
                background: #f3f4f6;
                border-top: 2px solid #2563eb;
            }
            
            .totals-table .total-row td {
                color: #1f2937;
                border-bottom: none;
            }
            
            .payment-info {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .payment-info h3 {
                color: #2563eb;
                margin-bottom: 15px;
            }
            
            .payment-terms {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .payment-terms div {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #2563eb;
            }
            
            .payment-terms strong {
                color: #1f2937;
                display: block;
                margin-bottom: 5px;
            }
            
            .notes {
                margin-top: 30px;
                padding: 20px;
                background: #fffbeb;
                border-left: 4px solid #f59e0b;
                border-radius: 0 6px 6px 0;
            }
            
            .notes h4 {
                color: #92400e;
                margin-bottom: 10px;
            }
            
            .footer {
                margin-top: 40px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 12px;
            }
            
            .footer p {
                margin-bottom: 5px;
            }
            
            @media print {
                .container {
                    padding: 20px;
                }
                
                .status-badge {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo-section">
                    ${companyData.logo ? `<img src="${await getLogoUrl()}" alt="Company Logo" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="logo-placeholder" style="display: ${companyData.logo ? 'none' : 'flex'};">
                        <div>
                            <div style="font-size: 8px; color: #999;">LOGO</div>
                            <div style="font-size: 6px; color: #ccc;">UPLOAD</div>
                        </div>
                    </div>
                    <div class="invoice-ref">Our Ref: ${invoiceData.invoiceNumber}</div>
                </div>
                <div class="company-details">
                    <div class="company-name">${companyData.name || 'Your Company'}</div>
                    <div class="company-info">
                        <div>Email: ${companyData.email || 'info@company.com'}</div>
                        <div>Website: ${companyData.website || 'www.company.com'}</div>
                        <div>Address: ${companyData.address || '123 Business Street'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Title -->
            <div class="invoice-title">INVOICE</div>
            
            <!-- Billing Information -->
            <div class="billing-info">
                <div class="billing-section">
                    <h3>Bill To:</h3>
                    <p><strong>${clientData.companyName}</strong></p>
                    <p>Attn: ${clientData.contactPerson}</p>
                    <p>${clientData.email}</p>
                    ${clientData.phone ? `<p>Phone: ${clientData.phone}</p>` : ''}
                    ${clientData.address ? `<p>${clientData.address}</p>` : ''}
                    ${clientData.city || clientData.state || clientData.zipCode ? 
                      `<p>${[clientData.city, clientData.state, clientData.zipCode].filter(Boolean).join(', ')}</p>` : ''
                    }
                    ${clientData.country ? `<p>${clientData.country}</p>` : ''}
                    ${clientData.taxId ? `<p><strong>Tax ID:</strong> ${clientData.taxId}</p>` : ''}
                </div>
                <div class="billing-section">
                    <h3>Project Details:</h3>
                    ${quotationData ? `
                        <p><strong>Quotation:</strong> ${quotationData.quotationNumber}</p>
                        <p><strong>Project:</strong> ${quotationData.title}</p>
                        ${quotationData.description ? `<p><strong>Description:</strong> ${quotationData.description}</p>` : ''}
                    ` : ''}
                </div>
            </div>
            
            <!-- Invoice Items Table -->
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${quotationData?.title || 'Professional Services'}</strong>
                            ${quotationData?.description ? `<br><small style="color: #6b7280;">${quotationData.description}</small>` : ''}
                        </td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                        <td style="text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                    </tr>
                    ${invoiceData.gstPercentage > 0 ? `
                    <tr>
                        <td><strong>GST (${invoiceData.gstPercentage}%):</strong></td>
                        <td style="text-align: right;">${formatCurrency(invoiceData.gstAmount)}</td>
                    </tr>
                    ` : ''}
                    ${invoiceData.pstPercentage > 0 ? `
                    <tr>
                        <td><strong>PST (${invoiceData.pstPercentage}%):</strong></td>
                        <td style="text-align: right;">${formatCurrency(invoiceData.pstAmount)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td><strong>Total Amount:</strong></td>
                        <td style="text-align: right;"><strong>${formatCurrency(invoiceData.totalAmount)}</strong></td>
                    </tr>
                </table>
            </div>
            
            <!-- Payment Information -->
            <div class="payment-info">
                <h3>Payment Information</h3>
                <div class="payment-terms">
                    <div>
                        <strong>Payment Terms:</strong>
                        Net 30 Days
                    </div>
                    <div>
                        <strong>Payment Method:</strong>
                        Bank Transfer / Check
                    </div>
                </div>
            </div>
            
            ${quotationData?.notes ? `
                <div class="notes">
                    <h4>Additional Notes:</h4>
                    <p>${quotationData.notes}</p>
                </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is an electronically generated invoice.</p>
                <p>Generated on ${formatDate(new Date())}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Add this function to your pdfService.js file, after the generateInvoiceHTML function

// Generate Scope of Work section HTML
const generateScopeOfWorkSection = (quotationData) => {
  console.log('🔍 Debug - quotationData.formData:', JSON.stringify(quotationData.formData, null, 2));
  console.log('🔍 Debug - quotationData.dynamicFields:', JSON.stringify(quotationData.dynamicFields, null, 2));
  
  // Check multiple possible locations for scope of work data (ONLY ONE SOURCE)
  let scopeOfWorkFields = [];
  let foundLocation = '';

  // 1) Direct key: formData.scopeOfWork (array of items)
  if (Array.isArray(quotationData?.formData?.scopeOfWork)) {
    scopeOfWorkFields = quotationData.formData.scopeOfWork;
    foundLocation = 'formData.scopeOfWork';
    console.log('✅ Found scope of work in formData.scopeOfWork');
  }

  // 2) Arbitrary key (e.g., "fg") that holds { items: [...] }
  if (scopeOfWorkFields.length === 0 && quotationData.formData && typeof quotationData.formData === 'object') {
    try {
      const values = Object.values(quotationData.formData);
      const candidate = values.find((v) => v && typeof v === 'object' && Array.isArray(v.items));
      if (candidate && Array.isArray(candidate.items)) {
        scopeOfWorkFields = candidate.items;
        foundLocation = 'arbitrary key in formData';
        console.log('✅ Found scope of work under arbitrary key in formData');
      }
    } catch {}
  }

  // 3) formData.dynamicFields style [{ type: 'scope-of-work', value: { items: [...] } }]
  if (scopeOfWorkFields.length === 0 && Array.isArray(quotationData?.formData?.dynamicFields)) {
    const scopeFields = quotationData.formData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
    if (scopeFields.length > 0) {
      scopeOfWorkFields = scopeFields[0]?.value?.items || [];
      foundLocation = 'formData.dynamicFields';
      console.log('✅ Found scope of work in formData.dynamicFields');
    }
  }

  // 4) Legacy: quotationData.dynamicFields
  if (scopeOfWorkFields.length === 0 && Array.isArray(quotationData?.dynamicFields)) {
    const scopeFields = quotationData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
    if (scopeFields.length > 0) {
      scopeOfWorkFields = scopeFields[0]?.value?.items || [];
      foundLocation = 'dynamicFields';
      console.log('✅ Found scope of work in dynamicFields');
    }
  }

  console.log(`📍 Using scope of work data from: ${foundLocation}`);
  
  console.log('🔍 Debug - scopeOfWorkFields:', JSON.stringify(scopeOfWorkFields, null, 2));
  
  if (!scopeOfWorkFields || scopeOfWorkFields.length === 0) {
    console.log('❌ No scope of work fields found');
    return '';
  }

  let scopeOfWorkHTML = '';
  
  if (scopeOfWorkFields.length > 0) {
    scopeOfWorkHTML += `
      <div class="scope-of-work-section">
        <div class="scope-of-work-header">
          <h3>Scope of Work</h3>
        </div>
        <table class="scope-table">
          <thead>
            <tr>
              <th style="width: 50px;">Sr. No.</th>
              <th>Description</th>
              <th style="width: 60px;">QTY</th>
              <th style="width: 80px;">Unit</th>
              <th style="width: 100px;">Price (PKR)</th>
              <th style="width: 100px;">Total Price (PKR)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    scopeOfWorkFields.forEach(item => {
      scopeOfWorkHTML += `
        <tr>
          <td>${item.srNo || ''}</td>
          <td class="description">${item.description || ''}</td>
          <td>${item.qty || 0}</td>
          <td>${item.unit || ''}</td>
          <td>₨${parseFloat(item.price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>₨${parseFloat(item.total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    });
    
    scopeOfWorkHTML += `
          </tbody>
        </table>
      </div>
    `;
  }
  
  return scopeOfWorkHTML;
};

// Generate HTML for quotation with dynamic company settings
const generateQuotationHTML = async (quotationData, clientData, userData, companyData) => {
  // If companyData is not provided, get it from settings service
  if (!companyData) {
    companyData = await settingsService.getCompanySettings();
  }

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';
  };

  // Load dynamic terms from DB table first, then settings, then defaults.
  const { listActiveTerms } = (() => { try { return require('./termsService'); } catch { return {}; } })();
  const invoiceSettings = await settingsService.getInvoiceSettings().catch(() => ({ defaultPaymentTerms: 'Net 30 Days' }));
  const dbTerms = listActiveTerms ? await listActiveTerms().catch(() => []) : [];
  const settingsTerms = await settingsService.getSettingByKey('quotation.terms').catch(() => null);
  const sourceTerms = dbTerms && dbTerms.length > 0 ? dbTerms : (Array.isArray(settingsTerms) ? settingsTerms : []);
  const terms = sourceTerms.length > 0
    ? sourceTerms
    : [
        {
          label: 'Validity',
          value: quotationData.validUntil ? formatDate(quotationData.validUntil) : 'Valid for 30 days',
          highlight: true
        },
        { label: 'Payment Terms', value: invoiceSettings?.defaultPaymentTerms || 'Net 30 Days', highlight: false },
        { label: 'Taxes', value: 'As per government rules', highlight: true },
        { label: 'Delivery', value: 'As per agreement', highlight: false },
        { label: 'Warranty', value: 'No Warranty', highlight: false },
        { label: 'SOW', value: 'Services Only', highlight: false }
      ];

  const termsHTML = terms
    .map(t => `
                    <div class="terms-item ${t.highlight ? 'highlight' : ''}">
                        <div class="terms-label">${t.label}</div>
                        <div class="terms-value">${t.value || ''}</div>
                    </div>
                `)
    .join('');

  const formatCurrency = (amount) => {
    return `₨${parseFloat(amount || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: '#6b7280',
      PENDING: '#f59e0b',
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
      EXPIRED: '#9ca3af'
    };
    return colors[status] || '#6b7280';
  };

  // Helper function to get logo URL (absolute URL or inline data URI)
  const getLogoUrl = () => {
    try {
      if (!companyData.logo) {
        return null;
      }

      // If already an absolute URL, return as-is
      if (/^https?:\/\//i.test(companyData.logo)) {
        return companyData.logo;
      }

      // Normalize stored path (usually '/uploads/logos/filename.png' or just 'filename.png')
      const relativeLogoPath = companyData.logo.startsWith('/')
        ? companyData.logo.replace(/^\//, '')
        : `uploads/${companyData.logo}`.replace(/^\//, '');

      // Try to inline from local filesystem to avoid CORS/network issues in Puppeteer
      const publicDir = path.resolve(__dirname, '../public');
      // If `companyData.logo` was '/uploads/..', this resolves to '<project>/server/public/uploads/...'
      const filePath = path.resolve(publicDir, relativeLogoPath);

      // Attempt to read the file and convert to base64 data URL
      return fs.readFile(filePath)
        .then(buffer => {
          const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          return `data:${mime};base64,${buffer.toString('base64')}`;
        })
        .catch(() => {
          // Fallback to constructing an absolute URL served by Express '/uploads'
          const baseUrl = process.env.SERVER_PUBLIC_URL
            || process.env.PUBLIC_BASE_URL
            || (process.env.NODE_ENV === 'development'
                  ? 'http://localhost:5000'
                  : (process.env.VPS_IP ? `http://${process.env.VPS_IP}:5000` : 'http://127.0.0.1:5000'));

          const httpPath = companyData.logo.startsWith('/')
            ? companyData.logo
            : `/uploads/${companyData.logo}`;
          return `${baseUrl}${httpPath}`;
        });
    } catch (_) {
      return null;
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation ${quotationData.quotationNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 10px;
                line-height: 1.2;
                color: #000;
                background: #fff;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 10px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
                border-bottom: 1px solid #000;
                padding-bottom: 8px;
            }
            
            .logo-section {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                flex: 1;
            }
            
            .logo {
                width: 200px;
                height: auto;
                margin: 0 0 8px 0;
                border: none;
            }
            
            .logo-placeholder {
                width: 200px;
                height: 60px;
                margin: 0 0 8px 0;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f5f5;
                font-size: 10px;
                text-align: center;
                color: #666;
            }
            
            .tagline {
                font-size: 14px;
                font-weight: bold;
                margin-top: 8px;
            }
            
            .company-details {
                text-align: right;
                flex: 1;
                margin-left: 0;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .company-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 6px;
                color: #1f6feb;
            }
            
            .company-info {
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                display: flex;
                justify-content: flex-end;
                gap: 16px;
                align-items: center;
                font-weight: 600;
                white-space: nowrap;
            }
            
            .company-info span {
                margin-bottom: 0;
            }
            
            .quotation-title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
                background: #f3f4f6;
                padding: 4px;
                border: 1px solid #000;
            }
            
            .quotation-header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                border: 1px solid #000;
            }
            
            .quotation-header-table td {
                border: 1px solid #000;
                padding: 8px;
                vertical-align: top;
                width: 50%;
            }
            
            .section-title {
                font-weight: bold;
                background: #f3f4f6;
                text-align: center;
                padding: 8px;
                border-bottom: 1px solid #000;
                font-size: 14px;
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                padding: 4px 8px;
                border-bottom: 1px solid #000;
                min-height: 24px;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                font-weight: bold;
                min-width: 120px;
                text-decoration: underline;
                font-size: 12px;
            }
            
            .detail-value {
                text-decoration: underline;
                margin-left: 10px;
                flex: 1;
                font-size: 12px;
                text-align: right;
            }
            
            .quotation-details {
                background: #f5f5f5;
                border: 1px solid #ccc;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .details-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .details-row:last-child {
                margin-bottom: 0;
            }
            
            .details-label {
                font-weight: bold;
                width: 120px;
            }
            
            .details-value {
                flex: 1;
            }
            
            .subject {
                font-size: 14px;
                font-weight: bold;
                margin: 15px 0;
            }
            
            .scope-of-work-header {
                background: #ffff00;
                color: #000;
                font-weight: bold;
                text-align: center;
                padding: 4px;
                margin: 10px 0 5px 0;
                font-size: 12px;
            }
            
            .scope-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
            }
            
            .scope-table th {
                background: #f3f4f6;
                border: 1px solid #000;
                padding: 4px 6px;
                text-align: center;
                font-weight: bold;
                font-size: 9px;
            }
            
            .scope-table td {
                border: 1px solid #000;
                padding: 4px 6px;
                text-align: center;
                font-size: 9px;
            }
            
            .scope-table .description {
                text-align: left;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 10px;
            }
            
            .totals-table {
                width: 250px;
                border-collapse: collapse;
            }
            
            .totals-table td {
                border: 1px solid #000;
                padding: 5px 8px;
            }
            
            .totals-table .label {
                text-align: left;
                font-weight: bold;
            }
            
            .totals-table .amount {
                text-align: right;
            }
            
            .totals-table .highlight {
                background: #ffff00;
                font-weight: bold;
            }
            
            .terms-section {
                margin-bottom: 10px;
            }
            
            .terms-title {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 8px;
                text-decoration: underline;
            }
            
            .terms-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .terms-item {
                display: flex;
                align-items: center;
                padding: 5px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .terms-item.highlight {
                background: #ffff00;
                padding: 8px;
                border-radius: 4px;
            }
            
            .terms-label {
                font-weight: bold;
                min-width: 120px;
                text-decoration: underline;
            }
            
            .terms-value {
                text-decoration: underline;
                margin-left: 10px;
            }
            
            .footer {
                text-align: center;
                font-size: 10px;
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header with Logo and Company Info -->
            <div class="header">
                <div class="logo-section">
                    ${companyData.logo ? `<img src="${await getLogoUrl()}" alt="Company Logo" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="logo-placeholder" style="display: ${companyData.logo ? 'none' : 'flex'};">
                        <div>
                            <div style="font-size: 8px; color: #999;">LOGO</div>
                            <div style="font-size: 6px; color: #ccc;">UPLOAD</div>
                        </div>
                    </div>
                    <div class="tagline">
                        <span style="color:#1f6feb;">Performance</span>, 
                        <span style="color:#16a34a;">Integrity</span>, 
                        <span style="color:#ef4444;">Quality</span>
                    </div>
                </div>
               <div class="company-details">
                <div class="company-name">${companyData.name || 'Your Company'}</div>
                <div class="company-info">
                    <span>${companyData.email || 'info@company.com'}</span>
                    <span>${companyData.website || 'www.company.com'}</span>
                </div>
            </div>


            </div>
            
            <!-- Quotation Title -->
            <div class="quotation-title">QUOTATION</div>
            
            <!-- Quotation Header Table -->
            <table class="quotation-header-table">
                <tr>
                    <td>
                        <div class="section-title">Customer: -</div>
                        <div class="detail-row">
                            <div class="detail-label">Customer:</div>
                            <div class="detail-value">${clientData.companyName || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${clientData.address || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">City:</div>
                            <div class="detail-value">${clientData.city || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Project:</div>
                            <div class="detail-value">${quotationData.title || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact #:</div>
                            <div class="detail-value">${clientData.phone || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Attn:</div>
                            <div class="detail-value">${clientData.contactPerson || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Your Ref:</div>
                            <div class="detail-value">-</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">NTN & GST#:</div>
                            <div class="detail-value">${clientData.taxId || '-'}</div>
                        </div>
                    </td>
                    <td>
                        <div class="section-title">From: -</div>
                        <div class="detail-row">
                            <div class="detail-label">From:</div>
                            <div class="detail-value">${companyData.name || 'Your Company'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Quotation Date:</div>
                            <div class="detail-value">${formatDate(quotationData.createdAt)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Quotation #:</div>
                            <div class="detail-value">${quotationData.quotationNumber}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Customer RFQ #:</div>
                            <div class="detail-value">${quotationData.formData?.['Customer RFQ #'] || quotationData.formData?.customerRfq || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Our NTN #:</div>
                            <div class="detail-value">${quotationData.formData?.['Our NTN #'] || quotationData.formData?.ourNtn ||  '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Our GST #:</div>
                            <div class="detail-value">${quotationData.formData?.['Our GST #'] || quotationData.formData?.ourGst ||  '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact Number:</div>
                            <div class="detail-value">${clientData.department?.phone || companyData.phone || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact Person:</div>
                            <div class="detail-value">${clientData.department?.name || 'Commercial Department'}</div>
                        </div>
                    </td>
                </tr>
            </table>
            
            <!-- Subject -->
            <div class="subject">Subject: ${quotationData.title}</div>
            
            <!-- Scope of Work Section -->
            ${generateScopeOfWorkSection(quotationData)}
            
            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Sub Total:</td>
                        <td class="amount">${formatCurrency(quotationData.subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="label">Total:</td>
                        <td class="amount">${formatCurrency(quotationData.subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="label">PST:</td>
                        <td class="amount">${formatCurrency(quotationData.pstAmount || 0)}</td>
                    </tr>
                    <tr class="highlight">
                        <td class="label">G.Total (PKR):</td>
                        <td class="amount">${formatCurrency(quotationData.totalAmount)}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Terms and Conditions -->
            <div class="terms-section">
                <div class="terms-title">Terms and Conditions:</div>
                <div class="terms-list">
${termsHTML}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>This is a computer generated document and doesn't need any signature or stamp</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate PDF from HTML
const generatePDF = async (html, options = {}) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: false,
      ...options
    };

    const pdf = await page.pdf(pdfOptions);
    return pdf;
  } finally {
    await page.close();
  }
};

// Generate invoice PDF with settings
const generateInvoicePDF = async (invoiceData, clientData, quotationData, taxType = 'GST_AND_PST') => {
  try {
    const html = await generateInvoiceHTML(invoiceData, clientData, quotationData, taxType);
    const pdf = await generatePDF(html, {
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | ${taxType.replace('_', ' ')}</span>
        </div>
      `
    });

    const taxSuffix = taxType.toLowerCase().replace(/_/g, '-');
    
    return {
      success: true,
      pdf,
      filename: `invoice-${invoiceData.invoiceNumber}-${taxSuffix}.pdf`
    };
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// Generate all invoice tax versions
const generateAllInvoiceTaxVersions = async (invoiceData, clientData, quotationData) => {
  try {
    const taxTypes = ['GST_ONLY', 'PST_ONLY', 'GST_AND_PST', 'NO_TAX'];
    const results = {};
    
    for (const taxType of taxTypes) {
      const result = await generateInvoicePDF(invoiceData, clientData, quotationData, taxType);
      results[taxType.toLowerCase()] = result;
    }
    
    return {
      success: true,
      results,
      zipFilename: `invoice-${invoiceData.invoiceNumber}-all-versions.zip`
    };
  } catch (error) {
    console.error('Error generating all tax versions:', error);
    throw new Error(`Bulk PDF generation failed: ${error.message}`);
  }
};

// Generate quotation PDF with settings
const generateQuotationPDF = async (quotationData, clientData, userData) => {
  try {
    const html = await generateQuotationHTML(quotationData, clientData, userData);
    const pdf = await generatePDF(html, {
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    return {
      success: true,
      pdf,
      filename: `quotation-${quotationData.quotationNumber}.pdf`
    };
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// Save PDF to file
const savePDFToFile = async (pdf, filename, directory = './uploads') => {
  try {
    await fs.mkdir(directory, { recursive: true });
    const filepath = path.join(directory, filename);
    await fs.writeFile(filepath, pdf);
    
    return {
      success: true,
      filepath,
      filename
    };
  } catch (error) {
    throw new Error(`Failed to save PDF: ${error.message}`);
  }
};

// Generate and save invoice PDF
const generateAndSaveInvoicePDF = async (invoiceData, clientData, quotationData, taxType = 'GST_AND_PST') => {
  try {
    const pdfResult = await generateInvoicePDF(invoiceData, clientData, quotationData, taxType);
    const saveResult = await savePDFToFile(pdfResult.pdf, pdfResult.filename);
    
    return {
      success: true,
      pdf: pdfResult.pdf,
      filepath: saveResult.filepath,
      filename: saveResult.filename
    };
  } catch (error) {
    throw new Error(`Failed to generate and save invoice PDF: ${error.message}`);
  }
};

// Generate and save quotation PDF
const generateAndSaveQuotationPDF = async (quotationData, clientData, userData) => {
  try {
    const pdfResult = await generateQuotationPDF(quotationData, clientData, userData);
    const saveResult = await savePDFToFile(pdfResult.pdf, pdfResult.filename);
    
    return {
      success: true,
      pdf: pdfResult.pdf,
      filepath: saveResult.filepath,
      filename: saveResult.filename
    };
  } catch (error) {
    throw new Error(`Failed to generate and save quotation PDF: ${error.message}`);
  }
};

// Stream PDF response
const streamPDFResponse = (res, pdf, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', pdf.length);
  res.end(pdf);
};

// Download PDF response
const downloadPDFResponse = (res, pdf, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdf.length);
  res.end(pdf);
};

// Generate bulk invoices PDF
const generateBulkInvoicesPDF = async (invoicesData) => {
  try {
    let combinedHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bulk Invoices</title>
          <style>
              .page-break { page-break-after: always; }
              .last-page .page-break { page-break-after: auto; }
          </style>
      </head>
      <body>
    `;

    for (let i = 0; i < invoicesData.length; i++) {
      const { invoiceData, clientData, quotationData, taxType } = invoicesData[i];
      const pageClass = i === invoicesData.length - 1 ? 'last-page' : '';
      
      const invoiceHTML = await generateInvoiceHTML(invoiceData, clientData, quotationData, taxType);
      const bodyContent = invoiceHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
      
      combinedHTML += `<div class="page-break ${pageClass}">${bodyContent}</div>`;
    }

    combinedHTML += '</body></html>';
    const pdf = await generatePDF(combinedHTML);
    
    return {
      success: true,
      pdf,
      filename: `bulk-invoices-${new Date().toISOString().split('T')[0]}.pdf`
    };
  } catch (error) {
    throw new Error(`Bulk PDF generation failed: ${error.message}`);
  }
};

// Test PDF generation
const testPDFGeneration = async () => {
  try {
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>PDF Test</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { color: #2563eb; font-size: 24px; margin-bottom: 20px; }
              .content { color: #333; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="header">PDF Service Test</div>
          <div class="content">
              <p>This is a test PDF generated by the PDF service.</p>
              <p>Generated at: ${new Date().toISOString()}</p>
              <p>If you can see this, the PDF service is working correctly!</p>
          </div>
      </body>
      </html>
    `;

    const pdf = await generatePDF(testHTML);
    
    return {
      success: true,
      pdf,
      filename: 'pdf-service-test.pdf'
    };
  } catch (error) {
    throw new Error(`PDF test failed: ${error.message}`);
  }
};

// Initialize PDF service
const initializePDFService = async () => {
  try {
    await getBrowser();
    console.log('✅ PDF service initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize PDF service:', error.message);
    return false;
  }
};

// Cleanup function
const cleanup = async () => {
  await closeBrowser();
};

// Handle graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);

module.exports = {
  initializePDFService,
  generateInvoicePDF,
  generateAllInvoiceTaxVersions,
  generateQuotationPDF,
  generateAndSaveInvoicePDF,
  generateAndSaveQuotationPDF,
  streamPDFResponse,
  downloadPDFResponse,
  generateBulkInvoicesPDF,
  testPDFGeneration,
  savePDFToFile,
  closeBrowser,
  cleanup
};