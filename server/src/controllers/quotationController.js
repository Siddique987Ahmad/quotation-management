const { prisma } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, MESSAGES, PAGINATION, QUOTATION_STATUS, ROLES, INVOICE_TYPES } = require('../config/constants');
const { buildUserFilteredWhere, canAccessRecord } = require('../middleware/userFiltering'); // NEW
const { sendQuotationApprovedEmail } = require('../services/emailService');
const { autoGenerateInvoiceForQuotation } = require('./invoiceController');
const { hasPermission } = require('../middleware/permissions');
const { notifyQuotationCreated, notifyQuotationStatusChange } = require('../services/notificationService');
const { InvoiceStatus } = require('@prisma/client');

// Generate unique quotation number
// const generateQuotationNumber = async () => {
//   const year = new Date().getFullYear();
//   const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
//   // Count quotations in current month
//   const startOfMonth = new Date(year, new Date().getMonth(), 1);
//   const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
  
//   const count = await prisma.quotation.count({
//     where: {
//       createdAt: {
//         gte: startOfMonth,
//         lte: endOfMonth
//       }
//     }
//   });

//   const sequence = String(count + 1).padStart(4, '0');
//   return `QUO-${year}${month}-${sequence}`;
// };

const generateQuotationNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Count quotations created today
  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const todayCount = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });
  
  const sequence = String(todayCount + 1).padStart(3, '0');
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
  
  return `QUO-${year}${month}-${sequence}${timestamp}`;
};

// Get all quotations with pagination and filtering
const getQuotations = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    status = '',
    clientId = '',
    startDate = '',
    endDate = ''
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  let where = {};

  // Search in quotation number, title, or client company name
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { 
        client: { 
          companyName: { contains: search, mode: 'insensitive' }
        }
      }
    ];
  }

  // Filter by status
  if (status && Object.values(QUOTATION_STATUS).includes(status)) {
    where.status = status;
  }

  // Filter by client
  if (clientId) {
    where.clientId = clientId;
  }

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // CRITICAL FIX: Apply user filtering
  where = buildUserFilteredWhere(req, where);

  // Build orderBy clause
  const orderBy = {};
  if (sortBy === 'client') {
    orderBy.client = { companyName: sortOrder };
  } else if (sortBy === 'user') {
    orderBy.user = { firstName: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  // Get quotations with pagination
  const [quotations, totalCount] = await Promise.all([
    prisma.quotation.findMany({
      where,
      select: {
        id: true,
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
        updatedAt: true,
        userId: true, // NEW: Include userId for access checks
        client: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    }),
    prisma.quotation.count({ where })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      quotations,
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

// Get quotation by ID with detailed information
const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: {
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
          customFields: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!quotation) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // CRITICAL FIX: Check if user can access this specific quotation
  // const canAccess = await canAccessRecord(req, quotation.userId);
  // if (!canAccess) {
  //   throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  // }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: { quotation }
  });
});

// Create new quotation
// const createQuotation = asyncHandler(async (req, res) => {
//   const {
//     title,
//     description,
//     clientId,
//     subtotal,
//     taxPercentage = 0,
//     validUntil,
//     notes,
//     formData = {}
//   } = req.body;

//   // Verify client exists and is active, and user has access to it
//   let clientWhere = { id: clientId, isActive: true };
//   clientWhere = buildUserFilteredWhere(req, clientWhere);

//   const client = await prisma.client.findFirst({
//     where: clientWhere,
//     select: { id: true, companyName: true, isActive: true }
//   });

//   if (!client) {
//     throw new AppError('Client not found or you do not have access to this client', STATUS_CODES.NOT_FOUND);
//   }

//   // Calculate tax amount and total
//   const subtotalAmount = parseFloat(subtotal);
//   const taxRate = parseFloat(taxPercentage);
//   const taxAmount = (subtotalAmount * taxRate) / 100;
//   const totalAmount = subtotalAmount + taxAmount;

//   // Generate quotation number
//   const quotationNumber = await generateQuotationNumber();

//   // Create quotation with userId
//   const newQuotation = await prisma.quotation.create({
//     data: {
//       quotationNumber,
//       title,
//       description,
//       clientId,
//       userId: req.user.id, // Associate quotation with current user
//       status: QUOTATION_STATUS.DRAFT,
//       formData,
//       subtotal: subtotalAmount,
//       taxPercentage: taxRate,
//       taxAmount,
//       totalAmount,
//       validUntil: validUntil ? new Date(validUntil) : null,
//       notes
//     },
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   // Send notification AFTER quotation creation but BEFORE response
//   try {
//     await notifyQuotationCreated(newQuotation, client, req.user);
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }

//   res.status(STATUS_CODES.CREATED).json({
//     success: true,
//     message: MESSAGES.SUCCESS.CREATED,
//     data: { quotation: newQuotation }
//   });
// });

// // Update quotation
// const updateQuotation = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     title,
//     description,
//     subtotal,
//     taxPercentage,
//     validUntil,
//     notes,
//     formData
//   } = req.body;

//   // Check if quotation exists
//   const existingQuotation = await prisma.quotation.findUnique({
//     where: { id },
//     select: { id: true, status: true, userId: true }
//   });

//   if (!existingQuotation) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // CRITICAL FIX: Check if user can access this quotation
//   const canAccess = await canAccessRecord(req, existingQuotation.userId);
//   if (!canAccess) {
//     throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
//   }

//   // Check if quotation can be updated
//   if (existingQuotation.status === QUOTATION_STATUS.APPROVED) {
//     throw new AppError('Cannot update approved quotation', STATUS_CODES.BAD_REQUEST);
//   }

//   // Prepare update data
//   const updateData = {
//     updatedAt: new Date()
//   };

//   if (title !== undefined) updateData.title = title;
//   if (description !== undefined) updateData.description = description;
//   if (notes !== undefined) updateData.notes = notes;
//   if (formData !== undefined) updateData.formData = formData;
//   if (validUntil !== undefined) {
//     updateData.validUntil = validUntil ? new Date(validUntil) : null;
//   }

//   // Recalculate amounts if subtotal or tax percentage changed
//   if (subtotal !== undefined || taxPercentage !== undefined) {
//     const currentQuotation = await prisma.quotation.findUnique({
//       where: { id },
//       select: { subtotal: true, taxPercentage: true }
//     });

//     const newSubtotal = subtotal !== undefined ? parseFloat(subtotal) : parseFloat(currentQuotation.subtotal);
//     const newTaxPercentage = taxPercentage !== undefined ? parseFloat(taxPercentage) : parseFloat(currentQuotation.taxPercentage);
//     const newTaxAmount = (newSubtotal * newTaxPercentage) / 100;
//     const newTotalAmount = newSubtotal + newTaxAmount;

//     updateData.subtotal = newSubtotal;
//     updateData.taxPercentage = newTaxPercentage;
//     updateData.taxAmount = newTaxAmount;
//     updateData.totalAmount = newTotalAmount;
//   }

//   // Update quotation
//   const updatedQuotation = await prisma.quotation.update({
//     where: { id },
//     data: updateData,
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.UPDATED,
//     data: { quotation: updatedQuotation }
//   });
// });

// UPDATE: Replace your createQuotation function in quotationController.js

const createQuotation = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    clientId,
    subtotal,
    // NEW: Individual tax fields from frontend
    gstPercentage = 0,
    gstAmount = 0,
    pstPercentage = 0,
    pstAmount = 0,
    combinedTaxAmount = 0,
    // LEGACY: Keep for backward compatibility
    taxPercentage = 0,
    taxAmount = 0,
    validUntil,
    notes,
    formData = {}
  } = req.body;

  console.log('Received quotation data:', {
    title,
    subtotal,
    gstPercentage,
    gstAmount,
    pstPercentage,
    pstAmount,
    combinedTaxAmount,
    taxPercentage,
    taxAmount
  });

  // Verify client exists and is active, and user has access to it
  let clientWhere = { id: clientId, isActive: true };
  clientWhere = buildUserFilteredWhere(req, clientWhere);

  const client = await prisma.client.findFirst({
    where: clientWhere,
    select: { id: true, companyName: true, isActive: true }
  });

  if (!client) {
    throw new AppError('Client not found or you do not have access to this client', STATUS_CODES.NOT_FOUND);
  }

  // Parse and calculate tax amounts
  const subtotalAmount = parseFloat(subtotal);
  const finalGstPercentage = parseFloat(gstPercentage) || 0;
  const finalPstPercentage = parseFloat(pstPercentage) || 0;
  
  // Use provided amounts or calculate from percentages
  const finalGstAmount = parseFloat(gstAmount) || (subtotalAmount * finalGstPercentage) / 100;
  const finalPstAmount = parseFloat(pstAmount) || (subtotalAmount * finalPstPercentage) / 100;
  const finalCombinedTaxAmount = parseFloat(combinedTaxAmount) || (finalGstAmount + finalPstAmount);
  
  // Calculate legacy fields for backward compatibility
  const finalTaxAmount = parseFloat(taxAmount) || finalCombinedTaxAmount;
  const finalTaxPercentage = parseFloat(taxPercentage) || (subtotalAmount > 0 ? (finalCombinedTaxAmount / subtotalAmount) * 100 : 0);
  
  // Calculate total amount
  const totalAmount = subtotalAmount + finalCombinedTaxAmount;

  console.log('Calculated tax amounts:', {
    finalGstPercentage,
    finalGstAmount,
    finalPstPercentage,
    finalPstAmount,
    finalCombinedTaxAmount,
    finalTaxPercentage,
    finalTaxAmount,
    totalAmount
  });

  // Generate quotation number
  const quotationNumber = await generateQuotationNumber();

  // Create quotation with ALL tax fields
  const newQuotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      title,
      description,
      clientId,
      userId: req.user.id,
      status: QUOTATION_STATUS.DRAFT,
      formData,
      subtotal: subtotalAmount,
      
      // NEW: Save individual GST/PST fields
      gstPercentage: finalGstPercentage,
      gstAmount: finalGstAmount,
      pstPercentage: finalPstPercentage,
      pstAmount: finalPstAmount,
      combinedTaxAmount: finalCombinedTaxAmount,
      
      // LEGACY: Keep for backward compatibility
      taxPercentage: finalTaxPercentage,
      taxAmount: finalTaxAmount,
      
      totalAmount: totalAmount,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes
    },
    include: {
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
    }
  });

  console.log('Created quotation with ID:', newQuotation.id);

  // Send notification AFTER quotation creation but BEFORE response
  try {
    await notifyQuotationCreated(newQuotation, client, req.user);
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.SUCCESS.CREATED,
    data: { quotation: newQuotation }
  });
});

// UPDATE: Replace your updateQuotation function as well

const updateQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    subtotal,
    // NEW: Individual tax fields
    gstPercentage,
    gstAmount,
    pstPercentage,
    pstAmount,
    combinedTaxAmount,
    // LEGACY: Keep for backward compatibility
    taxPercentage,
    taxAmount,
    validUntil,
    notes,
    formData
  } = req.body;

  console.log('Updating quotation with tax data:', {
    gstPercentage,
    gstAmount,
    pstPercentage,
    pstAmount,
    combinedTaxAmount
  });

  // Check if quotation exists and user has access
  const existingQuotation = await prisma.quotation.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true, subtotal: true }
  });

  if (!existingQuotation) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  const canAccess = await canAccessRecord(req, existingQuotation.userId);
  if (!canAccess) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  if (existingQuotation.status === QUOTATION_STATUS.APPROVED) {
    throw new AppError('Cannot update approved quotation', STATUS_CODES.BAD_REQUEST);
  }

  // Prepare update data
  const updateData = {
    updatedAt: new Date()
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (notes !== undefined) updateData.notes = notes;
  if (formData !== undefined) updateData.formData = formData;
  if (validUntil !== undefined) {
    updateData.validUntil = validUntil ? new Date(validUntil) : null;
  }

  // Handle tax calculations if any tax-related field is provided
  if (subtotal !== undefined || gstPercentage !== undefined || pstPercentage !== undefined || 
      gstAmount !== undefined || pstAmount !== undefined || combinedTaxAmount !== undefined ||
      taxPercentage !== undefined || taxAmount !== undefined) {
    
    const currentSubtotal = subtotal !== undefined ? parseFloat(subtotal) : parseFloat(existingQuotation.subtotal);
    
    // Calculate new tax amounts
    const finalGstPercentage = gstPercentage !== undefined ? parseFloat(gstPercentage) : 0;
    const finalPstPercentage = pstPercentage !== undefined ? parseFloat(pstPercentage) : 0;
    
    const finalGstAmount = gstAmount !== undefined ? parseFloat(gstAmount) : (currentSubtotal * finalGstPercentage) / 100;
    const finalPstAmount = pstAmount !== undefined ? parseFloat(pstAmount) : (currentSubtotal * finalPstPercentage) / 100;
    const finalCombinedTaxAmount = combinedTaxAmount !== undefined ? parseFloat(combinedTaxAmount) : (finalGstAmount + finalPstAmount);
    
    // Legacy compatibility
    const finalTaxAmount = taxAmount !== undefined ? parseFloat(taxAmount) : finalCombinedTaxAmount;
    const finalTaxPercentage = taxPercentage !== undefined ? parseFloat(taxPercentage) : (currentSubtotal > 0 ? (finalCombinedTaxAmount / currentSubtotal) * 100 : 0);
    
    const newTotalAmount = currentSubtotal + finalCombinedTaxAmount;

    // Update all tax-related fields
    updateData.subtotal = currentSubtotal;
    updateData.gstPercentage = finalGstPercentage;
    updateData.gstAmount = finalGstAmount;
    updateData.pstPercentage = finalPstPercentage;
    updateData.pstAmount = finalPstAmount;
    updateData.combinedTaxAmount = finalCombinedTaxAmount;
    updateData.taxPercentage = finalTaxPercentage;
    updateData.taxAmount = finalTaxAmount;
    updateData.totalAmount = newTotalAmount;
  }

  // Update quotation
  const updatedQuotation = await prisma.quotation.update({
    where: { id },
    data: updateData,
    include: {
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
    }
  });

  console.log('Updated quotation successfully');

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.UPDATED,
    data: { quotation: updatedQuotation }
  });
});

// Update quotation status
// const updateQuotationStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   // Validate status
//   if (!Object.values(QUOTATION_STATUS).includes(status)) {
//     throw new AppError('Invalid quotation status', STATUS_CODES.BAD_REQUEST);
//   }

//   // Check if quotation exists
//   const existingQuotation = await prisma.quotation.findUnique({
//     where: { id },
//     select: { 
//       id: true, 
//       status: true, 
//       quotationNumber: true,
//       clientId: true,
//       userId: true,
//       client: {
//         select: {
//           companyName: true
//         }
//       }
//     }
//   });

//   if (!existingQuotation) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // CRITICAL FIX: Check if user can access this quotation
//   const canAccess = await canAccessRecord(req, existingQuotation.userId);
//   if (!canAccess) {
//     throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
//   }

//   // Check if user has permission to approve/reject (handled by middleware in routes)
//   const { hasPermission } = require('../middleware/permissions');
//   if ((status === QUOTATION_STATUS.APPROVED || status === QUOTATION_STATUS.REJECTED) && 
//       !hasPermission(req.user.role, 'quotations:approve')) {
//     throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
//   }

//   // Update quotation status
//   const updatedQuotation = await prisma.quotation.update({
//     where: { id },
//     data: {
//       status,
//       updatedAt: new Date()
//     },
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   // AUTO-GENERATE INVOICE WHEN QUOTATION IS APPROVED
//   let generatedInvoice = null;
//   if (status === QUOTATION_STATUS.APPROVED) {
//     try {
//       console.log(`Quotation ${existingQuotation.quotationNumber} approved. Auto-generating invoice...`);
      
//       // Generate invoice with default type (TAX_INVOICE_1)
//       generatedInvoice = await autoGenerateInvoiceForQuotation(
//         id, 
//         req.user.id, // Use the approver's user ID
//         INVOICE_TYPES.TAX_INVOICE_1
//       );

//       console.log(`Invoice ${generatedInvoice.invoiceNumber} auto-generated successfully`);
      
//     } catch (invoiceError) {
//       console.error('Failed to auto-generate invoice:', invoiceError);
//       // Don't fail the quotation approval if invoice generation fails
//       // Just log the error and continue
//     }
//   }

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: `Quotation ${status.toLowerCase()} successfully`,
//     data: { 
//       quotation: updatedQuotation,
//       generatedInvoice: generatedInvoice // Include invoice info in response
//     }
//   });
// });


// UPDATE: Replace your updateQuotationStatus function with this enhanced version

// const updateQuotationStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   // Validate status
//   if (!Object.values(QUOTATION_STATUS).includes(status)) {
//     throw new AppError('Invalid quotation status', STATUS_CODES.BAD_REQUEST);
//   }

//   // Check if quotation exists
//   const existingQuotation = await prisma.quotation.findUnique({
//     where: { id },
//     select: { 
//       id: true, 
//       status: true, 
//       quotationNumber: true,
//       title: true, // ADD: Need this for email
//       totalAmount: true, // ADD: Need this for email
//       clientId: true,
//       userId: true,
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true, // ADD: Need this for email
//           email: true // ADD: Need this for email
//         }
//       }
//     }
//   });

//   if (!existingQuotation) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // CRITICAL FIX: Check if user can access this quotation
//   const canAccess = await canAccessRecord(req, existingQuotation.userId);
//   if (!canAccess) {
//     throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
//   }

//   // Check if user has permission to approve/reject (handled by middleware in routes)
//   if ((status === QUOTATION_STATUS.APPROVED || status === QUOTATION_STATUS.REJECTED) && 
//       !hasPermission(req.user.role, 'quotations:approve')) {
//     throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
//   }

//   // Update quotation status
//   const updatedQuotation = await prisma.quotation.update({
//     where: { id },
//     data: {
//       status,
//       updatedAt: new Date()
//     },
//     include: {
//       client: {
//         select: {
//           companyName: true,
//           contactPerson: true,
//           email: true
//         }
//       },
//       user: {
//         select: {
//           firstName: true,
//           lastName: true
//         }
//       }
//     }
//   });

//   // AUTO-GENERATE INVOICE AND SEND EMAIL WHEN QUOTATION IS APPROVED
//   let generatedInvoice = null;
//   let emailSent = false;
//   let emailError = null;

//   if (status === QUOTATION_STATUS.APPROVED) {
//     try {

      
//       console.log(`Quotation ${existingQuotation.quotationNumber} approved. Auto-generating invoice...`);
      
//       // Generate invoice with default type (TAX_INVOICE_1)
//       generatedInvoice = await autoGenerateInvoiceForQuotation(
//         id, 
//         req.user.id, // Use the approver's user ID
//         INVOICE_TYPES.TAX_INVOICE_1
//       );

//       console.log(`Invoice ${generatedInvoice.invoiceNumber} auto-generated successfully`);
      
//     } catch (invoiceError) {
//       console.error('Failed to auto-generate invoice:', invoiceError);
//       // Don't fail the quotation approval if invoice generation fails
//       // Just log the error and continue
//     }

//     // AUTO-SEND APPROVAL EMAIL TO CLIENT
//     // try {
//     //   console.log(`Sending approval email to client: ${existingQuotation.client.email}`);
      
//     //   // Import the email service function
      
//     //   // Prepare quotation data for email
//     //   const quotationData = {
//     //     quotationNumber: existingQuotation.quotationNumber,
//     //     title: existingQuotation.title,
//     //     totalAmount: existingQuotation.totalAmount
//     //   };

//     //   // Prepare client data for email
//     //   const clientData = {
//     //     companyName: existingQuotation.client.companyName,
//     //     contactPerson: existingQuotation.client.contactPerson,
//     //     email: existingQuotation.client.email
//     //   };

//     //   // Send the approval email
//     //   const emailResult = await sendQuotationApprovedEmail(quotationData, clientData);
      
//     //   emailSent = true;
//     //   console.log(`Approval email sent successfully to ${clientData.email} | Message ID: ${emailResult.messageId}`);
      
//     // } catch (error) {
//     //    console.log('=== EMAIL ERROR ===');
//     //    console.error('Email error details:', error);
//     //    console.log('===================');
//     //   emailError = error.message;
//     //   // Don't fail the quotation approval if email fails
//     //   // Just log the error and continue
//     // }

//     try {
//     console.log('📧 EMAIL DEBUG START');
//     console.log('Client email:', existingQuotation.client.email);
//     console.log('Quotation number:', existingQuotation.quotationNumber);
//     console.log('Quotation title:', existingQuotation.title);
    
//     // Import check
//     console.log('📧 Importing email service...');
//     const { sendQuotationApprovedEmail } = require('../services/emailService');
//     console.log('📧 Email service imported successfully');
    
//     // Prepare data
//     const quotationData = {
//       quotationNumber: existingQuotation.quotationNumber,
//       title: existingQuotation.title,
//       totalAmount: existingQuotation.totalAmount
//     };
//     console.log('📧 Quotation data:', quotationData);

//     const clientData = {
//       companyName: existingQuotation.client.companyName,
//       contactPerson: existingQuotation.client.contactPerson,
//       email: existingQuotation.client.email
//     };
//     console.log('📧 Client data:', clientData);

//     // Validation
//     if (!clientData.email) {
//       throw new Error('Client email is missing');
//     }

//     // Call email function
//     console.log('📧 Calling sendQuotationApprovedEmail...');
//     const emailResult = await sendQuotationApprovedEmail(quotationData, clientData);
//     console.log('📧 Email result:', emailResult);
    
//     emailSent = true;
//     console.log('✅ SUCCESS: Approval email sent');
    
//   } catch (error) {
//     console.log('❌ EMAIL ERROR CAUGHT');
//     console.error('Error type:', error.constructor.name);
//     console.error('Error message:', error.message);
//     console.error('Full error:', error);
    
//     emailError = error.message;
//   }
//   }

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: `Quotation ${status.toLowerCase()} successfully`,
//     data: { 
//       quotation: updatedQuotation,
//       generatedInvoice: generatedInvoice, // Include invoice info in response
//       emailSent: emailSent, // Include email status in response
//       emailError: emailError // Include email error if any
//     }
//   });
// });

// Add extensive logging to your updateQuotationStatus function
// Replace the entire function with this debug version:

const updateQuotationStatus = asyncHandler(async (req, res) => {
  console.log('🚀 === QUOTATION STATUS UPDATE STARTED ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User:', req.user?.id, req.user?.role);

  const { id } = req.params;
  const { status } = req.body;

  console.log('📝 Processing quotation:', id);
  console.log('📝 New status:', status);
  console.log('📝 Expected APPROVED status:', QUOTATION_STATUS.APPROVED);
  console.log('📝 Status match:', status === QUOTATION_STATUS.APPROVED);

  // Validate status
  if (!Object.values(QUOTATION_STATUS).includes(status)) {
    console.log('❌ Invalid status provided');
    console.log('Available statuses:', Object.values(QUOTATION_STATUS));
    throw new AppError('Invalid quotation status', STATUS_CODES.BAD_REQUEST);
  }
  console.log('✅ Status validation passed');

  // Check if quotation exists
  console.log('🔍 Looking for quotation...');
  const existingQuotation = await prisma.quotation.findUnique({
    where: { id },
    select: { 
      id: true, 
      status: true, 
      quotationNumber: true,
      title: true,
      totalAmount: true,
      clientId: true,
      userId: true,
      client: {
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      }
    }
  });

  if (!existingQuotation) {
    console.log('❌ Quotation not found');
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }
  
  console.log('✅ Quotation found:', {
    number: existingQuotation.quotationNumber,
    currentStatus: existingQuotation.status,
    clientEmail: existingQuotation.client?.email
  });

  // Check access
  console.log('🔒 Checking user access...');
  const canAccess = await canAccessRecord(req, existingQuotation.userId);
  if (!canAccess) {
    console.log('❌ Access denied');
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }
  console.log('✅ Access granted');

  // Check permissions
  console.log('🔑 Checking permissions...');
  if ((status === QUOTATION_STATUS.APPROVED || status === QUOTATION_STATUS.REJECTED) && 
      !hasPermission(req.user.role, 'quotations:approve')) {
    console.log('❌ Insufficient permissions');
    throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
  }
  console.log('✅ Permissions OK');

  // Update quotation status
  console.log('💾 Updating quotation status...');
  const updatedQuotation = await prisma.quotation.update({
    where: { id },
    data: {
      status,
      updatedAt: new Date()
    },
    include: {
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
    }
  });
  console.log('✅ Quotation updated successfully');

  let generatedInvoice = null;
  let emailSent = false;
  let emailError = null;

  console.log('🎯 Checking if status is APPROVED...');
  console.log('Status value:', status);
  console.log('APPROVED constant:', QUOTATION_STATUS.APPROVED);
  console.log('Strict equality:', status === QUOTATION_STATUS.APPROVED);
  console.log('Loose equality:', status == QUOTATION_STATUS.APPROVED);

  if (status === QUOTATION_STATUS.APPROVED) {
    console.log('🎉 STATUS IS APPROVED - Starting auto-processes...');

    // Invoice generation
    try {
      console.log('📄 Starting invoice generation...');
      generatedInvoice = await autoGenerateInvoiceForQuotation(
        id, 
        req.user.id,
        INVOICE_TYPES.TAX_INVOICE_1
      );
      console.log('✅ Invoice generated:', generatedInvoice?.invoiceNumber);
    } catch (invoiceError) {
      console.error('❌ Invoice generation failed:', invoiceError);
    }

    // Email sending
    try {
      console.log('📧 EMAIL DEBUG START');
      console.log('Client email:', existingQuotation.client.email);
      console.log('Quotation number:', existingQuotation.quotationNumber);
      console.log('Quotation title:', existingQuotation.title);
      
      // Import check
      console.log('📧 Importing email service...');
      // const { sendQuotationApprovedEmail } = require('../services/emailService');
      console.log('📧 Email service imported successfully');
      
      // Prepare data
      const quotationData = {
        quotationNumber: existingQuotation.quotationNumber,
        title: existingQuotation.title,
        totalAmount: existingQuotation.totalAmount
      };
      console.log('📧 Quotation data:', quotationData);

      const clientData = {
        companyName: existingQuotation.client.companyName,
        contactPerson: existingQuotation.client.contactPerson,
        email: existingQuotation.client.email
      };
      console.log('📧 Client data:', clientData);

      // Validation
      if (!clientData.email) {
        throw new Error('Client email is missing');
      }

      // Call email function
      console.log('📧 Calling sendQuotationApprovedEmail...');
      const emailResult = await sendQuotationApprovedEmail(quotationData, clientData);
      console.log('📧 Email result:', emailResult);
      
      emailSent = true;
      console.log('✅ SUCCESS: Approval email sent');
      
    } catch (error) {
      console.log('❌ EMAIL ERROR CAUGHT');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      emailError = error.message;
    }
  } else {
    console.log('ℹ️  Status is not APPROVED, skipping auto-processes');
  }

  console.log('📤 Preparing response...');
  const response = {
    success: true,
    message: `Quotation ${status.toLowerCase()} successfully`,
    data: { 
      quotation: updatedQuotation,
      generatedInvoice: generatedInvoice,
      emailSent: emailSent,
      emailError: emailError
    }
  };
  console.log('Response data:', response);
  
  console.log('🏁 === QUOTATION STATUS UPDATE COMPLETED ===');
  
  res.status(STATUS_CODES.OK).json(response);
});

// Bulk quotation actions with auto-invoice generation
// const bulkQuotationActions = asyncHandler(async (req, res) => {
//   const { quotationIds, action } = req.body;

//   if (!Array.isArray(quotationIds) || quotationIds.length === 0) {
//     throw new AppError('Quotation IDs array is required', STATUS_CODES.BAD_REQUEST);
//   }

//   if (!['approve', 'reject', 'delete'].includes(action)) {
//     throw new AppError('Invalid action. Must be approve, reject, or delete', STATUS_CODES.BAD_REQUEST);
//   }

//   // Check permissions (handled by middleware in routes)
//   // const { hasPermission } = require('../middleware/permissions');
//   if ((action === 'approve' || action === 'reject') && !hasPermission(req.user.role, 'quotations:approve')) {
//     throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
//   }

//   if (action === 'delete' && !hasPermission(req.user.role, 'quotations:delete')) {
//     throw new AppError('Insufficient permissions to delete quotations', STATUS_CODES.FORBIDDEN);
//   }

//   // CRITICAL FIX: Apply user filtering to bulk actions
//   let where = { id: { in: quotationIds } };
//   where = buildUserFilteredWhere(req, where);

//   let result;
//   let actionMessage = '';
//   let generatedInvoices = [];

//   try {
//     switch (action) {
//       case 'approve':
//         // First, get all quotations that will be approved
//         const quotationsToApprove = await prisma.quotation.findMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED }
//           },
//           select: { id: true, quotationNumber: true }
//         });

//         // Update quotations to approved
//         result = await prisma.quotation.updateMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED }
//           },
//           data: {
//             status: QUOTATION_STATUS.APPROVED,
//             updatedAt: new Date()
//           }
//         });

//         // Auto-generate invoices for each approved quotation
//         for (const quotation of quotationsToApprove) {
//           try {
//             const invoice = await autoGenerateInvoiceForQuotation(
//               quotation.id,
//               req.user.id,
//               INVOICE_TYPES.TAX_INVOICE_1
//             );
//             generatedInvoices.push({
//               quotationId: quotation.id,
//               quotationNumber: quotation.quotationNumber,
//               invoiceId: invoice.id,
//               invoiceNumber: invoice.invoiceNumber
//             });
//           } catch (invoiceError) {
//             console.error(`Failed to generate invoice for quotation ${quotation.quotationNumber}:`, invoiceError);
//           }
//         }

//         actionMessage = 'approved';
//         break;

//       case 'reject':
//         result = await prisma.quotation.updateMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.REJECTED }
//           },
//           data: {
//             status: QUOTATION_STATUS.REJECTED,
//             updatedAt: new Date()
//           }
//         });
//         actionMessage = 'rejected';
//         break;

//       case 'delete':
//         result = await prisma.quotation.deleteMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED } // Don't delete approved quotations
//           }
//         });
//         actionMessage = 'deleted';
//         break;
//     }

//     const responseData = {
//       affectedCount: result.count
//     };

//     // Include generated invoices info if any
//     if (generatedInvoices.length > 0) {
//       responseData.generatedInvoices = generatedInvoices;
//     }

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `${result.count} quotations ${actionMessage} successfully`,
//       data: responseData
//     });

//   } catch (error) {
//     console.error('Bulk action error:', error);
//     throw new AppError(`Failed to perform bulk ${action}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

// const bulkQuotationActions = asyncHandler(async (req, res) => {
//   const { quotationIds, action } = req.body;

//   if (!Array.isArray(quotationIds) || quotationIds.length === 0) {
//     throw new AppError('Quotation IDs array is required', STATUS_CODES.BAD_REQUEST);
//   }

//   if (!['approve', 'reject', 'delete'].includes(action)) {
//     throw new AppError('Invalid action. Must be approve, reject, or delete', STATUS_CODES.BAD_REQUEST);
//   }

//   // Check permissions
//   if ((action === 'approve' || action === 'reject') && !hasPermission(req.user.role, 'quotations:approve')) {
//     throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
//   }

//   if (action === 'delete' && !hasPermission(req.user.role, 'quotations:delete')) {
//     throw new AppError('Insufficient permissions to delete quotations', STATUS_CODES.FORBIDDEN);
//   }

//   // Apply user filtering to bulk actions
//   let where = { id: { in: quotationIds } };
//   where = buildUserFilteredWhere(req, where);

//   let result;
//   let actionMessage = '';
//   let generatedInvoices = [];
//   let emailResults = []; // NEW: Track email sending results

//   try {
//     switch (action) {
//       case 'approve':
//         console.log('🎯 BULK APPROVE: Starting bulk approval with email automation...');
        
//         // Get all quotations that will be approved WITH client data for emails
//         const quotationsToApprove = await prisma.quotation.findMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED }
//           },
//           select: {
//             id: true,
//             quotationNumber: true,
//             title: true,
//             totalAmount: true,
//             gstPercentage: true,  // ✅ Include GST percentage
//       pstPercentage: true,
//             client: {
//               select: {
//                 id: true,
//                 companyName: true,
//                 contactPerson: true,
//                 email: true
//               }
//             }
//           }
//         });

//         console.log(`📊 Found ${quotationsToApprove.length} quotations to approve`);

//         // Update quotations to approved
//         result = await prisma.quotation.updateMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED }
//           },
//           data: {
//             status: QUOTATION_STATUS.APPROVED,
//             updatedAt: new Date()
//           }
//         });

//         console.log(`✅ Updated ${result.count} quotations to APPROVED status`);

//         // Auto-generate invoices AND send emails for each approved quotation
//         for (const quotation of quotationsToApprove) {
//           console.log(`🔄 Processing quotation ${quotation.quotationNumber}...`);
          
//           // Generate invoice
//           try {
//             const invoice = await autoGenerateInvoiceForQuotation(
//               quotation.id,
//               req.user.id,
//               INVOICE_TYPES.TAX_INVOICE_1
//             );
//             const updatedInvoice = await prisma.invoice.update({
//         where: { id: invoice.id },
//         data: { status: InvoiceStatus.APPROVED,
//           gstPercentage: quotation.gstPercentage,  // ✅ Copy GST from quotation
//           pstPercentage: quotation.pstPercentage,
          
//          }  // or INVOICE_STATUS.SENT
//       });
//             generatedInvoices.push({
//               quotationId: quotation.id,
//               quotationNumber: quotation.quotationNumber,
//               invoiceId: updatedInvoice.id,
//               invoiceNumber: updatedInvoice.invoiceNumber,
//               invoiceStatus: updatedInvoice.status,
//               gstPercentage: updatedInvoice.gstPercentage,  // ✅ Include in response
//               pstPercentage: updatedInvoice.pstPercentage  
//             });
//             console.log(`📄 Invoice ${updatedInvoice.invoiceNumber} generated for ${quotation.quotationNumber}`);
//           } catch (invoiceError) {
//             console.error(`❌ Failed to generate invoice for quotation ${quotation.quotationNumber}:`, invoiceError);
//           }

//           // Send approval email
//           if (quotation.client && quotation.client.email) {
//             try {
//               console.log(`📧 Sending approval email to ${quotation.client.email} for ${quotation.quotationNumber}...`);
              
//               const quotationData = {
//                 quotationNumber: quotation.quotationNumber,
//                 title: quotation.title,
//                 totalAmount: quotation.totalAmount
//               };

//               const clientData = {
//                 companyName: quotation.client.companyName,
//                 contactPerson: quotation.client.contactPerson,
//                 email: quotation.client.email
//               };

//               const emailResult = await sendQuotationApprovedEmail(quotationData, clientData);
              
//               emailResults.push({
//                 quotationId: quotation.id,
//                 quotationNumber: quotation.quotationNumber,
//                 clientEmail: quotation.client.email,
//                 emailSent: true,
//                 messageId: emailResult.messageId,
//                 success: true
//               });

//               console.log(`✅ Approval email sent to ${quotation.client.email} for ${quotation.quotationNumber}`);

//             } catch (emailError) {
//               console.error(`❌ Failed to send approval email for ${quotation.quotationNumber}:`, emailError.message);
              
//               emailResults.push({
//                 quotationId: quotation.id,
//                 quotationNumber: quotation.quotationNumber,
//                 clientEmail: quotation.client.email,
//                 emailSent: false,
//                 error: emailError.message,
//                 success: false
//               });
//             }
//           } else {
//             console.warn(`⚠️  No client email for quotation ${quotation.quotationNumber} - skipping email`);
            
//             emailResults.push({
//               quotationId: quotation.id,
//               quotationNumber: quotation.quotationNumber,
//               clientEmail: null,
//               emailSent: false,
//               error: 'Client email not available',
//               success: false
//             });
//           }
//         }

//         actionMessage = 'approved';
//         break;

//       case 'reject':
//         // Get quotations for potential email notifications (optional)
//         const quotationsToReject = await prisma.quotation.findMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.REJECTED }
//           },
//           select: {
//             id: true,
//             quotationNumber: true,
//             title: true,
//             client: {
//               select: {
//                 companyName: true,
//                 contactPerson: true,
//                 email: true
//               }
//             }
//           }
//         });

//         result = await prisma.quotation.updateMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.REJECTED }
//           },
//           data: {
//             status: QUOTATION_STATUS.REJECTED,
//             updatedAt: new Date()
//           }
//         });

//         // Optional: Send rejection emails
//         // Uncomment if you want to send rejection emails
//         /*
//         for (const quotation of quotationsToReject) {
//           if (quotation.client && quotation.client.email) {
//             try {
//               // You'd need to create a sendQuotationRejectedEmail function
//               // await sendQuotationRejectedEmail(quotation, quotation.client);
//             } catch (error) {
//               console.error(`Failed to send rejection email for ${quotation.quotationNumber}`);
//             }
//           }
//         }
//         */

//         actionMessage = 'rejected';
//         break;

//       case 'delete':
//         result = await prisma.quotation.deleteMany({
//           where: {
//             ...where,
//             status: { not: QUOTATION_STATUS.APPROVED }
//           }
//         });
//         actionMessage = 'deleted';
//         break;
//     }

//     // Prepare response data
//     const responseData = {
//       affectedCount: result.count
//     };

//     // Include generated invoices info if any
//     if (generatedInvoices.length > 0) {
//       responseData.generatedInvoices = generatedInvoices;
//     }

//     // Include email results if any
//     if (emailResults.length > 0) {
//       responseData.emailResults = emailResults;
      
//       // Summary statistics
//       const emailsSent = emailResults.filter(r => r.success).length;
//       const emailsFailed = emailResults.filter(r => !r.success).length;
      
//       responseData.emailSummary = {
//         totalEmails: emailResults.length,
//         emailsSent: emailsSent,
//         emailsFailed: emailsFailed,
//         emailsSkipped: emailResults.filter(r => !r.clientEmail).length
//       };

//       console.log(`📧 EMAIL SUMMARY: ${emailsSent} sent, ${emailsFailed} failed, ${emailResults.length} total`);
//     }

//     // Enhanced response message
//     let responseMessage = `${result.count} quotations ${actionMessage} successfully`;
    
//     if (action === 'approve' && emailResults.length > 0) {
//       const emailsSent = emailResults.filter(r => r.success).length;
//       responseMessage += `. ${emailsSent} approval emails sent to clients.`;
//     }

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: responseMessage,
//       data: responseData
//     });

//     console.log(`🎯 BULK ${action.toUpperCase()} COMPLETED: ${result.count} quotations processed`);

//   } catch (error) {
//     console.error('Bulk action error:', error);
//     throw new AppError(`Failed to perform bulk ${action}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

const bulkQuotationActions = asyncHandler(async (req, res) => {
  const { quotationIds, action } = req.body;

  if (!Array.isArray(quotationIds) || quotationIds.length === 0) {
    throw new AppError('Quotation IDs array is required', STATUS_CODES.BAD_REQUEST);
  }

  if (!['approve', 'reject', 'delete'].includes(action)) {
    throw new AppError('Invalid action. Must be approve, reject, or delete', STATUS_CODES.BAD_REQUEST);
  }

  // Check permissions
  if ((action === 'approve' || action === 'reject') && !hasPermission(req.user.role, 'quotations:approve')) {
    throw new AppError('Insufficient permissions to approve/reject quotations', STATUS_CODES.FORBIDDEN);
  }

  if (action === 'delete' && !hasPermission(req.user.role, 'quotations:delete')) {
    throw new AppError('Insufficient permissions to delete quotations', STATUS_CODES.FORBIDDEN);
  }

  // Apply user filtering to bulk actions
  let where = { id: { in: quotationIds } };
  where = buildUserFilteredWhere(req, where);

  let result;
  let actionMessage = '';
  let generatedInvoices = [];
  let emailResults = [];

  try {
    switch (action) {
      case 'approve':
        console.log('🎯 BULK APPROVE: Starting bulk approval with email automation...');
        
        // Get all quotations that will be approved WITH full data for emails
        const quotationsToApprove = await prisma.quotation.findMany({
          where: {
            ...where,
            status: { not: QUOTATION_STATUS.APPROVED }
          },
          include: {
            client: {
              select: {
                id: true,
                companyName: true,
                contactPerson: true,
                email: true
              }
            }
          }
        });

        console.log(`📊 Found ${quotationsToApprove.length} quotations to approve`);

        // Update quotations to approved
        result = await prisma.quotation.updateMany({
          where: {
            ...where,
            status: { not: QUOTATION_STATUS.APPROVED }
          },
          data: {
            status: QUOTATION_STATUS.APPROVED,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated ${result.count} quotations to APPROVED status`);

        // Get email settings and company settings for inline email sending
        const { settingsService } = require('../services/settingsService');
        const nodemailer = require('nodemailer');
        
        let emailSettings = null;
        let companySettings = null;
        let transporter = null;

        // Initialize email components (only if we have quotations with email)
        const quotationsWithEmails = quotationsToApprove.filter(q => q.client?.email);
        if (quotationsWithEmails.length > 0) {
          try {
            [emailSettings, companySettings] = await Promise.all([
              settingsService.getEmailSettings(),
              settingsService.getCompanySettings()
            ]);

            transporter = nodemailer.createTransport({
  host: emailSettings.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: emailSettings.port || process.env.EMAIL_PORT || 587,
  secure: emailSettings.secure || process.env.EMAIL_SECURE === 'true',
  auth: {
    user: emailSettings.username || process.env.EMAIL_USER,
    pass: emailSettings.password || process.env.EMAIL_PASS
  }
});

            console.log('📧 Email transporter initialized for bulk emails');
          } catch (emailSetupError) {
            console.error('❌ Failed to initialize email setup:', emailSetupError);
          }
        }

        // Process each approved quotation
        for (const quotation of quotationsToApprove) {
          console.log(`🔄 Processing quotation ${quotation.quotationNumber}...`);
          
          // Generate invoice
          // try {
          //   const invoice = await autoGenerateInvoiceForQuotation(
          //     quotation.id,
          //     req.user.id,
          //     INVOICE_TYPES.TAX_INVOICE_1
          //   );
            
          //   const updatedInvoice = await prisma.invoice.update({
          //     where: { id: invoice.id },
          //     data: { 
          //       status: InvoiceStatus.APPROVED,
          //       gstPercentage: quotation.gstPercentage,
          //       pstPercentage: quotation.pstPercentage,
          //     }
          //   });
            
          //   generatedInvoices.push({
          //     quotationId: quotation.id,
          //     quotationNumber: quotation.quotationNumber,
          //     invoiceId: updatedInvoice.id,
          //     invoiceNumber: updatedInvoice.invoiceNumber,
          //     invoiceStatus: updatedInvoice.status,
          //     gstPercentage: updatedInvoice.gstPercentage,
          //     pstPercentage: updatedInvoice.pstPercentage  
          //   });
            
          //   console.log(`📄 Invoice ${updatedInvoice.invoiceNumber} generated for ${quotation.quotationNumber}`);
          // } catch (invoiceError) {
          //   console.error(`❌ Failed to generate invoice for quotation ${quotation.quotationNumber}:`, invoiceError);
          // }

          try {
  console.log(`📄 Generating invoice for ${quotation.quotationNumber}...`);
  
  const invoice = await autoGenerateInvoiceForQuotation(
    quotation.id,
    req.user.id,
    INVOICE_TYPES.TAX_INVOICE_1,
    quotation.gstPercentage,  // ✅ Pass the rates explicitly
    quotation.pstPercentage,   // ✅ Pass the rates explicitly
    true
  );
  
  console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
  
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { 
      status: InvoiceStatus.APPROVED,
      // Don't need to update tax rates - they're already set during creation
    }
  });
  
  generatedInvoices.push({
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    invoiceId: updatedInvoice.id,
    invoiceNumber: updatedInvoice.invoiceNumber,
    invoiceStatus: updatedInvoice.status,
    gstPercentage: updatedInvoice.gstPercentage,
    pstPercentage: updatedInvoice.pstPercentage  
  });
  
  console.log(`✅ Invoice ${updatedInvoice.invoiceNumber} completed`);
  
} catch (invoiceError) {
  console.error(`❌ Invoice generation failed for ${quotation.quotationNumber}:`);
    console.error(invoiceError);
  console.error(invoiceError.message);
  console.error(invoiceError.stack);
}

          // INLINE EMAIL SENDING FOR APPROVAL EMAILS
          if (quotation.client && quotation.client.email && transporter && emailSettings && companySettings) {
            try {
              console.log(`📧 Sending approval email to ${quotation.client.email} for ${quotation.quotationNumber}...`);
              
              // Helper functions
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

              // Prepare template data
              const templateData = {
                clientName: getClientName(quotation.client),
                quotationNumber: quotation.quotationNumber || 'N/A',
                quotationTitle: quotation.title || 'Untitled Project',
                description: quotation.description || '',
                subtotal: formatCurrency(quotation.subtotal),
                gstPercentage: toNumber(quotation.gstPercentage).toFixed(2),
                pstPercentage: toNumber(quotation.pstPercentage).toFixed(2),
                gstAmount: formatCurrency(quotation.gstAmount),
                pstAmount: formatCurrency(quotation.pstAmount),
                totalTaxAmount: formatCurrency(quotation.combinedTaxAmount),
                totalAmount: formatCurrency(quotation.totalAmount),
                validUntil: quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '',
                notes: quotation.notes || '',
                approvedDate: new Date().toLocaleDateString(),
                companyName: companySettings.name || 'Your Company',
                currentYear: new Date().getFullYear()
              };

              // Try to get quotation_approved template from database
              let emailSubject = `Quotation ${templateData.quotationNumber} Approved - Invoice Generated`;
              let emailHtml = '';
              let usedDatabaseTemplate = false;

              try {
                const template = await prisma.emailTemplate.findFirst({
                  where: {
                    templateKey: 'quotation_approved',
                    enabled: true
                  }
                });

                if (template) {
                  console.log(`✅ Using database template for ${quotation.quotationNumber}`);
                  
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
                console.warn(`⚠️ Database template not found for ${quotation.quotationNumber}, using default`);
                
                // Default approval email template
                emailSubject = `Quotation ${templateData.quotationNumber} Approved - Invoice Generated`;
                emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                    <div style="background: #16a34a; padding: 30px; text-align: center; color: white;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Quotation Approved!</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                      <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${templateData.clientName},</h2>
                      
                      <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 6px;">
                        <p style="color: #166534; margin: 0; font-size: 18px; font-weight: 500;">
                          🎊 Great news! Your quotation has been approved and an invoice has been generated.
                        </p>
                      </div>
                      
                      <div style="background: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px;">
                        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Quotation Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Quotation Number:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Project:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationTitle}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subtotal:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.subtotal}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">GST (${templateData.gstPercentage}%):</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.gstAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">PST (${templateData.pstPercentage}%):</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.pstAmount}</td>
                          </tr>
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 12px 0; font-weight: bold; color: #374151; font-size: 18px;">Total Amount:</td>
                            <td style="padding: 12px 0; color: #16a34a; font-weight: bold; font-size: 20px;">${templateData.totalAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Approved Date:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${templateData.approvedDate}</td>
                          </tr>
                        </table>
                      </div>
                      
                      ${templateData.description ? `
                      <div style="margin: 25px 0;">
                        <h4 style="color: #374151; margin: 0 0 10px 0;">Project Description:</h4>
                        <p style="color: #6b7280; line-height: 1.6; margin: 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                          ${templateData.description}
                        </p>
                      </div>
                      ` : ''}
                      
                      ${templateData.notes ? `
                      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                        <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Notes:</h4>
                        <p style="color: #1e40af; margin: 0; line-height: 1.6;">${templateData.notes}</p>
                      </div>
                      ` : ''}
                      
                      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; margin: 0; font-weight: 500;">
                          <strong>📄 Next Steps:</strong> An invoice will be sent to you separately. Please review and process payment according to the invoice terms.
                        </p>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
                        Thank you for choosing ${templateData.companyName}. We're excited to begin working on your project!
                      </p>
                      
                      <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                        <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
                        <p style="color: #16a34a; margin: 5px 0 0 0; font-weight: bold;">${templateData.companyName} Team</p>
                      </div>
                    </div>
                    
                    <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
                      <p style="margin: 0;">&copy; ${templateData.currentYear} ${templateData.companyName}. All rights reserved.</p>
                    </div>
                  </div>
                `;
              }

              // Send approval email
              const mailOptions = {
                from: {
                  name: emailSettings.fromName || companySettings.name || 'Quotation Management System',
                  address: emailSettings.fromEmail || emailSettings.username || process.env.EMAIL_FROM
                },
                to: quotation.client.email,
                subject: emailSubject,
                html: emailHtml,
                replyTo: emailSettings.replyTo || emailSettings.fromEmail || emailSettings.username
              };

              const info = await transporter.sendMail(mailOptions);
              
              emailResults.push({
                quotationId: quotation.id,
                quotationNumber: quotation.quotationNumber,
                clientEmail: quotation.client.email,
                emailSent: true,
                messageId: info.messageId,
                success: true,
                templateSource: usedDatabaseTemplate ? 'database' : 'fallback'
              });

              console.log(`✅ Approval email sent to ${quotation.client.email} for ${quotation.quotationNumber} (${info.messageId})`);

            } catch (emailError) {
              console.error(`❌ Failed to send approval email for ${quotation.quotationNumber}:`, emailError.message);
              
              emailResults.push({
                quotationId: quotation.id,
                quotationNumber: quotation.quotationNumber,
                clientEmail: quotation.client.email,
                emailSent: false,
                error: emailError.message,
                success: false
              });
            }
          } else {
            const reason = !quotation.client?.email ? 'Client email not available' : 'Email system not configured';
            console.warn(`⚠️ ${reason} for quotation ${quotation.quotationNumber} - skipping email`);
            
            emailResults.push({
              quotationId: quotation.id,
              quotationNumber: quotation.quotationNumber,
              clientEmail: quotation.client?.email || null,
              emailSent: false,
              error: reason,
              success: false
            });
          }
        }

        actionMessage = 'approved';
        break;

      // case 'reject':
      //   const quotationsToReject = await prisma.quotation.findMany({
      //     where: {
      //       ...where,
      //       status: { not: QUOTATION_STATUS.REJECTED }
      //     },
      //     select: {
      //       id: true,
      //       quotationNumber: true,
      //       title: true,
      //       client: {
      //         select: {
      //           companyName: true,
      //           contactPerson: true,
      //           email: true
      //         }
      //       }
      //     }
      //   });

      //   result = await prisma.quotation.updateMany({
      //     where: {
      //       ...where,
      //       status: { not: QUOTATION_STATUS.REJECTED }
      //     },
      //     data: {
      //       status: QUOTATION_STATUS.REJECTED,
      //       updatedAt: new Date()
      //     }
      //   });

      //   actionMessage = 'rejected';
      //   break;

      case 'reject':
  console.log('🎯 BULK REJECT: Starting bulk rejection with email automation...');
  
  const quotationsToReject = await prisma.quotation.findMany({
    where: {
      ...where,
      status: { not: QUOTATION_STATUS.REJECTED }
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true
        }
      }
    }
  });

  console.log(`📊 Found ${quotationsToReject.length} quotations to reject`);

  result = await prisma.quotation.updateMany({
    where: {
      ...where,
      status: { not: QUOTATION_STATUS.REJECTED }
    },
    data: {
      status: QUOTATION_STATUS.REJECTED,
      updatedAt: new Date()
    }
  });

  console.log(`✅ Updated ${result.count} quotations to REJECTED status`);

  // Initialize email components for rejection emails
  // const { settingsService: rejectSettingsService } = require('../services/settingsService');
  // const nodemailer = require('nodemailer');
  
  let rejectEmailSettings = null;
  let rejectCompanySettings = null;
  let rejectTransporter = null;

  const quotationsWithRejectEmails = quotationsToReject.filter(q => q.client?.email);
  if (quotationsWithRejectEmails.length > 0) {
    try {
      [rejectEmailSettings, rejectCompanySettings] = await Promise.all([
        rejectSettingsService.getEmailSettings(),
        rejectSettingsService.getCompanySettings()
      ]);

      rejectTransporter = nodemailer.createTransport({
        host: rejectEmailSettings.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: rejectEmailSettings.port || process.env.EMAIL_PORT || 587,
        secure: rejectEmailSettings.secure || process.env.EMAIL_SECURE === 'true',
        auth: {
          user: rejectEmailSettings.username || process.env.EMAIL_USER,
          pass: rejectEmailSettings.password || process.env.EMAIL_PASS
        }
      });

      console.log('📧 Email transporter initialized for rejection emails');
    } catch (emailSetupError) {
      console.error('❌ Failed to initialize email setup for rejections:', emailSetupError);
    }
  }

  // Send rejection emails
  for (const quotation of quotationsToReject) {
    if (quotation.client && quotation.client.email && rejectTransporter && rejectEmailSettings && rejectCompanySettings) {
      try {
        console.log(`📧 Sending rejection email to ${quotation.client.email} for ${quotation.quotationNumber}...`);
        
        // Helper functions
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

        // Prepare template data
        const templateData = {
          clientName: getClientName(quotation.client),
          quotationNumber: quotation.quotationNumber || 'N/A',
          quotationTitle: quotation.title || 'Untitled Project',
          description: quotation.description || '',
          totalAmount: formatCurrency(quotation.totalAmount),
          rejectedDate: new Date().toLocaleDateString(),
          companyName: rejectCompanySettings.name || 'Your Company',
          currentYear: new Date().getFullYear()
        };

        // Try to get quotation_rejected template from database
        let emailSubject = `Quotation ${templateData.quotationNumber} - Status Update`;
        let emailHtml = '';
        let usedDatabaseTemplate = false;

        try {
          const template = await prisma.emailTemplate.findFirst({
            where: {
              templateKey: 'quotation_rejected',
              enabled: true
            }
          });

          if (template) {
            console.log(`✅ Using database template for ${quotation.quotationNumber}`);
            
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
          console.warn(`⚠️ Database template not found for ${quotation.quotationNumber}, using default`);
          
          // Default rejection email template
          emailSubject = `Quotation ${templateData.quotationNumber} - Status Update`;
          emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #dc2626; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Quotation Status Update</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${templateData.clientName},</h2>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                  Thank you for your interest in our services. After careful review, we regret to inform you that we are unable to proceed with quotation ${templateData.quotationNumber} at this time.
                </p>
                
                <div style="background: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
                  <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Quotation Details:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Quotation Number:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Project:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${templateData.quotationTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Total Amount:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${templateData.totalAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${templateData.rejectedDate}</td>
                    </tr>
                  </table>
                </div>
                
                ${templateData.description ? `
                <div style="margin: 25px 0;">
                  <h4 style="color: #374151; margin: 0 0 10px 0;">Project Details:</h4>
                  <p style="color: #6b7280; line-height: 1.6; margin: 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                    ${templateData.description}
                  </p>
                </div>
                ` : ''}
                
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                  <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                    <strong>Alternative Options:</strong> We would be happy to discuss alternative solutions or revised quotations that might better suit your needs. Please feel free to contact us to explore other possibilities.
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
                  We appreciate your interest in ${templateData.companyName} and hope to work with you in the future.
                </p>
                
                <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                  <p style="color: #374151; margin: 0; font-weight: 500;">Best regards,</p>
                  <p style="color: #dc2626; margin: 5px 0 0 0; font-weight: bold;">${templateData.companyName} Team</p>
                </div>
              </div>
              
              <div style="background: #374151; color: #9ca3af; padding: 25px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">&copy; ${templateData.currentYear} ${templateData.companyName}. All rights reserved.</p>
              </div>
            </div>
          `;
        }

        // Send rejection email
        const mailOptions = {
          from: {
            name: rejectEmailSettings.fromName || rejectCompanySettings.name || 'Quotation Management System',
            address: rejectEmailSettings.fromEmail || rejectEmailSettings.username || process.env.EMAIL_FROM
          },
          to: quotation.client.email,
          subject: emailSubject,
          html: emailHtml,
          replyTo: rejectEmailSettings.replyTo || rejectEmailSettings.fromEmail || rejectEmailSettings.username
        };

        const info = await rejectTransporter.sendMail(mailOptions);
        
        emailResults.push({
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber,
          clientEmail: quotation.client.email,
          emailSent: true,
          messageId: info.messageId,
          success: true,
          templateSource: usedDatabaseTemplate ? 'database' : 'fallback'
        });

        console.log(`✅ Rejection email sent to ${quotation.client.email} for ${quotation.quotationNumber} (${info.messageId})`);

      } catch (emailError) {
        console.error(`❌ Failed to send rejection email for ${quotation.quotationNumber}:`, emailError.message);
        
        emailResults.push({
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber,
          clientEmail: quotation.client.email,
          emailSent: false,
          error: emailError.message,
          success: false
        });
      }
    } else {
      const reason = !quotation.client?.email ? 'Client email not available' : 'Email system not configured';
      console.warn(`⚠️ ${reason} for quotation ${quotation.quotationNumber} - skipping email`);
      
      emailResults.push({
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        clientEmail: quotation.client?.email || null,
        emailSent: false,
        error: reason,
        success: false
      });
    }
  }

  actionMessage = 'rejected';
  break;

      case 'delete':
        result = await prisma.quotation.deleteMany({
          where: {
            ...where,
            status: { not: QUOTATION_STATUS.APPROVED }
          }
        });
        actionMessage = 'deleted';
        break;
    }

    // Prepare response data
    const responseData = {
      affectedCount: result.count
    };

    if (generatedInvoices.length > 0) {
      responseData.generatedInvoices = generatedInvoices;
    }

    if (emailResults.length > 0) {
      responseData.emailResults = emailResults;
      
      const emailsSent = emailResults.filter(r => r.success).length;
      const emailsFailed = emailResults.filter(r => !r.success).length;
      
      responseData.emailSummary = {
        totalEmails: emailResults.length,
        emailsSent: emailsSent,
        emailsFailed: emailsFailed,
        emailsSkipped: emailResults.filter(r => !r.clientEmail).length
      };

      console.log(`📧 EMAIL SUMMARY: ${emailsSent} sent, ${emailsFailed} failed, ${emailResults.length} total`);
    }

    let responseMessage = `${result.count} quotations ${actionMessage} successfully`;
    
    if (action === 'approve' && emailResults.length > 0) {
      const emailsSent = emailResults.filter(r => r.success).length;
      responseMessage += `. ${emailsSent} approval emails sent to clients.`;
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: responseMessage,
      data: responseData
    });

    console.log(`🎯 BULK ${action.toUpperCase()} COMPLETED: ${result.count} quotations processed`);

  } catch (error) {
    console.error('Bulk action error:', error);
    throw new AppError(`Failed to perform bulk ${action}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Get quotations with their related invoices
const getQuotationWithInvoices = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: {
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
          taxId: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          totalAmount: true,
          dueDate: true,
          paidDate: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!quotation) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // CRITICAL FIX: Check if user can access this quotation
  const canAccess = await canAccessRecord(req, quotation.userId);
  if (!canAccess) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: { quotation }
  });
});

// Delete quotation
const deleteQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if quotation exists
  const existingQuotation = await prisma.quotation.findUnique({
    where: { id },
    select: { 
      id: true, 
      status: true,
      quotationNumber: true,
      userId: true, // NEW: Include userId for access check
      _count: {
        select: { invoices: true }
      }
    }
  });

  if (!existingQuotation) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // CRITICAL FIX: Check if user can access this quotation
  const canAccess = await canAccessRecord(req, existingQuotation.userId);
  if (!canAccess) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Check if quotation can be deleted
  if (existingQuotation.status === QUOTATION_STATUS.APPROVED) {
    throw new AppError('Cannot delete approved quotation', STATUS_CODES.BAD_REQUEST);
  }

  if (existingQuotation._count.invoices > 0) {
    throw new AppError('Cannot delete quotation with associated invoices', STATUS_CODES.BAD_REQUEST);
  }

  // Delete quotation
  await prisma.quotation.delete({
    where: { id }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.DELETED,
    data: { quotationNumber: existingQuotation.quotationNumber }
  });
});

// Get quotation statistics
const getQuotationStatistics = asyncHandler(async (req, res) => {
  // CRITICAL FIX: Apply user filtering to statistics
  let where = {};
  where = buildUserFilteredWhere(req, where);

  // Build userId condition for raw queries
  const userFilterCondition = req.userFiltered 
    ? `AND "userId" = '${req.user.id}'` 
    : '';

  const [statusStats, monthlyStats, topClients] = await Promise.all([
    // Statistics by status
    prisma.quotation.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
      _sum: { totalAmount: true }
    }),

    // Monthly statistics (last 12 months) with user filtering
    prisma.$queryRawUnsafe(`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        SUM("totalAmount") as total_amount,
        AVG("totalAmount") as avg_amount
      FROM quotations 
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months'
      ${userFilterCondition}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `),

    // Top clients by quotation value (with user filtering)
    prisma.quotation.groupBy({
      by: ['clientId'],
      where,
      _count: { clientId: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10
    })
  ]);

  // Get client details for top clients (with user filtering)
  const clientIds = topClients.map(item => item.clientId);
  let clientWhere = { id: { in: clientIds } };
  clientWhere = buildUserFilteredWhere(req, clientWhere);

  const clientDetails = await prisma.client.findMany({
    where: clientWhere,
    select: { id: true, companyName: true }
  });

  const topClientsWithDetails = topClients.map(item => {
    const client = clientDetails.find(c => c.id === item.clientId);
    return {
      client,
      quotationCount: item._count.clientId,
      totalValue: item._sum.totalAmount
    };
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      statusStatistics: statusStats,
      monthlyStatistics: monthlyStats,
      topClients: topClientsWithDetails
    }
  });
});

// Duplicate quotation
const duplicateQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get original quotation
  const originalQuotation = await prisma.quotation.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      clientId: true,
      formData: true,
      subtotal: true,
      taxPercentage: true,
      taxAmount: true,
      totalAmount: true,
      notes: true,
      userId: true // NEW: Include userId for access check
    }
  });

  if (!originalQuotation) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // CRITICAL FIX: Check if user can access this quotation
  const canAccess = await canAccessRecord(req, originalQuotation.userId);
  if (!canAccess) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Generate new quotation number
  const quotationNumber = await generateQuotationNumber();

  // Create duplicate quotation
  const duplicatedQuotation = await prisma.quotation.create({
    data: {
      ...originalQuotation,
      quotationNumber,
      userId: req.user.id, // Associate with current user
      status: QUOTATION_STATUS.DRAFT,
      title: `${originalQuotation.title} (Copy)`,
      validUntil: null // Reset valid until date
    },
    include: {
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
    }
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Quotation duplicated successfully',
    data: { quotation: duplicatedQuotation }
  });
});

module.exports = {
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
};