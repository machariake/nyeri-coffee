const express = require('express');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Ensure certificates directory exists
const certsDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

// Generate certificate number
const generateCertNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CNC-${year}-${random}`;
};

// Generate certificate for approved application
router.post('/generate/:applicationId', authenticate, authorize('officer', 'admin'), async (req, res) => {
    try {
        const applicationId = req.params.applicationId;

        // Get application details
        const [apps] = await pool.query(
            `SELECT a.*, u.full_name, u.email, u.phone_number, u.ward, u.sub_county, u.id_number
             FROM applications a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ? AND a.status = 'approved'`,
            [applicationId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found or not approved' });
        }

        const app = apps[0];

        // Check if certificate already exists
        const [existingCerts] = await pool.query(
            'SELECT id FROM certificates WHERE application_id = ? AND is_revoked = FALSE',
            [applicationId]
        );

        if (existingCerts.length > 0) {
            return res.status(400).json({ success: false, message: 'Certificate already exists for this application' });
        }

        // Generate certificate number
        const certificateNumber = generateCertNumber();

        // Calculate expiry date (1 year from now)
        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Generate QR code data
        const qrData = JSON.stringify({
            certificateNumber,
            nurseryName: app.nursery_name,
            owner: app.full_name,
            issueDate: issueDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            verifyUrl: `${process.env.API_URL || 'http://localhost:3000'}/api/certificates/verify/${certificateNumber}`
        });

        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        // Generate PDF certificate
        const pdfFileName = `cert-${certificateNumber}.pdf`;
        const pdfPath = path.join(certsDir, pdfFileName);

        const doc = new PDFDocument({ size: 'A4', layout: 'portrait' });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Certificate design
        doc.rect(30, 30, 550, 750).stroke('#2E7D32');
        doc.rect(40, 40, 530, 730).stroke('#4CAF50');

        // Header
        doc.fontSize(24).fillColor('#2E7D32').text('NYERI COUNTY GOVERNMENT', 50, 80, { align: 'center' });
        doc.fontSize(18).fillColor('#333').text('Department of Agriculture', 50, 110, { align: 'center' });
        doc.fontSize(20).fillColor('#2E7D32').text('COFFEE NURSERY CERTIFICATE', 50, 150, { align: 'center' });

        // Certificate number
        doc.fontSize(12).fillColor('#666').text(`Certificate No: ${certificateNumber}`, 50, 190, { align: 'center' });

        // Content
        doc.fontSize(14).fillColor('#333');
        doc.text('This certifies that', 50, 240, { align: 'center' });
        
        doc.fontSize(18).fillColor('#2E7D32');
        doc.text(app.full_name, 50, 270, { align: 'center' });
        
        doc.fontSize(14).fillColor('#333');
        doc.text('is authorized to operate a Coffee Nursery at', 50, 310, { align: 'center' });
        
        doc.fontSize(16).fillColor('#2E7D32');
        doc.text(app.nursery_location, 50, 340, { align: 'center' });
        
        doc.fontSize(14).fillColor('#333');
        doc.text(`Nursery Name: ${app.nursery_name}`, 50, 380, { align: 'center' });
        
        if (app.coffee_varieties) {
            doc.text(`Authorized Varieties: ${app.coffee_varieties}`, 50, 410, { align: 'center' });
        }

        // Dates
        doc.fontSize(12).fillColor('#666');
        doc.text(`Issue Date: ${issueDate.toDateString()}`, 50, 460, { align: 'center' });
        doc.text(`Expiry Date: ${expiryDate.toDateString()}`, 50, 480, { align: 'center' });

        // QR Code
        const qrImageData = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrImageData, 'base64');
        doc.image(qrBuffer, 250, 520, { width: 100 });

        // Footer
        doc.fontSize(10).fillColor('#666');
        doc.text('Scan QR code to verify certificate authenticity', 50, 640, { align: 'center' });
        doc.text('This certificate is valid for one year from the issue date', 50, 660, { align: 'center' });

        doc.end();

        // Wait for PDF to be written
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // Save certificate to database
        const [result] = await pool.query(
            `INSERT INTO certificates (certificate_number, application_id, user_id, issue_date, expiry_date, qr_code_data, pdf_path) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [certificateNumber, applicationId, app.user_id, issueDate, expiryDate, qrData, pdfFileName]
        );

        res.json({
            success: true,
            message: 'Certificate generated successfully',
            data: {
                certificateId: result.insertId,
                certificateNumber,
                issueDate: issueDate.toISOString().split('T')[0],
                expiryDate: expiryDate.toISOString().split('T')[0],
                downloadUrl: `/api/certificates/download/${certificateNumber}`
            }
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user's certificates (Farmer)
router.get('/my-certificates', authenticate, authorize('farmer'), async (req, res) => {
    try {
        const [certificates] = await pool.query(
            `SELECT c.id, c.certificate_number, c.issue_date, c.expiry_date, c.is_revoked,
                    a.nursery_name, a.nursery_location
             FROM certificates c
             JOIN applications a ON c.application_id = a.id
             WHERE c.user_id = ? AND c.is_revoked = FALSE
             ORDER BY c.issue_date DESC`,
            [req.user.id]
        );

        res.json({ success: true, data: { certificates } });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Download certificate PDF
router.get('/download/:certificateNumber', authenticate, async (req, res) => {
    try {
        const certificateNumber = req.params.certificateNumber;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = 'SELECT * FROM certificates WHERE certificate_number = ? AND is_revoked = FALSE';
        let params = [certificateNumber];

        if (userRole === 'farmer') {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const [certs] = await pool.query(query, params);

        if (certs.length === 0) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        const cert = certs[0];
        const filePath = path.join(certsDir, cert.pdf_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Certificate file not found' });
        }

        res.download(filePath, `Certificate-${certificateNumber}.pdf`);
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify certificate (Public endpoint)
router.get('/verify/:certificateNumber', async (req, res) => {
    try {
        const certificateNumber = req.params.certificateNumber;

        const [certs] = await pool.query(
            `SELECT c.*, u.full_name, a.nursery_name, a.nursery_location
             FROM certificates c
             JOIN users u ON c.user_id = u.id
             JOIN applications a ON c.application_id = a.id
             WHERE c.certificate_number = ?`,
            [certificateNumber]
        );

        if (certs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                valid: false,
                message: 'Certificate not found' 
            });
        }

        const cert = certs[0];
        const now = new Date();
        const expiryDate = new Date(cert.expiry_date);
        const isExpired = now > expiryDate;

        res.json({
            success: true,
            valid: !cert.is_revoked && !isExpired,
            certificate: {
                certificateNumber: cert.certificate_number,
                owner: cert.full_name,
                nurseryName: cert.nursery_name,
                nurseryLocation: cert.nursery_location,
                issueDate: cert.issue_date,
                expiryDate: cert.expiry_date,
                status: cert.is_revoked ? 'revoked' : (isExpired ? 'expired' : 'active')
            }
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all certificates (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [certificates] = await pool.query(
            `SELECT c.id, c.certificate_number, c.issue_date, c.expiry_date, c.is_revoked,
                    u.full_name as owner_name, a.nursery_name
             FROM certificates c
             JOIN users u ON c.user_id = u.id
             JOIN applications a ON c.application_id = a.id
             ORDER BY c.issue_date DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM certificates');

        res.json({
            success: true,
            data: {
                certificates,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get all certificates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
