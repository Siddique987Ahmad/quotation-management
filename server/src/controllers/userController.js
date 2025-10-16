// const bcrypt = require('bcryptjs');
// const { prisma } = require('../config/database');
// const { AppError, asyncHandler } = require('../middleware/errorHandler');
// const { STATUS_CODES, MESSAGES, ROLES, PAGINATION } = require('../config/constants');
// const { notifyUserCreated } = require('../services/notificationService');
// // Get all users with pagination and filtering
// const getUsers = asyncHandler(async (req, res) => {
//   const {
//     page = PAGINATION.DEFAULT_PAGE,
//     limit = PAGINATION.DEFAULT_LIMIT,
//     sortBy = 'createdAt',
//     sortOrder = 'desc',
//     search = '',
//     role = '',
//     isActive = ''
//   } = req.query;

//   // Convert page and limit to numbers
//   const pageNum = parseInt(page);
//   const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
//   const skip = (pageNum - 1) * limitNum;

//   // Build where clause for filtering
//   const where = {};

//   // Search in firstName, lastName, or email
//   if (search) {
//     where.OR = [
//       { firstName: { contains: search, mode: 'insensitive' } },
//       { lastName: { contains: search, mode: 'insensitive' } },
//       { email: { contains: search, mode: 'insensitive' } }
//     ];
//   }

//   // Filter by role
//   if (role && Object.values(ROLES).includes(role)) {
//     where.role = role;
//   }

//   // Filter by active status
//   if (isActive !== '') {
//     where.isActive = isActive === 'true';
//   }

//   // Build orderBy clause
//   const orderBy = {};
//   orderBy[sortBy] = sortOrder;

//   // Get users with pagination
//   const [users, totalCount] = await Promise.all([
//     prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         role: true,
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
//     prisma.user.count({ where })
//   ]);

//   // Calculate pagination info
//   const totalPages = Math.ceil(totalCount / limitNum);
//   const hasNextPage = pageNum < totalPages;
//   const hasPreviousPage = pageNum > 1;

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       users: users.map(user => ({
//         ...user,
//         statistics: {
//           totalQuotations: user._count.quotations,
//           totalInvoices: user._count.invoices
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

// // // Get user by ID
// // const getUserById = asyncHandler(async (req, res) => {
// //   const { id } = req.params;

// //   const user = await prisma.user.findUnique({
// //     where: { id },
// //     select: {
// //       id: true,
// //       email: true,
// //       firstName: true,
// //       lastName: true,
// //       role: true,
// //       isActive: true,
// //       createdAt: true,
// //       updatedAt: true,
// //       quotations: {
// //         select: {
// //           id: true,
// //           quotationNumber: true,
// //           title: true,
// //           status: true,
// //           totalAmount: true,
// //           createdAt: true
// //         },
// //         orderBy: { createdAt: 'desc' },
// //         take: 5
// //       },
// //       invoices: {
// //         select: {
// //           id: true,
// //           invoiceNumber: true,
// //           status: true,
// //           totalAmount: true,
// //           createdAt: true
// //         },
// //         orderBy: { createdAt: 'desc' },
// //         take: 5
// //       },
// //       _count: {
// //         select: {
// //           quotations: true,
// //           invoices: true
// //         }
// //       }
// //     }
// //   });

// //   if (!user) {
// //     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
// //   }

// //   res.status(STATUS_CODES.OK).json({
// //     success: true,
// //     message: MESSAGES.SUCCESS.FETCHED,
// //     data: {
// //       user: {
// //         ...user,
// //         statistics: {
// //           totalQuotations: user._count.quotations,
// //           totalInvoices: user._count.invoices
// //         },
// //         recentQuotations: user.quotations,
// //         recentInvoices: user.invoices,
// //         quotations: undefined,
// //         invoices: undefined,
// //         _count: undefined
// //       }
// //     }
// //   });
// // });

// const getUserById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const user = await prisma.user.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       createdAt: true,
//       updatedAt: true,
//       quotations: {
//         select: {
//           id: true,
//           quotationNumber: true,
//           title: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 5
//       },
//       invoices: {
//         select: {
//           id: true,
//           invoiceNumber: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 5
//       },
//       _count: {
//         select: {
//           quotations: true,
//           invoices: true
//         }
//       }
//     }
//   });

//   if (!user) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Transform the response to match frontend expectations
//   const transformedUser = {
//     ...user,
//     statistics: {
//       totalQuotations: user._count.quotations,
//       totalInvoices: user._count.invoices
//     },
//     recentQuotations: user.quotations,
//     recentInvoices: user.invoices,
//     // Remove the internal fields
//     quotations: undefined,
//     invoices: undefined,
//     _count: undefined
//   };

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       user: transformedUser
//     }
//   });
// });

// // Create new user
// const createUser = asyncHandler(async (req, res) => {
//   const { email, password, firstName, lastName, role = ROLES.USER } = req.body;

//   // Check if user already exists
//   const existingUser = await prisma.user.findUnique({
//     where: { email }
//   });

//   if (existingUser) {
//     throw new AppError('User with this email already exists', STATUS_CODES.CONFLICT);
//   }

//   // Hash password
//   const saltRounds = 12;
//   const hashedPassword = await bcrypt.hash(password, saltRounds);

//   // Create user
//   const newUser = await prisma.user.create({
//     data: {
//       email,
//       password: hashedPassword,
//       firstName,
//       lastName,
//       role,
//       isActive: true
//     },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       createdAt: true
//     }
//   });

//   try {
//   await notifyUserCreated(newUser, req.user);
// } catch (error) {
//   console.error('Error sending notification:', error);
// }

//   res.status(STATUS_CODES.CREATED).json({
//     success: true,
//     message: MESSAGES.SUCCESS.CREATED,
//     data: { user: newUser }
//   });
  
// });

// // Update user
// // const updateUser = asyncHandler(async (req, res) => {
// //   const { id } = req.params;
// //   const { email, firstName, lastName, role, isActive } = req.body;

// //   // Check if user exists
// //   const existingUser = await prisma.user.findUnique({
// //     where: { id }
// //   });

// //   if (!existingUser) {
// //     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
// //   }

// //   // Check if email is already taken by another user
// //   if (email && email !== existingUser.email) {
// //     const emailTaken = await prisma.user.findFirst({
// //       where: {
// //         email,
// //         NOT: { id }
// //       }
// //     });

// //     if (emailTaken) {
// //       throw new AppError('Email is already taken by another user', STATUS_CODES.CONFLICT);
// //     }
// //   }

// //   // Prevent users from changing their own role to a higher one
// //   if (req.user.id === id && role && role !== existingUser.role) {
// //     const { ROLE_HIERARCHY } = require('../config/constants');
// //     const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
// //     const newRoleLevel = ROLE_HIERARCHY[role] || 0;
    
// //     if (newRoleLevel > currentUserLevel) {
// //       throw new AppError('Cannot promote yourself to a higher role', STATUS_CODES.FORBIDDEN);
// //     }
// //   }

// //   // Update user
// //   const updatedUser = await prisma.user.update({
// //     where: { id },
// //     data: {
// //       ...(email && { email }),
// //       ...(firstName && { firstName }),
// //       ...(lastName && { lastName }),
// //       ...(role && { role }),
// //       ...(typeof isActive === 'boolean' && { isActive }),
// //       updatedAt: new Date()
// //     },
// //     select: {
// //       id: true,
// //       email: true,
// //       firstName: true,
// //       lastName: true,
// //       role: true,
// //       isActive: true,
// //       createdAt: true,
// //       updatedAt: true
// //     }
// //   });

// //   res.status(STATUS_CODES.OK).json({
// //     success: true,
// //     message: MESSAGES.SUCCESS.UPDATED,
// //     data: { user: updatedUser }
// //   });
// // });

// // Fixed updateUser function in your users controller
// const updateUser = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { email, firstName, lastName, role, isActive, password } = req.body; // ✅ Added password

//   console.log('🔧 Update request received:', {
//     id,
//     email,
//     firstName,
//     lastName,
//     role,
//     isActive,
//     hasPassword: !!password
//   });

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: { id }
//   });

//   if (!existingUser) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Check if email is already taken by another user
//   if (email && email !== existingUser.email) {
//     const emailTaken = await prisma.user.findFirst({
//       where: {
//         email,
//         NOT: { id }
//       }
//     });

//     if (emailTaken) {
//       throw new AppError('Email is already taken by another user', STATUS_CODES.CONFLICT);
//     }
//   }

//   // Prevent users from changing their own role to a higher one
//   if (req.user.id === id && role && role !== existingUser.role) {
//     const { ROLE_HIERARCHY } = require('../config/constants');
//     const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
//     const newRoleLevel = ROLE_HIERARCHY[role] || 0;
    
//     if (newRoleLevel > currentUserLevel) {
//       throw new AppError('Cannot promote yourself to a higher role', STATUS_CODES.FORBIDDEN);
//     }
//   }

//   // ✅ CRITICAL FIX: Prepare update data with password handling
//   const updateData = {
//     ...(email && { email }),
//     ...(firstName && { firstName }),
//     ...(lastName && { lastName }),
//     ...(role && { role }),
//     ...(typeof isActive === 'boolean' && { isActive }),
//     updatedAt: new Date()
//   };

//   // ✅ CRITICAL FIX: Handle password update with proper hashing
//   if (password && password.trim()) {
//     console.log('🔐 Password update requested for user:', id);
//     console.log('🔐 Password length:', password.length);
    
//     // Hash the password using the same method as createUser and changePassword
//     const saltRounds = 12;
//     const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    
//     updateData.password = hashedPassword;
//     console.log('✅ Password hashed successfully');
//   }

//   console.log('📤 Sending update data to database:', {
//     ...updateData,
//     password: updateData.password ? '[HASHED]' : '[NOT_INCLUDED]'
//   });

//   // Update user
//   const updatedUser = await prisma.user.update({
//     where: { id },
//     data: updateData,
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       createdAt: true,
//       updatedAt: true
//     }
//   });

//   console.log('✅ User updated successfully:', updatedUser.id);

//   // ✅ OPTIONAL: Verify password was saved correctly
//   if (password && password.trim()) {
//     const userWithPassword = await prisma.user.findUnique({
//       where: { id },
//       select: { password: true }
//     });
    
//     // Test the new password
//     const isPasswordValid = await bcrypt.compare(password.trim(), userWithPassword.password);
//     console.log('🧪 Password verification test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
//     if (!isPasswordValid) {
//       console.error('❌ Password was not saved correctly!');
//       throw new AppError('Password update failed - verification failed', STATUS_CODES.INTERNAL_SERVER_ERROR);
//     }
//   }

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: password && password.trim() 
//       ? 'User updated successfully - password changed' 
//       : MESSAGES.SUCCESS.UPDATED,
//     data: { user: updatedUser }
//   });
// });

// const updateUserPassword = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { password } = req.body;

//   if (!password || !password.trim()) {
//     throw new AppError('Password is required', STATUS_CODES.BAD_REQUEST);
//   }

//   console.log('🔐 Password-only update for user:', id);

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: { id },
//     select: { id: true, email: true }
//   });

//   if (!existingUser) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Hash password
//   const saltRounds = 12;
//   const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

//   // Update only password
//   await prisma.user.update({
//     where: { id },
//     data: {
//       password: hashedPassword,
//       updatedAt: new Date()
//     }
//   });

//   // Verify password was saved correctly
//   const updatedUser = await prisma.user.findUnique({
//     where: { id },
//     select: { password: true }
//   });

//   const isPasswordValid = await bcrypt.compare(password.trim(), updatedUser.password);
//   console.log('🧪 Password saved and verified:', isPasswordValid ? '✅ SUCCESS' : '❌ FAILED');

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Password updated successfully'
//   });
// });

// // Delete user (soft delete by deactivating)
// const deleteUser = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: { id },
//     select: { id: true, role: true, email: true }
//   });

//   if (!existingUser) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Prevent users from deleting themselves
//   if (req.user.id === id) {
//     throw new AppError('Cannot delete your own account', STATUS_CODES.FORBIDDEN);
//   }

//   // Check if this is the only SUPER_ADMIN
//   if (existingUser.role === ROLES.SUPER_ADMIN) {
//     const superAdminCount = await prisma.user.count({
//       where: { 
//         role: ROLES.SUPER_ADMIN,
//         isActive: true 
//       }
//     });

//     if (superAdminCount <= 1) {
//       throw new AppError('Cannot delete the only active Super Admin', STATUS_CODES.FORBIDDEN);
//     }
//   }

//   // Soft delete - deactivate user instead of permanent deletion
//   const deactivatedUser = await prisma.user.update({
//     where: { id },
//     data: {
//       isActive: false,
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       isActive: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'User deactivated successfully',
//     data: { user: deactivatedUser }
//   });
// });

// // Activate/Deactivate user
// const toggleUserStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { isActive } = req.body;

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: { id },
//     select: { id: true, role: true, isActive: true }
//   });

//   if (!existingUser) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Prevent users from deactivating themselves
//   if (req.user.id === id && isActive === false) {
//     throw new AppError('Cannot deactivate your own account', STATUS_CODES.FORBIDDEN);
//   }

//   // Check if trying to deactivate the only SUPER_ADMIN
//   if (existingUser.role === ROLES.SUPER_ADMIN && isActive === false) {
//     const activeSuperAdminCount = await prisma.user.count({
//       where: { 
//         role: ROLES.SUPER_ADMIN,
//         isActive: true,
//         NOT: { id }
//       }
//     });

//     if (activeSuperAdminCount === 0) {
//       throw new AppError('Cannot deactivate the only active Super Admin', STATUS_CODES.FORBIDDEN);
//     }
//   }

//   // Update user status
//   const updatedUser = await prisma.user.update({
//     where: { id },
//     data: {
//       isActive,
//       updatedAt: new Date()
//     },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       updatedAt: true
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
//     data: { user: updatedUser }
//   });
// });

// // Reset user password (Admin function)
// const resetUserPassword = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { newPassword } = req.body;

//   // Check if user exists
//   const existingUser = await prisma.user.findUnique({
//     where: { id },
//     select: { id: true, email: true, role: true }
//   });

//   if (!existingUser) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Hash new password
//   const saltRounds = 12;
//   const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

//   // Update password
//   await prisma.user.update({
//     where: { id },
//     data: {
//       password: hashedPassword,
//       updatedAt: new Date()
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'User password reset successfully'
//   });
// });

// // Get user statistics
// const getUserStatistics = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const user = await prisma.user.findUnique({
//     where: { id },
//     select: { id: true }
//   });

//   if (!user) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Get detailed statistics
//   const [quotationStats, invoiceStats, recentActivity] = await Promise.all([
//     // Quotation statistics
//     prisma.quotation.groupBy({
//       by: ['status'],
//       where: { userId: id },
//       _count: { status: true },
//       _sum: { totalAmount: true }
//     }),
    
//     // Invoice statistics
//     prisma.invoice.groupBy({
//       by: ['status'],
//       where: { userId: id },
//       _count: { status: true },
//       _sum: { totalAmount: true }
//     }),
    
//     // Recent activity (last 10 quotations and invoices)
//     Promise.all([
//       prisma.quotation.findMany({
//         where: { userId: id },
//         select: {
//           id: true,
//           quotationNumber: true,
//           title: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true,
//           client: {
//             select: { companyName: true }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 5
//       }),
//       prisma.invoice.findMany({
//         where: { userId: id },
//         select: {
//           id: true,
//           invoiceNumber: true,
//           status: true,
//           totalAmount: true,
//           createdAt: true,
//           client: {
//             select: { companyName: true }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         take: 5
//       })
//     ])
//   ]);

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       quotationStatistics: quotationStats,
//       invoiceStatistics: invoiceStats,
//       recentQuotations: recentActivity[0],
//       recentInvoices: recentActivity[1]
//     }
//   });
// });
// // Add bulk actions endpoint that your frontend expects
// const bulkUserAction = asyncHandler(async (req, res) => {
//   const { userIds, action } = req.body;

//   if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//     throw new AppError('User IDs are required', STATUS_CODES.BAD_REQUEST);
//   }

//   if (!['activate', 'deactivate', 'delete'].includes(action)) {
//     throw new AppError('Invalid action', STATUS_CODES.BAD_REQUEST);
//   }

//   // Prevent users from affecting themselves
//   if (userIds.includes(req.user.id)) {
//     throw new AppError('Cannot perform bulk action on your own account', STATUS_CODES.FORBIDDEN);
//   }

//   try {
//     let result;
    
//     switch (action) {
//       case 'activate':
//         result = await prisma.user.updateMany({
//           where: { 
//             id: { in: userIds },
//             NOT: { id: req.user.id } // Extra safety
//           },
//           data: { isActive: true, updatedAt: new Date() }
//         });
//         break;
        
//       case 'deactivate':
//         // Check if any are SUPER_ADMINs that would be the last active one
//         const superAdmins = await prisma.user.findMany({
//           where: { 
//             id: { in: userIds },
//             role: ROLES.SUPER_ADMIN 
//           }
//         });
        
//         if (superAdmins.length > 0) {
//           const activeSuperAdminCount = await prisma.user.count({
//             where: { 
//               role: ROLES.SUPER_ADMIN,
//               isActive: true,
//               NOT: { id: { in: userIds } }
//             }
//           });
          
//           if (activeSuperAdminCount === 0) {
//             throw new AppError('Cannot deactivate all Super Admins', STATUS_CODES.FORBIDDEN);
//           }
//         }
        
//         result = await prisma.user.updateMany({
//           where: { 
//             id: { in: userIds },
//             NOT: { id: req.user.id }
//           },
//           data: { isActive: false, updatedAt: new Date() }
//         });
//         break;
        
//       case 'delete':
//         // For delete, we'll do soft delete (deactivate)
//         // Same checks as deactivate
//         const deleteSuperAdmins = await prisma.user.findMany({
//           where: { 
//             id: { in: userIds },
//             role: ROLES.SUPER_ADMIN 
//           }
//         });
        
//         if (deleteSuperAdmins.length > 0) {
//           const remainingActiveSuperAdmins = await prisma.user.count({
//             where: { 
//               role: ROLES.SUPER_ADMIN,
//               isActive: true,
//               NOT: { id: { in: userIds } }
//             }
//           });
          
//           if (remainingActiveSuperAdmins === 0) {
//             throw new AppError('Cannot delete all Super Admins', STATUS_CODES.FORBIDDEN);
//           }
//         }
        
//         result = await prisma.user.updateMany({
//           where: { 
//             id: { in: userIds },
//             NOT: { id: req.user.id }
//           },
//           data: { isActive: false, updatedAt: new Date() }
//         });
//         break;
//     }

//     res.status(STATUS_CODES.OK).json({
//       success: true,
//       message: `Successfully ${action}d ${result.count} users`,
//       data: { affectedCount: result.count }
//     });
    
//   } catch (error) {
//     throw new AppError(`Failed to ${action} users: ${error.message}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// });

// // Add get available roles endpoint
// const getAvailableRoles = asyncHandler(async (req, res) => {
//   const { ROLE_HIERARCHY } = require('../config/constants');
  
//   // Get roles that current user can assign
//   const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
  
//   const availableRoles = Object.entries(ROLES)
//     .filter(([_, role]) => {
//       const roleLevel = ROLE_HIERARCHY[role] || 0;
//       return roleLevel <= currentUserLevel; // Can assign roles at or below their level
//     })
//     .map(([key, value]) => ({
//       value,
//       label: key.split('_').map(word => 
//         word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//       ).join(' '),
//       level: ROLE_HIERARCHY[value] || 0
//     }))
//     .sort((a, b) => b.level - a.level); // Sort by level, highest first

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Available roles fetched successfully',
//     data: { roles: availableRoles }
//   });
// });

// module.exports = {
//   getUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   updateUserPassword,
//   deleteUser,
//   toggleUserStatus,
//   resetUserPassword,
//   getUserStatistics,
//   bulkUserAction, // New
//   getAvailableRoles // New
// };


const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, MESSAGES, ROLES, PAGINATION } = require('../config/constants');
const { buildUserFilteredWhere, canAccessRecord } = require('../middleware/userFiltering'); // NEW
const { notifyUserCreated } = require('../services/notificationService');

// Get all users with pagination and filtering
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    role = '',
    isActive = ''
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const where = {};

  // Search in firstName, lastName, or email
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filter by role
  if (role && Object.values(ROLES).includes(role)) {
    where.role = role;
  }

  // Filter by active status
  if (isActive !== '') {
    where.isActive = isActive === 'true';
  }

  // NOTE: User management is role-based, not ownership-based
  // No user filtering applied here - admins see all users
  // Access control is handled by requirePermission middleware

  // Build orderBy clause
  const orderBy = {};
  orderBy[sortBy] = sortOrder;

  // Get users with pagination
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
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
    prisma.user.count({ where })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      users: users.map(user => ({
        ...user,
        statistics: {
          totalQuotations: user._count.quotations,
          totalInvoices: user._count.invoices
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

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      quotations: {
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: {
        select: {
          quotations: true,
          invoices: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // UPDATED: Allow admins to see any user profile, or users to see their own profile
  const { hasPermission } = require('../middleware/permissions');
  const isAdmin = hasPermission(req.user.role, 'users:read');
  const isOwnProfile = req.user.id === id;

  if (!isAdmin && !isOwnProfile) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Transform the response to match frontend expectations
  const transformedUser = {
    ...user,
    statistics: {
      totalQuotations: user._count.quotations,
      totalInvoices: user._count.invoices
    },
    recentQuotations: user.quotations,
    recentInvoices: user.invoices,
    // Remove the internal fields
    quotations: undefined,
    invoices: undefined,
    _count: undefined
  };

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      user: transformedUser
    }
  });
});

// Create new user
const createUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = ROLES.USER } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', STATUS_CODES.CONFLICT);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  try {
    await notifyUserCreated(newUser, req.user);
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.SUCCESS.CREATED,
    data: { user: newUser }
  });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, role, isActive, password } = req.body;

  console.log('🔧 Update request received:', {
    id,
    email,
    firstName,
    lastName,
    role,
    isActive,
    hasPassword: !!password
  });

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // UPDATED: Enhanced access control for user updates
  const { hasPermission } = require('../middleware/permissions');
  const isAdmin = hasPermission(req.user.role, 'users:update');
  const isOwnProfile = req.user.id === id;

  // Only admins can update other users, users can update their own profile (limited fields)
  if (!isAdmin && !isOwnProfile) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // If not admin but updating own profile, restrict what can be changed
  if (!isAdmin && isOwnProfile) {
    // Regular users can only update their own name and email, not role or isActive
    if (role && role !== existingUser.role) {
      throw new AppError('Cannot change your own role', STATUS_CODES.FORBIDDEN);
    }
    if (typeof isActive === 'boolean' && isActive !== existingUser.isActive) {
      throw new AppError('Cannot change your own account status', STATUS_CODES.FORBIDDEN);
    }
  }

  // Check if email is already taken by another user
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });

    if (emailTaken) {
      throw new AppError('Email is already taken by another user', STATUS_CODES.CONFLICT);
    }
  }

  // Prevent users from changing their own role to a higher one
  if (req.user.id === id && role && role !== existingUser.role) {
    const { ROLE_HIERARCHY } = require('../config/constants');
    const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const newRoleLevel = ROLE_HIERARCHY[role] || 0;
    
    if (newRoleLevel > currentUserLevel) {
      throw new AppError('Cannot promote yourself to a higher role', STATUS_CODES.FORBIDDEN);
    }
  }

  // Prepare update data with password handling
  const updateData = {
    ...(email && { email }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(role && isAdmin && { role }), // Only admins can change roles
    ...(typeof isActive === 'boolean' && isAdmin && { isActive }), // Only admins can change status
    updatedAt: new Date()
  };

  // Handle password update with proper hashing
  if (password && password.trim()) {
    console.log('🔐 Password update requested for user:', id);
    console.log('🔐 Password length:', password.length);
    
    // Hash the password using the same method as createUser and changePassword
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    
    updateData.password = hashedPassword;
    console.log('✅ Password hashed successfully');
  }

  console.log('📤 Sending update data to database:', {
    ...updateData,
    password: updateData.password ? '[HASHED]' : '[NOT_INCLUDED]'
  });

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  console.log('✅ User updated successfully:', updatedUser.id);

  // Verify password was saved correctly
  if (password && password.trim()) {
    const userWithPassword = await prisma.user.findUnique({
      where: { id },
      select: { password: true }
    });
    
    // Test the new password
    const isPasswordValid = await bcrypt.compare(password.trim(), userWithPassword.password);
    console.log('🧪 Password verification test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isPasswordValid) {
      console.error('❌ Password was not saved correctly!');
      throw new AppError('Password update failed - verification failed', STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: password && password.trim() 
      ? 'User updated successfully - password changed' 
      : MESSAGES.SUCCESS.UPDATED,
    data: { user: updatedUser }
  });
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || !password.trim()) {
    throw new AppError('Password is required', STATUS_CODES.BAD_REQUEST);
  }

  console.log('🔐 Password-only update for user:', id);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true }
  });

  if (!existingUser) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // UPDATED: Enhanced access control
  const { hasPermission } = require('../middleware/permissions');
  const isAdmin = hasPermission(req.user.role, 'users:update');
  const isOwnProfile = req.user.id === id;

  if (!isAdmin && !isOwnProfile) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

  // Update only password
  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  // Verify password was saved correctly
  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: { password: true }
  });

  const isPasswordValid = await bcrypt.compare(password.trim(), updatedUser.password);
  console.log('🧪 Password saved and verified:', isPasswordValid ? '✅ SUCCESS' : '❌ FAILED');

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// Delete user (soft delete by deactivating)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true }
  });

  if (!existingUser) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Prevent users from deleting themselves
  if (req.user.id === id) {
    throw new AppError('Cannot delete your own account', STATUS_CODES.FORBIDDEN);
  }

  // Check if this is the only SUPER_ADMIN
  if (existingUser.role === ROLES.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { 
        role: ROLES.SUPER_ADMIN,
        isActive: true 
      }
    });

    if (superAdminCount <= 1) {
      throw new AppError('Cannot delete the only active Super Admin', STATUS_CODES.FORBIDDEN);
    }
  }

  // Soft delete - deactivate user instead of permanent deletion
  const deactivatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'User deactivated successfully',
    data: { user: deactivatedUser }
  });
});

// Activate/Deactivate user
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true }
  });

  if (!existingUser) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Prevent users from deactivating themselves
  if (req.user.id === id && isActive === false) {
    throw new AppError('Cannot deactivate your own account', STATUS_CODES.FORBIDDEN);
  }

  // Check if trying to deactivate the only SUPER_ADMIN
  if (existingUser.role === ROLES.SUPER_ADMIN && isActive === false) {
    const activeSuperAdminCount = await prisma.user.count({
      where: { 
        role: ROLES.SUPER_ADMIN,
        isActive: true,
        NOT: { id }
      }
    });

    if (activeSuperAdminCount === 0) {
      throw new AppError('Cannot deactivate the only active Super Admin', STATUS_CODES.FORBIDDEN);
    }
  }

  // Update user status
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user: updatedUser }
  });
});

// Reset user password (Admin function)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  if (!existingUser) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'User password reset successfully'
  });
});

// Get user statistics
const getUserStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!user) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // UPDATED: Enhanced access control for user statistics
  const { hasPermission } = require('../middleware/permissions');
  const isAdmin = hasPermission(req.user.role, 'users:read');
  const isOwnProfile = req.user.id === id;

  if (!isAdmin && !isOwnProfile) {
    throw new AppError(MESSAGES.ERROR.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Get detailed statistics
  const [quotationStats, invoiceStats, recentActivity] = await Promise.all([
    // Quotation statistics
    prisma.quotation.groupBy({
      by: ['status'],
      where: { userId: id },
      _count: { status: true },
      _sum: { totalAmount: true }
    }),
    
    // Invoice statistics
    prisma.invoice.groupBy({
      by: ['status'],
      where: { userId: id },
      _count: { status: true },
      _sum: { totalAmount: true }
    }),
    
    // Recent activity (last 10 quotations and invoices)
    Promise.all([
      prisma.quotation.findMany({
        where: { userId: id },
        select: {
          id: true,
          quotationNumber: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          client: {
            select: { companyName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.invoice.findMany({
        where: { userId: id },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          client: {
            select: { companyName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])
  ]);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      quotationStatistics: quotationStats,
      invoiceStatistics: invoiceStats,
      recentQuotations: recentActivity[0],
      recentInvoices: recentActivity[1]
    }
  });
});

// Bulk user actions
const bulkUserAction = asyncHandler(async (req, res) => {
  const { userIds, action } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('User IDs are required', STATUS_CODES.BAD_REQUEST);
  }

  if (!['activate', 'deactivate', 'delete'].includes(action)) {
    throw new AppError('Invalid action', STATUS_CODES.BAD_REQUEST);
  }

  // Prevent users from affecting themselves
  if (userIds.includes(req.user.id)) {
    throw new AppError('Cannot perform bulk action on your own account', STATUS_CODES.FORBIDDEN);
  }

  try {
    let result;
    
    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            NOT: { id: req.user.id } // Extra safety
          },
          data: { isActive: true, updatedAt: new Date() }
        });
        break;
        
      case 'deactivate':
        // Check if any are SUPER_ADMINs that would be the last active one
        const superAdmins = await prisma.user.findMany({
          where: { 
            id: { in: userIds },
            role: ROLES.SUPER_ADMIN 
          }
        });
        
        if (superAdmins.length > 0) {
          const activeSuperAdminCount = await prisma.user.count({
            where: { 
              role: ROLES.SUPER_ADMIN,
              isActive: true,
              NOT: { id: { in: userIds } }
            }
          });
          
          if (activeSuperAdminCount === 0) {
            throw new AppError('Cannot deactivate all Super Admins', STATUS_CODES.FORBIDDEN);
          }
        }
        
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            NOT: { id: req.user.id }
          },
          data: { isActive: false, updatedAt: new Date() }
        });
        break;
        
      case 'delete':
        // For delete, we'll do soft delete (deactivate)
        // Same checks as deactivate
        const deleteSuperAdmins = await prisma.user.findMany({
          where: { 
            id: { in: userIds },
            role: ROLES.SUPER_ADMIN 
          }
        });
        
        if (deleteSuperAdmins.length > 0) {
          const remainingActiveSuperAdmins = await prisma.user.count({
            where: { 
              role: ROLES.SUPER_ADMIN,
              isActive: true,
              NOT: { id: { in: userIds } }
            }
          });
          
          if (remainingActiveSuperAdmins === 0) {
            throw new AppError('Cannot delete all Super Admins', STATUS_CODES.FORBIDDEN);
          }
        }
        
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            NOT: { id: req.user.id }
          },
          data: { isActive: false, updatedAt: new Date() }
        });
        break;
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Successfully ${action}d ${result.count} users`,
      data: { affectedCount: result.count }
    });
    
  } catch (error) {
    throw new AppError(`Failed to ${action} users: ${error.message}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Get available roles
const getAvailableRoles = asyncHandler(async (req, res) => {
  const { ROLE_HIERARCHY } = require('../config/constants');
  
  // Get roles that current user can assign
  const currentUserLevel = ROLE_HIERARCHY[req.user.role] || 0;
  
  const availableRoles = Object.entries(ROLES)
    .filter(([_, role]) => {
      const roleLevel = ROLE_HIERARCHY[role] || 0;
      return roleLevel <= currentUserLevel; // Can assign roles at or below their level
    })
    .map(([key, value]) => ({
      value,
      label: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' '),
      level: ROLE_HIERARCHY[value] || 0
    }))
    .sort((a, b) => b.level - a.level); // Sort by level, highest first

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Available roles fetched successfully',
    data: { roles: availableRoles }
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStatistics,
  bulkUserAction,
  getAvailableRoles
};