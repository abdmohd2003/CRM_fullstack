const Notification = require("../models/Notification");

class NotificationController {
  // Get all notifications for a user
  async getNotifications(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { read, type } = req.query;

      let query = { userId };
      if (read !== undefined) query.read = read === 'true';
      if (type) query.type = type;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, read: false })
      ]);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            unreadCount
          }
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get unread count only
  async getUnreadCount(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const unreadCount = await Notification.countDocuments({
        userId,
        read: false
      });

      // Check for new notifications (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const newCount = await Notification.countDocuments({
        userId,
        read: false,
        createdAt: { $gte: twentyFourHoursAgo }
      });

      res.status(200).json({
        success: true,
        data: {
          unreadCount,
          newCount,
          hasNew: newCount > 0
        }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const notification = await Notification.findOne({
        _id: id,
        userId: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );

      res.status(200).json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: `Marked ${result.modifiedCount} notifications as read`
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete all read notifications
  async deleteReadNotifications(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const result = await Notification.deleteMany({
        userId,
        read: true
      });

      res.status(200).json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        },
        message: `Deleted ${result.deletedCount} read notifications`
      });
    } catch (error) {
      console.error('Delete read notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete all notifications (unread too)
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Check authorization - only allow if user is admin or clearing their own
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'MANAGER';
      
      let query = { userId };
      if (!isAdmin) {
        query.userId = userId;
      }

      const result = await Notification.deleteMany(query);

      res.status(200).json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        },
        message: `Deleted ${result.deletedCount} notifications`
      });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create notification (internal use - for system to create notifications)
  async createNotification(req, res) {
    try {
      const { userId, title, message, type, link, metadata } = req.body;

      if (!userId || !title || !message || !type) {
        return res.status(400).json({
          success: false,
          message: 'userId, title, message, and type are required'
        });
      }

      const notification = new Notification({
        userId,
        title,
        message,
        type,
        link: link || null,
        metadata: metadata || null,
        read: false
      });

      await notification.save();

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get notification types (for filtering)
  async getNotificationTypes(req, res) {
    try {
      const types = [
        'ORDER_CREATED',
        'ORDER_CONFIRMED',
        'INVOICE_READY',
        'PAYMENT_RECEIVED',
        'ORDER_PAID',
        'DEAL_STAGE_CHANGED',
        'SYSTEM_ALERT'
      ];

      res.status(200).json({
        success: true,
        data: types
      });
    } catch (error) {
      console.error('Get notification types error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new NotificationController();