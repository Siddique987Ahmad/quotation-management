const express = require('express');
const { query } = require('express-validator');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY
} = require('../services/notificationService');

const { authenticateToken } = require('../middleware/auth');
const { validatePagination, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @access  Private
 */
router.get('/', [
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean'),
  query('type').optional().isIn(Object.values(NOTIFICATION_TYPES)).withMessage('Invalid notification type'),
  query('priority').optional().isIn(Object.values(NOTIFICATION_PRIORITY)).withMessage('Invalid priority'),
  validatePagination,
  handleValidationErrors
], (req, res) => {
  try {
    const { unreadOnly, type, priority, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = getUserNotifications(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications: result.notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / parseInt(limit)),
          totalCount: result.total,
          limit: parseInt(limit)
        },
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', (req, res) => {
  try {
    const result = getUserNotifications(req.user.id, { unreadOnly: true });
    res.json({
      success: true,
      data: { unreadCount: result.unreadCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', (req, res) => {
  try {
    const success = markAsRead(req.params.id, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/mark-all-read', (req, res) => {
  try {
    const count = markAllAsRead(req.user.id);
    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { markedCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', (req, res) => {
  try {
    const success = deleteNotification(req.params.id, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all notifications
 * @access  Private
 */
router.delete('/clear-all', (req, res) => {
  try {
    const count = clearAllNotifications(req.user.id);
    res.json({
      success: true,
      message: `${count} notifications cleared`,
      data: { clearedCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
});

module.exports = router;