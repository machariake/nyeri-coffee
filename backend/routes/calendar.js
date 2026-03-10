/**
 * Calendar & Reminders Routes
 */

const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route GET /api/calendar/events
 * @desc Get user's calendar events
 * @access Private
 */
router.get('/events', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;
    
    const events = await calendarService.getUserEvents(req.user.id, {
      startDate,
      endDate,
      type,
      status
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

/**
 * @route GET /api/calendar/events/summary
 * @desc Get upcoming events summary
 * @access Private
 */
router.get('/events/summary', authenticate, async (req, res) => {
  try {
    const result = await calendarService.getUpcomingSummary(req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get events summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events summary'
    });
  }
});

/**
 * @route POST /api/calendar/events
 * @desc Create calendar event
 * @access Private
 */
router.post('/events', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      allDay,
      location,
      relatedEntityType,
      relatedEntityId,
      assignedTo,
      reminderMinutes,
      recurrence,
      metadata
    } = req.body;

    if (!title || !type || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, and start date are required'
      });
    }

    const result = await calendarService.createEvent({
      title,
      description,
      type,
      startDate,
      endDate,
      allDay,
      location,
      relatedEntityType,
      relatedEntityId,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      reminderMinutes,
      recurrence,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event'
    });
  }
});

/**
 * @route GET /api/calendar/events/:eventId
 * @desc Get event details
 * @access Private
 */
router.get('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await calendarService.getEvent(parseInt(eventId));

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event'
    });
  }
});

/**
 * @route PUT /api/calendar/events/:eventId
 * @desc Update event
 * @access Private
 */
router.put('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const result = await calendarService.updateEvent(parseInt(eventId), updates);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event'
    });
  }
});

/**
 * @route DELETE /api/calendar/events/:eventId
 * @desc Delete event
 * @access Private
 */
router.delete('/events/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await calendarService.deleteEvent(parseInt(eventId));

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event'
    });
  }
});

/**
 * @route POST /api/calendar/inspections
 * @desc Create inspection schedule
 * @access Private (Officers only)
 */
router.post('/inspections', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const {
      applicationId,
      nurseryName,
      nurseryLocation,
      officerId,
      scheduledDate,
      notes
    } = req.body;

    if (!applicationId || !nurseryName || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Application ID, nursery name, and scheduled date are required'
      });
    }

    const result = await calendarService.createInspectionSchedule({
      applicationId,
      nurseryName,
      nurseryLocation,
      officerId: officerId || req.user.id,
      scheduledDate,
      notes
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create inspection schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating inspection schedule'
    });
  }
});

/**
 * @route POST /api/calendar/process-reminders
 * @desc Process pending reminders (admin/system endpoint)
 * @access Private (Admin only)
 */
router.post('/process-reminders', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const sentCount = await calendarService.processReminders();
    
    res.json({
      success: true,
      data: {
        remindersSent: sentCount
      }
    });
  } catch (error) {
    console.error('Process reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing reminders'
    });
  }
});

module.exports = router;
