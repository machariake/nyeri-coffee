const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAuditLogs,
  getUserActivitySummary,
  getSecurityEvents,
  exportAuditLogs,
} = require('../services/auditService');

const router = express.Router();

// Get audit logs (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId, action, entityType, startDate, endDate, page, limit } = req.query;

    const result = await getAuditLogs({
      userId,
      action,
      entityType,
      startDate,
      endDate,
      page,
      limit,
    });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user activity summary
router.get('/activity/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    // Users can only see their own activity unless they're admin
    if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await getUserActivitySummary(userId, days);

    if (result.success) {
      res.json({ success: true, data: result.summary });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get security events (Admin only)
router.get('/security', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await getSecurityEvents({ page, limit });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export audit logs (Admin only)
router.get('/export', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;

    const result = await exportAuditLogs({ startDate, endDate, format });

    if (result.success) {
      if (format === 'csv') {
        // Generate CSV
        const { headers, rows } = result.data;
        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(csvContent);
      } else {
        res.json({ success: true, data: result.data });
      }
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
