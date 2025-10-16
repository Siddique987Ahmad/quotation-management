// const { prisma } = require('../config/database');
// const { AppError, asyncHandler } = require('../middleware/errorHandler');
// const { STATUS_CODES, MESSAGES, PAGINATION } = require('../config/constants');

// // Get all clients with pagination and filtering
// const getClients = asyncHandler(async (req, res) => {
//   const {
//     page = PAGINATION.DEFAULT_PAGE,
//     limit = PAGINATION.DEFAULT_LIMIT,
//     sortBy = 'createdAt',
//     sortOrder = 'desc',
//     search = '',
//     isActive = '',
//     city = '',
//     country = ''
//   } = req.query;

//   // Convert page and limit to numbers
//   const pageNum = parseInt(page);
//   const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
//   const skip = (pageNum - 1) * limitNum;

//   // Build where clause for filtering
//   const where = {};

//   // Search in companyName, contactPerson, or email
//   if (search) {
//     where.OR = [
//       { companyName: { contains: search, mode: 'insensitive' } },
//       { contactPerson: { contains: search, mode: 'insensitive' } },
//       { email: { contains: search, mode: 'insensitive' } }
//     ];
//   }

//   // Filter by active status
//   if (isActive !== '') {
//     where.isActive = isActive === 'true';
//   }

//   // Filter by city
//   if (city) {
//     where.city = { contains: city, mode: 'insensitive' };
//   }

//   // Filter by country
//   if (country) {
//     where.country = { contains: country, mode: 'insensitive' };
//   }

//   // Build orderBy clause
//   const orderBy = {};
//   orderBy[sortBy] = sortOrder;

//   // Get clients with pagination
//   const [clients, totalCount] = await Promise.all([
//     prisma.client.findMany({
//       where,
//       select: {
//         id: true,
//         companyName: true,
//         contactPerson: true,
//         email: true,
//         phone: true,
//         city: true,
//         state: true,
//         country: true,
//         isActive: true,
//         createdAt: true,
//         updatedAt: true,
//         _count: {
//           select: {
//             quotations: true,
//             invoices: true
//           }
//         }
//       },
//       orderBy,
//       skip,
//       take: limitNum
//     }),
//     prisma.client.count({ where })
//   ]);

//   // Calculate pagination info
//   const totalPages = Math.ceil(totalCount / limitNum);
//   const hasNextPage = pageNum < totalPages;
//   const hasPreviousPage = pageNum > 1;

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       clients: clients.map(client => ({
//         ...client,
//         statistics: {
//           totalQuotations: client._count.quotations,
//           totalInvoices: client._count.invoices
//         },
//         _count: undefined
//       })),
//       pagination: {
//         currentPage: pageNum,
//         totalPages,
//         totalCount,
//         limit: limitNum,
//         hasNextPage,
//         hasPreviousPage
//       }
//     }
//   });
// });

// // Get client by ID with detailed information
// const getClientById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const client = await prisma.client.findUnique({
//     where: { id },
//     include: {
//       quotations: {
//         select: {
//           id: true,
//           quotationNumber: true,
//           title: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true,
//           user: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 10
//       },
//       invoices: {
//         select: {
//           id: true,
//           invoiceNumber: true,
//           type: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true,
//           user: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 10
//       },
//       _count: {
//         select: {
//           quotations: true,
//           invoices: true
//         }
//       }
//     }
//   });

//   if (!client) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Calculate total values
//   const quotationTotals = await prisma.quotation.aggregate({
//     where: { clientId: id },
//     _sum: { totalAmount: true },
//     _count: { id: true }
//   });

//   const invoiceTotals = await prisma.invoice.aggregate({
//     where: { clientId: id },
//     _sum: { totalAmount: true },
//     _count: { id: true }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       client: {
//         ...client,
//         statistics: {
//           totalQuotations: client._count.quotations,
//           totalInvoices: client._count.invoices,
//           totalQuotationValue: quotationTotals._sum.totalAmount || 0,
//           totalInvoiceValue: invoiceTotals._sum.totalAmount || 0
//         },
//         _count: undefined
//       }
//     }
//   });
// });

// // Create new client
// const createClient = asyncHandler(async (req, res) => {
//   const {
//     companyName,
//     contactPerson,
//     email,
//     phone,
//     address,
//     city,
//     state,
//     zipCode,
//     country,
//     taxId,
//     customFields
//   } = req.body;

//   // Check if client with same email already exists
//   const existingClient = await prisma.client.findUnique({
//     where: { email }
//   });

//   if (existingClient) {
//     throw new AppError('Client with this email already exists', STATUS_CODES.CONFLICT);
//   }

//   // Create client
//   const newClient = await prisma.client.create({
//     data: {
//       companyName,
//       contactPerson,
//       email,
//       phone,
//       address,
//       city,
//       state,
//       zipCode,
//       country,
//       taxId,
//       customFields,
//       isActive: true
//     },
//     select: {
//       id: true,
//       companyName: true,
//       contactPerson: true,
//       email: true,
//       phone: true,
//       address: true,
//       city: true,
//       state: true,
//       zipCode: true,
//       country: true,
//       taxId: true,
//       customFields: true,
//       isActive: true,
//       createdAt: true
//     }
//   });

//   res.status(STATUS_CODES.CREATED).json({
//     success: true,
//     message: MESSAGES.SUCCESS.CREATED,
//     data: { client: newClient }
//   });
// });

// // Update client
// const updateClient = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     companyName,
//     contactPerson,
//     email,
//     phone,
//     address,
//     city,
//     state,
//     zipCode,
//     country,
//     taxId,
//     customFields,
//     isActive
//   } = req.body;

//   // Check if client exists
//   const existingClient = await prisma.client.findUnique({
//     where: { id }
//   });

//   if (!existingClient) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Check if email is already taken by another client
//   if (email && email !== existingClient.email) {
//     const emailTaken = await prisma.client.findFirst({
//       where: {
//         email,
//         NOT: { id }
//       }
//     });

//     if (emailTaken) {
//       throw new AppError('Email is already taken by another client', STATUS_CODES.CONFLICT);
//     }
//   }

//   // Update client
//   const updatedClient = await prisma.client.update({
//     where: { id },
//     data: {
//       ...(companyName && { companyName }),
//       ...(contactPerson && { contactPerson }),
//       ...(email && { email }),
//       ...(phone !== undefined && { phone }),
//       ...(address !== undefined && { address }),
//       ...(city !== undefined && { city }),
//       ...(state !== undefined && { state }),
//       ...(zipCode !== undefined && { zipCode }),
//       ...(country !== undefined && { country }),
//       ...(taxId !== undefined && { taxId }),
//       ...(customFields !== undefined && { customFields }),
//       ...(typeof isActive === 'boolean' && { isActive }),
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       companyName: true,
//       contactPerson: true,
//       email: true,
//       phone: true,
//       address: true,
//       city: true,
//       state: true,
//       zipCode: true,
//       country: true,
//       taxId: true,
//       customFields: true,
//       isActive: true,
//       createdAt: true,
//       updatedAt: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.UPDATED,
//     data: { client: updatedClient }
//   });
// });

// // Delete client (soft delete)
// const deleteClient = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   // Check if client exists
//   const existingClient = await prisma.client.findUnique({
//     where: { id },
//     select: { 
//       id: true, 
//       companyName: true,
//       _count: {
//         select: {
//           quotations: true,
//           invoices: true
//         }
//       }
//     }
//   });

//   if (!existingClient) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Check if client has associated quotations or invoices
//   if (existingClient._count.quotations > 0 || existingClient._count.invoices > 0) {
//     // Soft delete - deactivate client instead of permanent deletion
//     const deactivatedClient = await prisma.client.update({
//       where: { id },
//       data: {
//         isActive: false,
//         updatedAt: new Date()
//       },
//       select: {
//         id: true,
//         companyName: true,
//         isActive: true
//       }
//     });

//     return res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: 'Client deactivated successfully (has existing quotations/invoices)',
//       data: { client: deactivatedClient }
//     });
//   }

//   // If no associated records, we can perform soft delete
//   const deactivatedClient = await prisma.client.update({
//     where: { id },
//     data: {
//       isActive: false,
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       companyName: true,
//       isActive: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.DELETED,
//     data: { client: deactivatedClient }
//   });
// });

// // Toggle client status
// const toggleClientStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { isActive } = req.body;

//   // Check if client exists
//   const existingClient = await prisma.client.findUnique({
//     where: { id },
//     select: { id: true, companyName: true, isActive: true }
//   });

//   if (!existingClient) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Update client status
//   const updatedClient = await prisma.client.update({
//     where: { id },
//     data: {
//       isActive,
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       companyName: true,
//       contactPerson: true,
//       email: true,
//       isActive: true,
//       updatedAt: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: `Client ${isActive ? 'activated' : 'deactivated'} successfully`,
//     data: { client: updatedClient }
//   });
// });

// // Get client statistics
// const getClientStatistics = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const client = await prisma.client.findUnique({
//     where: { id },
//     select: { id: true, companyName: true }
//   });

//   if (!client) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Get detailed statistics
//   const [quotationStats, invoiceStats, monthlyData] = await Promise.all([
//     // Quotation statistics by status
//     prisma.quotation.groupBy({
//       by: ['status'],
//       where: { clientId: id },
//       _count: { status: true },
//       _sum: { totalAmount: true }
//     }),
    
//     // Invoice statistics by status
//     prisma.invoice.groupBy({
//       by: ['status'],
//       where: { clientId: id },
//       _count: { status: true },
//       _sum: { totalAmount: true }
//     }),
    
//     // Monthly activity (last 12 months)
//     prisma.$queryRaw`
//       SELECT 
//         DATE_TRUNC('month', "createdAt") as month,
//         COUNT(*) as quotation_count,
//         SUM("totalAmount") as total_amount
//       FROM quotations 
//       WHERE "clientId" = ${id} 
//         AND "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
//       GROUP BY DATE_TRUNC('month', "createdAt")
//       ORDER BY month DESC
//     `
//   ]);

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       clientName: client.companyName,
//       quotationStatistics: quotationStats,
//       invoiceStatistics: invoiceStats,
//       monthlyActivity: monthlyData
//     }
//   });
// });

// // Get clients for dropdown (simplified data)
// const getClientsDropdown = asyncHandler(async (req, res) => {
//   const { search = '' } = req.query;

//   const where = {
//     isActive: true
//   };

//   if (search) {
//     where.OR = [
//       { companyName: { contains: search, mode: 'insensitive' } },
//       { contactPerson: { contains: search, mode: 'insensitive' } }
//     ];
//   }

//   const clients = await prisma.client.findMany({
//     where,
//     select: {
//       id: true,
//       companyName: true,
//       contactPerson: true,
//       email: true,
//       customFields: true
//     },
//     orderBy: { companyName: 'asc' },
//     take: 50 // Limit for dropdown
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: { clients }
//   });
// });

// // Update client custom fields (for dynamic forms)
// const updateClientCustomFields = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { customFields } = req.body;

//   // Check if client exists
//   const existingClient = await prisma.client.findUnique({
//     where: { id },
//     select: { id: true, companyName: true }
//   });

//   if (!existingClient) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Update custom fields
//   const updatedClient = await prisma.client.update({
//     where: { id },
//     data: {
//       customFields,
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       companyName: true,
//       customFields: true,
//       updatedAt: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Client custom fields updated successfully',
//     data: { client: updatedClient }
//   });
// });

// module.exports = {
//   getClients,
//   getClientById,
//   createClient,
//   updateClient,
//   deleteClient,
//   toggleClientStatus,
//   getClientStatistics,
//   getClientsDropdown,
//   updateClientCustomFields
// };



const { prisma } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, MESSAGES, PAGINATION } = require('../config/constants');

// Helper function to validate dynamic fields structure
const validateDynamicFields = (customFields) => {
  if (!customFields || typeof customFields !== 'object') {
    return true; // Allow null/undefined
  }

  // Validate that customFields has the expected structure
  // Should be an object where keys are field names and values are field values
  for (const [key, value] of Object.entries(customFields)) {
    if (typeof key !== 'string' || key.trim() === '') {
      throw new AppError('Invalid custom field key format', STATUS_CODES.BAD_REQUEST);
    }
  }

  return true;
};

// Get all clients with pagination and filtering
const getClients = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    isActive = '',
    city = '',
    country = ''
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const where = {};

  // Search in companyName, contactPerson, or email
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filter by active status
  if (isActive !== '') {
    where.isActive = isActive === 'true';
  }

  // Filter by city
  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  // Filter by country
  if (country) {
    where.country = { contains: country, mode: 'insensitive' };
  }

  // Build orderBy clause
  const orderBy = {};
  orderBy[sortBy] = sortOrder;

  // Get clients with pagination
  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      select: {
        id: true,
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
        updatedAt: true,
        _count: {
          select: {
            quotations: true,
            invoices: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    }),
    prisma.client.count({ where })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      clients: clients.map(client => ({
        ...client,
        statistics: {
          totalQuotations: client._count.quotations,
          totalInvoices: client._count.invoices
        },
        _count: undefined
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPreviousPage
      }
    }
  });
});

// Get client by ID with detailed information
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotations: {
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
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
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
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          quotations: true,
          invoices: true
        }
      }
    }
  });

  if (!client) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Calculate total values
  const quotationTotals = await prisma.quotation.aggregate({
    where: { clientId: id },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const invoiceTotals = await prisma.invoice.aggregate({
    where: { clientId: id },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      client: {
        ...client,
        statistics: {
          totalQuotations: client._count.quotations,
          totalInvoices: client._count.invoices,
          totalQuotationValue: quotationTotals._sum.totalAmount || 0,
          totalInvoiceValue: invoiceTotals._sum.totalAmount || 0
        },
        _count: undefined
      }
    }
  });
});

// Create new client with dynamic fields
const createClient = asyncHandler(async (req, res) => {
  const {
    companyName,
    contactPerson,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    taxId,
    customFields
  } = req.body;

  // Validate custom fields if provided
  if (customFields) {
    validateDynamicFields(customFields);
  }

  // Check if client with same email already exists
  // const existingClient = await prisma.client.findUnique({
  //   where: { email }
  // });

  const existingClient = await prisma.client.findUnique({
  where: { email: email.toLowerCase() }
});
  

  if (existingClient) {
    throw new AppError('Client with this email already exists', STATUS_CODES.CONFLICT);
  }

  // Create client
  const newClient = await prisma.client.create({
    data: {
      companyName,
      contactPerson,
      // email,
      email: email.toLowerCase(),
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      taxId,
      customFields,
      isActive: true
    },
    select: {
      id: true,
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
      createdAt: true
    }
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.SUCCESS.CREATED,
    data: { client: newClient }
  });
});

// Update client with dynamic fields support
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    contactPerson,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    taxId,
    customFields,
    isActive
  } = req.body;

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id }
  });

  if (!existingClient) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Validate custom fields if provided
  if (customFields !== undefined) {
    validateDynamicFields(customFields);
  }

  // Check if email is already taken by another client
  if (email && email !== existingClient.email) {
    const emailTaken = await prisma.client.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });

    if (emailTaken) {
      throw new AppError('Email is already taken by another client', STATUS_CODES.CONFLICT);
    }
  }

  // Update client
  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      ...(companyName && { companyName }),
      ...(contactPerson && { contactPerson }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(country !== undefined && { country }),
      ...(taxId !== undefined && { taxId }),
      ...(customFields !== undefined && { customFields }),
      ...(typeof isActive === 'boolean' && { isActive }),
      updatedAt: new Date()
    },
    select: {
      id: true,
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
      updatedAt: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.UPDATED,
    data: { client: updatedClient }
  });
});

// Delete client (soft delete)
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: { 
      id: true, 
      companyName: true,
      _count: {
        select: {
          quotations: true,
          invoices: true
        }
      }
    }
  });

  if (!existingClient) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Check if client has associated quotations or invoices
  if (existingClient._count.quotations > 0 || existingClient._count.invoices > 0) {
    // Soft delete - deactivate client instead of permanent deletion
    const deactivatedClient = await prisma.client.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        companyName: true,
        isActive: true
      }
    });

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Client deactivated successfully (has existing quotations/invoices)',
      data: { client: deactivatedClient }
    });
  }

  // If no associated records, we can perform soft delete
  const deactivatedClient = await prisma.client.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date()
    },
    select: {
      id: true,
      companyName: true,
      isActive: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.DELETED,
    data: { client: deactivatedClient }
  });
});

// Toggle client status
const toggleClientStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: { id: true, companyName: true, isActive: true }
  });

  if (!existingClient) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Update client status
  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      isActive,
      updatedAt: new Date()
    },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      isActive: true,
      updatedAt: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Client ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { client: updatedClient }
  });
});

// Get client statistics
const getClientStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: { id: true, companyName: true }
  });

  if (!client) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Get detailed statistics
  const [quotationStats, invoiceStats, monthlyData] = await Promise.all([
    // Quotation statistics by status
    prisma.quotation.groupBy({
      by: ['status'],
      where: { clientId: id },
      _count: { status: true },
      _sum: { totalAmount: true }
    }),
    
    // Invoice statistics by status
    prisma.invoice.groupBy({
      by: ['status'],
      where: { clientId: id },
      _count: { status: true },
      _sum: { totalAmount: true }
    }),
    
    // Monthly activity (last 12 months)
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as quotation_count,
        SUM("totalAmount") as total_amount
      FROM quotations 
      WHERE "clientId" = ${id} 
        AND "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `
  ]);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      clientName: client.companyName,
      quotationStatistics: quotationStats,
      invoiceStatistics: invoiceStats,
      monthlyActivity: monthlyData
    }
  });
});

// Get clients for dropdown (simplified data)
const getClientsDropdown = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;

  const where = {
    isActive: true
  };

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } }
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      customFields: true
    },
    orderBy: { companyName: 'asc' },
    take: 50 // Limit for dropdown
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: { clients }
  });
});

// Update client custom fields (for dynamic forms)
const updateClientCustomFields = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customFields } = req.body;

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: { id: true, companyName: true, customFields: true }
  });

  if (!existingClient) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Validate custom fields
  if (customFields !== undefined) {
    validateDynamicFields(customFields);
  }

  // Update custom fields
  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      customFields,
      updatedAt: new Date()
    },
    select: {
      id: true,
      companyName: true,
      customFields: true,
      updatedAt: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Client custom fields updated successfully',
    data: { client: updatedClient }
  });
});

// Bulk update custom fields for multiple clients
const bulkUpdateCustomFields = asyncHandler(async (req, res) => {
  const { clientIds, customFields } = req.body;

  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    throw new AppError('Client IDs array is required', STATUS_CODES.BAD_REQUEST);
  }

  // Validate custom fields
  if (customFields) {
    validateDynamicFields(customFields);
  }

  // Update multiple clients
  const result = await prisma.client.updateMany({
    where: {
      id: { in: clientIds },
      isActive: true
    },
    data: {
      customFields,
      updatedAt: new Date()
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Custom fields updated for ${result.count} clients`,
    data: { affectedCount: result.count }
  });
});

// Get client form template (for dynamic field configuration)
const getClientFormTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      customFields: true
    }
  });

  if (!client) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Extract field definitions from customFields
  // This assumes customFields contains both field definitions and values
  const formTemplate = {
    clientId: client.id,
    clientName: client.companyName,
    fields: client.customFields || {},
    fieldCount: client.customFields ? Object.keys(client.customFields).length : 0
  };

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Client form template fetched successfully',
    data: { template: formTemplate }
  });
});

// Duplicate client with custom fields
const duplicateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newCompanyName, newEmail } = req.body;

  if (!newCompanyName || !newEmail) {
    throw new AppError('New company name and email are required', STATUS_CODES.BAD_REQUEST);
  }

  // Check if original client exists
  const originalClient = await prisma.client.findUnique({
    where: { id }
  });

  if (!originalClient) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Check if new email is available
  const existingEmail = await prisma.client.findUnique({
    where: { email: newEmail }
  });

  if (existingEmail) {
    throw new AppError('Email already exists', STATUS_CODES.CONFLICT);
  }

  // Create duplicate client
  const duplicatedClient = await prisma.client.create({
    data: {
      companyName: newCompanyName,
      contactPerson: originalClient.contactPerson,
      email: newEmail,
      phone: originalClient.phone,
      address: originalClient.address,
      city: originalClient.city,
      state: originalClient.state,
      zipCode: originalClient.zipCode,
      country: originalClient.country,
      taxId: originalClient.taxId,
      customFields: originalClient.customFields, // Copy custom fields
      isActive: true
    },
    select: {
      id: true,
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
      createdAt: true
    }
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Client duplicated successfully',
    data: { client: duplicatedClient }
  });
});

module.exports = {
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
};