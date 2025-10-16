// const express = require('express');
// const { body } = require('express-validator');
// const {
//   getClients,
//   getClientById,
//   createClient,
//   updateClient,
//   deleteClient,
//   toggleClientStatus,
//   getClientStatistics,
//   getClientsDropdown,
//   updateClientCustomFields
// } = require('../controllers/clientController');

// const { authenticateToken } = require('../middleware/auth');
// const { requirePermission } = require('../middleware/permissions');
// const { 
//   validateClient, 
//   validatePagination, 
//   validateUUIDParam,
//   handleValidationErrors 
// } = require('../middleware/validation');
// const { PERMISSIONS } = require('../config/constants');

// const router = express.Router();

// // All client routes require authentication
// router.use(authenticateToken);

// /**
//  * @route   GET /api/clients
//  * @desc    Get all clients with pagination and filtering
//  * @access  Private (Users can read clients)
//  * @query   page, limit, sortBy, sortOrder, search, isActive, city, country
//  */
// router.get('/', [
//   requirePermission(PERMISSIONS.CLIENTS.READ),
//   validatePagination
// ], getClients);

// /**
//  * @route   GET /api/clients/dropdown
//  * @desc    Get clients for dropdown (simplified data)
//  * @access  Private (Users can read clients)
//  * @query   search
//  */
// router.get('/dropdown', [
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], getClientsDropdown);

// /**
//  * @route   GET /api/clients/:id
//  * @desc    Get client by ID with detailed information
//  * @access  Private (Users can read clients)
//  */
// router.get('/:id', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], getClientById);

// /**
//  * @route   GET /api/clients/:id/statistics
//  * @desc    Get client statistics (quotations, invoices, monthly data)
//  * @access  Private (Users can read client stats)
//  */
// router.get('/:id/statistics', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], getClientStatistics);

// /**
//  * @route   POST /api/clients
//  * @desc    Create new client
//  * @access  Private (Manager+)
//  * @body    { companyName, contactPerson, email, phone?, address?, city?, state?, zipCode?, country?, taxId?, customFields? }
//  */
// router.post('/', [
//   requirePermission(PERMISSIONS.CLIENTS.CREATE),
//   validateClient.create
// ], createClient);

// /**
//  * @route   PUT /api/clients/:id
//  * @desc    Update client
//  * @access  Private (Manager+)
//  */
// router.put('/:id', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.UPDATE),
//   validateClient.update
// ], updateClient);

// /**
//  * @route   PATCH /api/clients/:id/status
//  * @desc    Activate/Deactivate client
//  * @access  Private (Manager+)
//  * @body    { isActive: boolean }
//  */
// router.patch('/:id/status', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.UPDATE),
//   body('isActive')
//     .isBoolean()
//     .withMessage('isActive must be true or false'),
//   handleValidationErrors
// ], toggleClientStatus);

// /**
//  * @route   PATCH /api/clients/:id/custom-fields
//  * @desc    Update client custom fields (for dynamic forms)
//  * @access  Private (Manager+)
//  * @body    { customFields: object }
//  */
// router.patch('/:id/custom-fields', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.UPDATE),
//   body('customFields')
//     .optional()
//     .isObject()
//     .withMessage('Custom fields must be a valid object'),
//   handleValidationErrors
// ], updateClientCustomFields);

// /**
//  * @route   DELETE /api/clients/:id
//  * @desc    Delete client (soft delete - deactivate)
//  * @access  Private (Admin+)
//  */
// router.delete('/:id', [
//   validateUUIDParam('id'),
//   requirePermission(PERMISSIONS.CLIENTS.DELETE)
// ], deleteClient);

// // Additional utility routes

// /**
//  * @route   POST /api/clients/bulk-action
//  * @desc    Perform bulk actions on clients (activate, deactivate, delete)
//  * @access  Private (Admin+)
//  * @body    { clientIds: string[], action: 'activate' | 'deactivate' | 'delete' }
//  */
// router.post('/bulk-action', [
//   requirePermission(PERMISSIONS.CLIENTS.DELETE), // Highest permission for bulk actions
//   body('clientIds')
//     .isArray({ min: 1 })
//     .withMessage('At least one client ID is required'),
//   body('clientIds.*')
//     .isUUID()
//     .withMessage('Invalid client ID format'),
//   body('action')
//     .isIn(['activate', 'deactivate', 'delete'])
//     .withMessage('Invalid action. Must be activate, deactivate, or delete'),
//   handleValidationErrors
// ], async (req, res, next) => {
//   try {
//     const { clientIds, action } = req.body;
//     const { prisma } = require('../config/database');
//     const { STATUS_CODES, MESSAGES } = require('../config/constants');

//     let updateData = {};
//     let actionMessage = '';

//     switch (action) {
//       case 'activate':
//         updateData = { isActive: true };
//         actionMessage = 'activated';
//         break;
//       case 'deactivate':
//         updateData = { isActive: false };
//         actionMessage = 'deactivated';
//         break;
//       case 'delete':
//         updateData = { isActive: false }; // Soft delete
//         actionMessage = 'deleted';
//         break;
//     }

//     const result = await prisma.client.updateMany({
//       where: {
//         id: { in: clientIds }
//       },
//       data: {
//         ...updateData,
//         updatedAt: new Date()
//       }
//     });

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `${result.count} clients ${actionMessage} successfully`,
//       data: { affectedCount: result.count }
//     });

//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * @route   GET /api/clients/export/csv
//  * @desc    Export clients data as CSV
//  * @access  Private (Manager+)
//  */
// router.get('/export/csv', [
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], async (req, res, next) => {
//   try {
//     const { prisma } = require('../config/database');
    
//     const clients = await prisma.client.findMany({
//       select: {
//         companyName: true,
//         contactPerson: true,
//         email: true,
//         phone: true,
//         address: true,
//         city: true,
//         state: true,
//         zipCode: true,
//         country: true,
//         taxId: true,
//         isActive: true,
//         createdAt: true,
//         _count: {
//           select: {
//             quotations: true,
//             invoices: true
//           }
//         }
//       },
//       orderBy: { companyName: 'asc' }
//     });

//     // Convert to CSV format
//     const csvData = clients.map(client => ({
//       'Company Name': client.companyName,
//       'Contact Person': client.contactPerson,
//       'Email': client.email,
//       'Phone': client.phone || '',
//       'Address': client.address || '',
//       'City': client.city || '',
//       'State': client.state || '',
//       'ZIP Code': client.zipCode || '',
//       'Country': client.country || '',
//       'Tax ID': client.taxId || '',
//       'Status': client.isActive ? 'Active' : 'Inactive',
//       'Total Quotations': client._count.quotations,
//       'Total Invoices': client._count.invoices,
//       'Created Date': client.createdAt.toISOString().split('T')[0]
//     }));

//     // Set CSV headers
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');

//     // Simple CSV generation
//     const headers = Object.keys(csvData[0] || {});
//     const csvContent = [
//       headers.join(','),
//       ...csvData.map(row => 
//         headers.map(header => 
//           `"${(row[header] || '').toString().replace(/"/g, '""')}"`)
//         .join(',')
//       )
//     ].join('\n');

//     res.send(csvContent);

//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * @route   POST /api/clients/import/csv
//  * @desc    Import clients from CSV file
//  * @access  Private (Admin+)
//  */
// router.post('/import/csv', [
//   requirePermission(PERMISSIONS.CLIENTS.CREATE)
// ], async (req, res, next) => {
//   // TODO: Implement CSV import functionality with file upload
//   res.json({
//     success: false,
//     message: 'CSV import functionality will be implemented with file upload middleware'
//   });
// });

// /**
//  * @route   GET /api/clients/analytics/summary
//  * @desc    Get clients analytics summary
//  * @access  Private (Manager+)
//  */
// router.get('/analytics/summary', [
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], async (req, res, next) => {
//   try {
//     const { prisma } = require('../config/database');
    
//     const [
//       totalClients,
//       activeClients,
//       clientsByCountry,
//       clientsWithQuotations,
//       recentlyAdded
//     ] = await Promise.all([
//       prisma.client.count(),
//       prisma.client.count({ where: { isActive: true } }),
//       prisma.client.groupBy({
//         by: ['country'],
//         _count: { country: true },
//         where: { 
//           country: { not: null },
//           isActive: true 
//         },
//         orderBy: { _count: { country: 'desc' } },
//         take: 10
//       }),
//       prisma.client.count({
//         where: {
//           quotations: { some: {} }
//         }
//       }),
//       prisma.client.count({
//         where: {
//           createdAt: {
//             gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
//           }
//         }
//       })
//     ]);

//     res.json({
//       success: true,
//       message: 'Client analytics fetched successfully',
//       data: {
//         totalClients,
//         activeClients,
//         inactiveClients: totalClients - activeClients,
//         clientsWithBusiness: clientsWithQuotations,
//         recentlyAdded,
//         topCountries: clientsByCountry
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = router;




const express = require('express');
const { body } = require('express-validator');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  getClientStatistics,
  getClientsDropdown,
  updateClientCustomFields,
  bulkUpdateCustomFields,
  getClientFormTemplate,
  duplicateClient
} = require('../controllers/clientController');

const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { 
  validateClient, 
  validatePagination, 
  validateUUIDParam,
  handleValidationErrors 
} = require('../middleware/validation');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

// All client routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination and filtering
 * @access  Private (Users can read clients)
 * @query   page, limit, sortBy, sortOrder, search, isActive, city, country
 */
router.get('/', [
  requirePermission(PERMISSIONS.CLIENTS.READ),
  validatePagination
], getClients);

/**
 * @route   GET /api/clients/dropdown
 * @desc    Get clients for dropdown (simplified data)
 * @access  Private (Users can read clients)
 * @query   search
 */
router.get('/dropdown', [
  requirePermission(PERMISSIONS.CLIENTS.READ)
], getClientsDropdown);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID with detailed information
 * @access  Private (Users can read clients)
 */
router.get('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.READ)
], getClientById);

/**
 * @route   GET /api/clients/:id/statistics
 * @desc    Get client statistics (quotations, invoices, monthly data)
 * @access  Private (Users can read client stats)
 */
router.get('/:id/statistics', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.READ)
], getClientStatistics);

/**
 * @route   GET /api/clients/:id/form-template
 * @desc    Get client form template for dynamic fields
 * @access  Private (Users can read clients)
 */
router.get('/:id/form-template', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.READ)
], getClientFormTemplate);

/**
 * @route   POST /api/clients
 * @desc    Create new client with dynamic fields support
 * @access  Private (Manager+)
 * @body    { companyName, contactPerson, email, phone?, address?, city?, state?, zipCode?, country?, taxId?, customFields? }
 */
router.post('/', [
  requirePermission(PERMISSIONS.CLIENTS.CREATE),
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name is required and must be less than 255 characters'),
  body('contactPerson')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Contact person is required and must be less than 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax ID must be less than 50 characters'),
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be a valid object'),
  handleValidationErrors
], createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client with dynamic fields support
 * @access  Private (Manager+)
 */
router.put('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.UPDATE),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name must be less than 255 characters'),
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Contact person must be less than 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax ID must be less than 50 characters'),
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be a valid object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),
  handleValidationErrors
], updateClient);

/**
 * @route   POST /api/clients/:id/duplicate
 * @desc    Duplicate client with custom fields
 * @access  Private (Manager+)
 * @body    { newCompanyName, newEmail }
 */
router.post('/:id/duplicate', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.CREATE),
  body('newCompanyName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('New company name is required and must be less than 255 characters'),
  body('newEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('New valid email is required'),
  handleValidationErrors
], duplicateClient);

/**
 * @route   PATCH /api/clients/:id/status
 * @desc    Activate/Deactivate client
 * @access  Private (Manager+)
 * @body    { isActive: boolean }
 */
router.patch('/:id/status', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.UPDATE),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be true or false'),
  handleValidationErrors
], toggleClientStatus);

/**
 * @route   PATCH /api/clients/:id/custom-fields
 * @desc    Update client custom fields (for dynamic forms)
 * @access  Private (Manager+)
 * @body    { customFields: object }
 */
router.patch('/:id/custom-fields', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.UPDATE),
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be a valid object'),
  handleValidationErrors
], updateClientCustomFields);

/**
 * @route   PATCH /api/clients/bulk/custom-fields
 * @desc    Bulk update custom fields for multiple clients
 * @access  Private (Manager+)
 * @body    { clientIds: string[], customFields: object }
 */
router.patch('/bulk/custom-fields', [
  requirePermission(PERMISSIONS.CLIENTS.UPDATE),
  body('clientIds')
    .isArray({ min: 1 })
    .withMessage('At least one client ID is required'),
  body('clientIds.*')
    .isUUID()
    .withMessage('Invalid client ID format'),
  body('customFields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be a valid object'),
  handleValidationErrors
], bulkUpdateCustomFields);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client (soft delete - deactivate)
 * @access  Private (Admin+)
 */
router.delete('/:id', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.CLIENTS.DELETE)
], deleteClient);

// Bulk Actions

/**
 * @route   POST /api/clients/bulk-action
 * @desc    Perform bulk actions on clients (activate, deactivate, delete)
 * @access  Private (Admin+)
 * @body    { clientIds: string[], action: 'activate' | 'deactivate' | 'delete' }
 */
router.post('/bulk-action', [
  requirePermission(PERMISSIONS.CLIENTS.DELETE), // Highest permission for bulk actions
  body('clientIds')
    .isArray({ min: 1 })
    .withMessage('At least one client ID is required'),
  body('clientIds.*')
    .isUUID()
    .withMessage('Invalid client ID format'),
  body('action')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Invalid action. Must be activate, deactivate, or delete'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { clientIds, action } = req.body;
    const { prisma } = require('../config/database');
    const { STATUS_CODES, MESSAGES } = require('../config/constants');

    let updateData = {};
    let actionMessage = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        actionMessage = 'activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        actionMessage = 'deactivated';
        break;
      case 'delete':
        updateData = { isActive: false }; // Soft delete
        actionMessage = 'deleted';
        break;
    }

    const result = await prisma.client.updateMany({
      where: {
        id: { in: clientIds }
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `${result.count} clients ${actionMessage} successfully`,
      data: { affectedCount: result.count }
    });

  } catch (error) {
    next(error);
  }
});

// Export and Import

/**
 * @route   GET /api/clients/export/csv
 * @desc    Export clients data as CSV with custom fields
 * @access  Private (Manager+)
 */
router.get('/export/csv', [
  requirePermission(PERMISSIONS.CLIENTS.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    
    const clients = await prisma.client.findMany({
      select: {
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        taxId: true,
        customFields: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            quotations: true,
            invoices: true
          }
        }
      },
      orderBy: { companyName: 'asc' }
    });

    // Convert to CSV format including custom fields
    const csvData = clients.map(client => {
      const baseData = {
        'Company Name': client.companyName,
        'Contact Person': client.contactPerson,
        'Email': client.email,
        'Phone': client.phone || '',
        'Address': client.address || '',
        'City': client.city || '',
        'State': client.state || '',
        'ZIP Code': client.zipCode || '',
        'Country': client.country || '',
        'Tax ID': client.taxId || '',
        'Status': client.isActive ? 'Active' : 'Inactive',
        'Total Quotations': client._count.quotations,
        'Total Invoices': client._count.invoices,
        'Created Date': client.createdAt.toISOString().split('T')[0]
      };

      // Add custom fields to CSV
      if (client.customFields && typeof client.customFields === 'object') {
        Object.entries(client.customFields).forEach(([key, value]) => {
          baseData[`Custom: ${key}`] = value || '';
        });
      }

      return baseData;
    });

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');

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
 * @route   POST /api/clients/import/csv
 * @desc    Import clients from CSV file with custom fields support
 * @access  Private (Admin+)
 */
router.post('/import/csv', [
  requirePermission(PERMISSIONS.CLIENTS.CREATE)
], async (req, res, next) => {
  // TODO: Implement CSV import functionality with file upload
  // This would parse CSV and create clients with custom fields
  res.json({
    success: false,
    message: 'CSV import functionality will be implemented with file upload middleware'
  });
});

// Analytics and Reporting

/**
 * @route   GET /api/clients/analytics/summary
 * @desc    Get clients analytics summary including custom field usage
 * @access  Private (Manager+)
 */
router.get('/analytics/summary', [
  requirePermission(PERMISSIONS.CLIENTS.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    
    const [
      totalClients,
      activeClients,
      clientsByCountry,
      clientsWithQuotations,
      recentlyAdded,
      clientsWithCustomFields
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.groupBy({
        by: ['country'],
        _count: { country: true },
        where: { 
          country: { not: null },
          isActive: true 
        },
        orderBy: { _count: { country: 'desc' } },
        take: 10
      }),
      prisma.client.count({
        where: {
          quotations: { some: {} }
        }
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.client.count({
        where: {
          customFields: { not: null }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Client analytics fetched successfully',
      data: {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        clientsWithBusiness: clientsWithQuotations,
        clientsWithCustomFields,
        recentlyAdded,
        topCountries: clientsByCountry
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/clients/check-email
 * @desc Check if email already exists for another client
 * @access Private (Users with client read permission)
 * @query {string} email - Email address to check
 */
// router.get('/check-email', [
//   requirePermission(PERMISSIONS.CLIENTS.READ)
// ], async (req, res, next) => {
//   try {
//     const { email } = req.query;

//     // Validate email parameter
//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email parameter is required'
//       });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid email format'
//       });
//     }

//     const { prisma } = require('../config/database');

//     // Check if email exists
//     const existingClient = await prisma.client.findUnique({
//       where: {
//         email: email.toLowerCase().trim()
//       },
//       select: {
//         id: true,
//         email: true,
//         companyName: true
//       }
//     });

//     if (existingClient) {
//       // Email exists - return 409 Conflict
//       return res.status(409).json({
//         success: false,
//         message: 'Email already exists',
//         data: {
//           exists: true,
//           clientId: existingClient.id,
//           companyName: existingClient.companyName
//         }
//       });
//     }

//     // Email is available
//     res.json({
//       success: true,
//       message: 'Email is available',
//       data: {
//         exists: false,
//         email: email
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// });

/**
 * @route   GET /api/clients/analytics/custom-fields
 * @desc    Get analytics on custom field usage
 * @access  Private (Manager+)
 */
router.get('/analytics/custom-fields', [
  requirePermission(PERMISSIONS.CLIENTS.READ)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    
    // Get all clients with custom fields
    const clientsWithFields = await prisma.client.findMany({
      where: {
        customFields: { not: null },
        isActive: true
      },
      select: {
        id: true,
        companyName: true,
        customFields: true
      }
    });

    // Analyze custom field usage
    const fieldUsage = {};
    const fieldValues = {};

    clientsWithFields.forEach(client => {
      if (client.customFields && typeof client.customFields === 'object') {
        Object.entries(client.customFields).forEach(([fieldName, fieldValue]) => {
          // Count field usage
          fieldUsage[fieldName] = (fieldUsage[fieldName] || 0) + 1;
          
          // Track field values for analytics
          if (!fieldValues[fieldName]) {
            fieldValues[fieldName] = [];
          }
          fieldValues[fieldName].push(fieldValue);
        });
      }
    });

    // Calculate field statistics
    const fieldStats = Object.entries(fieldUsage).map(([fieldName, count]) => ({
      fieldName,
      usageCount: count,
      usagePercentage: ((count / clientsWithFields.length) * 100).toFixed(1),
      uniqueValues: [...new Set(fieldValues[fieldName])].length,
      sampleValues: fieldValues[fieldName].slice(0, 5)
    })).sort((a, b) => b.usageCount - a.usageCount);

    res.json({
      success: true,
      message: 'Custom fields analytics fetched successfully',
      data: {
        totalClientsWithFields: clientsWithFields.length,
        totalUniqueFields: Object.keys(fieldUsage).length,
        fieldStatistics: fieldStats
      }
    });

  } catch (error) {
    next(error);
  }
});
// In your backend routes
// router.get('/check-email', async (req, res) => {
//   const { email } = req.query;
  
//   const existingClient = await prisma.client.findFirst({
//     where: { 
//       email: email.toLowerCase(),
//       isActive: true 
//     }
//   });
  
//   res.json({
//     success: true,
//     exists: !!existingClient
//   });
// });

// Backend route
// router.get('/check-email', async (req, res) => {
//   const { email } = req.query;
  
//   const existingClient = await prisma.client.findFirst({
//     where: { 
//       email: email.toLowerCase(),
//       isActive: true 
//     }
//   });
  
//   // Match your standard API response format
//   res.json({
//     success: true,
//     message: existingClient ? 'Email exists' : 'Email available',
//     data: {
//       exists: !!existingClient
//     }
//   });
// });

router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  
  // Use EXACT same logic as createClient
  const existingClient = await prisma.client.findUnique({
  where: { email: email.toLowerCase() }
});
  
  res.json({
    success: true,
    message: existingClient ? 'Email exists' : 'Email available',
    data: {
      exists: !!existingClient
    }
  });
});
module.exports = router;