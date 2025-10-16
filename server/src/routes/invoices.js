const express = require('express');
const { body, query } = require('express-validator');
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  sendInvoiceEmail,
  deleteInvoice,
  getInvoiceStatistics,
  generateInvoicePDFController,
  getTaxPresets,
  bulkUpdateTaxRates,
  bulkInvoiceActions,
  sendInvoiceEmailWithTax,
  INVOICE_TAX_TYPES
} = require('../controllers/invoiceController');

const { authenticateToken } = require('../middleware/auth');
const { 
  requirePermission,
  canAccessResource 
} = require('../middleware/permissions');
const { 
  validatePagination, 
  validateUUIDParam,
  handleValidationErrors 
} = require('../middleware/validation');
const { PERMISSIONS, INVOICE_STATUS, INVOICE_TYPES } = require('../config/constants');

const router = express.Router();

// All invoice routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices with pagination and filtering
 * @access  Private (Users can see own, Managers+ can see all)
 * @query   page, limit, sortBy, sortOrder, search, status, type, clientId, userId, startDate, endDate
 */
router.get('/', [
  requirePermission(PERMISSIONS.INVOICES.READ),
  validatePagination
], getInvoices);

/**
 * @route   GET /api/invoices/statistics
 * @desc    Get invoice statistics and analytics
 * @access  Private (Users see own stats, Managers+ see all)
 */
router.get('/statistics', [
  requirePermission(PERMISSIONS.INVOICES.READ)
], getInvoiceStatistics);

/**
 * @route   GET /api/invoices/dashboard/summary
 * @desc    Get invoices summary for dashboard
 * @access  Private
 */
router.get('/dashboard/summary', [
  requirePermission(PERMISSIONS.INVOICES.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    // Build where clause based on permissions
    const where = {};
    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const [
      totalInvoices,
      pendingInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      cancelledInvoices,
      totalValue,
      paidValue,
      recentInvoices
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ 
        where: { ...where, status: INVOICE_STATUS.PENDING } 
      }),
      prisma.invoice.count({ 
        where: { ...where, status: INVOICE_STATUS.SENT } 
      }),
      prisma.invoice.count({ 
        where: { ...where, status: INVOICE_STATUS.PAID } 
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: { notIn: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.invoice.count({ 
        where: { ...where, status: INVOICE_STATUS.CANCELLED } 
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: INVOICE_STATUS.PAID },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          gstPercentage: true,
          pstPercentage: true,
          combinedTaxAmount: true,
          dueDate: true,
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

    const outstandingValue = (totalValue._sum.totalAmount || 0) - (paidValue._sum.totalAmount || 0);

    res.json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: {
        summary: {
          total: totalInvoices,
          pending: pendingInvoices,
          sent: sentInvoices,
          paid: paidInvoices,
          overdue: overdueInvoices,
          cancelled: cancelledInvoices,
          totalValue: totalValue._sum.totalAmount || 0,
          paidValue: paidValue._sum.totalAmount || 0,
          outstandingValue
        },
        recentInvoices
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/invoices/overdue/list
 * @desc    Get overdue invoices
 * @access  Private (Manager+)
 */
router.get('/overdue/list', [
  requirePermission(PERMISSIONS.INVOICES.READ),
  validatePagination
], async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    // Build where clause for overdue invoices
    const where = {
      status: { notIn: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
      dueDate: { lt: new Date() }
    };

    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          gstPercentage: true,
          pstPercentage: true,
          combinedTaxAmount: true,
          dueDate: true,
          createdAt: true,
          client: {
            select: {
              id: true,
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
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.invoice.count({ where })
    ]);

    // Calculate days overdue for each invoice
    const invoicesWithOverdueDays = invoices.map(invoice => ({
      ...invoice,
      daysOverdue: Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      message: 'Overdue invoices fetched successfully',
      data: {
        invoices: invoicesWithOverdueDays,
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
 * @route   GET /api/invoices/export/csv
 * @desc    Export invoices data as CSV
 * @access  Private (Manager+)
 */
router.get('/export/csv', [
  requirePermission(PERMISSIONS.INVOICES.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    // Build where clause based on permissions
    const where = {};
    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        invoiceNumber: true,
        type: true,
        status: true,
        subtotal: true,
        gstPercentage: true,
        gstAmount: true,
        pstPercentage: true,
        pstAmount: true,
        combinedTaxAmount: true,
        totalAmount: true,
        dueDate: true,
        paidDate: true,
        emailSent: true,
        createdAt: true,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to CSV format
    const csvData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoiceNumber,
      'Type': invoice.type.replace(/_/g, ' '),
      'Status': invoice.status,
      'Client Company': invoice.client.companyName,
      'Client Contact': invoice.client.contactPerson,
      'Client Email': invoice.client.email,
      'Quotation Number': invoice.quotation?.quotationNumber || '',
      'Quotation Title': invoice.quotation?.title || '',
      'Subtotal': invoice.subtotal,
      'GST %': invoice.gstPercentage,
      'GST Amount': invoice.gstAmount,
      'PST %': invoice.pstPercentage,
      'PST Amount': invoice.pstAmount,
      'Total Tax': invoice.combinedTaxAmount,
      'Total Amount': invoice.totalAmount,
      'Due Date': invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
      'Paid Date': invoice.paidDate ? invoice.paidDate.toISOString().split('T')[0] : '',
      'Email Sent': invoice.emailSent ? 'Yes' : 'No',
      'Created By': `${invoice.user.firstName} ${invoice.user.lastName}`,
      'Created Date': invoice.createdAt.toISOString().split('T')[0]
    }));

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');

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

/**
 * @route   GET /api/invoices/types/available
 * @desc    Get available invoice types
 * @access  Private
 */
router.get('/types/available', [
  requirePermission(PERMISSIONS.INVOICES.READ)
], (req, res) => {
  const invoiceTypes = Object.values(INVOICE_TYPES).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: `${type.replace('TAX_INVOICE_', 'Tax Invoice Type ')}`
  }));

  res.json({
    success: true,
    message: 'Available invoice types fetched successfully',
    data: { types: invoiceTypes }
  });
});

/**
 * NEW: GET /api/invoices/tax-presets
 * @desc    Get available tax rate presets
 * @access  Private
 */
router.get('/tax-presets', [
  requirePermission(PERMISSIONS.INVOICES.READ)
], getTaxPresets);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID with detailed information
 * @access  Private (Owner or Manager+)
 */
router.get('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.READ),
  canAccessResource('invoice')
], getInvoiceById);

/**
 * ENHANCED: GET /api/invoices/:id/pdf
 * @desc    Generate and download invoice PDF with dynamic tax rates
 * @access  Private (Owner or Manager+)
 * @query   taxType, customGstRate, customPstRate
 */
router.get('/:id/pdf', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.READ),
  canAccessResource('invoice'),
  query('taxType')
    .optional()
    .isIn(Object.values(INVOICE_TAX_TYPES))
    .withMessage('Invalid tax type'),
  query('customGstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Custom GST rate must be between 0 and 100'),
  query('customPstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Custom PST rate must be between 0 and 100'),
  handleValidationErrors
], generateInvoicePDFController);

/**
 * ENHANCED: POST /api/invoices
 * @desc    Create new invoice from quotation with custom tax rates
 * @access  Private (Manager+)
 * @body    { quotationId, type, dueDate?, gstPercentage?, pstPercentage? }
 */
router.post('/', [
  requirePermission(PERMISSIONS.INVOICES.CREATE),
  body('quotationId')
    .isUUID()
    .withMessage('Valid quotation ID is required'),
  body('type')
    .isIn(Object.values(INVOICE_TYPES))
    .withMessage('Valid invoice type is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('gstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('pstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('PST rate must be between 0 and 100'),
  handleValidationErrors
], createInvoice);

/**
 * NEW: POST /api/invoices/bulk-update-tax-rates
 * @desc    Bulk update tax rates for multiple invoices
 * @access  Private (Manager+)
 * @body    { invoiceIds: string[], gstPercentage: number, pstPercentage: number }
 */
router.post('/bulk-update-tax-rates', [
  requirePermission(PERMISSIONS.INVOICES.UPDATE),
  body('invoiceIds')
    .isArray({ min: 1 })
    .withMessage('At least one invoice ID is required'),
  body('invoiceIds.*')
    .isUUID()
    .withMessage('Invalid invoice ID format'),
  body('gstPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('pstPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('PST rate must be between 0 and 100'),
  handleValidationErrors
], bulkUpdateTaxRates);

/**
 * @route   POST /api/invoices/bulk-action
 * @desc    Perform bulk actions on invoices
 * @access  Private (Manager+)
 * @body    { invoiceIds: string[], action: 'send' | 'mark_paid' | 'cancel' | 'delete' }
 */
router.post('/bulk-action', [
  requirePermission(PERMISSIONS.INVOICES.UPDATE),
  body('invoiceIds')
    .isArray({ min: 1 })
    .withMessage('At least one invoice ID is required'),
  body('invoiceIds.*')
    .isUUID()
    .withMessage('Invalid invoice ID format'),
  body('action')
    .isIn(['send', 'mark_paid', 'cancel', 'delete'])
    .withMessage('Invalid action. Must be send, mark_paid, cancel, or delete'),
  handleValidationErrors
], bulkInvoiceActions);

/**
 * ENHANCED: PUT /api/invoices/:id
 * @desc    Update invoice including tax rates
 * @access  Private (Owner or Manager+)
 */
router.put('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.UPDATE),
  canAccessResource('invoice'),
  body('status')
    .optional()
    .isIn(Object.values(INVOICE_STATUS))
    .withMessage('Invalid invoice status'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('paidDate')
    .optional()
    .isISO8601()
    .withMessage('Paid date must be a valid date'),
  body('gstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('pstPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('PST rate must be between 0 and 100'),
  handleValidationErrors
], updateInvoice);

/**
 * @route   POST /api/invoices/:id/send
 * @desc    Send invoice via email
 * @access  Private (Owner or Manager+)
 */
router.post('/:id/send', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.SEND),
  canAccessResource('invoice')
], sendInvoiceEmail);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private (Owner or Manager+)
 */
router.delete('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.DELETE),
  canAccessResource('invoice')
], deleteInvoice);

/**
 * @route   GET /api/invoices/quotation/:quotationId
 * @desc    Get all invoices for a specific quotation
 * @access  Private
 */
router.get('/quotation/:quotationId', [
  validateUUIDParam('quotationId'),
  requirePermission(PERMISSIONS.INVOICES.READ)
], async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    const where = { quotationId };
    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        totalAmount: true,
        gstPercentage: true,
        gstAmount: true,
        pstPercentage: true,
        pstAmount: true,
        combinedTaxAmount: true,
        dueDate: true,
        paidDate: true,
        emailSent: true,
        createdAt: true,
        client: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Quotation invoices fetched successfully',
      data: { invoices }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/invoices/client/:clientId
 * @desc    Get all invoices for a specific client
 * @access  Private
 */
router.get('/client/:clientId', [
  validateUUIDParam('clientId'),
  requirePermission(PERMISSIONS.INVOICES.READ)
], async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    const where = { clientId };
    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          gstPercentage: true,
          gstAmount: true,
          pstPercentage: true,
          pstAmount: true,
          combinedTaxAmount: true,
          dueDate: true,
          paidDate: true,
          createdAt: true,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Client invoices fetched successfully',
      data: {
        invoices,
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
 * NEW: POST /api/invoices/:id/send-with-tax
 * @desc    Send invoice via email with specific tax configuration
 * @access  Private (Owner or Manager+)
 * @body    { taxType: 'GST_ONLY' | 'PST_ONLY' | 'GST_AND_PST' | 'NO_TAX', customGstRate?: number, customPstRate?: number }
 */
router.post('/:id/send-with-tax', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.INVOICES.SEND),
  canAccessResource('invoice'),
  body('taxType')
    .isIn(Object.values(INVOICE_TAX_TYPES))
    .withMessage('Invalid tax type'),
  body('customGstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Custom GST rate must be between 0 and 100'),
  body('customPstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Custom PST rate must be between 0 and 100'),
  handleValidationErrors
], sendInvoiceEmailWithTax);

/**
 * @route   GET /api/invoices/status/:status
 * @desc    Get invoices by status
 * @access  Private
 */
router.get('/status/:status', [
  requirePermission(PERMISSIONS.INVOICES.READ),
  validatePagination
], async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!Object.values(INVOICE_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice status'
      });
    }

    const { prisma } = require('../config/database');
    const { hasPermission } = require('../middleware/permissions');

    const where = { status };
    if (!hasPermission(req.user.role, PERMISSIONS.INVOICES.READ_ALL)) {
      where.userId = req.user.id;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          gstPercentage: true,
          gstAmount: true,
          pstPercentage: true,
          pstAmount: true,
          combinedTaxAmount: true,
          dueDate: true,
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
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      message: `${status} invoices fetched successfully`,
      data: {
        invoices,
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

module.exports = router;