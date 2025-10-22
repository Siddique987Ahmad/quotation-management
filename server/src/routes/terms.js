const router = require('express').Router();
const { requireRole } = require('../middleware/permissions');
const { authenticateToken } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { listTerms, listActiveTerms, createTerm, updateTerm, deleteTerm, reorderTerms } = require('../services/termsService');

// Public read for active terms (used by PDF)
router.get('/quotation/active', async (req, res) => {
  try {
    const terms = await listActiveTerms();
    res.json({ success: true, data: terms });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch active terms', error: e.message });
  }
});

// Admin-only CRUD
router.get('/quotation', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const terms = await listTerms();
    res.json({ success: true, data: terms });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch terms', error: e.message });
  }
});

router.post('/quotation', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const term = await createTerm(req.body);
    res.status(201).json({ success: true, data: term });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to create term', error: e.message });
  }
});

router.put('/quotation/:id', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const term = await updateTerm(req.params.id, req.body);
    res.json({ success: true, data: term });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to update term', error: e.message });
  }
});

router.delete('/quotation/:id', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    await deleteTerm(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to delete term', error: e.message });
  }
});

router.put('/quotation/reorder', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const terms = await reorderTerms(req.body?.order || []);
    res.json({ success: true, data: terms });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to reorder terms', error: e.message });
  }
});

module.exports = router;


