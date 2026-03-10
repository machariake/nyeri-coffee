/**
 * AI Document Verification Routes
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiVerificationService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route POST /api/ai/verify
 * @desc Analyze document using AI
 * @access Private (Officers and Admins)
 */
router.post('/verify', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { documentId, documentType, imageUrl, extractedText, metadata } = req.body;

    if (!documentId || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and type are required'
      });
    }

    const result = await aiService.analyzeDocument({
      documentId,
      documentType,
      imageUrl,
      extractedText,
      metadata
    });

    res.json(result);
  } catch (error) {
    console.error('AI verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing document'
    });
  }
});

/**
 * @route POST /api/ai/verify/batch
 * @desc Batch verify multiple documents
 * @access Private (Officers and Admins)
 */
router.post('/verify/batch', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { documents } = req.body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Documents array is required'
      });
    }

    const results = await aiService.batchVerify(documents);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error batch verifying documents'
    });
  }
});

/**
 * @route GET /api/ai/verify/history
 * @desc Get AI verification history
 * @access Private (Officers and Admins)
 */
router.get('/verify/history', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { documentId, riskLevel, fromDate, toDate, limit } = req.query;

    const history = await aiService.getVerificationHistory({
      documentId,
      riskLevel,
      fromDate,
      toDate,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification history'
    });
  }
});

/**
 * @route GET /api/ai/verify/stats
 * @desc Get fraud detection statistics
 * @access Private (Admin only)
 */
router.get('/verify/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await aiService.getFraudStats();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get fraud stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud statistics'
    });
  }
});

module.exports = router;
