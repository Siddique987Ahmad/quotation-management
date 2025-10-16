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
    return `$${parseFloat(amount || 0).toLocaleString('en-US', {
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
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 30px;
            }
            
            .company-info h1 {
                font-size: 28px;
                color: #2563eb;
                margin-bottom: 10px;
            }
            
            .company-info p {
                margin-bottom: 5px;
                color: #666;
            }
            
            .invoice-details {
                text-align: right;
            }
            
            .invoice-title {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 10px;
                font-weight: bold;
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
                padding: 10px 15px;
                border-bottom: 1px solid #e5e7eb;
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
                <div class="company-info">
                    <h1>${companyData.name || 'Your Company'}</h1>
                    <p>${companyData.address || '123 Business Street'}</p>
                    <p>${companyData.city || 'City'}, ${companyData.state || 'State'} ${companyData.zipCode || '12345'}</p>
                    <p>Phone: ${companyData.phone || '+1 (555) 123-4567'}</p>
                    <p>Email: ${companyData.email || 'info@company.com'}</p>
                    ${companyData.website ? `<p>Website: ${companyData.website}</p>` : ''}
                    ${companyData.taxId ? `<p>Tax ID: ${companyData.taxId}</p>` : ''}
                </div>
                <div class="invoice-details">
                    <div class="invoice-title">${getInvoiceTypeLabel(invoiceData.type)}</div>
                    <div class="invoice-number">#${invoiceData.invoiceNumber}</div>
                    <p><strong>Date:</strong> ${formatDate(invoiceData.createdAt)}</p>
                    <p><strong>Due Date:</strong> ${formatDate(invoiceData.dueDate)}</p>
                    <div class="status-badge">${invoiceData.status}</div>
                </div>
            </div>
            
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
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 30px;
            }
            
            .company-info h1 {
                font-size: 28px;
                color: #2563eb;
                margin-bottom: 10px;
            }
            
            .company-info p {
                margin-bottom: 5px;
                color: #666;
            }
            
            .quotation-details {
                text-align: right;
            }
            
            .quotation-title {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .quotation-number {
                font-size: 16px;
                color: #2563eb;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                background: ${getStatusColor(quotationData.status)};
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
            
            .quotation-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .quotation-table th {
                background: #f3f4f6;
                padding: 15px;
                text-align: left;
                font-weight: bold;
                color: #374151;
                border-bottom: 2px solid #d1d5db;
            }
            
            .quotation-table td {
                padding: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .quotation-table tr:nth-child(even) {
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
                padding: 10px 15px;
                border-bottom: 1px solid #e5e7eb;
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
            
            .terms-info {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .terms-info h3 {
                color: #2563eb;
                margin-bottom: 15px;
            }
            
            .terms-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .terms-grid div {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #2563eb;
            }
            
            .terms-grid strong {
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
                <div class="company-info">
                    <h1>${companyData.name || 'Your Company'}</h1>
                    <p>${companyData.address || '123 Business Street'}</p>
                    <p>${companyData.city || 'City'}, ${companyData.state || 'State'} ${companyData.zipCode || '12345'}</p>
                    <p>Phone: ${companyData.phone || '+1 (555) 123-4567'}</p>
                    <p>Email: ${companyData.email || 'info@company.com'}</p>
                    ${companyData.website ? `<p>Website: ${companyData.website}</p>` : ''}
                    ${companyData.taxId ? `<p>Tax ID: ${companyData.taxId}</p>` : ''}
                </div>
                <div class="quotation-details">
                    <div class="quotation-title">QUOTATION</div>
                    <div class="quotation-number">#${quotationData.quotationNumber}</div>
                    <p><strong>Date:</strong> ${formatDate(quotationData.createdAt)}</p>
                    <p><strong>Valid Until:</strong> ${formatDate(quotationData.validUntil)}</p>
                    <div class="status-badge">${quotationData.status}</div>
                </div>
            </div>
            
            <!-- Billing Information -->
            <div class="billing-info">
                <div class="billing-section">
                    <h3>Quote To:</h3>
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
                    <h3>Prepared By:</h3>
                    <p><strong>${userData.firstName} ${userData.lastName}</strong></p>
                    <p>${userData.email}</p>
                    <p><strong>Quotation ID:</strong> ${quotationData.id}</p>
                </div>
            </div>
            
            <!-- Quotation Items Table -->
            <table class="quotation-table">
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
                            <strong>${quotationData.title}</strong>
                            ${quotationData.description ? `<br><small style="color: #6b7280;">${quotationData.description}</small>` : ''}
                        </td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">${formatCurrency(quotationData.subtotal)}</td>
                        <td style="text-align: right;">${formatCurrency(quotationData.subtotal)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">${formatCurrency(quotationData.subtotal)}</td>
                    </tr>
                   ${quotationData.gstPercentage > 0 ? `
<tr>
    <td><strong>GST (${quotationData.gstPercentage}%):</strong></td>
    <td style="text-align: right;">${formatCurrency(quotationData.gstAmount)}</td>
</tr>
` : ''}
${quotationData.pstPercentage > 0 ? `
<tr>
    <td><strong>PST (${quotationData.pstPercentage}%):</strong></td>
    <td style="text-align: right;">${formatCurrency(quotationData.pstAmount)}</td>
</tr>
` : ''}
${(quotationData.gstPercentage > 0 || quotationData.pstPercentage > 0) ? `
<tr>
    <td><strong>Total Tax:</strong></td>
    <td style="text-align: right;">${formatCurrency(quotationData.taxAmount)}</td>
</tr>
` : ''}
                    <tr class="total-row">
                        <td><strong>Total Amount:</strong></td>
                        <td style="text-align: right;"><strong>${formatCurrency(quotationData.totalAmount)}</strong></td>
                    </tr>
                </table>
            </div>
            
            <!-- Terms Information -->
            <div class="terms-info">
                <h3>Terms & Conditions</h3>
                <div class="terms-grid">
                    <div>
                        <strong>Validity:</strong>
                        ${quotationData.validUntil ? formatDate(quotationData.validUntil) : 'Valid for 30 days'}
                    </div>
                    <div>
                        <strong>Payment Terms:</strong>
                        50% advance, 50% on completion
                    </div>
                </div>
            </div>
            
            ${quotationData.notes ? `
                <div class="notes">
                    <h4>Additional Notes:</h4>
                    <p>${quotationData.notes}</p>
                </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
                <p>This quotation is valid until ${formatDate(quotationData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</p>
                <p>Thank you for considering our services!</p>
                <p>Generated on ${formatDate(new Date())}</p>
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
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
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