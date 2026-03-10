/**
 * M-Pesa Integration Service
 * Handles STK Push, C2B, and B2C transactions
 */

const axios = require('axios');
const { pool } = require('../config/database');

// M-Pesa Configuration
const MPESA_CONFIG = {
  baseUrl: process.env.MPESA_ENV === 'production' 
    ? 'https://api.safaricom.et'
    : 'https://sandbox.safaricom.et',
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL,
};

// Generate Access Token
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa access token error:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
};

// Generate Password and Timestamp
const generatePassword = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
  ).toString('base64');
  
  return { password, timestamp };
};

// STK Push (Lipa na M-Pesa Online)
const initiateSTKPush = async ({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
  userId,
  applicationId,
}) => {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    // Format phone number (remove leading 0 and add 254)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? `254${phoneNumber.slice(1)}` 
      : phoneNumber;

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl || MPESA_CONFIG.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Save payment record
    const [result] = await pool.query(
      `INSERT INTO payments (user_id, application_id, amount, payment_method, 
       mpesa_phone_number, transaction_id, status, description)
       VALUES (?, ?, ?, 'mpesa', ?, ?, 'pending', ?)`,
      [userId, applicationId, amount, formattedPhone, response.data.CheckoutRequestID, transactionDesc]
    );

    return {
      success: true,
      paymentId: result.insertId,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error) {
    console.error('STK Push error:', error);
    return {
      success: false,
      error: error.response?.data?.errorMessage || 'Failed to initiate payment',
    };
  }
};

// Query STK Push Status
const querySTKStatus = async (checkoutRequestId) => {
  try {
    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      mpesaReceiptNumber: response.data.CallbackMetadata?.Item?.find(
        item => item.Name === 'MpesaReceiptNumber'
      )?.Value,
    };
  } catch (error) {
    console.error('Query STK status error:', error);
    return {
      success: false,
      error: error.response?.data?.errorMessage || 'Failed to query status',
    };
  }
};

// Handle M-Pesa Callback
const handleCallback = async (callbackData) => {
  try {
    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      return { success: false, error: 'Invalid callback data' };
    }

    const { stkCallback } = Body;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Get payment record
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE transaction_id = ?',
      [checkoutRequestId]
    );

    if (payments.length === 0) {
      return { success: false, error: 'Payment record not found' };
    }

    const payment = payments[0];

    if (resultCode === 0) {
      // Success
      const callbackMetadata = stkCallback.CallbackMetadata;
      const mpesaReceiptNumber = callbackMetadata?.Item?.find(
        item => item.Name === 'MpesaReceiptNumber'
      )?.Value;
      const transactionDate = callbackMetadata?.Item?.find(
        item => item.Name === 'TransactionDate'
      )?.Value;
      const phoneNumber = callbackMetadata?.Item?.find(
        item => item.Name === 'PhoneNumber'
      )?.Value;

      await pool.query(
        `UPDATE payments 
         SET status = 'completed', 
             mpesa_receipt_number = ?,
             paid_at = NOW()
         WHERE id = ?`,
        [mpesaReceiptNumber, payment.id]
      );

      // Send notification
      const { sendNotification } = require('./notificationService');
      await sendNotification({
        userId: payment.user_id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of KES ${payment.amount} has been received. M-Pesa Receipt: ${mpesaReceiptNumber}`,
        channels: ['inApp', 'email', 'sms'],
      });

      return { success: true, status: 'completed' };
    } else {
      // Failed
      await pool.query(
        'UPDATE payments SET status = ? WHERE id = ?',
        [resultCode === 1032 ? 'cancelled' : 'failed', payment.id]
      );

      return { success: false, status: 'failed', resultDesc };
    }
  } catch (error) {
    console.error('Callback handling error:', error);
    return { success: false, error: error.message };
  }
};

// Get Payment History
const getPaymentHistory = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM payments WHERE user_id = ?';
    let params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [payments] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE user_id = ?';
    let countParams = [userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return {
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  } catch (error) {
    console.error('Get payment history error:', error);
    return { success: false, error: error.message };
  }
};

// Get Payment Statistics
const getPaymentStats = async (userId) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
       FROM payments WHERE user_id = ?`,
      [userId]
    );

    return {
      success: true,
      stats: stats[0],
    };
  } catch (error) {
    console.error('Get payment stats error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initiateSTKPush,
  querySTKStatus,
  handleCallback,
  getPaymentHistory,
  getPaymentStats,
  getAccessToken,
};
