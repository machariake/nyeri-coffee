const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { sendNotification, getNotificationPreferences, updateNotificationPreferences } = require('../services/notificationService');

const router = express.Router();

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, message, type, is_read, data, created_at
      FROM notifications
      WHERE user_id = ?
    `;
    let params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadCount[0].count
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const preferences = await getNotificationPreferences(req.user.id);
    res.json({ success: true, data: { preferences } });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, [
  body('emailEnabled').optional().isBoolean(),
  body('smsEnabled').optional().isBoolean(),
  body('pushEnabled').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await updateNotificationPreferences(req.user.id, req.body);
    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test notification (Admin only)
router.post('/test', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, type, title, message, channels } = req.body;

    const result = await sendNotification({
      userId,
      type,
      title,
      message,
      channels: channels || ['inApp'],
    });

    if (result.success) {
      res.json({ success: true, message: 'Test notification sent' });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register device for push notifications
router.post('/device', authenticate, [
  body('deviceId').notEmpty(),
  body('deviceType').isIn(['android', 'ios', 'web']),
  body('fcmToken').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { deviceId, deviceType, fcmToken, deviceName } = req.body;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO user_devices (user_id, device_id, device_type, fcm_token, device_name)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       fcm_token = VALUES(fcm_token),
       device_name = VALUES(device_name),
       is_active = TRUE,
       last_used = CURRENT_TIMESTAMP`,
      [userId, deviceId, deviceType, fcmToken, deviceName]
    );

    res.json({ success: true, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Unregister device
router.delete('/device/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;

    await pool.query(
      'UPDATE user_devices SET is_active = FALSE WHERE user_id = ? AND device_id = ?',
      [userId, deviceId]
    );

    res.json({ success: true, message: 'Device unregistered' });
  } catch (error) {
    console.error('Unregister device error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send push notification to users (Admin only)
router.post('/send', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide notifications array' 
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const notification of notifications) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, ?, ?, ?)`,
          [
            notification.user_id,
            notification.title,
            notification.message,
            notification.type || 'system'
          ]
        );
        successCount++;
      } catch (error) {
        console.error('Error sending notification:', error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully sent ${successCount} notifications (${errorCount} failed)`,
      data: {
        successCount,
        errorCount,
        totalSent: notifications.length
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get notification history (Admin only)
router.get('/history', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [history] = await pool.query(`
      SELECT 
        title,
        message,
        type,
        created_at,
        COUNT(*) as recipient_count
      FROM notifications
      GROUP BY title, message, type, DATE(created_at)
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({ success: true, data: { history } });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
