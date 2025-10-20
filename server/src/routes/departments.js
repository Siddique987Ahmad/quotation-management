const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS, STATUS_CODES, MESSAGES } = require('../config/constants');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// List departments (for dropdown)
router.get('/', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
});

// Create department (Admin + Super Admin)
router.post('/', [
  requirePermission(PERMISSIONS.SETTINGS.CREATE),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and max 100 chars'),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { name } = req.body;
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return res.status(STATUS_CODES.CONFLICT).json({ success: false, message: 'Department already exists' });
    }
    const dept = await prisma.department.create({ data: { name } });
    res.status(STATUS_CODES.CREATED).json({ success: true, message: MESSAGES.SUCCESS.CREATED, data: dept });
  } catch (error) {
    next(error);
  }
});

// Delete department (Admin + Super Admin). Prevent delete if clients exist
router.delete('/:id', [
  requirePermission(PERMISSIONS.SETTINGS.DELETE)
], async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const { id } = req.params;

    const usage = await prisma.client.count({ where: { departmentId: id } });
    if (usage > 0) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Department is in use by clients and cannot be deleted'
      });
    }

    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: MESSAGES.SUCCESS.DELETED });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


