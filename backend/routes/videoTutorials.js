/**
 * Video Tutorials Routes
 */

const express = require('express');
const router = express.Router();
const tutorialService = require('../services/videoTutorialService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route GET /api/tutorials
 * @desc Get all tutorials
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, level, language, search, limit } = req.query;
    
    const tutorials = await tutorialService.getTutorials({
      category,
      level,
      language: language || req.user.language || 'en',
      search,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: tutorials
    });
  } catch (error) {
    console.error('Get tutorials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutorials'
    });
  }
});

/**
 * @route GET /api/tutorials/categories
 * @desc Get tutorial categories
 * @access Private
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.entries(tutorialService.CATEGORIES).map(([key, value]) => ({
        key,
        value,
        label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

/**
 * @route GET /api/tutorials/progress
 * @desc Get user's learning progress
 * @access Private
 */
router.get('/progress', authenticate, async (req, res) => {
  try {
    const result = await tutorialService.getUserProgress(req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress'
    });
  }
});

/**
 * @route GET /api/tutorials/:tutorialId
 * @desc Get tutorial details
 * @access Private
 */
router.get('/:tutorialId', authenticate, async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const result = await tutorialService.getTutorial(
      parseInt(tutorialId),
      req.user.id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get tutorial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutorial'
    });
  }
});

/**
 * @route POST /api/tutorials/:tutorialId/progress
 * @desc Update watch progress
 * @access Private
 */
router.post('/:tutorialId/progress', authenticate, async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const { watchTimeSeconds, isCompleted } = req.body;

    const result = await tutorialService.updateProgress(
      parseInt(tutorialId),
      req.user.id,
      { watchTimeSeconds, isCompleted }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
});

/**
 * @route POST /api/tutorials/:tutorialId/rate
 * @desc Rate tutorial
 * @access Private
 */
router.post('/:tutorialId/rate', authenticate, async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const result = await tutorialService.rateTutorial(
      parseInt(tutorialId),
      req.user.id,
      rating,
      feedback
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Rate tutorial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating tutorial'
    });
  }
});

/**
 * @route POST /api/tutorials
 * @desc Create new tutorial (admin only)
 * @access Private (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await tutorialService.createTutorial(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create tutorial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tutorial'
    });
  }
});

/**
 * @route PUT /api/tutorials/:tutorialId
 * @desc Update tutorial (admin only)
 * @access Private (Admin only)
 */
router.put('/:tutorialId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const result = await tutorialService.updateTutorial(parseInt(tutorialId), req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update tutorial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tutorial'
    });
  }
});

/**
 * @route GET /api/tutorials/admin/statistics
 * @desc Get tutorial statistics (admin only)
 * @access Private (Admin only)
 */
router.get('/admin/statistics', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await tutorialService.getStatistics();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;
