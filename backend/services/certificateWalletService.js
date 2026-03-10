/**
 * Digital Certificate Wallet Service
 * Manages digital certificates with QR codes, verification, and sharing
 */

const { pool } = require('../config/database');
const QRCode = require('qrcode');
const crypto = require('crypto');
const auditService = require('./auditService');

// Certificate status
const CERTIFICATE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended'
};

/**
 * Generate unique certificate hash for blockchain-style verification
 * @param {Object} certificateData - Certificate data
 * @returns {string} - SHA-256 hash
 */
const generateCertificateHash = (certificateData) => {
  const dataString = JSON.stringify({
    id: certificateData.id,
    nurseryName: certificateData.nurseryName,
    ownerName: certificateData.ownerName,
    issueDate: certificateData.issueDate,
    expiryDate: certificateData.expiryDate,
    certificateNumber: certificateData.certificateNumber
  });
  
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Generate QR code for certificate
 * @param {Object} certificate - Certificate data
 * @returns {Promise<string>} - QR code data URL
 */
const generateQRCode = async (certificate) => {
  try {
    const verificationUrl = `${process.env.APP_URL}/verify/${certificate.verificationCode}`;
    const qrData = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a5f2a',
        light: '#ffffff'
      }
    });
    return qrData;
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
};

/**
 * Add certificate to user's wallet
 * @param {Object} walletData - Wallet entry data
 * @returns {Promise<Object>} - Result
 */
const addToWallet = async (walletData) => {
  try {
    const {
      userId,
      certificateId,
      notes = '',
      tags = []
    } = walletData;

    // Check if already in wallet
    const [existing] = await db.query(
      `SELECT id FROM user_certificate_wallet 
       WHERE user_id = ? AND certificate_id = ?`,
      [userId, certificateId]
    );

    if (existing.length > 0) {
      return {
        success: false,
        error: 'Certificate already in wallet'
      };
    }

    // Get certificate details
    const [certificates] = await db.query(
      `SELECT * FROM certificates WHERE id = ?`,
      [certificateId]
    );

    if (certificates.length === 0) {
      return {
        success: false,
        error: 'Certificate not found'
      };
    }

    const certificate = certificates[0];

    // Generate QR code
    const qrCode = await generateQRCode(certificate);

    // Generate certificate hash
    const certificateHash = generateCertificateHash(certificate);

    // Add to wallet
    const [result] = await db.query(
      `INSERT INTO user_certificate_wallet 
       (user_id, certificate_id, qr_code, certificate_hash, notes, tags, added_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, certificateId, qrCode, certificateHash, notes, JSON.stringify(tags)]
    );

    // Log audit
    await auditService.logAction({
      userId,
      action: 'CERTIFICATE_ADDED_TO_WALLET',
      entityType: 'certificate_wallet',
      entityId: result.insertId,
      newValues: { certificateId, certificateHash }
    });

    return {
      success: true,
      walletId: result.insertId,
      qrCode,
      certificateHash
    };
  } catch (error) {
    console.error('Add to wallet error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's certificate wallet
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Wallet certificates
 */
const getWallet = async (userId, options = {}) => {
  try {
    const { status, tag, search } = options;

    let query = `
      SELECT 
        w.id as wallet_id,
        w.certificate_id,
        w.qr_code,
        w.certificate_hash,
        w.notes,
        w.tags,
        w.added_at,
        w.is_favorite,
        w.share_count,
        c.certificate_number,
        c.nursery_name,
        c.nursery_location,
        c.variety_types,
        c.capacity,
        c.issue_date,
        c.expiry_date,
        c.status,
        c.pdf_url,
        c.verification_code
      FROM user_certificate_wallet w
      JOIN certificates c ON w.certificate_id = c.id
      WHERE w.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (tag) {
      query += ` AND JSON_CONTAINS(w.tags, ?)`;
      params.push(JSON.stringify(tag));
    }

    if (search) {
      query += ` AND (c.nursery_name LIKE ? OR c.certificate_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY w.is_favorite DESC, w.added_at DESC`;

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      walletId: row.wallet_id,
      certificateId: row.certificate_id,
      certificateNumber: row.certificate_number,
      nurseryName: row.nursery_name,
      nurseryLocation: row.nursery_location,
      varietyTypes: JSON.parse(row.variety_types || '[]'),
      capacity: row.capacity,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      status: row.status,
      qrCode: row.qr_code,
      certificateHash: row.certificate_hash,
      pdfUrl: row.pdf_url,
      verificationCode: row.verification_code,
      notes: row.notes,
      tags: JSON.parse(row.tags || '[]'),
      addedAt: row.added_at,
      isFavorite: row.is_favorite,
      shareCount: row.share_count
    }));
  } catch (error) {
    console.error('Get wallet error:', error);
    return [];
  }
};

/**
 * Get wallet certificate details
 * @param {number} walletId - Wallet entry ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Certificate details
 */
const getWalletCertificate = async (walletId, userId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        w.*,
        c.*,
        u.first_name as officer_first_name,
        u.last_name as officer_last_name
      FROM user_certificate_wallet w
      JOIN certificates c ON w.certificate_id = c.id
      LEFT JOIN users u ON c.issued_by = u.id
      WHERE w.id = ? AND w.user_id = ?`,
      [walletId, userId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Certificate not found in wallet' };
    }

    const row = rows[0];

    return {
      success: true,
      data: {
        walletId: row.id,
        certificateId: row.certificate_id,
        certificateNumber: row.certificate_number,
        nurseryName: row.nursery_name,
        nurseryLocation: row.nursery_location,
        varietyTypes: JSON.parse(row.variety_types || '[]'),
        capacity: row.capacity,
        issueDate: row.issue_date,
        expiryDate: row.expiry_date,
        status: row.status,
        qrCode: row.qr_code,
        certificateHash: row.certificate_hash,
        pdfUrl: row.pdf_url,
        verificationCode: row.verification_code,
        notes: row.notes,
        tags: JSON.parse(row.tags || '[]'),
        addedAt: row.added_at,
        isFavorite: row.is_favorite,
        shareCount: row.share_count,
        officerName: row.officer_first_name 
          ? `${row.officer_first_name} ${row.officer_last_name}` 
          : null
      }
    };
  } catch (error) {
    console.error('Get wallet certificate error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update wallet certificate (notes, tags, favorite)
 * @param {number} walletId - Wallet entry ID
 * @param {number} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Result
 */
const updateWalletCertificate = async (walletId, userId, updates) => {
  try {
    const { notes, tags, isFavorite } = updates;
    const updateFields = [];
    const params = [];

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(tags));
    }

    if (isFavorite !== undefined) {
      updateFields.push('is_favorite = ?');
      params.push(isFavorite);
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    params.push(walletId, userId);

    await db.query(
      `UPDATE user_certificate_wallet 
       SET ${updateFields.join(', ')} 
       WHERE id = ? AND user_id = ?`,
      params
    );

    return { success: true };
  } catch (error) {
    console.error('Update wallet certificate error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove certificate from wallet
 * @param {number} walletId - Wallet entry ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result
 */
const removeFromWallet = async (walletId, userId) => {
  try {
    await db.query(
      `DELETE FROM user_certificate_wallet WHERE id = ? AND user_id = ?`,
      [walletId, userId]
    );

    await auditService.logAction({
      userId,
      action: 'CERTIFICATE_REMOVED_FROM_WALLET',
      entityType: 'certificate_wallet',
      entityId: walletId
    });

    return { success: true };
  } catch (error) {
    console.error('Remove from wallet error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share certificate
 * @param {number} walletId - Wallet entry ID
 * @param {number} userId - User ID
 * @param {Object} shareData - Share configuration
 * @returns {Promise<Object>} - Share result
 */
const shareCertificate = async (walletId, userId, shareData) => {
  try {
    const { recipientEmail, expiryDays = 7, message = '' } = shareData;

    // Get wallet certificate
    const certResult = await getWalletCertificate(walletId, userId);
    if (!certResult.success) {
      return certResult;
    }

    const certificate = certResult.data;

    // Generate share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Save share record
    await db.query(
      `INSERT INTO certificate_shares 
       (wallet_id, share_token, recipient_email, message, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [walletId, shareToken, recipientEmail, message, expiresAt]
    );

    // Update share count
    await db.query(
      `UPDATE user_certificate_wallet 
       SET share_count = share_count + 1 
       WHERE id = ?`,
      [walletId]
    );

    // Generate share URL
    const shareUrl = `${process.env.APP_URL}/shared-certificate/${shareToken}`;

    return {
      success: true,
      shareUrl,
      shareToken,
      expiresAt
    };
  } catch (error) {
    console.error('Share certificate error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify shared certificate
 * @param {string} shareToken - Share token
 * @returns {Promise<Object>} - Verification result
 */
const verifySharedCertificate = async (shareToken) => {
  try {
    const [shares] = await db.query(
      `SELECT 
        s.*,
        w.certificate_id,
        c.certificate_number,
        c.nursery_name,
        c.nursery_location,
        c.variety_types,
        c.capacity,
        c.issue_date,
        c.expiry_date,
        c.status
      FROM certificate_shares s
      JOIN user_certificate_wallet w ON s.wallet_id = w.id
      JOIN certificates c ON w.certificate_id = c.id
      WHERE s.share_token = ? AND s.expires_at > NOW()`,
      [shareToken]
    );

    if (shares.length === 0) {
      return {
        success: false,
        error: 'Invalid or expired share link'
      };
    }

    const share = shares[0];

    return {
      success: true,
      data: {
        certificateNumber: share.certificate_number,
        nurseryName: share.nursery_name,
        nurseryLocation: share.nursery_location,
        varietyTypes: JSON.parse(share.variety_types || '[]'),
        capacity: share.capacity,
        issueDate: share.issue_date,
        expiryDate: share.expiry_date,
        status: share.status,
        sharedMessage: share.message,
        sharedAt: share.created_at
      }
    };
  } catch (error) {
    console.error('Verify shared certificate error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify certificate by hash (blockchain-style)
 * @param {string} certificateHash - Certificate hash
 * @returns {Promise<Object>} - Verification result
 */
const verifyByHash = async (certificateHash) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        w.certificate_hash,
        c.certificate_number,
        c.nursery_name,
        c.status,
        c.issue_date,
        c.expiry_date
      FROM user_certificate_wallet w
      JOIN certificates c ON w.certificate_id = c.id
      WHERE w.certificate_hash = ?`,
      [certificateHash]
    );

    if (rows.length === 0) {
      return {
        success: false,
        verified: false,
        message: 'Certificate hash not found'
      };
    }

    const cert = rows[0];
    const isExpired = new Date(cert.expiry_date) < new Date();

    return {
      success: true,
      verified: cert.status === CERTIFICATE_STATUS.ACTIVE && !isExpired,
      message: isExpired ? 'Certificate has expired' : 'Certificate is valid',
      data: {
        certificateNumber: cert.certificate_number,
        nurseryName: cert.nursery_name,
        status: cert.status,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        hash: cert.certificate_hash
      }
    };
  } catch (error) {
    console.error('Verify by hash error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get wallet statistics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Statistics
 */
const getWalletStats = async (userId) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_certificates,
        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN c.status = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN c.expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) AND c.status = 'active' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(share_count) as total_shares
      FROM user_certificate_wallet w
      JOIN certificates c ON w.certificate_id = c.id
      WHERE w.user_id = ?`,
      [userId]
    );

    return {
      success: true,
      data: {
        totalCertificates: stats[0].total_certificates,
        activeCount: stats[0].active_count,
        expiredCount: stats[0].expired_count,
        expiringSoon: stats[0].expiring_soon,
        totalShares: stats[0].total_shares || 0
      }
    };
  } catch (error) {
    console.error('Get wallet stats error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  addToWallet,
  getWallet,
  getWalletCertificate,
  updateWalletCertificate,
  removeFromWallet,
  shareCertificate,
  verifySharedCertificate,
  verifyByHash,
  getWalletStats,
  generateQRCode,
  generateCertificateHash,
  CERTIFICATE_STATUS
};
