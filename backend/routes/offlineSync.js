/**
 * Offline Sync Routes
 */

const express = require('express');
const router = express.Router();
const offlineSyncService = require('../services/offlineSyncService');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/sync/queue
 * @desc Queue operation for sync
 * @access Private
 */
router.post('/queue', authenticate, async (req, res) => {
  try {
    const { operation, entityType, entityId, data, deviceId, timestamp } = req.body;

    if (!operation || !entityType || !data || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Operation, entity type, data, and device ID are required'
      });
    }

    const result = await offlineSyncService.queueOperation({
      userId: req.user.id,
      operation,
      entityType,
      entityId,
      data,
      deviceId,
      timestamp: timestamp || new Date()
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Queue operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error queuing operation'
    });
  }
});

/**
 * @route GET /api/sync/pending
 * @desc Get pending sync operations
 * @access Private
 */
router.get('/pending', authenticate, async (req, res) => {
  try {
    const { deviceId, limit } = req.query;
    
    const operations = await offlineSyncService.getPendingOperations(req.user.id, {
      deviceId,
      limit: parseInt(limit) || 100
    });

    res.json({
      success: true,
      data: operations
    });
  } catch (error) {
    console.error('Get pending operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending operations'
    });
  }
});

/**
 * @route POST /api/sync/sync-all
 * @desc Sync all pending operations
 * @access Private
 */
router.post('/sync-all', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    const result = await offlineSyncService.syncAllPending(req.user.id, deviceId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing operations'
    });
  }
});

/**
 * @route GET /api/sync/status
 * @desc Get sync status
 * @access Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    const result = await offlineSyncService.getSyncStatus(req.user.id, deviceId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sync status'
    });
  }
});

/**
 * @route POST /api/sync/resolve/:syncId
 * @desc Resolve sync conflict
 * @access Private
 */
router.post('/resolve/:syncId', authenticate, async (req, res) => {
  try {
    const { syncId } = req.params;
    const { resolution } = req.body;

    if (!resolution || !['local', 'server'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Resolution must be "local" or "server"'
      });
    }

    const result = await offlineSyncService.resolveConflict(
      parseInt(syncId),
      resolution
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving conflict'
    });
  }
});

module.exports = router;
