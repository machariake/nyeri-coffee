/**
 * Certificate Wallet Routes
 */

const express = require('express');
const router = express.Router();
const walletService = require('../services/certificateWalletService');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/wallet
 * @desc Get user's certificate wallet
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, tag, search } = req.query;
    
    const wallet = await walletService.getWallet(req.user.id, {
      status,
      tag,
      search
    });

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet'
    });
  }
});

/**
 * @route POST /api/wallet
 * @desc Add certificate to wallet
 * @access Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { certificateId, notes, tags } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }

    const result = await walletService.addToWallet({
      userId: req.user.id,
      certificateId,
      notes,
      tags
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Add to wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding certificate to wallet'
    });
  }
});

/**
 * @route GET /api/wallet/stats
 * @desc Get wallet statistics
 * @access Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await walletService.getWalletStats(req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet statistics'
    });
  }
});

/**
 * @route GET /api/wallet/:walletId
 * @desc Get wallet certificate details
 * @access Private
 */
router.get('/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const result = await walletService.getWalletCertificate(
      parseInt(walletId),
      req.user.id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get wallet certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate details'
    });
  }
});

/**
 * @route PUT /api/wallet/:walletId
 * @desc Update wallet certificate
 * @access Private
 */
router.put('/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { notes, tags, isFavorite } = req.body;

    const result = await walletService.updateWalletCertificate(
      parseInt(walletId),
      req.user.id,
      { notes, tags, isFavorite }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update wallet certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating certificate'
    });
  }
});

/**
 * @route DELETE /api/wallet/:walletId
 * @desc Remove certificate from wallet
 * @access Private
 */
router.delete('/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const result = await walletService.removeFromWallet(
      parseInt(walletId),
      req.user.id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Remove from wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing certificate from wallet'
    });
  }
});

/**
 * @route POST /api/wallet/:walletId/share
 * @desc Share certificate
 * @access Private
 */
router.post('/:walletId/share', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { recipientEmail, expiryDays, message } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const result = await walletService.shareCertificate(
      parseInt(walletId),
      req.user.id,
      { recipientEmail, expiryDays, message }
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Share certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing certificate'
    });
  }
});

/**
 * @route GET /api/wallet/verify/hash/:hash
 * @desc Verify certificate by hash
 * @access Public
 */
router.get('/verify/hash/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const result = await walletService.verifyByHash(hash);

    res.json(result);
  } catch (error) {
    console.error('Verify by hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate'
    });
  }
});

/**
 * @route GET /api/wallet/shared/:token
 * @desc View shared certificate
 * @access Public
 */
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await walletService.verifySharedCertificate(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Verify shared certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying shared certificate'
    });
  }
});

module.exports = router;
