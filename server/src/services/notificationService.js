const { prisma } = require('../config/database');
const { sendEmail, addToEmailQueue } = require('./emailService');

// Notification types
const NOTIFICATION_TYPES = {
  QUOTATION_CREATED: 'QUOTATION_CREATED',
  QUOTATION_UPDATED: 'QUOTATION_UPDATED', 
  QUOTATION_APPROVED: 'QUOTATION_APPROVED',
  QUOTATION_REJECTED: 'QUOTATION_REJECTED',
  QUOTATION_EXPIRED: 'QUOTATION_EXPIRED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_SENT: 'INVOICE_SENT',
  INVOICE_PAID: 'INVOICE_PAID',
  INVOICE_OVERDUE: 'INVOICE_OVERDUE',
  USER_CREATED: 'USER_CREATED',
  CLIENT_CREATED: 'CLIENT_CREATED',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};

// Notification priorities
const NOTIFICATION_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// In-memory notifications store (in production, use Redis or database)
let notifications = [];
let notificationId = 1;

// Create notification
const createNotification = async (data) => {
  const notification = {
    id: notificationId++,
    type: data.type,
    title: data.title,
    message: data.message,
    userId: data.userId,
    relatedId: data.relatedId || null, // ID of related resource (quotation, invoice, etc.)
    relatedType: data.relatedType || null, // Type of related resource
    priority: data.priority || NOTIFICATION_PRIORITY.MEDIUM,
    data: data.data || {}, // Additional data
    read: false,
    createdAt: new Date(),
    expiresAt: data.expiresAt || null
  };

  notifications.push(notification);

  // If userId is 'ALL', create notification for all users
  if (data.userId === 'ALL') {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const bulkNotifications = users.map(user => ({
        ...notification,
        id: notificationId++,
        userId: user.id
      }));

      notifications.push(...bulkNotifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
    }
  }

  return notification;
};

// Get notifications for user
const getUserNotifications = (userId, options = {}) => {
  const {
    unreadOnly = false,
    limit = 50,
    offset = 0,
    type = null,
    priority = null
  } = options;

  let userNotifications = notifications.filter(n => n.userId === userId);

  // Filter by read status
  if (unreadOnly) {
    userNotifications = userNotifications.filter(n => !n.read);
  }

  // Filter by type
  if (type) {
    userNotifications = userNotifications.filter(n => n.type === type);
  }

  // Filter by priority
  if (priority) {
    userNotifications = userNotifications.filter(n => n.priority === priority);
  }

  // Remove expired notifications
  const now = new Date();
  userNotifications = userNotifications.filter(n => !n.expiresAt || n.expiresAt > now);

  // Sort by creation date (newest first)
  userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const total = userNotifications.length;
  const paginatedNotifications = userNotifications.slice(offset, offset + limit);

  return {
    notifications: paginatedNotifications,
    total,
    unreadCount: userNotifications.filter(n => !n.read).length
  };
};

// Mark notification as read
const markAsRead = (notificationId, userId) => {
  const notification = notifications.find(n => 
    n.id === parseInt(notificationId) && n.userId === userId
  );

  if (notification) {
    notification.read = true;
    notification.readAt = new Date();
    return true;
  }
  return false;
};

// Mark all notifications as read for user
const markAllAsRead = (userId) => {
  const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
  const count = userNotifications.length;

  userNotifications.forEach(notification => {
    notification.read = true;
    notification.readAt = new Date();
  });

  return count;
};

// Delete notification
const deleteNotification = (notificationId, userId) => {
  const index = notifications.findIndex(n => 
    n.id === parseInt(notificationId) && n.userId === userId
  );

  if (index !== -1) {
    notifications.splice(index, 1);
    return true;
  }
  return false;
};

// Clear all notifications for user
const clearAllNotifications = (userId) => {
  const initialLength = notifications.length;
  notifications = notifications.filter(n => n.userId !== userId);
  return initialLength - notifications.length;
};

// Notification handlers for specific events
const notifyQuotationCreated = async (quotationData, clientData, userData) => {
  // Notify managers and admins
  const managers = await getManagersAndAdmins();
  
  for (const manager of managers) {
    if (manager.id !== userData.id) { // Don't notify the creator
      await createNotification({
        type: NOTIFICATION_TYPES.QUOTATION_CREATED,
        title: 'New Quotation Created',
        message: `${userData.firstName} ${userData.lastName} created quotation ${quotationData.quotationNumber} for ${clientData.companyName}`,
        userId: manager.id,
        relatedId: quotationData.id,
        relatedType: 'quotation',
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        data: {
          quotationNumber: quotationData.quotationNumber,
          clientName: clientData.companyName,
          amount: quotationData.totalAmount,
          createdBy: `${userData.firstName} ${userData.lastName}`
        }
      });
    }
  }
};

const notifyQuotationStatusChange = async (quotationData, clientData, userData, oldStatus, newStatus) => {
  const statusMessages = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING: 'marked as pending',
    EXPIRED: 'expired'
  };

  const priorityMap = {
    APPROVED: NOTIFICATION_PRIORITY.HIGH,
    REJECTED: NOTIFICATION_PRIORITY.MEDIUM,
    PENDING: NOTIFICATION_PRIORITY.MEDIUM,
    EXPIRED: NOTIFICATION_PRIORITY.HIGH
  };

  // Notify quotation owner
  if (quotationData.userId !== userData.id) {
    await createNotification({
      type: `QUOTATION_${newStatus}`,
      title: `Quotation ${statusMessages[newStatus] || 'updated'}`,
      message: `Your quotation ${quotationData.quotationNumber} for ${clientData.companyName} has been ${statusMessages[newStatus] || 'updated'}`,
      userId: quotationData.userId,
      relatedId: quotationData.id,
      relatedType: 'quotation',
      priority: priorityMap[newStatus] || NOTIFICATION_PRIORITY.MEDIUM,
      data: {
        quotationNumber: quotationData.quotationNumber,
        clientName: clientData.companyName,
        oldStatus,
        newStatus,
        updatedBy: `${userData.firstName} ${userData.lastName}`
      }
    });
  }

  // Notify managers if status is approved/rejected
  if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
    const managers = await getManagersAndAdmins();
    
    for (const manager of managers) {
      if (manager.id !== userData.id && manager.id !== quotationData.userId) {
        await createNotification({
          type: `QUOTATION_${newStatus}`,
          title: `Quotation ${statusMessages[newStatus]}`,
          message: `Quotation ${quotationData.quotationNumber} for ${clientData.companyName} has been ${statusMessages[newStatus]} by ${userData.firstName} ${userData.lastName}`,
          userId: manager.id,
          relatedId: quotationData.id,
          relatedType: 'quotation',
          priority: priorityMap[newStatus],
          data: {
            quotationNumber: quotationData.quotationNumber,
            clientName: clientData.companyName,
            amount: quotationData.totalAmount,
            approvedBy: `${userData.firstName} ${userData.lastName}`
          }
        });
      }
    }
  }
};

const notifyInvoiceCreated = async (invoiceData, quotationData, clientData, userData) => {
  // Notify quotation owner if different from invoice creator
  if (quotationData.userId !== userData.id) {
    await createNotification({
      type: NOTIFICATION_TYPES.INVOICE_CREATED,
      title: 'Invoice Generated',
      message: `Invoice ${invoiceData.invoiceNumber} has been generated for your quotation ${quotationData.quotationNumber}`,
      userId: quotationData.userId,
      relatedId: invoiceData.id,
      relatedType: 'invoice',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        quotationNumber: quotationData.quotationNumber,
        clientName: clientData.companyName,
        amount: invoiceData.totalAmount
      }
    });
  }
};

const notifyInvoiceSent = async (invoiceData, quotationData, clientData) => {
  // Notify quotation owner
  await createNotification({
    type: NOTIFICATION_TYPES.INVOICE_SENT,
    title: 'Invoice Sent',
    message: `Invoice ${invoiceData.invoiceNumber} has been sent to ${clientData.companyName}`,
    userId: quotationData.userId,
    relatedId: invoiceData.id,
    relatedType: 'invoice',
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    data: {
      invoiceNumber: invoiceData.invoiceNumber,
      clientName: clientData.companyName,
      amount: invoiceData.totalAmount,
      sentAt: new Date()
    }
  });
};

const notifyInvoiceOverdue = async (invoiceData, quotationData, clientData) => {
  // Notify quotation owner and managers
  const recipients = await getManagersAndAdmins();
  const quotationOwner = await prisma.user.findUnique({
    where: { id: quotationData.userId },
    select: { id: true }
  });

  if (quotationOwner) {
    recipients.push(quotationOwner);
  }

  // Remove duplicates
  const uniqueRecipients = recipients.filter((recipient, index, self) =>
    index === self.findIndex(r => r.id === recipient.id)
  );

  for (const recipient of uniqueRecipients) {
    await createNotification({
      type: NOTIFICATION_TYPES.INVOICE_OVERDUE,
      title: 'Invoice Overdue',
      message: `Invoice ${invoiceData.invoiceNumber} for ${clientData.companyName} is overdue`,
      userId: recipient.id,
      relatedId: invoiceData.id,
      relatedType: 'invoice',
      priority: NOTIFICATION_PRIORITY.URGENT,
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        clientName: clientData.companyName,
        amount: invoiceData.totalAmount,
        dueDate: invoiceData.dueDate,
        daysOverdue: Math.floor((new Date() - new Date(invoiceData.dueDate)) / (1000 * 60 * 60 * 24))
      }
    });
  }
};

const notifyUserCreated = async (newUserData, creatorData) => {
  // Notify the new user
  await createNotification({
    type: NOTIFICATION_TYPES.USER_CREATED,
    title: 'Welcome to the System',
    message: `Your account has been created by ${creatorData.firstName} ${creatorData.lastName}. Welcome to the Quotation Management System!`,
    userId: newUserData.id,
    priority: NOTIFICATION_PRIORITY.HIGH,
    data: {
      createdBy: `${creatorData.firstName} ${creatorData.lastName}`,
      role: newUserData.role
    }
  });

  // Notify admins
  const admins = await getAdmins();
  for (const admin of admins) {
    if (admin.id !== creatorData.id) {
      await createNotification({
        type: NOTIFICATION_TYPES.USER_CREATED,
        title: 'New User Created',
        message: `${creatorData.firstName} ${creatorData.lastName} created a new user account for ${newUserData.firstName} ${newUserData.lastName}`,
        userId: admin.id,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        data: {
          newUserName: `${newUserData.firstName} ${newUserData.lastName}`,
          newUserEmail: newUserData.email,
          newUserRole: newUserData.role,
          createdBy: `${creatorData.firstName} ${creatorData.lastName}`
        }
      });
    }
  }
};

const notifySystemAlert = async (title, message, priority = NOTIFICATION_PRIORITY.MEDIUM, targetUsers = 'ALL') => {
  await createNotification({
    type: NOTIFICATION_TYPES.SYSTEM_ALERT,
    title,
    message,
    userId: targetUsers,
    priority,
    data: {
      timestamp: new Date(),
      source: 'system'
    }
  });
};

// Helper functions
const getManagersAndAdmins = async () => {
  return await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      isActive: true
    },
    select: { id: true, firstName: true, lastName: true, role: true }
  });
};

const getAdmins = async () => {
  return await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN'] },
      isActive: true
    },
    select: { id: true, firstName: true, lastName: true, role: true }
  });
};

// Cleanup expired notifications
const cleanupExpiredNotifications = () => {
  const now = new Date();
  const initialLength = notifications.length;
  
  notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
  
  const cleanedCount = initialLength - notifications.length;
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired notifications`);
  }
  
  return cleanedCount;
};

// Background task to check for overdue invoices
const checkOverdueInvoices = async () => {
  try {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { notIn: ['PAID', 'CANCELLED'] },
        dueDate: { lt: new Date() },
        // Only check invoices that became overdue in the last day (to avoid spam)
        dueDate: { 
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          lt: new Date()
        }
      },
      include: {
        quotation: {
          select: {
            userId: true,
            quotationNumber: true
          }
        },
        client: {
          select: {
            companyName: true
          }
        }
      }
    });

    for (const invoice of overdueInvoices) {
      await notifyInvoiceOverdue(invoice, invoice.quotation, invoice.client);
    }

    if (overdueInvoices.length > 0) {
      console.log(`Sent overdue notifications for ${overdueInvoices.length} invoices`);
    }
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
  }
};

// Schedule cleanup and overdue checks
const startBackgroundTasks = () => {
  // Clean expired notifications every hour
  setInterval(cleanupExpiredNotifications, 60 * 60 * 1000);
  
  // Check for overdue invoices daily at 9 AM
  const now = new Date();
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  const msUntilTomorrow9AM = tomorrow9AM - now;
  
  setTimeout(() => {
    checkOverdueInvoices();
    // Then repeat every 24 hours
    setInterval(checkOverdueInvoices, 24 * 60 * 60 * 1000);
  }, msUntilTomorrow9AM);

  console.log('Background notification tasks started');
};

// Real-time notification support (basic implementation)
const notificationSubscribers = new Map();

const subscribeToNotifications = (userId, callback) => {
  if (!notificationSubscribers.has(userId)) {
    notificationSubscribers.set(userId, []);
  }
  notificationSubscribers.get(userId).push(callback);
};

const unsubscribeFromNotifications = (userId, callback) => {
  const subscribers = notificationSubscribers.get(userId);
  if (subscribers) {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  }
};

const broadcastNotification = (notification) => {
  const subscribers = notificationSubscribers.get(notification.userId);
  if (subscribers) {
    subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error broadcasting notification:', error);
      }
    });
  }
};

// Enhanced createNotification that broadcasts
const createAndBroadcastNotification = async (data) => {
  const notification = await createNotification(data);
  broadcastNotification(notification);
  return notification;
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  createNotification,
  createAndBroadcastNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  notifyQuotationCreated,
  notifyQuotationStatusChange,
  notifyInvoiceCreated,
  notifyInvoiceSent,
  notifyInvoiceOverdue,
  notifyUserCreated,
  notifySystemAlert,
  cleanupExpiredNotifications,
  checkOverdueInvoices,
  startBackgroundTasks,
  subscribeToNotifications,
  unsubscribeFromNotifications
};