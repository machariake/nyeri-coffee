/**
 * Audit Logging Service
 * Tracks all system activities for compliance and security
 */

const { pool } = require('../config/database');

// Log an action
const logAction = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  req = null,
}) => {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || null;
    const userAgent = req?.headers['user-agent'] || null;

    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ]
    );

    return { success: true };
  } catch (error) {
    console.error('Audit log error:', error);
    return { success: false, error: error.message };
  }
};

// Get audit logs with filters
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    let query = `
      SELECT al.*, u.full_name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    if (entityType) {
      query += ' AND al.entity_type = ?';
      params.push(entityType);
    }

    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [logs] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1';
    let countParams = [];

    if (userId) {
      countQuery += ' AND al.user_id = ?';
      countParams.push(userId);
    }
    if (action) {
      countQuery += ' AND al.action = ?';
      countParams.push(action);
    }
    if (entityType) {
      countQuery += ' AND al.entity_type = ?';
      countParams.push(entityType);
    }
    if (startDate) {
      countQuery += ' AND al.created_at >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND al.created_at <= ?';
      countParams.push(endDate);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return {
      success: true,
      logs: logs.map((log) => ({
        ...log,
        old_values: log.old_values ? JSON.parse(log.old_values) : null,
        new_values: log.new_values ? JSON.parse(log.new_values) : null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { success: false, error: error.message };
  }
};

// Get user activity summary
const getUserActivitySummary = async (userId, days = 30) => {
  try {
    // Activity by day
    const [dailyActivity] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as action_count,
        GROUP_CONCAT(DISTINCT action) as actions
       FROM audit_logs
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId, days]
    );

    // Activity by action type
    const [actionTypes] = await pool.query(
      `SELECT 
        action,
        COUNT(*) as count
       FROM audit_logs
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY action
       ORDER BY count DESC`,
      [userId, days]
    );

    // Most accessed entities
    const [entities] = await pool.query(
      `SELECT 
        entity_type,
        COUNT(*) as access_count
       FROM audit_logs
       WHERE user_id = ? AND entity_type IS NOT NULL
             AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY entity_type
       ORDER BY access_count DESC`,
      [userId, days]
    );

    return {
      success: true,
      summary: {
        dailyActivity,
        actionTypes,
        entities,
      },
    };
  } catch (error) {
    console.error('Get activity summary error:', error);
    return { success: false, error: error.message };
  }
};

// Get security events (failed logins, etc.)
const getSecurityEvents = async (filters = {}) => {
  try {
    const { page = 1, limit = 50 } = filters;

    const [events] = await pool.query(
      `SELECT al.*, u.full_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.action IN ('login_failed', 'password_reset', 'account_locked',
                           'unauthorized_access', 'suspicious_activity')
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );

    return {
      success: true,
      events,
    };
  } catch (error) {
    console.error('Get security events error:', error);
    return { success: false, error: error.message };
  }
};

// Export audit logs
const exportAuditLogs = async (filters = {}) => {
  try {
    const { startDate, endDate, format = 'csv' } = filters;

    let query = `
      SELECT 
        al.created_at,
        u.full_name,
        u.email,
        al.action,
        al.entity_type,
        al.entity_id,
        al.ip_address,
        al.user_agent
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC';

    const [logs] = await pool.query(query, params);

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
      const rows = logs.map((log) => [
        log.created_at,
        log.full_name || 'System',
        log.email || '-',
        log.action,
        log.entity_type || '-',
        log.entity_id || '-',
        log.ip_address || '-',
      ]);

      return {
        success: true,
        data: { headers, rows },
      };
    }

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Export audit logs error:', error);
    return { success: false, error: error.message };
  }
};

// Middleware for automatic audit logging
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // Store original values for updates
    if (action === 'update' && req.params.id) {
      const [records] = await pool.query(
        `SELECT * FROM ${entityType} WHERE id = ?`,
        [req.params.id]
      );
      if (records.length > 0) {
        req.auditOldValues = records[0];
      }
    }

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function (data) {
      // Restore original json
      res.json = originalJson;

      // Log the action
      if (data.success) {
        logAction({
          userId: req.user?.id,
          action,
          entityType,
          entityId: data.data?.id || req.params.id,
          oldValues: req.auditOldValues,
          newValues: action === 'create' || action === 'update' ? req.body : null,
          req,
        });
      }

      return res.json(data);
    };

    next();
  };
};

module.exports = {
  logAction,
  getAuditLogs,
  getUserActivitySummary,
  getSecurityEvents,
  exportAuditLogs,
  auditMiddleware,
};
