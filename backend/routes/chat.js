/**
 * Chat Routes for In-App Messaging
 */

const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route GET /api/chat/rooms
 * @desc Get user's chat rooms
 * @access Private
 */
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const rooms = await chatService.getUserChatRooms(req.user.id);
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms'
    });
  }
});

/**
 * @route POST /api/chat/rooms
 * @desc Create a new chat room
 * @access Private
 */
router.post('/rooms', authenticate, async (req, res) => {
  try {
    const { name, type, participants, applicationId, metadata } = req.body;

    if (!name || !type || !participants) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and participants are required'
      });
    }

    const result = await chatService.createChatRoom({
      name,
      type,
      createdBy: req.user.id,
      participants,
      applicationId,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat room'
    });
  }
});

/**
 * @route GET /api/chat/rooms/:roomId/messages
 * @desc Get messages from a chat room
 * @access Private
 */
router.get('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit, before, after } = req.query;

    const messages = await chatService.getMessages(parseInt(roomId), {
      limit: parseInt(limit) || 50,
      before,
      after
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

/**
 * @route POST /api/chat/rooms/:roomId/messages
 * @desc Send a message to a chat room
 * @access Private
 */
router.post('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type, replyTo, metadata, attachments } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const result = await chatService.sendMessage({
      roomId: parseInt(roomId),
      senderId: req.user.id,
      content,
      type,
      replyTo,
      metadata,
      attachments
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

/**
 * @route POST /api/chat/rooms/:roomId/read
 * @desc Mark messages as read
 * @access Private
 */
router.post('/rooms/:roomId/read', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await chatService.markAsRead(parseInt(roomId), req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
});

/**
 * @route PUT /api/chat/messages/:messageId
 * @desc Edit a message
 * @access Private
 */
router.put('/messages/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await chatService.editMessage(
      parseInt(messageId),
      req.user.id,
      content
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message'
    });
  }
});

/**
 * @route DELETE /api/chat/messages/:messageId
 * @desc Delete a message
 * @access Private
 */
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await chatService.deleteMessage(parseInt(messageId), req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
});

/**
 * @route POST /api/chat/rooms/:roomId/participants
 * @desc Add participant to room
 * @access Private (Officers and Admins)
 */
router.post('/rooms/:roomId/participants', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await chatService.addParticipant(
      parseInt(roomId),
      userId,
      req.user.id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding participant'
    });
  }
});

/**
 * @route DELETE /api/chat/rooms/:roomId/participants/:userId
 * @desc Remove participant from room
 * @access Private (Officers and Admins)
 */
router.delete('/rooms/:roomId/participants/:userId', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const result = await chatService.removeParticipant(
      parseInt(roomId),
      parseInt(userId),
      req.user.id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing participant'
    });
  }
});

/**
 * @route GET /api/chat/support
 * @desc Get or create support chat
 * @access Private
 */
router.get('/support', authenticate, async (req, res) => {
  try {
    const result = await chatService.getOrCreateSupportChat(req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get support chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting support chat'
    });
  }
});

/**
 * @route GET /api/chat/rooms/:roomId/search
 * @desc Search messages in a room
 * @access Private
 */
router.get('/rooms/:roomId/search', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await chatService.searchMessages(parseInt(roomId), q);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching messages'
    });
  }
});

module.exports = router;
