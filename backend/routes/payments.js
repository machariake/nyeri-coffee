const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  initiateSTKPush,
  querySTKStatus,
  handleCallback,
  getPaymentHistory,
  getPaymentStats,
} = require('../services/mpesaService');

const router = express.Router();

// Initiate M-Pesa payment
router.post('/mpesa/stkpush', authenticate, [
  body('phoneNumber').notEmpty().matches(/^(0|254)\d{9}$/),
  body('amount').isFloat({ min: 1 }),
  body('accountReference').notEmpty(),
  body('description').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phoneNumber, amount, accountReference, description, applicationId } = req.body;

    const result = await initiateSTKPush({
      phoneNumber,
      amount,
      accountReference,
      transactionDesc: description || 'AgriCertify Payment',
      userId: req.user.id,
      applicationId,
    });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Query payment status
router.get('/status/:checkoutRequestId', authenticate, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const result = await querySTKStatus(checkoutRequestId);

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Query status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// M-Pesa callback URL (public)
router.post('/callback', async (req, res) => {
  try {
    console.log('M-Pesa callback received:', req.body);

    const result = await handleCallback(req.body);

    // Always return 200 to M-Pesa
    res.json({
      ResultCode: result.success ? 0 : 1,
      ResultDesc: result.success ? 'Success' : result.error,
    });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page, limit, status } = req.query;

    const result = await getPaymentHistory(req.user.id, { page, limit, status });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get payment statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await getPaymentStats(req.user.id);

    if (result.success) {
      res.json({ success: true, data: result.stats });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
