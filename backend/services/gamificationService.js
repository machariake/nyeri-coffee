/**
 * Gamification Service
 * Handles badges, points, levels, and leaderboards
 */

const { pool } = require('../config/database');
const { sendNotification } = require('./notificationService');

// Badge definitions
const BADGE_DEFINITIONS = {
  FIRST_STEPS: {
    id: 1,
    name: 'First Steps',
    description: 'Created your first application',
    points: 10,
    requirement: { type: 'applications_count', value: 1 },
  },
  APPLICATION_PRO: {
    id: 2,
    name: 'Application Pro',
    description: 'Submitted 5 applications',
    points: 50,
    requirement: { type: 'applications_count', value: 5 },
  },
  CERTIFIED_FARMER: {
    id: 3,
    name: 'Certified Farmer',
    description: 'Received your first certificate',
    points: 100,
    requirement: { type: 'certificates_count', value: 1 },
  },
  CERTIFICATE_COLLECTOR: {
    id: 4,
    name: 'Certificate Collector',
    description: 'Received 5 certificates',
    points: 250,
    requirement: { type: 'certificates_count', value: 5 },
  },
  QUICK_STARTER: {
    id: 5,
    name: 'Quick Starter',
    description: 'Completed application within 24 hours of registration',
    points: 25,
    requirement: { type: 'quick_start', value: 1 },
  },
  DOCUMENT_MASTER: {
    id: 6,
    name: 'Document Master',
    description: 'Uploaded all required documents',
    points: 15,
    requirement: { type: 'complete_documents', value: 1 },
  },
  ACTIVE_MEMBER: {
    id: 7,
    name: 'Active Member',
    description: 'Logged in for 7 consecutive days',
    points: 30,
    requirement: { type: 'login_streak', value: 7 },
  },
  COMMUNITY_HELPER: {
    id: 8,
    name: 'Community Helper',
    description: 'Replied to 10 forum topics',
    points: 40,
    requirement: { type: 'forum_replies', value: 10 },
  },
  EARLY_BIRD: {
    id: 9,
    name: 'Early Bird',
    description: 'Submitted application before 8 AM',
    points: 20,
    requirement: { type: 'early_submission', value: 1 },
  },
  PERFECT_SCORE: {
    id: 10,
    name: 'Perfect Score',
    description: 'Got first application approved without rejection',
    points: 50,
    requirement: { type: 'first_try_approval', value: 1 },
  },
  STREAK_MASTER: {
    id: 11,
    name: 'Streak Master',
    description: '30-day login streak',
    points: 100,
    requirement: { type: 'login_streak', value: 30 },
  },
  TOP_CONTRIBUTOR: {
    id: 12,
    name: 'Top Contributor',
    description: 'Helped 50 other farmers in the forum',
    points: 200,
    requirement: { type: 'helped_farmers', value: 50 },
  },
  EXPERT_FARMER: {
    id: 13,
    name: 'Expert Farmer',
    description: 'Maintained 10 active certificates for a year',
    points: 500,
    requirement: { type: 'expert_certificates', value: 10 },
  },
};

// Award points to user
const awardPoints = async (userId, points, source, description) => {
  try {
    // Add transaction
    await pool.query(
      `INSERT INTO point_transactions (user_id, points, source, description)
       VALUES (?, ?, ?, ?)`,
      [userId, points, source, description]
    );

    // Update total points
    await pool.query(
      `INSERT INTO user_points (user_id, total_points, ${source}_points)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       total_points = total_points + ?,
       ${source}_points = ${source}_points + ?`,
      [userId, points, points, points, points]
    );

    // Check for level up
    await checkLevelUp(userId);

    return { success: true };
  } catch (error) {
    console.error('Award points error:', error);
    return { success: false, error: error.message };
  }
};

// Check and award badges
const checkAndAwardBadges = async (userId) => {
  try {
    const earnedBadges = [];

    // Get user's current stats
    const [stats] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM applications WHERE user_id = ?) as applications_count,
        (SELECT COUNT(*) FROM certificates WHERE user_id = ?) as certificates_count,
        (SELECT current_streak FROM user_points WHERE user_id = ?) as login_streak,
        (SELECT COUNT(*) FROM forum_replies WHERE user_id = ?) as forum_replies`,
      [userId, userId, userId, userId]
    );

    const userStats = stats[0];

    // Get already earned badges
    const [earned] = await pool.query(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedBadgeIds = earned.map((b) => b.badge_id);

    // Check each badge
    for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let shouldAward = false;

      switch (badge.requirement.type) {
        case 'applications_count':
          shouldAward = userStats.applications_count >= badge.requirement.value;
          break;
        case 'certificates_count':
          shouldAward = userStats.certificates_count >= badge.requirement.value;
          break;
        case 'login_streak':
          shouldAward = userStats.login_streak >= badge.requirement.value;
          break;
        case 'forum_replies':
          shouldAward = userStats.forum_replies >= badge.requirement.value;
          break;
      }

      if (shouldAward) {
        await awardBadge(userId, badge);
        earnedBadges.push(badge);
      }
    }

    return { success: true, earnedBadges };
  } catch (error) {
    console.error('Check badges error:', error);
    return { success: false, error: error.message };
  }
};

// Award a specific badge
const awardBadge = async (userId, badge) => {
  try {
    await pool.query(
      'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
      [userId, badge.id]
    );

    // Award points for the badge
    await awardPoints(userId, badge.points, 'engagement', `Earned badge: ${badge.name}`);

    // Send notification
    await sendNotification({
      userId,
      type: 'badge_earned',
      title: '🏆 New Badge Earned!',
      message: `Congratulations! You've earned the "${badge.name}" badge!`,
      channels: ['inApp', 'push'],
    });

    return { success: true };
  } catch (error) {
    console.error('Award badge error:', error);
    return { success: false, error: error.message };
  }
};

// Check for level up
const checkLevelUp = async (userId) => {
  try {
    const [points] = await pool.query(
      'SELECT total_points, level FROM user_points WHERE user_id = ?',
      [userId]
    );

    if (points.length === 0) return;

    const { total_points, level } = points[0];

    // Level thresholds
    const levels = [
      { level: 1, min: 0, title: 'Beginner' },
      { level: 2, min: 100, title: 'Novice' },
      { level: 3, min: 300, title: 'Intermediate' },
      { level: 4, min: 600, title: 'Advanced' },
      { level: 5, min: 1000, title: 'Expert' },
      { level: 6, min: 1500, title: 'Master' },
      { level: 7, min: 2500, title: 'Grandmaster' },
      { level: 8, min: 4000, title: 'Legend' },
    ];

    const newLevel = levels.reverse().find((l) => total_points >= l.min);

    if (newLevel && newLevel.level > level) {
      await pool.query(
        'UPDATE user_points SET level = ? WHERE user_id = ?',
        [newLevel.level, userId]
      );

      // Send level up notification
      await sendNotification({
        userId,
        type: 'level_up',
        title: '🎉 Level Up!',
        message: `Congratulations! You've reached Level ${newLevel.level} - ${newLevel.title}!`,
        channels: ['inApp', 'push'],
      });

      return { success: true, leveledUp: true, newLevel };
    }

    return { success: true, leveledUp: false };
  } catch (error) {
    console.error('Level up check error:', error);
    return { success: false, error: error.message };
  }
};

// Update login streak
const updateLoginStreak = async (userId) => {
  try {
    const today = new Date().toDateString();

    const [points] = await pool.query(
      'SELECT last_activity_date, current_streak, longest_streak FROM user_points WHERE user_id = ?',
      [userId]
    );

    if (points.length === 0) {
      // First login
      await pool.query(
        `INSERT INTO user_points (user_id, current_streak, longest_streak, last_activity_date)
         VALUES (?, 1, 1, CURDATE())`,
        [userId]
      );
      return { success: true, streak: 1 };
    }

    const { last_activity_date, current_streak, longest_streak } = points[0];
    const lastDate = last_activity_date ? new Date(last_activity_date).toDateString() : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = current_streak;

    if (lastDate === today) {
      // Already logged in today
      return { success: true, streak: current_streak };
    } else if (lastDate === yesterday.toDateString()) {
      // Consecutive day
      newStreak = current_streak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongest = Math.max(longest_streak || 0, newStreak);

    await pool.query(
      `UPDATE user_points 
       SET current_streak = ?, 
           longest_streak = ?, 
           last_activity_date = CURDATE()
       WHERE user_id = ?`,
      [newStreak, newLongest, userId]
    );

    // Award streak points
    if (newStreak > 1) {
      await awardPoints(userId, 5, 'engagement', `${newStreak} day login streak!`);
    }

    // Check for streak badges
    await checkAndAwardBadges(userId);

    return { success: true, streak: newStreak };
  } catch (error) {
    console.error('Update streak error:', error);
    return { success: false, error: error.message };
  }
};

// Get user gamification stats
const getUserStats = async (userId) => {
  try {
    const [points] = await pool.query(
      `SELECT total_points, application_points, certificate_points, 
              engagement_points, current_streak, longest_streak, level
       FROM user_points WHERE user_id = ?`,
      [userId]
    );

    const [badges] = await pool.query(
      `SELECT b.*, ub.earned_at 
       FROM badges b
       JOIN user_badges ub ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    const [transactions] = await pool.query(
      `SELECT * FROM point_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    // Calculate progress to next level
    const levels = [
      { level: 1, min: 0 },
      { level: 2, min: 100 },
      { level: 3, min: 300 },
      { level: 4, min: 600 },
      { level: 5, min: 1000 },
      { level: 6, min: 1500 },
      { level: 7, min: 2500 },
      { level: 8, min: 4000 },
    ];

    const currentLevel = points[0]?.level || 1;
    const currentPoints = points[0]?.total_points || 0;
    const nextLevel = levels.find((l) => l.level === currentLevel + 1);
    const progress = nextLevel
      ? ((currentPoints - levels[currentLevel - 1].min) /
          (nextLevel.min - levels[currentLevel - 1].min)) *
        100
      : 100;

    return {
      success: true,
      stats: {
        ...points[0],
        progress: Math.min(progress, 100),
        nextLevelPoints: nextLevel?.min || null,
      },
      badges,
      recentTransactions: transactions,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard
const getLeaderboard = async (options = {}) => {
  try {
    const { type = 'total', period = 'all', limit = 10 } = options;

    let orderBy = 'total_points';
    if (type === 'applications') orderBy = 'application_points';
    if (type === 'certificates') orderBy = 'certificate_points';
    if (type === 'engagement') orderBy = 'engagement_points';

    let timeFilter = '';
    if (period === 'month') {
      timeFilter = 'AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    } else if (period === 'week') {
      timeFilter = 'AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    }

    const [leaders] = await pool.query(
      `SELECT 
        u.id, u.full_name, u.ward,
        up.total_points, up.level, up.current_streak,
        COUNT(DISTINCT ub.badge_id) as badge_count
       FROM users u
       JOIN user_points up ON u.id = up.user_id
       LEFT JOIN user_badges ub ON u.id = ub.user_id
       WHERE u.role = 'farmer' AND u.is_active = TRUE
       GROUP BY u.id
       ORDER BY up.${orderBy} DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    return {
      success: true,
      leaderboard: leaders.map((user, index) => ({
        ...user,
        rank: index + 1,
      })),
    };
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  awardPoints,
  checkAndAwardBadges,
  awardBadge,
  updateLoginStreak,
  getUserStats,
  getLeaderboard,
  BADGE_DEFINITIONS,
};
