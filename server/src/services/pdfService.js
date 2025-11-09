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

// Helper function to find system Chrome/Chromium executable
const findSystemChrome = () => {
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  // Common Chrome/Chromium paths on Linux
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/local/bin/chrome',
    '/usr/local/bin/chromium',
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH
  ].filter(Boolean);
  
  // Try to find via which command
  try {
    const chromePath = execSync('which google-chrome 2>/dev/null', { encoding: 'utf8' }).trim();
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  } catch (e) {}
  
  try {
    const chromiumPath = execSync('which chromium-browser 2>/dev/null', { encoding: 'utf8' }).trim();
    if (chromiumPath && fs.existsSync(chromiumPath)) {
      return chromiumPath;
    }
  } catch (e) {}
  
  // Check common paths
  for (const chromePath of possiblePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  return null;
};

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
      
      // Try to find system Chrome as fallback
      const systemChrome = findSystemChrome();
      const launchOptions = {
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
      };
      
      // Use system Chrome if available (will be set on retry if needed)
      if (systemChrome) {
        console.log(`🔍 System Chrome found at: ${systemChrome} (will use if needed)`);
      }
      
      browser = await puppeteer.launch(launchOptions);
      console.log('✅ Browser launched successfully');
    }
    return browser;
  } catch (error) {
    console.error(`❌ Browser launch failed (attempt ${retryCount + 1}):`, error.message);
    
    // If Chrome not found, try system Chrome on first retry
    if (error.message.includes('Could not find Chrome')) {
      const systemChrome = findSystemChrome();
      if (systemChrome && retryCount === 0) {
        console.log(`🔧 Retrying with system Chrome at: ${systemChrome}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry with system Chrome
        try {
          const os = require('os');
          const path = require('path');
          const customTempDir = path.join(os.tmpdir(), 'puppeteer-custom');
          browser = await puppeteer.launch({
            executablePath: systemChrome,
            headless: true,
            userDataDir: customTempDir,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--no-first-run',
              '--disable-extensions',
              '--disable-default-apps',
              '--disable-sync',
              '--disable-translate',
              '--hide-scrollbars',
              '--mute-audio',
              '--no-default-browser-check',
              '--disable-blink-features=AutomationControlled'
            ],
            timeout: 30000,
            protocolTimeout: 30000,
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false
          });
          console.log('✅ Browser launched successfully with system Chrome');
          return browser;
        } catch (systemChromeError) {
          console.error(`❌ System Chrome also failed:`, systemChromeError.message);
        }
      } else if (!systemChrome && retryCount === 0) {
        console.error(`
⚠️  Chrome/Chromium not found. Please install it using one of these methods:

For Ubuntu/Debian:
  sudo apt-get update
  sudo apt-get install -y chromium-browser

Or install via Puppeteer:
  cd server && npx puppeteer browsers install chrome

Or set CHROME_PATH environment variable to point to your Chrome executable.
        `);
      }
    }
    
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
    return `$ ${parseFloat(amount || 0).toLocaleString('en-US', {
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
  const getLogoUrl = async () => {
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
      // Try multiple possible paths for better localhost compatibility
      const possibleDirs = [
        path.resolve(__dirname, '../public'),
        path.resolve(__dirname, '../../public'),
        path.resolve(process.cwd(), 'server/public'),
        path.resolve(process.cwd(), 'public')
      ];
      
      let filePath = null;
      for (const publicDir of possibleDirs) {
        const testPath = path.resolve(publicDir, relativeLogoPath);
        try {
          // Check if file exists synchronously (for better error handling)
          const fsSync = require('fs');
          if (fsSync.existsSync(testPath)) {
            filePath = testPath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      // If file found, read and convert to base64
      if (filePath) {
        try {
          const buffer = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          return `data:${mime};base64,${buffer.toString('base64')}`;
        } catch (readError) {
          console.log('⚠️ Could not read logo file, using HTTP fallback:', readError.message);
        }
      }
      
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
                font-size: 7px;
                line-height: 1.2;
                color: #333;
                background: #fff;
            }
            
            .container {
                max-width: 100%;
                width: 100%;
                margin: 0;
                padding: 8px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 4px;
                padding-bottom: 2px;
            }
            
            .logo-section {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                flex: 1;
                
            }
            
            .logo {
                width: 170px;
                height: auto;
                margin: 0 0 2px 0;
                border: none;
                margin-left: 5px;
            }
            
            .logo-placeholder {
                width: 170px;
                height: 50px;
                margin: 0 0 2px 0;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f9f9f9;
                font-size: 6px;
            }
            
            .invoice-ref {
                font-size: 10px;
                font-weight: bold;
                font-family: tahoma;
                text-decoration: underline;
                margin-top: 5px;
            }
            
            .company-details {
                text-align: center;
                flex: 1;
                margin-top: 2px;
                margin-left: -15px;
            }
            
            .company-name {
                font-size: 15px;
                font-weight: bold;
                margin-bottom: 2px;
                margin-top: -3px;
                color: #3177b7;
            }
            
            .company-info {
                font-size: 8px;
                line-height: 1.2;
                display: flex;
                justify-content: center;
                gap: 6px;
                align-items: center;
                font-weight: bold;
                white-space: nowrap;
            }
            
            .company-info span {
                margin-bottom: 0;
            }
            
            .company-address {
                font-size: 8px;
                line-height: 1.2;
                color: #000;
                text-align: center;
                font-weight: bold;
                margin-top: 1px;
                margin-left: -40px;
            }
            
            .company-address div {
                margin-bottom: 1px;
            }
            
            .invoice-title {
                text-align: center;
                font-size: 10px;
                font-weight: bold;
                margin: 4px 0;
                color: #1f2937;
            }
            
            .invoice-number {
                font-size: 8px;
                color: #2563eb;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 2px 6px;
                background: ${getStatusColor(invoiceData.status)};
                color: white;
                border-radius: 10px;
                font-size: 6px;
                font-weight: bold;
                text-transform: uppercase;
                margin-top: 2px;
            }
            
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                margin-top: 18px;
                gap: 1px;
            }
            
            .invoice-left {
                flex: 1;
                text-align: left;
            }
            
            .invoice-center {
                flex: 1;
                text-align: left;
                margin-left: -65px;
            }
            
            .invoice-right {
                flex: 1;
                text-align: right;
            }
            
            .date-section {
                margin-bottom: 3px;
            }
            
            .date-label {
                font-weight: bold;
                font-size: 10px;
                font-family: tahoma;
                margin-left: 24px;
            }
            
            .date-value {
                font-weight: bold;
                font-size: 10px;
                margin-top: 4px;
                margin-left: 4px;
                font-family: tahoma;

            }
            
            .to-section {
                margin-bottom: 3px;
            }
            
            .to-label {
                font-weight: bold;
                font-size: 10px;
                font-family: tahoma;
            }
            
            .client-name {
                font-weight: bold;
                font-size: 10px;
                margin-top: 4px;
                font-family: tahoma;
            }
            
            .client-address {
                font-weight: bold;
                font-size: 10px;
                margin-top: 3px;
                font-family: tahoma;
            }
            
            .client-city {
                font-weight: bold;
                font-size: 10px;
                margin-top: 3px;
                text-decoration: underline;
                font-family: tahoma;
            }
            
            .invoice-title-section {
                text-align: right;
                margin-right: 35px;
            }
            
            .invoice-title-text {
                font-weight: bold;
                font-size: 20px;
                text-decoration: underline;
                margin-bottom: 3px;
                margin-top: -10px;
                font-family: tahoma;
                letter-spacing: 5px;
            }
            
            .attn-section {
                margin-top: 16px;
               
            }
            
            .attn-label {
                font-size: 10px;
                font-family: tahoma;
                 position: relative;
                left: -22px;
            }
            
            .attn-value {
                font-size: 10px;
                font-family: tahoma;
                position: relative;
                left: 13px;
            }
            
            .billing-section p {
                margin-bottom: 5px;
                color: #4b5563;
            }
            
            .scope-of-work-section {
                margin-bottom: 4px;
                position: relative;
            }
            
            .scope-table {
                width: 100%;
                border-collapse: collapse;
                border: none
                border-spacing: 0;
                table-layout: fixed;
            }
            
            .scope-table th {
                background: #dc2626;
                padding: 3px 4px;
                text-align: left;
                font-weight: bold;
                color: #fff;
                border: none;
                font-size: 7px;
            } 
            .scope-table td {
                padding: 3px 4px;
                border: none;
                font-size: 7px;
            }
                
            
            .scope-table thead th:first-child,
            .scope-table tbody td:first-child {
                text-align: center;
                width: 15%;
                font-size: 10px;
                font-family: tahoma;
            }
            
            .scope-table thead th:nth-child(2),
            .scope-table tbody td:nth-child(2) {
                text-align: center;
                width: 15%;
                 font-size: 10px;
                font-family: tahoma;
            }
            
            .scope-table thead th:nth-child(3),
            .scope-table tbody td:nth-child(3) {
                text-align: left;
                width: 15%;
            }
            
            .scope-table thead th:nth-child(4),
            .scope-table tbody td:nth-child(4) {
                text-align: right;
                width: 30%;
            }
            
            .scope-table thead th:nth-child(5),
            .scope-table tbody td:nth-child(5) {
                text-align: right;
                width: 25%;
            }
            
            .scope-table tbody td:nth-child(3) {
                word-wrap: break-word;
                overflow-wrap: break-word;
                word-break: break-word;
            }
            
            .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 4px;
            }
            
            .summary-box {
                width: 150px;
                border: 2px solid #000;
                
            }
            
            .summary-line {
                display: flex;
                justify-content: space-between;
                padding: 3px 6px;
                font-size: 7px;
                font-weight: bold;
                border-bottom: 1px solid #000;
            }
            
            .summary-line:last-child {
                border-bottom: none !important;
            }
            
            .total-due {
                background: #fbbf24 !important;
                padding: 3px 6px;
                font-weight: bold;
                border-radius: 0;
            }
            
            .amount-words {
                margin-top: 3px;
                font-size: 10px;
                font-family: tahoma;
                font-weight: bold;
            }
            
            .amount-words strong {
                font-weight: bold;
            }
            
            .amount-text {
                font-style: italic;
                text-decoration: underline;
                margin-left: 18px;
                font-size: 10px;
                font-family: tahoma;
                font-weight: bold;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 4px;
            }
            
            .totals-table {
                width: 220px;
                border-collapse: collapse;
            }
            
            .totals-table td {
                padding: 2px 4px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 7px;
            }
            
            .totals-table .total-row {
                font-weight: bold;
                font-size: 9px;
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
                margin-top: 4px;
                text-align: center;
                padding-top: 2px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 7px;
            }
            
            .footer p {
                margin-bottom: 2px;
            }
            
            @media print {
                .container {
                    padding: 8px;
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
              <div style="border-bottom: 1px solid #000; margin: 0 auto 3px auto; width: 100%;"></div>

              <!-- Header Reference Section -->
              <div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px; margin: 0 auto 3px auto; width: 90%; text-align: center;">
                  <div style="text-align: left; position: relative; left: -80px;">
                        <div style="font-weight: bold; text-decoration: underline; font-size: 10px;font-family: tahoma;">ABS Ref:</div>
                        <div style="font-size: 10px; margin-top: 1px;font-family: tahoma;">Service Order No.</div>
                        <div style="font-size: 10px; margin-top: 1px;font-family: tahoma;">Dated:</div>
                    </div>


                  <div style="position: relative; top: 13px; left: -68px;">
                      <div style="font-weight: bold; font-size: 10px;font-family: tahoma;">SMS By Regional Office</div>
                  </div>

                  <div style="position: relative; right: -34px;">
                      <div style="font-weight: bold; font-size: 10px;position: relative; left: -15px;font-family: tahoma;">Our Ref:</div>
                      <div style="font-size: 10px; margin-top: 1px;font-family: tahoma;">NTN: <strong style="text-decoration: underline;font-family: tahoma; font-weight: bold;font-size: 10px;">${companyData.ntn || ''}</strong></div>
                      <div style="font-size: 10px; margin-top: 1px;font-family: tahoma;">GST: <strong style="text-decoration: underline;font-family: tahoma; font-weight: bold;font-size: 10px;">${companyData.gst || ''}</strong></div>
                  </div>
              </div>

            
            <!-- Scope of Work Table -->
            <div class="scope-of-work-section">
                <table class="scope-table" style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
                <thead>
                    <tr>
                            <th style="background: #ff0000; padding: 3px 4px; text-align: center; border: none;  font-size: 14px;font-family: tahoma; width: 17%;">Qty.</th>
                            <th style="background: #ff0000; padding: 3px 4px; text-align: center;  border: none;  font-size: 14px;font-family: tahoma; width: 8%;">Unit</th>
                        <th style="background: #ff0000; padding: 3px 4px; text-align: center;  border: none;  font-size: 14px;font-family: tahoma; width: 45%;">Description</th>
                            <th style="background: #ff0000; padding: 3px 4px; text-align: center;  border: none;  font-size: 14px;font-family: tahoma; width: 23%;">Unit Price</th>
                            <th style="background: #ff0000; padding: 3px 4px; text-align: center; border: none;  font-size: 14px;font-family: tahoma; width: 25%;">Total</th>
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
                                  <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; text-align: center;">${item.srNo || item.qty || 1}</td>
                                  <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; text-align: center;">${item.unit || 'Job'}</td>
                                  <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; text-align: left;">${item.description || '-'}</td>
                                  <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; text-align: center;">${formatCurrency(item.price || 0)}</td>
                                  <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; text-align: center;">${formatCurrency(item.total || 0)}</td>
                    </tr>
                            `).join('');
                          } else {
                            console.log('❌ Invoice PDF - No scope of work data found, using fallback');
                            return `<tr>
                              <td style="padding: 3px 4px; border: none; font-size: 10px; font-family: tahoma; background: #fff; text-align: center;">1</td>
                              <td style="padding: 3px 4px; border: none; font-size: 7px; background: #fff; text-align: center;">Job</td>
                              <td style="padding: 3px 4px; border: none; font-size: 7px; background: #fff; text-align: left;">${quotationData?.title || 'Professional Services'}</td>
                              <td style="padding: 3px 4px; border: none; font-size: 7px; background: #fff; text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                              <td style="padding: 3px 4px; border: none; font-size: 7px; background: #fff; text-align: right;">${formatCurrency(invoiceData.subtotal)}</td>
                            </tr>`;
                          }
                        })()}
                </tbody>
            </table>
            </div>
                
                <!-- Summary Section -->
                <div class="summary-section" style="display: flex; justify-content: flex-end; margin-top: 35px;">
                    <div style="width: 190px; position: relative; left: -20px;">
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
                                <div style="display: flex; flex-direction: column; justify-content: space-around; padding-right: 5px;">
                                    <div style="padding: 6px 0; font-size: 7px; font-weight: bold; visibility: hidden;">Subtotal</div>
                                    <div style="padding: 6px 0; font-size: 10px; font-family: tahoma; margin-left: 18px;margin-bottom: 1px;">PRA @ ${Number(totalTaxPerc || 0).toFixed(2)}%</div>
                                    <div style="padding: 6px 0; font-size: 10px; font-family: tahoma;">Total Due By [Date]:</div>
                                </div>
                                <div class="summary-box" style="border: 2px solid #000; background: #fff; flex: 1;">
                                    <div style="padding: 6px 6px; font-size: 10px; font-family: tahoma; text-align: right;">
                                        ${formatCurrency(subtotal)}
                                    </div>
                                    <div style="padding: 6px 6px; font-size: 10px;font-family: tahoma; text-align: right;">
                                        ${formatCurrency(tax)}
                                    </div>
                                    <div style="padding: 6px 6px; font-size: 10px; font-family: tahoma; text-align: right; background: #ffff00;">
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
            <div style="margin-top: 5px; font-size: 10px; font-family: tahoma; font-weight: bold;">
                Remarks:
            </div>
            
            <!-- Thank You Message -->
            <div style="margin-top: 3px; text-align: right; font-size: 10px; font-family: tahoma;font-weight: bold; position: relative; left: -35px;">
                Thanks for your business with Spectrum Telecom (Pvt.) Ltd
            </div>
            
            <!-- Company Name -->
            <div style="margin-top: 3px; font-size: 10px; font-family: tahoma; font-weight: bold;">
                ${companyData.name || 'Spectrum Telecom (Pvt.) Ltd'}
            </div>
            
            <!-- Signature and Recipient Information -->
            <div style="margin-top: 2px;">
                <!-- Signature space -->
                <div style="height: 40px; margin-bottom: 1px; text-align: left;">
                    ${signatureBase64 ? `<img src="${signatureBase64}" alt="Chief Executive Signature" style="max-height: 40px; max-width: 150px; display: block;" />` : '<div style="height: 40px; width: 150px; margin-bottom: 1px;"></div>'}
                </div>
                
                <!-- Recipient Information -->
                <div style="text-align: left; margin-top: 1px;">
                    <div style="font-size: 10px; font-family: tahoma; font-weight: bold; margin-bottom: 1px;">${companyData.recipientName || 'Ghania Khan'}</div>
                    <div style="font-size: 10px; font-family: tahoma; font-weight: bold; margin-bottom: 1px;">${companyData.recipientRole || 'Manager Commercial'}</div>
                    <div style="font-size: 10px; font-family: tahoma; color: #2d7ccb; text-decoration: underline;">${companyData.recipientEmail || 'ghania.khan@spectrumtele.com'}</div>
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
  
  // Debug: Check for category and title in items
  if (scopeOfWorkFields.length > 0) {
    console.log('🔍 First item sample:', JSON.stringify(scopeOfWorkFields[0], null, 2));
    scopeOfWorkFields.forEach((item, idx) => {
      if (item.category || item.servicesTitle || item.supplyTitle) {
        console.log(`🔍 Item ${idx}: category=${item.category}, servicesTitle=${item.servicesTitle}, supplyTitle=${item.supplyTitle}`);
      }
    });
  }
  
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
              <th style="width: 95px;">Sr. No.</th>
              <th style="width: 368px;">Description</th>
              <th style="width: 40px;">QTY</th>
              <th style="width: 55px;">Unit</th>
              <th style="width: 75px;">Price (US $)</th>
              <th style="width: 75px;">Total Price (US $)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Calculate subtotal from all items
    const subtotal = scopeOfWorkFields.reduce((sum, item) => {
      return sum + (parseFloat(item.total || 0));
    }, 0);
    
    // Group items by category and title (if they exist)
    let lastCategory = null;
    let lastTitle = null;
    
    scopeOfWorkFields.forEach((item, index) => {
      // Check if this item has a different category or title than the previous one
      const currentCategory = item.category || '';
      const currentTitle = currentCategory === 'supply' ? (item.supplyTitle || '') : (item.servicesTitle || '');
      
      console.log(`🔍 Item ${index}: category="${currentCategory}", supplyTitle="${item.supplyTitle || ''}", servicesTitle="${item.servicesTitle || ''}", currentTitle="${currentTitle}"`);
      
      // Add title row if:
      // 1. This is the first item and has a title, OR
      // 2. Category/title changed from previous item
      const shouldShowTitle = currentTitle && currentTitle.trim() !== '' && (
        index === 0 || 
        currentCategory !== lastCategory || 
        currentTitle !== lastTitle
      );
      
      if (shouldShowTitle) {
        // Show only the title, without the category label
        // Title appears in Description column and spans to the end without vertical borders after Description
        const titleText = currentTitle;
        // Set color based on category: Services = #4181bb (blue), Supply = #d32f2f (red)
        const titleColor = currentCategory === 'services' ? '#4181bb' : '#d32f2f';
        console.log(`✅ Adding title row: "${titleText}" with color: ${titleColor} for category: ${currentCategory}`);
        scopeOfWorkHTML += `
          <tr>
            <td style="background-color: #fff; padding: 3px; border: 1px solid #000; border-right: 1px solid #000;"></td>
            <td colspan="5" style="background-color: #fff; padding: 3px; font-weight: bold; font-style: italic; font-size: 10px; text-decoration: underline; color: ${titleColor}; text-align: left; border: 1px solid #000; border-left: none;">
              ${titleText}
            </td>
          </tr>
        `;
        lastCategory = currentCategory;
        lastTitle = currentTitle;
      } else if (currentTitle && currentTitle.trim() !== '') {
        console.log(`⏭️ Skipping title row for item ${index} (same as previous)`);
      } else {
        console.log(`⏭️ Skipping title row for item ${index} (no title)`);
      }
      
      scopeOfWorkHTML += `
        <tr>
          <td>${item.srNo || ''}</td>
          <td class="description">${item.description || ''}</td>
          <td style="font-weight: bold;">${item.qty || 0}</td>
          <td style="font-weight: bold;">${item.unit || ''}</td>
          <td style="text-align: right; font-weight: bold;">${parseFloat(item.price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold;">${parseFloat(item.total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    });
    
    // Add two subtotal rows at the end
    scopeOfWorkHTML += `
        <tr>
          <td style="background-color: #ffff00; padding: 2px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
          <td style="background-color: #ffff00; padding: 2px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffff00; padding: 2px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffff00; padding: 2px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffff00; padding: 2px 4px; color: #71a17b; font-weight: bold; font-size: 8px; font-style: italic; text-align: right; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;">Sub Total</td>
          <td style="background-color: #ffff00; padding: 2px 4px; color: #71a17b; font-weight: bold; font-size: 8px; text-align: right; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;">${subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="background-color: #ffc000; padding: 4px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
          <td style="background-color: #ffc000; padding: 4px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffc000; padding: 4px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffc000; padding: 4px 4px; border-right: none; border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: none;"></td>
          <td style="background-color: #ffc000; padding: 4px 4px; font-weight: bold; text-align: right; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 8px; border-left: none;">Sub Total</td>
          <td style="background-color: #ffc000; padding: 4px 4px; font-weight: bold; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 8px; border-left: none;"><span style="float: left;">$</span><span style="float: right;">${subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
        </tr>
        <tr>
          <td colspan="4" style="border-right: none; border-top: none; border-bottom: none; border-left: 1px solid #000;"></td>
          <td style="padding: 2px 4px; text-align: right; border: 1px solid #000; font-size: 8px; font-weight: bold;">GST @ ${quotationData.gstPercentage || 0}%:</td>
          <td style="padding: 2px 4px; border: 1px solid #000; font-size: 8px; font-weight: bold;"><span style="float: left;">$</span><span style="float: right;">${parseFloat(quotationData.gstAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></td>
        </tr>
        <tr>
          <td colspan="4" style="border-right: none; border-top: none; border-bottom: none; border-left: 1px solid #000;"></td>
          <td style="padding: 2px 4px; text-align: right; border: 1px solid #000; font-size: 8px; font-weight: bold;">PST @ ${quotationData.pstPercentage || 0}%:</td>
          <td style="padding: 2px 4px; border: 1px solid #000; font-size: 8px; font-weight: bold;"><span style="float: left;">$</span><span style="float: right;">${parseFloat(quotationData.pstAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></td>
        </tr>
        <tr>
          <td colspan="4" style="border-right: none; border-top: none; border-bottom: none; border-left: 1px solid #000;"></td>
          <td style="padding: 2px 4px; text-align: right; border: 1px solid #000; font-size: 8px; font-weight: bold;">Grand Total:</td>
          <td style="padding: 2px 4px; border: 1px solid #000; font-size: 8px; font-weight: bold;"><span style="float: left;">$</span><span style="float: right;">${parseFloat(quotationData.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></td>
        </tr>
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
  const getLogoUrl = async () => {
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
      // Try multiple possible paths for better localhost compatibility
      const possibleDirs = [
        path.resolve(__dirname, '../public'),
        path.resolve(__dirname, '../../public'),
        path.resolve(process.cwd(), 'server/public'),
        path.resolve(process.cwd(), 'public')
      ];
      
      let filePath = null;
      for (const publicDir of possibleDirs) {
        const testPath = path.resolve(publicDir, relativeLogoPath);
        try {
          // Check if file exists synchronously (for better error handling)
          const fsSync = require('fs');
          if (fsSync.existsSync(testPath)) {
            filePath = testPath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      // If file found, read and convert to base64
      if (filePath) {
        try {
          const buffer = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          return `data:${mime};base64,${buffer.toString('base64')}`;
        } catch (readError) {
          console.log('⚠️ Could not read logo file, using HTTP fallback:', readError.message);
        }
      }
      
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
                font-size: 7px;
                line-height: 1.1;
                color: #000;
                background: #fff;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 4px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 4px;
                padding-bottom: 2px;
            }
            
            .logo-section {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                flex: 1;
                margin-left: 8px;
                position: relative;
                top: 4px;
            }
            
            .logo {
                width: 180px;
                height: auto;
                margin: 0 0 2px 0;
                border: none;
                transform: skewX(-10deg);
            }
            
            .logo-placeholder {
                width: 120px;
                height: 35px;
                margin: 0 0 2px 0;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f5f5;
                font-size: 7px;
                font-weight: bold;
                font-style: italic;
                text-align: center;
                color: #666;
            }
            
            .tagline {
                font-size: 14px;
                font-weight: bold;
                margin-top: 2px;
                font-family: 'Calibri', sans-serif;
            }
            
            .company-details {
                text-align: right;
                flex: 1;
                margin-left: 0;
                margin-top: 20px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .company-name {
                font-size: 14px;
                font-weight: bold;
                color: #528dc2;
            }
            
            .company-info {
                font-size: 10px;
                line-height: 1.1;
                color: #000;
                display: flex;
                justify-content: flex-end;
                gap: 2px;
                align-items: center;
                font-weight: 600;
                white-space: nowrap;
                text-align: right;
                margin-left: auto;
                padding-left: 50px;
                margin-top: 2px;
            }
            
            .company-info span {
                margin-bottom: 0;
            }
            
            .quotation-title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                background: #bfbfbf;
                padding: 3px;
                border: 1px solid #000;
            }
            
            .quotation-header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 4px;
                border: 1px solid #000;
            }
            
            .quotation-header-table td {
                padding: 2px 3px;
                vertical-align: top;
                border: 1px solid #000;

            }
            
            .quotation-header-table td:first-child {
                width: 65%;
            }
            
            .quotation-header-table td:last-child {
                width: 35%;
            }
            
            .section-title {
                font-weight: bold;
                background: #f3f4f6;
                text-align: center;
                padding: 4px;
                font-size: 10px;
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                padding: 1px 2px;
                min-height: 12px;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                min-width: 90px;
                font-size: 8px;
            }
            
            .detail-label.section-header {
                font-weight: bold;
                text-decoration: underline;
            }
            
            .detail-value {
                text-decoration: underline;
                margin-left: 4px;
                flex: 1;
                font-size: 8px;
                font-weight: bold;
                text-align: left;
            }
            
            .quotation-details {
                background: #f5f5f5;
                border: 1px solid #ccc;
                padding: 8px;
                margin-bottom: 10px;
            }
            
            .details-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            
            .details-row:last-child {
                margin-bottom: 0;
            }
            
            .details-label {
                font-weight: bold;
                width: 100px;
            }
            
            .details-value {
                flex: 1;
            }
            
            .subject {
                font-size: 10px;
                font-weight: bold;
                font-style: italic;
                margin: 8px 0;
            }
            
            .subject-value {
                text-decoration: underline;
                margin-left: 14px;
                font-weight: bold;
                font-size: 10px;
                font-style: italic;
            }
            
            .scope-of-work-header {
                background: #ffc000;
                color: #000;
                font-weight: bold;
                font-style: italic;
                text-align: center;
                padding: 3px;
                border: 1px solid #000;
                font-size: 20px;
            }
            
            .scope-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 3px;
                table-layout: fixed;
            }
            
            .scope-table th {
                background: #e7e6e6;
                border: 1px solid #000;
                padding: 3px 4px;
                text-align: center;
                font-weight: bold;
                font-style: italic;
                font-size: 9px;
            }
            
            .scope-table th:nth-child(2),
            .scope-table td:nth-child(2) {
                width: 365px;
                max-width: 365px;
            }
            
           
            
            .scope-table td {
                border: 1px solid #000;
                padding: 3px 4px;
                text-align: center;
                font-size: 7px;
            }
            
            .scope-table .description {
                text-align: left;
                padding: 3px 4px !important;
                overflow: hidden;
                word-wrap: break-word;
                font-family: Helvetica, Arial, sans-serif;
                line-height: 1.3;
            }
            
            /* Style lists within description cell to keep bullets inside */
            .scope-table .description ul,
            .scope-table .description ol {
              list-style-position: inside;
              padding-left: 0;
              margin: 0;
            }
            
            .scope-table .description ul {
                list-style-type: disc;
            }
            
            .scope-table .description ol {
                list-style-type: decimal;
            }
            
            .scope-table .description ul {
              list-style: none;
            }
            
            .scope-table .description li {
              padding-left: 0;
              text-indent: 0;
              margin: 0;
              font-size: 7px;
              line-height: 1.3;
              position: relative;
              font-family: Helvetica, Arial, sans-serif;
            }
            
            .scope-table .description ul li::before {
              content: "•";
              font-size: 9px;
              margin-right: 2px;
              display: inline-block;
              vertical-align: middle;
              font-family: Helvetica, Arial, sans-serif;
            }
            
           
            
           
            
            /* Paragraphs and headings within description */
            .scope-table .description p {
                margin: 2px 0;
                padding: 0;
                font-family: Helvetica, Arial, sans-serif;
            }
            
            .scope-table .description h1,
            .scope-table .description h2,
            .scope-table .description h3,
            .scope-table .description h4,
            .scope-table .description h5,
            .scope-table .description h6 {
                margin: 3px 0 2px 0;
                padding: 0;
                font-weight: bold;
                font-family: Helvetica, Arial, sans-serif;
            }
            
            .scope-table .description li {
                font-family: Helvetica, Arial, sans-serif;
            }
            
            /* Ensure content doesn't overflow */
            .scope-table .description * {
                max-width: 100%;
                box-sizing: border-box;
                font-family: Helvetica, Arial, sans-serif;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 3px;
                margin-top: 3px;
            }
            
            .totals-table {
                width: 220px;
                border-collapse: collapse;
                border: 1px solid #000;
            }
            
            .totals-table td {
                border: 1px solid #000;
                padding: 2px 4px;
                font-size: 8px;
            }
            
            .totals-table .label {
                text-align: right;
                font-weight: bold;
            }
            
            .totals-table .amount {
                text-align: right;
                font-weight: bold;
            }
            
            .terms-section {
                margin-bottom: 3px;
                margin-top: -20px;
                margin-left: 3px;
            }
            
            .terms-title {
                font-size: 8px;
                font-weight: bold;
                margin-bottom: 2px;
                font-style: italic;
                text-decoration: underline;
            }
            
            .terms-list {
                display: flex;
                flex-direction: column;
            }
            
            .terms-item {
                display: flex;
                align-items: center;
                padding: 3px 0;
                margin: 2px 0;
            }
            
            .terms-item.highlight {
                background: #ffff00;
                margin-top: 0;
                margin-bottom: 0;
                padding: 3px 0;
            }
            
            .terms-item.highlight + .terms-item.highlight {
                margin-top: 0;
            }
            
            .terms-item:not(.highlight) + .terms-item.highlight {
                margin-top: 2px;
            }
            
            .terms-item.highlight + .terms-item:not(.highlight) {
                margin-top: 1px;
            }
            
            .terms-label {
                font-weight: bold;
                min-width: 80px;
                font-size: 8px;
                text-decoration: underline;
                font-family: sans-serif;
            }
            
            .terms-value {
                text-decoration: underline;
                font-weight: bold;
                margin-left: 120px;
                font-size: 8px;
                font-style: italic;
 
            }
            
            .footer {
                text-align: left;
                font-size: 7px;
                padding-top: 3px;
                text-color: #000000;
                background-color: #a6a6a6;
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
                        <span style="color:#0070c0;">Performance</span>, 
                        <span style="color:#70ad47;">Integrity</span>, 
                        <span style="color:#ff0000;">Quality</span>
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
            <div class="quotation-title">Quotation</div>
            
            <!-- Quotation Header Table -->
            <table class="quotation-header-table">
                <tr>
                    <td>
                        <div class="detail-row">
                            <div class="detail-label section-header">Customer:</div>
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
                        <div class="detail-label section-header">From:</div>
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
            <div class="subject">Subject:<span class="subject-value">${quotationData.title}</span></div>
            
            <!-- Scope of Work Section -->
            ${generateScopeOfWorkSection(quotationData)}
            
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
    // Use more lenient wait strategy for localhost, but keep networkidle0 for server
    const isLocalhost = process.env.NODE_ENV === 'development' || 
                        !process.env.SERVER_PUBLIC_URL && 
                        !process.env.PUBLIC_BASE_URL &&
                        !process.env.VPS_IP;
    
    const waitStrategy = isLocalhost ? 'load' : 'networkidle0';
    
    try {
      await page.setContent(html, { 
        waitUntil: waitStrategy,
        timeout: 30000 
      });
    } catch (waitError) {
      // Fallback to domcontentloaded if load fails (more lenient)
      if (isLocalhost && waitError.message.includes('timeout')) {
        console.log('⚠️ Using fallback wait strategy for localhost...');
        await page.setContent(html, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
      } else {
        throw waitError;
      }
    }

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
      format: 'A5',
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