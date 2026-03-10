/**
 * Chat Service for In-App Messaging
 * Supports real-time messaging, chat rooms, and notifications
 */

const { pool } = require('../config/database');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

// Chat room types
const CHAT_ROOM_TYPES = {
  SUPPORT: 'support',
  APPLICATION: 'application',
  GROUP: 'group',
  DIRECT: 'direct'
};

// Message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  SYSTEM: 'system',
  VOICE: 'voice'
};

/**
 * Create a new chat room
 * @param {Object} roomData - Room configuration
 * @returns {Promise<Object>} - Created room
 */
const createChatRoom = async (roomData) => {
  try {
    const {
      name,
      type,
      createdBy,
      participants,
      applicationId = null,
      metadata = {}
    } = roomData;

    // Create room
    const [result] = await db.query(
      `INSERT INTO chat_rooms (name, type, created_by, application_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, type, createdBy, applicationId, JSON.stringify(metadata)]
    );

    const roomId = result.insertId;

    // Add participants
    const allParticipants = [...new Set([createdBy, ...participants])];
    for (const userId of allParticipants) {
      await db.query(
        `INSERT INTO chat_room_participants (room_id, user_id, joined_at)
         VALUES (?, ?, NOW())`,
        [roomId, userId]
      );
    }

    // Create system message
    await sendMessage({
      roomId,
      senderId: null,
      type: MESSAGE_TYPES.SYSTEM,
      content: `Chat room "${name}" created`,
      metadata: { action: 'room_created', createdBy }
    });

    // Log audit
    await auditService.logAction({
      userId: createdBy,
      action: 'CHAT_ROOM_CREATED',
      entityType: 'chat_room',
      entityId: roomId,
      newValues: { name, type, participants: allParticipants }
    });

    return {
      success: true,
      roomId,
      name,
      type
    };
  } catch (error) {
    console.error('Create chat room error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a message to a chat room
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} - Sent message
 */
const sendMessage = async (messageData) => {
  try {
    const {
      roomId,
      senderId,
      content,
      type = MESSAGE_TYPES.TEXT,
      replyTo = null,
      metadata = {},
      attachments = []
    } = messageData;

    // Verify sender is participant
    if (senderId) {
      const [participant] = await db.query(
        `SELECT id FROM chat_room_participants WHERE room_id = ? AND user_id = ?`,
        [roomId, senderId]
      );

      if (participant.length === 0) {
        return { success: false, error: 'Not a participant of this room' };
      }
    }

    // Insert message
    const [result] = await db.query(
      `INSERT INTO chat_messages 
       (room_id, sender_id, content, type, reply_to, metadata, attachments, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [roomId, senderId, content, type, replyTo, 
       JSON.stringify(metadata), JSON.stringify(attachments)]
    );

    const messageId = result.insertId;

    // Update room's last message
    await db.query(
      `UPDATE chat_rooms SET last_message_at = NOW() WHERE id = ?`,
      [roomId]
    );

    // Update participant's last read
    if (senderId) {
      await db.query(
        `UPDATE chat_room_participants 
         SET last_read_at = NOW() 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, senderId]
      );
    }

    // Notify other participants
    await notifyParticipants(roomId, senderId, {
      messageId,
      content: type === MESSAGE_TYPES.TEXT ? content : `New ${type}`,
      senderId
    });

    return {
      success: true,
      messageId,
      roomId,
      senderId,
      content,
      type,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify participants of new message
 */
const notifyParticipants = async (roomId, senderId, message) => {
  try {
    // Get other participants
    const [participants] = await db.query(
      `SELECT user_id FROM chat_room_participants 
       WHERE room_id = ? AND user_id != ?`,
      [roomId, senderId]
    );

    // Get room info
    const [rooms] = await db.query(
      `SELECT name, type FROM chat_rooms WHERE id = ?`,
      [roomId]
    );
    const room = rooms[0];

    for (const participant of participants) {
      // Send in-app notification
      await notificationService.sendNotification({
        userId: participant.user_id,
        type: 'new_message',
        title: `New message in ${room.name}`,
        message: message.content.substring(0, 100),
        data: {
          roomId,
          messageId: message.messageId,
          senderId: message.senderId
        },
        channels: ['inApp', 'push']
      });
    }
  } catch (error) {
    console.error('Notify participants error:', error);
  }
};

/**
 * Get messages from a chat room
 * @param {number} roomId - Room ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Messages
 */
const getMessages = async (roomId, options = {}) => {
  try {
    const { limit = 50, before = null, after = null } = options;

    let query = `
      SELECT 
        m.id,
        m.room_id,
        m.sender_id,
        m.content,
        m.type,
        m.reply_to,
        m.metadata,
        m.attachments,
        m.created_at,
        m.is_edited,
        m.edited_at,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
    `;
    const params = [roomId];

    if (before) {
      query += ` AND m.created_at < ?`;
      params.push(before);
    }

    if (after) {
      query += ` AND m.created_at > ?`;
      params.push(after);
    }

    query += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      senderName: row.first_name ? `${row.first_name} ${row.last_name}` : 'System',
      senderAvatar: row.avatar_url,
      content: row.content,
      type: row.type,
      replyTo: row.reply_to,
      metadata: JSON.parse(row.metadata || '{}'),
      attachments: JSON.parse(row.attachments || '[]'),
      createdAt: row.created_at,
      isEdited: row.is_edited,
      editedAt: row.edited_at
    })).reverse();
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
};

/**
 * Get user's chat rooms
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Chat rooms
 */
const getUserChatRooms = async (userId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        r.id,
        r.name,
        r.type,
        r.application_id,
        r.last_message_at,
        r.metadata,
        p.last_read_at,
        p.is_muted,
        (SELECT COUNT(*) FROM chat_messages 
         WHERE room_id = r.id AND created_at > p.last_read_at) as unread_count,
        (SELECT content FROM chat_messages 
         WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_rooms r
      JOIN chat_room_participants p ON r.id = p.room_id
      WHERE p.user_id = ?
      ORDER BY r.last_message_at DESC`,
      [userId]
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      applicationId: row.application_id,
      lastMessageAt: row.last_message_at,
      lastMessage: row.last_message,
      lastReadAt: row.last_read_at,
      unreadCount: row.unread_count,
      isMuted: row.is_muted,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  } catch (error) {
    console.error('Get user chat rooms error:', error);
    return [];
  }
};

/**
 * Mark messages as read
 * @param {number} roomId - Room ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result
 */
const markAsRead = async (roomId, userId) => {
  try {
    await db.query(
      `UPDATE chat_room_participants 
       SET last_read_at = NOW() 
       WHERE room_id = ? AND user_id = ?`,
      [roomId, userId]
    );

    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Edit a message
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID (must be sender)
 * @param {string} newContent - New content
 * @returns {Promise<Object>} - Result
 */
const editMessage = async (messageId, userId, newContent) => {
  try {
    // Verify sender
    const [messages] = await db.query(
      `SELECT sender_id FROM chat_messages WHERE id = ?`,
      [messageId]
    );

    if (messages.length === 0) {
      return { success: false, error: 'Message not found' };
    }

    if (messages[0].sender_id !== userId) {
      return { success: false, error: 'Can only edit your own messages' };
    }

    await db.query(
      `UPDATE chat_messages 
       SET content = ?, is_edited = TRUE, edited_at = NOW()
       WHERE id = ?`,
      [newContent, messageId]
    );

    return { success: true };
  } catch (error) {
    console.error('Edit message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a message (soft delete)
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result
 */
const deleteMessage = async (messageId, userId) => {
  try {
    const [messages] = await db.query(
      `SELECT sender_id FROM chat_messages WHERE id = ?`,
      [messageId]
    );

    if (messages.length === 0) {
      return { success: false, error: 'Message not found' };
    }

    // Allow sender or admin to delete
    const [users] = await db.query(
      `SELECT role FROM users WHERE id = ?`,
      [userId]
    );

    if (messages[0].sender_id !== userId && users[0]?.role !== 'admin') {
      return { success: false, error: 'Not authorized to delete this message' };
    }

    await db.query(
      `UPDATE chat_messages 
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ?
       WHERE id = ?`,
      [userId, messageId]
    );

    return { success: true };
  } catch (error) {
    console.error('Delete message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add participant to room
 * @param {number} roomId - Room ID
 * @param {number} userId - User to add
 * @param {number} addedBy - User adding
 * @returns {Promise<Object>} - Result
 */
const addParticipant = async (roomId, userId, addedBy) => {
  try {
    await db.query(
      `INSERT INTO chat_room_participants (room_id, user_id, joined_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE joined_at = NOW()`,
      [roomId, userId]
    );

    // Send system message
    const [users] = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [userId]
    );
    const userName = users[0] ? `${users[0].first_name} ${users[0].last_name}` : 'User';

    await sendMessage({
      roomId,
      senderId: null,
      type: MESSAGE_TYPES.SYSTEM,
      content: `${userName} joined the chat`,
      metadata: { action: 'user_joined', userId, addedBy }
    });

    return { success: true };
  } catch (error) {
    console.error('Add participant error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove participant from room
 * @param {number} roomId - Room ID
 * @param {number} userId - User to remove
 * @param {number} removedBy - User removing
 * @returns {Promise<Object>} - Result
 */
const removeParticipant = async (roomId, userId, removedBy) => {
  try {
    await db.query(
      `DELETE FROM chat_room_participants WHERE room_id = ? AND user_id = ?`,
      [roomId, userId]
    );

    // Send system message
    const [users] = await db.query(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [userId]
    );
    const userName = users[0] ? `${users[0].first_name} ${users[0].last_name}` : 'User';

    await sendMessage({
      roomId,
      senderId: null,
      type: MESSAGE_TYPES.SYSTEM,
      content: `${userName} left the chat`,
      metadata: { action: 'user_left', userId, removedBy }
    });

    return { success: true };
  } catch (error) {
    console.error('Remove participant error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get or create support chat for user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Support chat room
 */
const getOrCreateSupportChat = async (userId) => {
  try {
    // Check for existing support chat
    const [existing] = await db.query(
      `SELECT r.id FROM chat_rooms r
       JOIN chat_room_participants p ON r.id = p.room_id
       WHERE r.type = 'support' AND p.user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      return { success: true, roomId: existing[0].id };
    }

    // Get available support agent
    const [agents] = await db.query(
      `SELECT id FROM users WHERE role IN ('officer', 'admin') LIMIT 1`
    );

    // Create new support chat
    const result = await createChatRoom({
      name: 'Support Chat',
      type: CHAT_ROOM_TYPES.SUPPORT,
      createdBy: userId,
      participants: agents.map(a => a.id)
    });

    return result;
  } catch (error) {
    console.error('Get support chat error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search messages in a room
 * @param {number} roomId - Room ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Matching messages
 */
const searchMessages = async (roomId, query) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        m.id,
        m.content,
        m.created_at,
        u.first_name,
        u.last_name
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ? AND m.content LIKE ? AND m.type = 'text'
      ORDER BY m.created_at DESC
      LIMIT 50`,
      [roomId, `%${query}%`]
    );

    return rows.map(row => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      senderName: row.first_name ? `${row.first_name} ${row.last_name}` : 'System'
    }));
  } catch (error) {
    console.error('Search messages error:', error);
    return [];
  }
};

module.exports = {
  createChatRoom,
  sendMessage,
  getMessages,
  getUserChatRooms,
  markAsRead,
  editMessage,
  deleteMessage,
  addParticipant,
  removeParticipant,
  getOrCreateSupportChat,
  searchMessages,
  CHAT_ROOM_TYPES,
  MESSAGE_TYPES
};
