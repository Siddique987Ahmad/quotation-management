const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { PERMISSIONS } = require('../config/constants');
const { prisma } = require('../config/database');

const router = express.Router();

// All department routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/departments
 * @desc    Get all departments with their clients
 * @access  Private (Manager+)
 */
router.get('/', [
  requirePermission(PERMISSIONS.DEPARTMENTS.READ),
  async (req, res, next) => {
    try {
      const departments = await prisma.department.findMany({
        include: {
          clients: {
            include: {
              client: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true,
                  email: true,
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }
]);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Private (Admin+)
 */
router.post('/', [
  requirePermission(PERMISSIONS.DEPARTMENTS.CREATE),
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Department name is required and must be less than 255 characters'),
    body('contactPerson')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Contact person must be less than 255 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email is required and must be a valid email address'),
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Phone must be less than 50 characters'),
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
    body('clientId')
      .isUUID()
      .withMessage('Client ID is required and must be a valid UUID')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { 
        name, 
        contactPerson,
        email,
        phone,
        address,
        city,
        clientId 
      } = req.body;

      // Check if department already exists
      const existing = await prisma.department.findUnique({ 
        where: { name } 
      });
      
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: 'Department already exists' 
        });
      }

      // Create department with client
      const department = await prisma.department.create({
        data: {
          name,
          contactPerson,
          email,
          phone,
          address,
          city,
          clients: clientId ? {
            create: {
              client: {
                connect: { id: clientId }
              }
            }
          } : undefined
        },
        include: {
          clients: {
            include: {
              client: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true,
                  email: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      res.status(201).json({ 
        success: true, 
        data: department,
        message: 'Department created successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
]);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department and assign clients
 * @access  Private (Admin+)
 */
router.put('/:id', [
  requirePermission(PERMISSIONS.DEPARTMENTS.UPDATE),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Department name must be less than 255 characters'),
    body('contactPerson')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Contact person must be less than 255 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email must be a valid email address'),
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Phone must be less than 50 characters'),
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
    body('clientId')
      .isUUID()
      .withMessage('Client ID is required and must be a valid UUID')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        name, 
        contactPerson,
        email,
        phone,
        address,
        city,
        clientId 
      } = req.body;

      // Check if department exists
      const existing = await prisma.department.findUnique({ 
        where: { id } 
      });
      
      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Department not found' 
        });
      }

      // Check if new name conflicts with existing department
      if (name && name !== existing.name) {
        const nameConflict = await prisma.department.findUnique({ 
          where: { name } 
        });
        
        if (nameConflict) {
          return res.status(409).json({ 
            success: false, 
            message: 'Department name already exists' 
          });
        }
      }

      // Update department with transaction to handle client relationships
      const department = await prisma.$transaction(async (tx) => {
        // Update department basic info
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;

        // Update department
        const updatedDepartment = await tx.department.update({
          where: { id },
          data: updateData
        });

        // Handle client relationships if clientId is provided
        if (clientId !== undefined) {
          // Delete existing client-department relationships
          await tx.clientDepartment.deleteMany({
            where: { departmentId: id }
          });

          // Create new client-department relationship if clientId is provided
          if (clientId) {
            await tx.clientDepartment.create({
              data: {
                clientId: clientId,
                departmentId: id
              }
            });
          }
        }

        // Return updated department with clients
        return await tx.department.findUnique({
          where: { id },
          include: {
            clients: {
              include: {
                client: {
                  select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    email: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });
      });

      res.json({ 
        success: true, 
        data: department,
        message: 'Department updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
]);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (Admin+)
 */
router.delete('/:id', [
  requirePermission(PERMISSIONS.DEPARTMENTS.DELETE),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if department exists
      const existing = await prisma.department.findUnique({ 
        where: { id },
        include: { clients: true }
      });
      
      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Department not found' 
        });
      }

      // Check if department has clients
      if (existing.clients.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete department with assigned clients. Please reassign clients first.' 
        });
      }

      await prisma.department.delete({ where: { id } });

      res.json({ 
        success: true, 
        message: 'Department deleted successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
]);

/**
 * @route   GET /api/departments/clients
 * @desc    Get all clients for department assignment dropdown
 * @access  Private (Manager+)
 */
router.get('/clients', [
  requirePermission(PERMISSIONS.CLIENTS.READ),
  async (req, res, next) => {
    try {
      const clients = await prisma.client.findMany({
        where: { isActive: true },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          email: true,
          departments: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { companyName: 'asc' }
      });

      res.json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }
]);

module.exports = router;
