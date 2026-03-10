/**
 * Calendar & Reminders Service
 * Manages events, reminders, and scheduling
 */

const { pool } = require('../config/database');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

// Event types
const EVENT_TYPES = {
  INSPECTION: 'inspection',
  CERTIFICATE_EXPIRY: 'certificate_expiry',
  RENEWAL_DUE: 'renewal_due',
  TRAINING: 'training',
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  FOLLOW_UP: 'follow_up',
  CUSTOM: 'custom'
};

// Event status
const EVENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
};

/**
 * Create calendar event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} - Created event
 */
const createEvent = async (eventData) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      allDay = false,
      location = null,
      relatedEntityType = null,
      relatedEntityId = null,
      assignedTo,
      createdBy,
      reminderMinutes = [60], // Default 1 hour before
      recurrence = null,
      metadata = {}
    } = eventData;

    const [result] = await db.query(
      `INSERT INTO calendar_events 
       (title, description, type, start_date, end_date, all_day, location,
        related_entity_type, related_entity_id, assigned_to, created_by,
        reminder_minutes, recurrence, metadata, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, type, startDate, endDate, allDay, location,
       relatedEntityType, relatedEntityId, assignedTo, createdBy,
       JSON.stringify(reminderMinutes), recurrence, JSON.stringify(metadata), EVENT_STATUS.PENDING]
    );

    const eventId = result.insertId;

    // Schedule reminders
    await scheduleReminders(eventId, eventData);

    // Log audit
    await auditService.logAction({
      userId: createdBy,
      action: 'CALENDAR_EVENT_CREATED',
      entityType: 'calendar_event',
      entityId: eventId,
      newValues: { title, type, startDate, assignedTo }
    });

    return {
      success: true,
      eventId,
      title
    };
  } catch (error) {
    console.error('Create event error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Schedule reminders for an event
 * @param {number} eventId - Event ID
 * @param {Object} eventData - Event data
 */
const scheduleReminders = async (eventId, eventData) => {
  try {
    const { reminderMinutes, startDate, assignedTo, title, type } = eventData;

    for (const minutes of reminderMinutes) {
      const reminderTime = new Date(startDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - minutes);

      await db.query(
        `INSERT INTO event_reminders 
         (event_id, reminder_time, minutes_before, status, created_at)
         VALUES (?, ?, ?, 'pending', NOW())`,
        [eventId, reminderTime, minutes]
      );
    }
  } catch (error) {
    console.error('Schedule reminders error:', error);
  }
};

/**
 * Get user's calendar events
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Events
 */
const getUserEvents = async (userId, options = {}) => {
  try {
    const { startDate, endDate, type, status } = options;

    let query = `
      SELECT 
        e.*,
        u.first_name as assigned_first_name,
        u.last_name as assigned_last_name
      FROM calendar_events e
      LEFT JOIN users u ON e.assigned_to = u.id
      WHERE (e.assigned_to = ? OR e.created_by = ?)
    `;
    const params = [userId, userId];

    if (startDate) {
      query += ` AND e.start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND e.start_date <= ?`;
      params.push(endDate);
    }

    if (type) {
      query += ` AND e.type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY e.start_date ASC`;

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      allDay: row.all_day,
      location: row.location,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      assignedTo: row.assigned_to,
      assignedName: row.assigned_first_name 
        ? `${row.assigned_first_name} ${row.assigned_last_name}` 
        : null,
      reminderMinutes: JSON.parse(row.reminder_minutes || '[]'),
      recurrence: row.recurrence,
      status: row.status,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Get user events error:', error);
    return [];
  }
};

/**
 * Get event details
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} - Event details
 */
const getEvent = async (eventId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        e.*,
        u.first_name as assigned_first_name,
        u.last_name as assigned_last_name,
        c.first_name as creator_first_name,
        c.last_name as creator_last_name
      FROM calendar_events e
      LEFT JOIN users u ON e.assigned_to = u.id
      LEFT JOIN users c ON e.created_by = c.id
      WHERE e.id = ?`,
      [eventId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Event not found' };
    }

    const row = rows[0];

    // Get reminders
    const [reminders] = await db.query(
      `SELECT * FROM event_reminders WHERE event_id = ? ORDER BY reminder_time`,
      [eventId]
    );

    return {
      success: true,
      data: {
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        startDate: row.start_date,
        endDate: row.end_date,
        allDay: row.all_day,
        location: row.location,
        relatedEntityType: row.related_entity_type,
        relatedEntityId: row.related_entity_id,
        assignedTo: row.assigned_to,
        assignedName: row.assigned_first_name 
          ? `${row.assigned_first_name} ${row.assigned_last_name}` 
          : null,
        createdBy: row.created_by,
        creatorName: row.creator_first_name 
          ? `${row.creator_first_name} ${row.creator_last_name}` 
          : null,
        reminderMinutes: JSON.parse(row.reminder_minutes || '[]'),
        reminders: reminders.map(r => ({
          id: r.id,
          reminderTime: r.reminder_time,
          minutesBefore: r.minutes_before,
          status: r.status,
          sentAt: r.sent_at
        })),
        recurrence: row.recurrence,
        status: row.status,
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: row.created_at
      }
    };
  } catch (error) {
    console.error('Get event error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update event
 * @param {number} eventId - Event ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Result
 */
const updateEvent = async (eventId, updates) => {
  try {
    const allowedFields = [
      'title', 'description', 'start_date', 'end_date', 'all_day',
      'location', 'assigned_to', 'status', 'metadata'
    ];

    const updateFields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = ?`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No valid updates provided' };
    }

    params.push(eventId);

    await db.query(
      `UPDATE calendar_events SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    return { success: true };
  } catch (error) {
    console.error('Update event error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} - Result
 */
const deleteEvent = async (eventId) => {
  try {
    // Delete reminders first
    await db.query(`DELETE FROM event_reminders WHERE event_id = ?`, [eventId]);
    
    // Delete event
    await db.query(`DELETE FROM calendar_events WHERE id = ?`, [eventId]);

    return { success: true };
  } catch (error) {
    console.error('Delete event error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process pending reminders
 * @returns {Promise<number>} - Number of reminders sent
 */
const processReminders = async () => {
  try {
    // Get pending reminders that are due
    const [reminders] = await db.query(
      `SELECT 
        r.id,
        r.event_id,
        r.minutes_before,
        e.title,
        e.description,
        e.start_date,
        e.assigned_to,
        e.type
      FROM event_reminders r
      JOIN calendar_events e ON r.event_id = e.id
      WHERE r.status = 'pending' AND r.reminder_time <= NOW()`
    );

    let sentCount = 0;

    for (const reminder of reminders) {
      try {
        // Send notification
        await notificationService.sendNotification({
          userId: reminder.assigned_to,
          type: 'event_reminder',
          title: `Reminder: ${reminder.title}`,
          message: reminder.minutes_before >= 1440
            ? `Your event is scheduled for ${new Date(reminder.start_date).toLocaleDateString()}`
            : `Your event starts in ${reminder.minutes_before} minutes`,
          data: {
            eventId: reminder.event_id,
            type: reminder.type
          },
          channels: ['inApp', 'push', 'email']
        });

        // Mark reminder as sent
        await db.query(
          `UPDATE event_reminders SET status = 'sent', sent_at = NOW() WHERE id = ?`,
          [reminder.id]
        );

        sentCount++;
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Process reminders error:', error);
    return 0;
  }
};

/**
 * Create certificate expiry reminders
 * @param {number} certificateId - Certificate ID
 * @returns {Promise<Object>} - Result
 */
const createCertificateExpiryReminders = async (certificateId) => {
  try {
    // Get certificate details
    const [certificates] = await db.query(
      `SELECT 
        c.*,
        a.farmer_id,
        a.nursery_name
      FROM certificates c
      JOIN applications a ON c.application_id = a.id
      WHERE c.id = ?`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return { success: false, error: 'Certificate not found' };
    }

    const cert = certificates[0];
    const expiryDate = new Date(cert.expiry_date);

    // Create reminders at 90, 60, 30, 14, 7, and 1 day before expiry
    const reminderDays = [90, 60, 30, 14, 7, 1];

    for (const days of reminderDays) {
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      await createEvent({
        title: `Certificate Expiring in ${days} Days`,
        description: `Your certificate for ${cert.nursery_name} will expire on ${expiryDate.toLocaleDateString()}. Please renew before expiry.`,
        type: EVENT_TYPES.CERTIFICATE_EXPIRY,
        startDate: reminderDate,
        endDate: reminderDate,
        allDay: true,
        relatedEntityType: 'certificate',
        relatedEntityId: certificateId,
        assignedTo: cert.farmer_id,
        createdBy: 1, // System
        reminderMinutes: [60]
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Create expiry reminders error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create inspection schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} - Result
 */
const createInspectionSchedule = async (scheduleData) => {
  try {
    const {
      applicationId,
      nurseryName,
      nurseryLocation,
      officerId,
      scheduledDate,
      notes = ''
    } = scheduleData;

    const result = await createEvent({
      title: `Nursery Inspection: ${nurseryName}`,
      description: `Scheduled inspection for ${nurseryName} at ${nurseryLocation}. ${notes}`,
      type: EVENT_TYPES.INSPECTION,
      startDate: scheduledDate,
      endDate: new Date(new Date(scheduledDate).getTime() + 2 * 60 * 60 * 1000), // 2 hours
      location: nurseryLocation,
      relatedEntityType: 'application',
      relatedEntityId: applicationId,
      assignedTo: officerId,
      createdBy: officerId,
      reminderMinutes: [1440, 60] // 1 day and 1 hour before
    });

    return result;
  } catch (error) {
    console.error('Create inspection schedule error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get upcoming events summary
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Summary
 */
const getUpcomingSummary = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_upcoming,
        COUNT(CASE WHEN DATE(start_date) = ? THEN 1 END) as today,
        COUNT(CASE WHEN DATE(start_date) = DATE_ADD(?, INTERVAL 1 DAY) THEN 1 END) as tomorrow,
        COUNT(CASE WHEN start_date BETWEEN ? AND ? THEN 1 END) as this_week
      FROM calendar_events
      WHERE (assigned_to = ? OR created_by = ?)
        AND start_date >= ?
        AND status = 'pending'`,
      [today, today, today, nextWeek, userId, userId, today]
    );

    return {
      success: true,
      data: {
        totalUpcoming: stats[0].total_upcoming,
        today: stats[0].today,
        tomorrow: stats[0].tomorrow,
        thisWeek: stats[0].this_week
      }
    };
  } catch (error) {
    console.error('Get upcoming summary error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createEvent,
  getUserEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  processReminders,
  createCertificateExpiryReminders,
  createInspectionSchedule,
  getUpcomingSummary,
  EVENT_TYPES,
  EVENT_STATUS
};
