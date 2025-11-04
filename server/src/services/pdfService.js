const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { settingsService } = require('./settingsService');

// Function to convert signature image to base64
const getSignatureBase64 = async () => {
  try {
    const signaturePath = path.join(__dirname, '../assets/signature.png');
    const imageBuffer = await fs.readFile(signaturePath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error loading signature image:', error);
    return null;
  }
};

// Initialize browser instance
let browser;

// Get or create browser instance with retry logic
const getBrowser = async (retryCount = 0) => {
  try {
    if (!browser || !browser.isConnected()) {
      console.log(`🔄 Launching browser (attempt ${retryCount + 1})...`);
      // Create a custom temp directory for Puppeteer
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      
      const customTempDir = path.join(os.tmpdir(), 'puppeteer-custom');
      if (!fs.existsSync(customTempDir)) {
        fs.mkdirSync(customTempDir, { recursive: true });
      }
      
      browser = await puppeteer.launch({
        headless: true,
        userDataDir: customTempDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--memory-pressure-off',
          '--max_old_space_size=2048',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--metrics-recording-only',
          '--no-report-upload',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-logging',
          '--disable-gpu-logging',
          '--disable-software-rasterizer',
          '--disable-background-mode',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-sync-preferences',
          '--disable-web-resources',
          '--enable-aggressive-domstorage-flushing',
          '--enable-simple-cache-backend',
          '--force-device-scale-factor=1',
          '--high-dpi-support=1',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors',
          '--no-first-run',
          '--no-service-autorun',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-blink-features=AutomationControlled'
        ],
        timeout: 30000,
        protocolTimeout: 30000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      });
      console.log('✅ Browser launched successfully');
    }
    return browser;
  } catch (error) {
    console.error(`❌ Browser launch failed (attempt ${retryCount + 1}):`, error.message);
    if (retryCount < 2) {
      console.log('🔄 Retrying browser launch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getBrowser(retryCount + 1);
    }
    throw error;
  }
};

// Close browser
const closeBrowser = async () => {
  if (browser && browser.isConnected()) {
    try {
      await browser.close();
    } catch (error) {
      console.log('Browser close error (expected):', error.message);
    }
    browser = null;
  }
};

// Reset browser connection (force new browser instance)
const resetBrowser = async () => {
  console.log('🔄 Resetting browser connection...');
  await closeBrowser();
  browser = null;
};

// Monitor system resources
const checkSystemResources = () => {
  const used = process.memoryUsage();
  console.log('📊 Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`
  });
};

// Clean up temporary files
const cleanupTempFiles = async () => {
  try {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    
    const tempDir = os.tmpdir();
    const puppeteerDir = path.join(tempDir, 'puppeteer-custom');
    
    if (fs.existsSync(puppeteerDir)) {
      console.log('🧹 Cleaning up Puppeteer temp files...');
      const files = fs.readdirSync(puppeteerDir);
      for (const file of files) {
        try {
          const filePath = path.join(puppeteerDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.log(`Could not clean ${file}:`, error.message);
        }
      }
    }
    
    // Also clean system temp files
    const systemTempFiles = fs.readdirSync(tempDir).filter(file => 
      file.startsWith('puppeteer') || file.startsWith('.org.chromium')
    );
    
    for (const file of systemTempFiles) {
      try {
        const filePath = path.join(tempDir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      } catch (error) {
        console.log(`Could not clean system temp ${file}:`, error.message);
      }
    }
    
    console.log('✅ Temp files cleaned up');
  } catch (error) {
    console.log('⚠️ Temp cleanup error:', error.message);
  }
};


// Generate HTML for invoice with dynamic company settings
const generateInvoiceHTML = async (invoiceData, clientData, quotationData, taxType = 'GST_AND_PST') => {
  // Get current company settings from database
  const companyData = await settingsService.getCompanySettings();
  
  // Get signature image as base64
  const signatureBase64 = await getSignatureBase64();
  
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';
  };

  // const formatCurrency = (amount) => {
  //   return `₨${parseFloat(amount || 0).toLocaleString('en-PK', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   })}`;
  // };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  

  const convertNumberToWords = (num) => {
    // Handle decimal numbers by rounding to nearest integer
    const roundedNum = Math.round(parseFloat(num) || 0);
    
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (roundedNum === 0) return 'zero';
    
    const convertHundreds = (n) => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' hundred';
        n %= 100;
        if (n > 0) result += ' ';
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) result += ' ' + ones[n];
      } else if (n > 9) {
        result += teens[n - 10];
      } else if (n > 0) {
        result += ones[n];
      }
      return result;
    };
    
    let result = '';
    let remaining = roundedNum;
    
    if (remaining >= 100000) {
      result += convertHundreds(Math.floor(remaining / 100000)) + ' hundred thousand';
      remaining %= 100000;
      if (remaining > 0) result += ' ';
    }
    if (remaining >= 1000) {
      result += convertHundreds(Math.floor(remaining / 1000)) + ' thousand';
      remaining %= 1000;
      if (remaining > 0) result += ' ';
    }
    if (remaining > 0) {
      result += convertHundreds(remaining);
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
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
                background: #f9f9f9;
            }
            
            .invoice-ref {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
            
            .company-details {
                text-align: center;
                flex: 1;
            }
            
            .company-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 6px;
                color: #1f6feb;
            }
            
            .company-info {
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                display: flex;
                justify-content: center;
                gap: 16px;
                align-items: center;
                font-weight: 600;
                white-space: nowrap;
            }
            
            .company-info span {
                margin-bottom: 0;
            }
            
            .company-address {
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                text-align: center;
                font-weight: 600;
                margin-top: 4px;
            }
            
            .company-address div {
                margin-bottom: 2px;
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
            
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                margin-top: 10px;
            }
            
            .invoice-left {
                flex: 1;
                text-align: left;
            }
            
            .invoice-center {
                flex: 1;
                text-align: left;
                padding: 0 20px;
            }
            
            .invoice-right {
                flex: 1;
                text-align: right;
            }
            
            .date-section {
                margin-bottom: 10px;
            }
            
            .date-label {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
            }
            
            .date-value {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
                margin-top: 2px;
            }
            
            .to-section {
                margin-bottom: 10px;
            }
            
            .to-label {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
            }
            
            .client-name {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
                margin-top: 2px;
            }
            
            .client-address {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
                margin-top: 2px;
            }
            
            .client-city {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
                margin-top: 2px;
                text-decoration: underline;
            }
            
            .invoice-title-section {
                text-align: right;
            }
            
            .invoice-title-text {
                font-weight: bold;
                font-size: 28px;
                color: #1f2937;
                text-decoration: underline;
                margin-bottom: 15px;
                text-transform: uppercase;
            }
            
            .attn-section {
                margin-top: 10px;
            }
            
            .attn-label {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
            }
            
            .attn-value {
                font-weight: bold;
                font-size: 14px;
                color: #1f2937;
            }
            
            .billing-section p {
                margin-bottom: 5px;
                color: #4b5563;
            }
            
            .scope-of-work-section {
                margin-bottom: 15px;
                position: relative;
            }
            
            .scope-table {
                width: 100%;
                border-collapse: collapse;
                border: none;
            }
            
            .scope-table th {
                background: #dc2626;
                padding: 8px;
                text-align: left;
                font-weight: bold;
                color: #fff;
                border: none;
                border-bottom: 2px solid #000;
                font-size: 12px;
            }
            
            .scope-table td {
                padding: 8px;
                border: none;
                font-size: 12px;
                background: #fff;
            }
            
            .scope-table thead th:first-child,
            .scope-table tbody td:first-child {
                text-align: center;
                width: 8%;
            }
            
            .scope-table thead th:nth-child(2),
            .scope-table tbody td:nth-child(2) {
                text-align: center;
                width: 10%;
            }
            
            .scope-table thead th:nth-child(3),
            .scope-table tbody td:nth-child(3) {
                text-align: left;
                width: 42%;
            }
            
            .scope-table thead th:nth-child(4),
            .scope-table tbody td:nth-child(4) {
                text-align: right;
                width: 20%;
            }
            
            .scope-table thead th:nth-child(5),
            .scope-table tbody td:nth-child(5) {
                text-align: right;
                width: 20%;
            }
            
            .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .summary-box {
                width: 300px;
                border: 2px solid #000;
                background: #fff;
            }
            
            .summary-line {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: bold;
                border-bottom: 1px solid #000;
            }
            
            .summary-line:last-child {
                border-bottom: none !important;
            }
            
            .total-due {
                background: #fbbf24 !important;
                padding: 8px 12px;
                font-weight: bold;
                border-radius: 0;
            }
            
            .amount-words {
                margin-top: 15px;
                font-size: 12px;
                color: #000;
                font-weight: normal;
            }
            
            .amount-words strong {
                font-weight: bold;
            }
            
            .amount-text {
                font-style: italic;
                text-decoration: underline;
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
                padding: 15px;
                margin-bottom: 15px;
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
                        <span>${companyData.email || 'info@company.com'}</span>
                        <span>${companyData.website || 'www.company.com'}</span>
                </div>
                    <div class="company-address">
                        <div>${companyData.address || '123 Business Street'}</div>
                        <div>${companyData.city || 'City'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Title -->
           
            
            <!-- Invoice Details -->
            <div class="invoice-details">
                <div class="invoice-left">
                    <div class="date-section">
                        <div class="date-label">Date:</div>
                        <div class="date-value">${formatDate(invoiceData.createdAt)}</div>
                </div>
                </div>
                <div class="invoice-center">
                    <div class="to-section">
                        <div class="to-label">To</div>
                        <div class="client-name">${clientData.companyName || '-'}</div>
                        ${clientData.address ? `<div class="client-address">${clientData.address}</div>` : ''}
                        ${clientData.city ? `<div class="client-city">${clientData.city}</div>` : ''}
                    </div>
                </div>
                <div class="invoice-right">
                    <div class="invoice-title-section">
                        <div class="invoice-title-text">INVOICE</div>
                        <div class="attn-section">
                            <span class="attn-label">Attn:</span>
                            <span class="attn-value">${clientData.contactPerson || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Separator Line -->
              <div style="border-bottom: 1px solid #000; margin: 0 auto 20px auto; width: 90%;"></div>

              <!-- Header Reference Section -->
              <div style="display: flex; justify-content: center; align-items: flex-start; gap: 50px; margin: 0 auto 20px auto; width: 90%; text-align: center;">
                  <div style="text-align: left;">
                        <div style="font-weight: bold; text-decoration: underline; font-size: 12px;">ABS Ref:</div>
                        <div style="font-size: 12px; margin-top: 5px;">Service Order No.</div>
                        <div style="font-size: 12px; margin-top: 5px;">Dated:</div>
                    </div>


                  <div>
                      <div style="font-weight: bold; font-size: 12px;">SMS By Regional Office</div>
                  </div>

                  <div>
                      <div style="font-weight: bold; font-size: 12px;">Our Ref:</div>
                      <div style="font-size: 12px; margin-top: 5px;">NTN: <strong style="text-decoration: underline;">${companyData.ntn || ''}</strong></div>
                      <div style="font-size: 12px; margin-top: 5px;">GST: <strong style="text-decoration: underline;">${companyData.gst || ''}</strong></div>
                  </div>
              </div>

            
            <!-- Scope of Work Table -->
            <div class="scope-of-work-section">
                <table class="scope-table" style="width: 100%; border-collapse: collapse; border: none;">
                <thead>
                    <tr>
                            <th style="background: #dc2626; padding: 8px; text-align: center; font-weight: bold; color: #fff; border: none; border-bottom: 2px solid #000; font-size: 12px; width: 8%;">Qty.</th>
                            <th style="background: #dc2626; padding: 8px; text-align: center; font-weight: bold; color: #fff; border: none; border-bottom: 2px solid #000; font-size: 12px; width: 10%;">Unit</th>
                        <th style="background: #dc2626; padding: 8px; text-align: left; font-weight: bold; color: #fff; border: none; border-bottom: 2px solid #000; font-size: 12px; width: 42%;">Description</th>
                            <th style="background: #dc2626; padding: 8px; text-align: right; font-weight: bold; color: #fff; border: none; border-bottom: 2px solid #000; font-size: 12px; width: 20%;">Unit Price</th>
                            <th style="background: #dc2626; padding: 8px; text-align: right; font-weight: bold; color: #fff; border: none; border-bottom: 2px solid #000; font-size: 12px; width: 20%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                        ${(() => {
                          // Debug: Log what data we have
                          console.log('🔍 Invoice PDF Debug - quotationData:', JSON.stringify(quotationData, null, 2));
                          console.log('🔍 Invoice PDF Debug - quotationData.formData:', JSON.stringify(quotationData?.formData, null, 2));
                          
                          // Use same logic as quotation PDF to find scope of work data
                          let scopeOfWorkFields = [];
                          let foundLocation = '';
                          
                          // 1) Direct key: formData.scopeOfWork (array of items)
                          if (Array.isArray(quotationData?.formData?.scopeOfWork)) {
                            scopeOfWorkFields = quotationData.formData.scopeOfWork;
                            foundLocation = 'formData.scopeOfWork';
                            console.log('✅ Invoice PDF - Found scope of work in formData.scopeOfWork');
                          }
                          
                          // 2) Arbitrary key that holds { items: [...] }
                          if (scopeOfWorkFields.length === 0 && quotationData.formData && typeof quotationData.formData === 'object') {
                            try {
                              const values = Object.values(quotationData.formData);
                              const candidate = values.find((v) => v && typeof v === 'object' && Array.isArray(v.items));
                              if (candidate && Array.isArray(candidate.items)) {
                                scopeOfWorkFields = candidate.items;
                                foundLocation = 'arbitrary key in formData';
                                console.log('✅ Invoice PDF - Found scope of work under arbitrary key in formData');
                              }
                            } catch (e) {
                              console.log('❌ Invoice PDF - Error in arbitrary key search:', e.message);
                            }
                          }
                          
                          // 3) formData.dynamicFields style [{ type: 'scope-of-work', value: { items: [...] } }]
                          if (scopeOfWorkFields.length === 0 && Array.isArray(quotationData?.formData?.dynamicFields)) {
                            const scopeFields = quotationData.formData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                            if (scopeFields.length > 0) {
                              scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                              foundLocation = 'formData.dynamicFields';
                              console.log('✅ Invoice PDF - Found scope of work in formData.dynamicFields');
                            }
                          }
                          
                          // 4) Legacy: quotationData.dynamicFields
                          if (scopeOfWorkFields.length === 0 && Array.isArray(quotationData?.dynamicFields)) {
                            const scopeFields = quotationData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                            if (scopeFields.length > 0) {
                              scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                              foundLocation = 'dynamicFields';
                              console.log('✅ Invoice PDF - Found scope of work in dynamicFields');
                            }
                          }
                          
                          console.log(`📍 Invoice PDF - Using scope of work data from: ${foundLocation}`);
                          console.log('🔍 Invoice PDF - scopeOfWorkFields:', JSON.stringify(scopeOfWorkFields, null, 2));
                          
                          if (scopeOfWorkFields && scopeOfWorkFields.length > 0) {
                            console.log('✅ Invoice PDF - Rendering scope of work items');
                            return scopeOfWorkFields.map(item => `
                              <tr>
                                  <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: center;">${item.srNo || item.qty || 1}</td>
                                  <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: center;">${item.unit || 'Job'}</td>
                                  <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: left;">${item.description || '-'}</td>
                                  <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: right;">${formatCurrency(item.price || 0)}</td>
                                  <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: right;">${formatCurrency(item.total || 0)}</td>
                    </tr>
                            `).join('');
                          } else {
                            console.log('❌ Invoice PDF - No scope of work data found, using fallback');
                            return `<tr>
                              <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: center;">1</td>
                              <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: center;">Job</td>
                              <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: left;">${quotationData?.title || 'Professional Services'}</td>
                              <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                              <td style="padding: 8px; border: none; font-size: 12px; background: #fff; text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                            </tr>`;
                          }
                        })()}
                </tbody>
            </table>
            </div>
                
                <!-- Summary Section -->
                <div class="summary-section" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <div style="width: 300px;">
                        ${(() => {
                          // Calculate totals from scope of work data
                          let scopeOfWorkFields = [];
                          let subtotal = 0;
                          
                          // Use same logic to find scope of work data
                          if (Array.isArray(quotationData?.formData?.scopeOfWork)) {
                            scopeOfWorkFields = quotationData.formData.scopeOfWork;
                          } else if (quotationData.formData && typeof quotationData.formData === 'object') {
                            try {
                              const values = Object.values(quotationData.formData);
                              const candidate = values.find((v) => v && typeof v === 'object' && Array.isArray(v.items));
                              if (candidate && Array.isArray(candidate.items)) {
                                scopeOfWorkFields = candidate.items;
                              }
                            } catch {}
                          } else if (Array.isArray(quotationData?.formData?.dynamicFields)) {
                            const scopeFields = quotationData.formData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                            if (scopeFields.length > 0) {
                              scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                            }
                          } else if (Array.isArray(quotationData?.dynamicFields)) {
                            const scopeFields = quotationData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                            if (scopeFields.length > 0) {
                              scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                            }
                          }
                          
                          // Calculate subtotal from scope of work items
                          if (scopeOfWorkFields && scopeOfWorkFields.length > 0) {
                            subtotal = scopeOfWorkFields.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
                          } else {
                            subtotal = parseFloat(invoiceData.subtotal) || 0;
                          }
                          
                          // Derive total tax percentage (GST + PST) if available; otherwise infer from amounts
                          const gstPerc = parseFloat(invoiceData?.gstPercentage) || 0;
                          const pstPerc = parseFloat(invoiceData?.pstPercentage) || 0;
                          let totalTaxPerc = gstPerc + pstPerc;
                          const gstAmt = parseFloat(invoiceData?.gstAmount) || 0;
                          const pstAmt = parseFloat(invoiceData?.pstAmount) || 0;
                          if (!totalTaxPerc && subtotal > 0) {
                            const inferred = ((gstAmt + pstAmt) / subtotal) * 100;
                            totalTaxPerc = Number.isFinite(inferred) ? inferred : 0;
                          }
                          const tax = subtotal * (totalTaxPerc / 100);
                          const total = subtotal + tax;
                          
                          return `
                            <div style="display: flex; align-items: stretch;">
                                <div style="display: flex; flex-direction: column; justify-content: space-around; padding-right: 10px;">
                                    <div style="padding: 8px 0; font-size: 12px; font-weight: bold; visibility: hidden;">Subtotal</div>
                                    <div style="padding: 8px 0; font-size: 12px; font-weight: bold;">PRA @ ${Number(totalTaxPerc || 0).toFixed(2)}%:</div>
                                    <div style="padding: 8px 0; font-size: 12px; font-weight: bold;">Total Due By [Date]:</div>
                                </div>
                                <div class="summary-box" style="border: 2px solid #000; background: #fff; flex: 1;">
                                    <div style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-align: right;">
                                        ${formatCurrency(subtotal)}
                                    </div>
                                    <div style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-align: right;">
                                        ${formatCurrency(tax)}
                                    </div>
                                    <div style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-align: right; background: #fbbf24;">
                                        ${formatCurrency(total)}
                                    </div>
                                </div>
                            </div>
                          `;
                        })()}
                    </div>
                </div>
            
            <!-- Amount in Words -->
            <div class="amount-words">
                <strong>Amount in Words:</strong> <span class="amount-text">Rupees: ${(() => {
                  // Calculate total from scope of work data
                  let scopeOfWorkFields = [];
                  let subtotal = 0;
                  
                  if (Array.isArray(quotationData?.formData?.scopeOfWork)) {
                    scopeOfWorkFields = quotationData.formData.scopeOfWork;
                  } else if (quotationData.formData && typeof quotationData.formData === 'object') {
                    try {
                      const values = Object.values(quotationData.formData);
                      const candidate = values.find((v) => v && typeof v === 'object' && Array.isArray(v.items));
                      if (candidate && Array.isArray(candidate.items)) {
                        scopeOfWorkFields = candidate.items;
                      }
                    } catch {}
                  } else if (Array.isArray(quotationData?.formData?.dynamicFields)) {
                    const scopeFields = quotationData.formData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                    if (scopeFields.length > 0) {
                      scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                    }
                  } else if (Array.isArray(quotationData?.dynamicFields)) {
                    const scopeFields = quotationData.dynamicFields.filter((field) => field?.type === 'scope-of-work');
                    if (scopeFields.length > 0) {
                      scopeOfWorkFields = scopeFields[0]?.value?.items || [];
                    }
                  }
                  
                  if (scopeOfWorkFields && scopeOfWorkFields.length > 0) {
                    subtotal = scopeOfWorkFields.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
                  } else {
                    subtotal = parseFloat(invoiceData.subtotal) || 0;
                  }
                  
                  const total = subtotal * 1.16;
                  return convertNumberToWords(total);
                })()} Only</span>
            </div>
            
            <!-- Remarks -->
            <div style="margin-top: 20px; font-size: 12px; font-weight: bold;">
                Remarks:
            </div>
            
            <!-- Thank You Message -->
            <div style="margin-top: 20px; text-align: center; font-size: 12px;">
                Thanks for your business with Spectrum Telecom (Pvt.) Ltd
            </div>
            
            <!-- Company Name -->
            <div style="margin-top: 20px; font-size: 12px; font-weight: bold;">
                ${companyData.name || 'Spectrum Telecom (Pvt.) Ltd'}
            </div>
            
            <!-- Signature and Recipient Information -->
            <div style="margin-top: 15px;">
                <!-- Signature space -->
                <div style="height: 50px; margin-bottom: 3px; text-align: left;">
                    ${signatureBase64 ? `<img src="${signatureBase64}" alt="Chief Executive Signature" style="max-height: 50px; max-width: 180px; display: block;" />` : '<div style="height: 50px; width: 180px; margin-bottom: 3px;"></div>'}
                </div>
                
                <!-- Recipient Information -->
                <div style="text-align: left; margin-top: 5px;">
                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">${companyData.recipientName || 'Ghania Khan'}</div>
                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">${companyData.recipientRole || 'Manager Commercial'}</div>
                    <div style="font-size: 11px; color: #0066cc; text-decoration: underline;">${companyData.recipientEmail || 'ghania.khan@spectrumtele.com'}</div>
                </div>
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
              <th style="width: 100px;">Price (US $)</th>
              <th style="width: 100px;">Total Price (US $)</th>
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

  // const formatCurrency = (amount) => {
  //   return `₨${parseFloat(amount || 0).toLocaleString('en-PK', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   })}`;
  // };
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', {
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
                    <tr>
                        <td class="label">GST:</td>
                        <td class="amount">${formatCurrency(quotationData.gstAmount || 0)}</td>
                    </tr>
                    
                    <tr class="highlight">
                        <td class="label">G.Total:</td>
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

// Generate PDF from HTML with retry logic and fallback
const generatePDF = async (html, options = {}, retryCount = 0) => {
  let browser;
  let page;
  
  try {
    console.log(`🔄 Starting PDF generation (attempt ${retryCount + 1})...`);
    checkSystemResources();
    
    // Clean up temp files before starting
    if (retryCount === 0) {
      await cleanupTempFiles();
    }
    
    browser = await getBrowser();
    page = await browser.newPage();

    // Set page timeout
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    console.log('📄 Setting page content...');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    console.log('📄 Generating PDF...');
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
      timeout: 30000,
      ...options
    };

    const pdf = await page.pdf(pdfOptions);
    console.log('✅ PDF generated successfully');
    return pdf;
  } catch (error) {
    console.error(`❌ PDF generation failed (attempt ${retryCount + 1}):`, error.message);
    console.error('Error details:', error);
    
    // If it's a connection error and we haven't retried too many times
    if ((error.message.includes('Connection closed') || 
         error.message.includes('Protocol error') ||
         error.message.includes('ConnectionClosedError') ||
         error.message.includes('Target closed') ||
         error.message.includes('ENOSPC') ||
         error.message.includes('socket hang up')) && retryCount < 3) {
      console.log('🔄 Retrying PDF generation with fresh browser...');
      
      // Clean up temp files on retry
      await cleanupTempFiles();
      
      // Close current browser and create a new one
      if (browser && browser.isConnected()) {
        try {
          await browser.close();
        } catch (closeError) {
          console.log('Browser close error (expected):', closeError.message);
        }
      }
      browser = null;
      
      // Wait longer before retrying
      const waitTime = (retryCount + 1) * 3000; // 3s, 6s, 9s
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return generatePDF(html, options, retryCount + 1);
    }
    
    // If all retries failed, try one more time with a completely fresh browser
    if (retryCount === 0) {
      console.log('🔄 Final attempt with completely fresh browser...');
      browser = null;
      await new Promise(resolve => setTimeout(resolve, 5000));
      return generatePDF(html, options, 1);
    }
    
    // If still failing, try with minimal options
    if (retryCount === 1) {
      console.log('🔄 Trying with minimal PDF options...');
      const minimalOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
        timeout: 15000
      };
      return generatePDF(html, minimalOptions, 2);
    }
    
    throw new Error(`PDF generation failed after ${retryCount + 1} attempts: ${error.message}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.log('Page close error (expected):', closeError.message);
      }
    }
  }
};

// Generate invoice PDF with settings
const generateInvoicePDF = async (invoiceData, clientData, quotationData, taxType = 'GST_AND_PST') => {
  try {
    const html = await generateInvoiceHTML(invoiceData, clientData, quotationData, taxType);
    const pdf = await generatePDF(html, {
      displayHeaderFooter: false,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true
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
const generateQuotationPDF = async (quotationData, clientData, userData, companyData) => {
  try {
    const html = await generateQuotationHTML(quotationData, clientData, userData, companyData);
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
  resetBrowser,
  checkSystemResources,
  cleanupTempFiles,
  cleanup
};