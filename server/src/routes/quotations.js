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
const { settingsService } = require('../services/settingsService');

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
        client: {
          include: {
            departments: {
              include: {
                department: {
                  select: {
                    id: true,
                    name: true,
                    contactPerson: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true
                  }
                }
              }
            }
          }
        },
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

    // Get company settings from database
    const companyData = await settingsService.getCompanySettings();

    // Generate PDF with processed data
    const pdfResult = await generateQuotationPDF(
      processedQuotation,
      quotation.client,
      quotation.user
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

/**
 * @route   POST /api/quotations/:id/send-email
 * @desc    Send quotation via email to clients (department-based or all)
 * @access  Private (Owner or Manager+)
 * @body    { departmentId? } - Optional department ID to send to specific department
 */
router.post('/:id/send-email', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;
    const { prisma } = require('../config/database');
    const { canAccessRecord } = require('../middleware/userFiltering');
    const { generateQuotationPDF } = require('../services/pdfService');
    const { sendQuotationEmailToDepartment } = require('../services/emailService');

    console.log(`🔄 Starting email send for quotation: ${id}`, departmentId ? `to department: ${departmentId}` : 'to all departments');

    // Get quotation with full details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            departments: {
              include: {
                department: {
                  select: {
                    id: true,
                    name: true,
                    contactPerson: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true
                  }
                }
              }
            }
          }
        },
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

    // Get company settings from database
    const companyData = await settingsService.getCompanySettings();

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfResult = await generateQuotationPDF(
      quotation,
      quotation.client,
      quotation.user
    );

    if (!pdfResult || !pdfResult.pdf) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    console.log('✅ PDF generated successfully');

    // Get target departments based on department selection
    let targetDepartments = [];
    
    if (departmentId) {
      // Send to specific department
      console.log(`📧 Sending to department: ${departmentId}`);
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: {
          id: true,
          name: true,
          email: true,
          contactPerson: true
        }
      });
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
      
      if (department.email && department.email.trim() !== '') {
        targetDepartments = [department];
        console.log(`📧 Found department: ${department.name} (${department.email})`);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Department has no email address configured'
        });
      }
    } else {
      // Send to all departments that the client belongs to
      console.log('📧 Sending to all client departments');
      const clientDepartments = quotation.client.departments || [];
      
      targetDepartments = clientDepartments
        .map(cd => cd.department)
        .filter(dept => dept.email && dept.email.trim() !== '');
      
      console.log(`📧 Found ${targetDepartments.length} departments for client`);
    }

    if (targetDepartments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No departments with email addresses found to send email to'
      });
    }

    // Send emails to all target departments using the email service
    console.log(`📧 Sending emails to ${targetDepartments.length} departments...`);
    const emailResults = await sendQuotationEmailToDepartment(quotation, targetDepartments, pdfResult.pdf);

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

    console.log('✅ Quotation status updated');

    const successCount = emailResults.totalSent;
    const failureCount = emailResults.totalFailed;
    
    res.json({
      success: true,
      message: `Quotation email sent to ${successCount} clients${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      data: {
        totalSent: successCount,
        totalFailed: failureCount,
        successfulEmails: emailResults.successfulEmails,
        failedEmails: emailResults.failedEmails,
        departmentId: departmentId || null
      }
    });

  } catch (error) {
    console.error('❌ Error sending quotation email:', error);
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