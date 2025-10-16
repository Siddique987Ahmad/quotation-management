// const bcrypt = require('bcryptjs');
// const { prisma } = require('../config/database');
// const { generateToken } = require('../utils/jwt');
// const { AppError, asyncHandler } = require('../middleware/errorHandler');
// const { STATUS_CODES, MESSAGES, ROLES } = require('../config/constants');

// // Register new user (First user becomes SUPER_ADMIN)
// const register = asyncHandler(async (req, res) => {
//   const { email, password, firstName, lastName, role } = req.body;

//   // Check if user already exists
//   const existingUser = await prisma.user.findUnique({
//     where: { email }
//   });

//   if (existingUser) {
//     throw new AppError('User with this email already exists', STATUS_CODES.CONFLICT);
//   }

//   // Check if this is the first user
//   const userCount = await prisma.user.count();
//   let userRole = role || ROLES.USER;

//   // First user becomes SUPER_ADMIN
//   if (userCount === 0) {
//     userRole = ROLES.SUPER_ADMIN;
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
//       role: userRole,
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

//   // Generate JWT token
//   const token = generateToken(newUser);

//   res.status(STATUS_CODES.CREATED).json({
//     success: true,
//     message: userCount === 0 ? 'Super Admin account created successfully' : MESSAGES.SUCCESS.CREATED,
//     data: {
//       user: newUser,
//       token,
//       expiresIn: process.env.JWT_EXPIRES_IN || '7d'
//     }
//   });
// });

// // Login user
// const login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   // Find user by email
//   const user = await prisma.user.findUnique({
//     where: { email },
//     select: {
//       id: true,
//       email: true,
//       password: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       createdAt: true
//     }
//   });

//   // Check if user exists and password is correct
//   if (!user || !await bcrypt.compare(password, user.password)) {
//     throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
//   }

//   // Check if user is active
//   if (!user.isActive) {
//     throw new AppError('Your account has been deactivated. Please contact administrator.', STATUS_CODES.FORBIDDEN);
//   }

//   // Remove password from response
//   const { password: _, ...userWithoutPassword } = user;

//   // Generate JWT token
//   const token = generateToken(userWithoutPassword);

//   // Update last login (optional)
//   await prisma.user.update({
//     where: { id: user.id },
//     data: { updatedAt: new Date() }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.LOGIN,
//     data: {
//       user: userWithoutPassword,
//       token,
//       expiresIn: process.env.JWT_EXPIRES_IN || '7d'
//     }
//   });
// });

// // Get current user profile
// const getProfile = asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       lastName: true,
//       role: true,
//       isActive: true,
//       createdAt: true,
//       updatedAt: true,
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

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.FETCHED,
//     data: {
//       user: {
//         ...user,
//         statistics: {
//           totalQuotations: user._count.quotations,
//           totalInvoices: user._count.invoices
//         }
//       }
//     }
//   });
// });

// // Update profile
// const updateProfile = asyncHandler(async (req, res) => {
//   const userId = req.user.id;
//   const { firstName, lastName, email } = req.body;

//   // Check if email is already taken by another user
//   if (email) {
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         email,
//         NOT: { id: userId }
//       }
//     });

//     if (existingUser) {
//       throw new AppError('Email is already taken by another user', STATUS_CODES.CONFLICT);
//     }
//   }

//   // Update user profile
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       ...(firstName && { firstName }),
//       ...(lastName && { lastName }),
//       ...(email && { email }),
//       updatedAt: new Date()
//     },
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

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.UPDATED,
//     data: { user: updatedUser }
//   });
// });

// // Change password
// const changePassword = asyncHandler(async (req, res) => {
//   const userId = req.user.id;
//   const { currentPassword, newPassword } = req.body;

//   // Get user with password
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, password: true }
//   });

//   if (!user) {
//     throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
//   }

//   // Verify current password
//   const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//   if (!isCurrentPasswordValid) {
//     throw new AppError('Current password is incorrect', STATUS_CODES.BAD_REQUEST);
//   }

//   // Hash new password
//   const saltRounds = 12;
//   const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

//   // Update password
//   await prisma.user.update({
//     where: { id: userId },
//     data: {
//       password: hashedNewPassword,
//       updatedAt: new Date()
//     }
//   });

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Password changed successfully'
//   });
// });

// // Refresh token
// const refreshToken = asyncHandler(async (req, res) => {
//   const userId = req.user.id;

//   // Get fresh user data
//   const user = await prisma.user.findUnique({
//     where: { id: userId, isActive: true },
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

//   if (!user) {
//     throw new AppError('User not found or inactive', STATUS_CODES.NOT_FOUND);
//   }

//   // Generate new token
//   const token = generateToken(user);

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Token refreshed successfully',
//     data: {
//       user,
//       token,
//       expiresIn: process.env.JWT_EXPIRES_IN || '7d'
//     }
//   });
// });

// // Logout (optional - mainly for client-side token removal)
// const logout = asyncHandler(async (req, res) => {
//   // In a stateless JWT system, logout is mainly handled client-side
//   // But we can perform any server-side cleanup here if needed
  
//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: MESSAGES.SUCCESS.LOGOUT
//   });
// });

// // Check if system has any users (for initial setup)
// const checkSystemStatus = asyncHandler(async (req, res) => {
//   const userCount = await prisma.user.count();
//   const hasUsers = userCount > 0;

//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     data: {
//       hasUsers,
//       userCount,
//       requiresSetup: !hasUsers,
//       message: hasUsers 
//         ? 'System is set up and ready' 
//         : 'System requires initial setup - first user will become Super Admin'
//     }
//   });
// });

// // Forgot password (placeholder for future implementation)
// const forgotPassword = asyncHandler(async (req, res) => {
//   // TODO: Implement email-based password reset
//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Password reset functionality will be implemented soon'
//   });
// });

// // Reset password (placeholder for future implementation)
// const resetPassword = asyncHandler(async (req, res) => {
//   // TODO: Implement password reset with token verification
//   res.status(STATUS_CODES.OK).json({
//     success: true,
//     message: 'Password reset functionality will be implemented soon'
//   });
// });

// module.exports = {
//   register,
//   login,
//   getProfile,
//   updateProfile,
//   changePassword,
//   refreshToken,
//   logout,
//   checkSystemStatus,
//   forgotPassword,
//   resetPassword
// };



const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../services/emailService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, MESSAGES, ROLES } = require('../config/constants');
const { getPermissionsForRole } = require('./rolePermissionController');


// Register new user (First user becomes SUPER_ADMIN)
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', STATUS_CODES.CONFLICT);
  }

  // Check if this is the first user
  const userCount = await prisma.user.count();
  let userRole = role || ROLES.USER;

  // First user becomes SUPER_ADMIN
  if (userCount === 0) {
    userRole = ROLES.SUPER_ADMIN;
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
      role: userRole,
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

  // Generate JWT token
  const token = generateToken(newUser);

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: userCount === 0 ? 'Super Admin account created successfully' : MESSAGES.SUCCESS.CREATED,
    data: {
      user: newUser,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  // Check if user exists and password is correct
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact administrator.', STATUS_CODES.FORBIDDEN);
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Generate JWT token
  const token = generateToken(userWithoutPassword);

  // Update last login (optional)
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.LOGIN,
    data: {
      user: userWithoutPassword,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  });
});

/**
 * Get current user's permissions (from database)
 */
const getMyPermissions = async (req, res, next) => {
  try {    
    const rolePermissions = await getPermissionsForRole(req.user.role);
    const customPermissions = req.user.customPermissions || [];
    
    // Combine role-based and custom permissions
    const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
    
    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: {
        role: req.user.role,
        rolePermissions,
        customPermissions,
        allPermissions
      }
    });
  } catch (error) {
    next(error);
  }
};



// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    }
  });

  if (!user) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.FETCHED,
    data: {
      user: {
        ...user,
        statistics: {
          totalQuotations: user._count.quotations,
          totalInvoices: user._count.invoices
        }
      }
    }
  });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      throw new AppError('Email is already taken by another user', STATUS_CODES.CONFLICT);
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      updatedAt: new Date()
    },
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

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.UPDATED,
    data: { user: updatedUser }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true }
  });

  if (!user) {
    throw new AppError(MESSAGES.ERROR.NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', STATUS_CODES.BAD_REQUEST);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      updatedAt: new Date()
    }
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
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

  if (!user) {
    throw new AppError('User not found or inactive', STATUS_CODES.NOT_FOUND);
  }

  // Generate new token
  const token = generateToken(user);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  });
});

// Logout (optional - mainly for client-side token removal)
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is mainly handled client-side
  // But we can perform any server-side cleanup here if needed
  
  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.LOGOUT
  });
});

// Check if system has any users (for initial setup)
const checkSystemStatus = asyncHandler(async (req, res) => {
  const userCount = await prisma.user.count();
  const hasUsers = userCount > 0;

  res.status(STATUS_CODES.OK).json({
    success: true,
    data: {
      hasUsers,
      userCount,
      requiresSetup: !hasUsers,
      message: hasUsers 
        ? 'System is set up and ready' 
        : 'System requires initial setup - first user will become Super Admin'
    }
  });
});

// WORKING: Forgot password - generate and send reset token
// const forgotPassword = asyncHandler(async (req, res) => {
//   const { email } = req.body;

//   // Find user by email
//   const user = await prisma.user.findUnique({
//     where: { email: email.toLowerCase() },
//     select: {
//       id: true,
//       email: true,
//       firstName: true,
//       isActive: true
//     }
//   });

//   // Always return success to prevent email enumeration attacks
//   const successResponse = {
//     success: true,
//     message: 'If an account with this email exists, you will receive a password reset link shortly.'
//   };

//   // If user doesn't exist or is inactive, still return success but don't send email
//   if (!user || !user.isActive) {
//     return res.status(STATUS_CODES.OK).json(successResponse);
//   }

//   try {
//     // Generate secure random token
//     const resetToken = crypto.randomBytes(32).toString('hex');
    
//     // Set expiration to 1 hour from now
//     const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//     // Delete any existing password reset tokens for this user
//     await prisma.passwordReset.deleteMany({
//       where: { userId: user.id }
//     });

//     // Create new password reset record
//     await prisma.passwordReset.create({
//       data: {
//         email: user.email,
//         token: resetToken,
//         userId: user.id,
//         expiresAt: expiresAt,
//         used: false
//       }
//     });

//     // Send password reset email
//     await sendPasswordResetEmail(user.email, resetToken, user.firstName);

//     console.log(`Password reset email sent to: ${user.email}`);
    
//   } catch (error) {
//     console.error('Error in forgot password process:', error);
    
//     // Clean up any created reset token if email failed
//     try {
//       await prisma.passwordReset.deleteMany({
//         where: { 
//           userId: user.id,
//           createdAt: {
//             gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
//           }
//         }
//       });
//     } catch (cleanupError) {
//       console.error('Error cleaning up reset token:', cleanupError);
//     }

//     throw new AppError('Failed to send password reset email. Please try again later.', STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }

//   res.status(STATUS_CODES.OK).json(successResponse);
// });

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  console.log('🔍 Forgot password request for:', email);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      firstName: true,
      isActive: true
    }
  });

  // Always return success to prevent email enumeration attacks
  const successResponse = {
    success: true,
    message: 'If an account with this email exists, you will receive a password reset link shortly.'
  };

  // If user doesn't exist or is inactive, still return success but don't send email
  if (!user || !user.isActive) {
    console.log('⚠️ User not found or inactive for email:', email);
    return res.status(STATUS_CODES.OK).json(successResponse);
  }

  console.log('✅ User found:', user.firstName, user.email);

  try {
    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated reset token');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing password reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Create new password reset record
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: resetToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false
      }
    });

    console.log('💾 Password reset token saved to database');

    // Send password reset email - THIS IS WHERE THE FIX IS APPLIED
    await sendPasswordResetEmail(user.email, resetToken, user.firstName);

    console.log('📧 Password reset email sent successfully to:', user.email);
    
  } catch (error) {
    console.error('❌ Error in forgot password process:', error);
    
    // Clean up any created reset token if email failed
    try {
      await prisma.passwordReset.deleteMany({
        where: { 
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      });
    } catch (cleanupError) {
      console.error('❌ Error cleaning up reset token:', cleanupError);
    }

    throw new AppError('Failed to send password reset email. Please try again later.', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  res.status(STATUS_CODES.OK).json(successResponse);
});

// WORKING: Reset password with token verification
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', STATUS_CODES.BAD_REQUEST);
  }

  // Find the reset token
  const passwordReset = await prisma.passwordReset.findFirst({
    where: {
      token: token,
      used: false,
      expiresAt: {
        gt: new Date() // Token hasn't expired
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          isActive: true
        }
      }
    }
  });

  if (!passwordReset) {
    throw new AppError('Invalid or expired reset token. Please request a new password reset.', STATUS_CODES.BAD_REQUEST);
  }

  // Check if user is still active
  if (!passwordReset.user.isActive) {
    throw new AppError('Account is inactive. Please contact administrator.', STATUS_CODES.FORBIDDEN);
  }

  try {
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }),
      
      // Mark token as used
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true }
      }),
      
      // Clean up old unused tokens for this user
      prisma.passwordReset.deleteMany({
        where: {
          userId: passwordReset.userId,
          used: false,
          id: { not: passwordReset.id }
        }
      })
    ]);

    console.log(`Password successfully reset for user: ${passwordReset.user.email}`);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Password has been successfully reset. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    throw new AppError('Failed to reset password. Please try again.', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
});

// Clean up expired reset tokens (utility function)
const cleanupExpiredTokens = asyncHandler(async () => {
  try {
    const result = await prisma.passwordReset.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired tokens
          { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Used tokens older than 24h
        ]
      }
    });
    
    console.log(`Cleaned up ${result.count} expired/used password reset tokens`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  checkSystemStatus,
  forgotPassword,
  resetPassword,
  cleanupExpiredTokens,
  getMyPermissions
};