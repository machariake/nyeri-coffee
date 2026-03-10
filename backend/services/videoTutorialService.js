/**
 * Video Tutorials Service
 * Manages educational video content for users
 */

const { pool } = require('../config/database');
const auditService = require('./auditService');

// Tutorial categories
const CATEGORIES = {
  GETTING_STARTED: 'getting_started',
  APPLICATION_PROCESS: 'application_process',
  DOCUMENT_UPLOAD: 'document_upload',
  CERTIFICATE_MANAGEMENT: 'certificate_management',
  OFFICER_TRAINING: 'officer_training',
  ADMIN_GUIDE: 'admin_guide',
  FAQ: 'faq'
};

// Difficulty levels
const LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

/**
 * Get all tutorials with filtering
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - Tutorials
 */
const getTutorials = async (filters = {}) => {
  try {
    const { category, level, language = 'en', search, limit = 50 } = filters;

    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT tv.user_id) as view_count,
        AVG(tv.rating) as average_rating,
        COUNT(DISTINCT CASE WHEN tv.is_completed = TRUE THEN tv.user_id END) as completion_count
      FROM video_tutorials t
      LEFT JOIN tutorial_views tv ON t.id = tv.tutorial_id
      WHERE t.is_active = TRUE AND (t.language = ? OR t.language = 'all')
    `;
    const params = [language];

    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (level) {
      query += ` AND t.level = ?`;
      params.push(level);
    }

    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY t.id ORDER BY t.display_order ASC, t.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      level: row.level,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration_seconds,
      language: row.language,
      tags: JSON.parse(row.tags || '[]'),
      viewCount: row.view_count,
      averageRating: row.average_rating ? Math.round(row.average_rating * 10) / 10 : null,
      completionCount: row.completion_count,
      displayOrder: row.display_order,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Get tutorials error:', error);
    return [];
  }
};

/**
 * Get tutorial by ID
 * @param {number} tutorialId - Tutorial ID
 * @param {number} userId - User ID (for tracking)
 * @returns {Promise<Object>} - Tutorial details
 */
const getTutorial = async (tutorialId, userId = null) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM video_tutorials WHERE id = ? AND is_active = TRUE`,
      [tutorialId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Tutorial not found' };
    }

    const tutorial = rows[0];

    // Get user's view history
    let userProgress = null;
    if (userId) {
      const [views] = await db.query(
        `SELECT * FROM tutorial_views WHERE tutorial_id = ? AND user_id = ?`,
        [tutorialId, userId]
      );
      
      if (views.length > 0) {
        userProgress = {
          watchTime: views[0].watch_time_seconds,
          isCompleted: views[0].is_completed,
          rating: views[0].rating,
          lastWatchedAt: views[0].last_watched_at
        };
      }

      // Record view
      await recordView(tutorialId, userId);
    }

    // Get related tutorials
    const [related] = await db.query(
      `SELECT id, title, thumbnail_url, duration_seconds
       FROM video_tutorials
       WHERE category = ? AND id != ? AND is_active = TRUE
       LIMIT 4`,
      [tutorial.category, tutorialId]
    );

    return {
      success: true,
      data: {
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description,
        category: tutorial.category,
        level: tutorial.level,
        videoUrl: tutorial.video_url,
        thumbnailUrl: tutorial.thumbnail_url,
        duration: tutorial.duration_seconds,
        language: tutorial.language,
        tags: JSON.parse(tutorial.tags || '[]'),
        transcript: tutorial.transcript,
        userProgress,
        relatedTutorials: related.map(r => ({
          id: r.id,
          title: r.title,
          thumbnailUrl: r.thumbnail_url,
          duration: r.duration_seconds
        })),
        createdAt: tutorial.created_at
      }
    };
  } catch (error) {
    console.error('Get tutorial error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record tutorial view
 * @param {number} tutorialId - Tutorial ID
 * @param {number} userId - User ID
 */
const recordView = async (tutorialId, userId) => {
  try {
    await db.query(
      `INSERT INTO tutorial_views (tutorial_id, user_id, view_count, last_watched_at)
       VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
       view_count = view_count + 1,
       last_watched_at = NOW()`,
      [tutorialId, userId]
    );
  } catch (error) {
    console.error('Record view error:', error);
  }
};

/**
 * Update watch progress
 * @param {number} tutorialId - Tutorial ID
 * @param {number} userId - User ID
 * @param {Object} progress - Progress data
 * @returns {Promise<Object>} - Result
 */
const updateProgress = async (tutorialId, userId, progress) => {
  try {
    const { watchTimeSeconds, isCompleted } = progress;

    await db.query(
      `UPDATE tutorial_views 
       SET watch_time_seconds = ?, is_completed = ?
       WHERE tutorial_id = ? AND user_id = ?`,
      [watchTimeSeconds, isCompleted, tutorialId, userId]
    );

    // Award points for completion
    if (isCompleted) {
      const gamificationService = require('./gamificationService');
      await gamificationService.awardPoints(userId, 'TUTORIAL_COMPLETED', {
        tutorialId,
        points: 10
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Update progress error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Rate tutorial
 * @param {number} tutorialId - Tutorial ID
 * @param {number} userId - User ID
 * @param {number} rating - Rating (1-5)
 * @param {string} feedback - Optional feedback
 * @returns {Promise<Object>} - Result
 */
const rateTutorial = async (tutorialId, userId, rating, feedback = null) => {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    await db.query(
      `UPDATE tutorial_views 
       SET rating = ?, feedback = ?
       WHERE tutorial_id = ? AND user_id = ?`,
      [rating, feedback, tutorialId, userId]
    );

    return { success: true };
  } catch (error) {
    console.error('Rate tutorial error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's learning progress
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Progress data
 */
const getUserProgress = async (userId) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT tutorial_id) as tutorials_started,
        COUNT(DISTINCT CASE WHEN is_completed = TRUE THEN tutorial_id END) as tutorials_completed,
        SUM(watch_time_seconds) as total_watch_time,
        AVG(rating) as average_rating_given
      FROM tutorial_views
      WHERE user_id = ?`,
      [userId]
    );

    const [byCategory] = await db.query(
      `SELECT 
        t.category,
        COUNT(DISTINCT tv.tutorial_id) as completed_count
      FROM tutorial_views tv
      JOIN video_tutorials t ON tv.tutorial_id = t.id
      WHERE tv.user_id = ? AND tv.is_completed = TRUE
      GROUP BY t.category`,
      [userId]
    );

    return {
      success: true,
      data: {
        tutorialsStarted: stats[0].tutorials_started,
        tutorialsCompleted: stats[0].tutorials_completed,
        totalWatchTime: stats[0].total_watch_time,
        averageRatingGiven: stats[0].average_rating_given,
        completionRate: stats[0].tutorials_started > 0
          ? Math.round((stats[0].tutorials_completed / stats[0].tutorials_started) * 100)
          : 0,
        byCategory: byCategory.reduce((acc, curr) => {
          acc[curr.category] = curr.completed_count;
          return acc;
        }, {})
      }
    };
  } catch (error) {
    console.error('Get user progress error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new tutorial (admin only)
 * @param {Object} tutorialData - Tutorial data
 * @returns {Promise<Object>} - Result
 */
const createTutorial = async (tutorialData) => {
  try {
    const {
      title,
      description,
      category,
      level,
      videoUrl,
      thumbnailUrl,
      durationSeconds,
      language = 'en',
      tags = [],
      transcript = null,
      displayOrder = 0
    } = tutorialData;

    const [result] = await db.query(
      `INSERT INTO video_tutorials 
       (title, description, category, level, video_url, thumbnail_url, 
        duration_seconds, language, tags, transcript, display_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [title, description, category, level, videoUrl, thumbnailUrl,
       durationSeconds, language, JSON.stringify(tags), transcript, displayOrder]
    );

    return {
      success: true,
      tutorialId: result.insertId
    };
  } catch (error) {
    console.error('Create tutorial error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update tutorial (admin only)
 * @param {number} tutorialId - Tutorial ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Result
 */
const updateTutorial = async (tutorialId, updates) => {
  try {
    const allowedFields = [
      'title', 'description', 'category', 'level', 'video_url',
      'thumbnail_url', 'duration_seconds', 'language', 'tags',
      'transcript', 'display_order', 'is_active'
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

    params.push(tutorialId);

    await db.query(
      `UPDATE video_tutorials SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    return { success: true };
  } catch (error) {
    console.error('Update tutorial error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get tutorial statistics (admin only)
 * @returns {Promise<Object>} - Statistics
 */
const getStatistics = async () => {
  try {
    const [overall] = await db.query(
      `SELECT 
        COUNT(*) as total_tutorials,
        COUNT(DISTINCT tv.user_id) as unique_viewers,
        SUM(tv.view_count) as total_views,
        COUNT(CASE WHEN tv.is_completed = TRUE THEN 1 END) as total_completions,
        AVG(tv.rating) as average_rating
      FROM video_tutorials t
      LEFT JOIN tutorial_views tv ON t.id = tv.tutorial_id
      WHERE t.is_active = TRUE`
    );

    const [byCategory] = await db.query(
      `SELECT 
        category,
        COUNT(*) as tutorial_count,
        SUM(tv.view_count) as views
      FROM video_tutorials t
      LEFT JOIN tutorial_views tv ON t.id = tv.tutorial_id
      WHERE t.is_active = TRUE
      GROUP BY category`
    );

    return {
      success: true,
      data: {
        totalTutorials: overall[0].total_tutorials,
        uniqueViewers: overall[0].unique_viewers,
        totalViews: overall[0].total_views,
        totalCompletions: overall[0].total_completions,
        averageRating: overall[0].average_rating 
          ? Math.round(overall[0].average_rating * 10) / 10 
          : null,
        completionRate: overall[0].total_views > 0
          ? Math.round((overall[0].total_completions / overall[0].total_views) * 100)
          : 0,
        byCategory
      }
    };
  } catch (error) {
    console.error('Get statistics error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getTutorials,
  getTutorial,
  updateProgress,
  rateTutorial,
  getUserProgress,
  createTutorial,
  updateTutorial,
  getStatistics,
  CATEGORIES,
  LEVELS
};
