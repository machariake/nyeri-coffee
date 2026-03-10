/**
 * Offline Sync Service
 * Manages offline data queue and synchronization
 */

const { pool } = require('../config/database');
const auditService = require('./auditService');

// Sync operation types
const SYNC_OPERATIONS = {
  CREATE_APPLICATION: 'create_application',
  UPDATE_APPLICATION: 'update_application',
  UPLOAD_DOCUMENT: 'upload_document',
  UPDATE_PROFILE: 'update_profile',
  CREATE_CERTIFICATE: 'create_certificate',
  SEND_MESSAGE: 'send_message',
  UPDATE_STATUS: 'update_status'
};

// Sync status
const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CONFLICT: 'conflict'
};

/**
 * Queue operation for sync
 * @param {Object} syncData - Sync data
 * @returns {Promise<Object>} - Result
 */
const queueOperation = async (syncData) => {
  try {
    const {
      userId,
      operation,
      entityType,
      entityId = null,
      data,
      deviceId,
      timestamp = new Date()
    } = syncData;

    const [result] = await db.query(
      `INSERT INTO offline_sync_queue 
       (user_id, operation, entity_type, entity_id, data, device_id, 
        local_timestamp, status, retry_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [userId, operation, entityType, entityId, JSON.stringify(data), 
       deviceId, timestamp, SYNC_STATUS.PENDING]
    );

    return {
      success: true,
      syncId: result.insertId,
      status: SYNC_STATUS.PENDING
    };
  } catch (error) {
    console.error('Queue operation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending sync operations for user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Pending operations
 */
const getPendingOperations = async (userId, options = {}) => {
  try {
    const { deviceId, limit = 100 } = options;

    let query = `
      SELECT * FROM offline_sync_queue 
      WHERE user_id = ? AND status IN ('pending', 'failed')
    `;
    const params = [userId];

    if (deviceId) {
      query += ` AND device_id = ?`;
      params.push(deviceId);
    }

    query += ` ORDER BY local_timestamp ASC LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      operation: row.operation,
      entityType: row.entity_type,
      entityId: row.entity_id,
      data: JSON.parse(row.data || '{}'),
      deviceId: row.device_id,
      localTimestamp: row.local_timestamp,
      status: row.status,
      retryCount: row.retry_count,
      errorMessage: row.error_message,
      syncedAt: row.synced_at,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Get pending operations error:', error);
    return [];
  }
};

/**
 * Process sync operation
 * @param {number} syncId - Sync queue ID
 * @returns {Promise<Object>} - Result
 */
const processOperation = async (syncId) => {
  try {
    // Get sync operation
    const [operations] = await db.query(
      `SELECT * FROM offline_sync_queue WHERE id = ?`,
      [syncId]
    );

    if (operations.length === 0) {
      return { success: false, error: 'Sync operation not found' };
    }

    const operation = operations[0];

    // Update status to syncing
    await db.query(
      `UPDATE offline_sync_queue SET status = ? WHERE id = ?`,
      [SYNC_STATUS.SYNCING, syncId]
    );

    // Process based on operation type
    let result;
    const data = JSON.parse(operation.data || '{}');

    switch (operation.operation) {
      case SYNC_OPERATIONS.CREATE_APPLICATION:
        result = await processCreateApplication(operation.user_id, data);
        break;
      case SYNC_OPERATIONS.UPDATE_APPLICATION:
        result = await processUpdateApplication(operation.entity_id, data);
        break;
      case SYNC_OPERATIONS.UPLOAD_DOCUMENT:
        result = await processUploadDocument(operation.user_id, operation.entity_id, data);
        break;
      case SYNC_OPERATIONS.UPDATE_PROFILE:
        result = await processUpdateProfile(operation.user_id, data);
        break;
      case SYNC_OPERATIONS.SEND_MESSAGE:
        result = await processSendMessage(operation.user_id, data);
        break;
      default:
        result = { success: false, error: 'Unknown operation type' };
    }

    // Update sync status
    if (result.success) {
      await db.query(
        `UPDATE offline_sync_queue 
         SET status = ?, synced_at = NOW(), server_entity_id = ?
         WHERE id = ?`,
        [SYNC_STATUS.COMPLETED, result.entityId || null, syncId]
      );
    } else {
      await db.query(
        `UPDATE offline_sync_queue 
         SET status = ?, error_message = ?, retry_count = retry_count + 1
         WHERE id = ?`,
        [SYNC_STATUS.FAILED, result.error, syncId]
      );
    }

    return result;
  } catch (error) {
    console.error('Process operation error:', error);
    
    await db.query(
      `UPDATE offline_sync_queue 
       SET status = ?, error_message = ?, retry_count = retry_count + 1
       WHERE id = ?`,
      [SYNC_STATUS.FAILED, error.message, syncId]
    );

    return { success: false, error: error.message };
  }
};

/**
 * Process create application
 */
const processCreateApplication = async (userId, data) => {
  try {
    const [result] = await db.query(
      `INSERT INTO applications SET ?, farmer_id = ?, created_at = NOW()`,
      [data, userId]
    );

    return {
      success: true,
      entityId: result.insertId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Process update application
 */
const processUpdateApplication = async (applicationId, data) => {
  try {
    await db.query(
      `UPDATE applications SET ?, updated_at = NOW() WHERE id = ?`,
      [data, applicationId]
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Process upload document
 */
const processUploadDocument = async (userId, applicationId, data) => {
  try {
    const [result] = await db.query(
      `INSERT INTO documents SET ?, uploaded_by = ?, uploaded_at = NOW()`,
      [{ ...data, application_id: applicationId }, userId]
    );

    return {
      success: true,
      entityId: result.insertId
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Process update profile
 */
const processUpdateProfile = async (userId, data) => {
  try {
    await db.query(
      `UPDATE users SET ?, updated_at = NOW() WHERE id = ?`,
      [data, userId]
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Process send message
 */
const processSendMessage = async (userId, data) => {
  try {
    // Import chat service
    const chatService = require('./chatService');
    
    const result = await chatService.sendMessage({
      roomId: data.roomId,
      senderId: userId,
      content: data.content,
      type: data.type || 'text',
      replyTo: data.replyTo,
      metadata: data.metadata,
      attachments: data.attachments
    });

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sync all pending operations for user
 * @param {number} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} - Sync results
 */
const syncAllPending = async (userId, deviceId) => {
  try {
    const pending = await getPendingOperations(userId, { deviceId });
    
    const results = {
      total: pending.length,
      successful: 0,
      failed: 0,
      details: []
    };

    for (const operation of pending) {
      const result = await processOperation(operation.id);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }

      results.details.push({
        syncId: operation.id,
        operation: operation.operation,
        success: result.success,
        error: result.error
      });
    }

    // Log audit
    await auditService.logAction({
      userId,
      action: 'OFFLINE_SYNC_COMPLETED',
      entityType: 'offline_sync',
      newValues: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        deviceId
      }
    });

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Sync all pending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sync status for user
 * @param {number} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} - Sync status
 */
const getSyncStatus = async (userId, deviceId) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_pending,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'syncing' THEN 1 END) as syncing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        MAX(synced_at) as last_sync
      FROM offline_sync_queue
      WHERE user_id = ? AND device_id = ?`,
      [userId, deviceId]
    );

    return {
      success: true,
      data: {
        totalPending: stats[0].total_pending,
        pending: stats[0].pending,
        syncing: stats[0].syncing,
        failed: stats[0].failed,
        lastSync: stats[0].last_sync
      }
    };
  } catch (error) {
    console.error('Get sync status error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resolve sync conflict
 * @param {number} syncId - Sync ID
 * @param {string} resolution - Resolution strategy ('local' or 'server')
 * @returns {Promise<Object>} - Result
 */
const resolveConflict = async (syncId, resolution) => {
  try {
    if (resolution === 'local') {
      // Retry the local operation
      return await processOperation(syncId);
    } else {
      // Discard local changes
      await db.query(
        `UPDATE offline_sync_queue SET status = ? WHERE id = ?`,
        [SYNC_STATUS.COMPLETED, syncId]
      );
      return { success: true, message: 'Local changes discarded' };
    }
  } catch (error) {
    console.error('Resolve conflict error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old completed sync records
 * @param {number} days - Days to keep
 * @returns {Promise<Object>} - Cleanup result
 */
const cleanupOldRecords = async (days = 30) => {
  try {
    const [result] = await db.query(
      `DELETE FROM offline_sync_queue 
       WHERE status = 'completed' 
       AND synced_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    return {
      success: true,
      deletedCount: result.affectedRows
    };
  } catch (error) {
    console.error('Cleanup old records error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  queueOperation,
  getPendingOperations,
  processOperation,
  syncAllPending,
  getSyncStatus,
  resolveConflict,
  cleanupOldRecords,
  SYNC_OPERATIONS,
  SYNC_STATUS
};
