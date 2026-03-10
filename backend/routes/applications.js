const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate unique application ID
const generateAppId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `APP${timestamp}${random}`;
};

// Create new application (Farmer)
router.post('/', authenticate, authorize('farmer'), [
    body('nurseryName').trim().notEmpty().withMessage('Nursery name is required'),
    body('nurseryLocation').trim().notEmpty().withMessage('Nursery location is required'),
    body('nurserySize').optional().trim(),
    body('coffeeVarieties').optional().trim(),
    body('expectedSeedlings').optional().isInt().withMessage('Expected seedlings must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { nurseryName, nurseryLocation, nurserySize, coffeeVarieties, expectedSeedlings } = req.body;
        const appId = generateAppId();

        const [result] = await pool.query(
            `INSERT INTO applications (app_id, user_id, nursery_name, nursery_location, nursery_size, 
                                      coffee_varieties, expected_seedlings, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [appId, req.user.id, nurseryName, nurseryLocation, nurserySize, coffeeVarieties, expectedSeedlings]
        );

        res.status(201).json({
            success: true,
            message: 'Application created successfully',
            data: {
                applicationId: result.insertId,
                appId,
                status: 'draft'
            }
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Submit application (Farmer)
router.post('/:id/submit', authenticate, authorize('farmer'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;

        // Verify ownership
        const [apps] = await pool.query(
            'SELECT id, status FROM applications WHERE id = ? AND user_id = ?',
            [applicationId, userId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (apps[0].status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Application already submitted' });
        }

        await pool.query(
            'UPDATE applications SET status = ?, submitted_at = NOW() WHERE id = ?',
            ['submitted', applicationId]
        );

        // Create notification
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, 'Application Submitted', 'Your application has been submitted successfully.', 'status_change')`,
            [userId]
        );

        res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Submit application error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get farmer's applications
router.get('/my-applications', authenticate, authorize('farmer'), async (req, res) => {
    try {
        const [applications] = await pool.query(
            `SELECT a.id, a.app_id, a.nursery_name, a.nursery_location, a.status,
                    a.submitted_at, a.reviewed_at, a.officer_comments,
                    (SELECT COUNT(*) FROM documents WHERE application_id = a.id) as document_count,
                    c.certificate_number, c.issue_date, c.expiry_date
             FROM applications a
             LEFT JOIN certificates c ON c.application_id = a.id
             WHERE a.user_id = ?
             ORDER BY a.created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, data: { applications } });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single application details
router.get('/:id', authenticate, async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
            SELECT a.*, u.full_name as applicant_name, u.email as applicant_email, 
                   u.phone_number as applicant_phone, u.ward, u.sub_county,
                   o.full_name as officer_name
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN users o ON a.officer_id = o.id
            WHERE a.id = ?
        `;
        let params = [applicationId];

        // Farmers can only see their own applications
        if (userRole === 'farmer') {
            query += ' AND a.user_id = ?';
            params.push(userId);
        }

        const [applications] = await pool.query(query, params);

        if (applications.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Get documents
        const [documents] = await pool.query(
            'SELECT id, document_type, file_name, uploaded_at FROM documents WHERE application_id = ?',
            [applicationId]
        );

        res.json({
            success: true,
            data: {
                application: applications[0],
                documents
            }
        });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get applications for review (Officer)
router.get('/officer/review-list', authenticate, authorize('officer'), async (req, res) => {
    try {
        const { status = 'submitted', ward } = req.query;

        let query = `
            SELECT a.id, a.app_id, a.nursery_name, a.nursery_location, a.status,
                   a.submitted_at, u.full_name as applicant_name, u.ward
            FROM applications a
            JOIN users u ON a.user_id = u.id
            WHERE a.status = ?
        `;
        let params = [status];

        if (ward) {
            query += ' AND u.ward = ?';
            params.push(ward);
        }

        query += ' ORDER BY a.submitted_at ASC';

        const [applications] = await pool.query(query, params);

        res.json({ success: true, data: { applications } });
    } catch (error) {
        console.error('Get review list error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Review application - Approve/Reject (Officer)
router.post('/:id/review', authenticate, authorize('officer'), [
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('comments').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const applicationId = req.params.id;
        const { action, comments } = req.body;
        const officerId = req.user.id;

        const [apps] = await pool.query(
            'SELECT id, user_id, status FROM applications WHERE id = ? AND status = "submitted"',
            [applicationId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found or not in reviewable status' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await pool.query(
            'UPDATE applications SET status = ?, officer_id = ?, officer_comments = ?, reviewed_at = NOW() WHERE id = ?',
            [newStatus, officerId, comments, applicationId]
        );

        // Create notification for farmer
        const notificationTitle = action === 'approve' ? 'Application Approved' : 'Application Rejected';
        const notificationMessage = action === 'approve' 
            ? 'Your application has been approved. You can now download your certificate.'
            : `Your application has been rejected. Reason: ${comments || 'No reason provided'}`;

        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
            [apps[0].user_id, notificationTitle, notificationMessage, action === 'approve' ? 'approval' : 'rejection']
        );

        res.json({ 
            success: true, 
            message: `Application ${action}d successfully`,
            data: { status: newStatus }
        });
    } catch (error) {
        console.error('Review application error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all applications (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status, ward, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.id, a.app_id, a.nursery_name, a.nursery_location, a.status,
                   a.submitted_at, a.reviewed_at,
                   u.full_name as applicant_name, u.ward, u.sub_county,
                   o.full_name as officer_name
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN users o ON a.officer_id = o.id
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) as total FROM applications a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        let params = [];
        let countParams = [];

        if (status) {
            query += ' AND a.status = ?';
            countQuery += ' AND a.status = ?';
            params.push(status);
            countParams.push(status);
        }

        if (ward) {
            query += ' AND u.ward = ?';
            countQuery += ' AND u.ward = ?';
            params.push(ward);
            countParams.push(ward);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [applications] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: {
                applications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get all applications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete application (Farmer - only drafts)
router.delete('/:id', authenticate, authorize('farmer'), async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;

        // Verify ownership and that it's a draft
        const [apps] = await pool.query(
            'SELECT id, status FROM applications WHERE id = ? AND user_id = ?',
            [applicationId, userId]
        );

        if (apps.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (apps[0].status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft applications can be deleted'
            });
        }

        // Delete associated documents first
        await pool.query('DELETE FROM documents WHERE application_id = ?', [applicationId]);

        // Delete the application
        await pool.query('DELETE FROM applications WHERE id = ?', [applicationId]);

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Bulk review applications (Admin only)
router.post('/bulk-review', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { applicationIds, action, comments } = req.body;

        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide application IDs' 
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Action must be approve or reject' 
            });
        }

        const officerId = req.user.id;
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        let successCount = 0;
        let errorCount = 0;

        for (const applicationId of applicationIds) {
            try {
                // Verify application exists and is submitted
                const [apps] = await pool.query(
                    'SELECT id, user_id, status FROM applications WHERE id = ? AND status = "submitted"',
                    [applicationId]
                );

                if (apps.length === 0) {
                    errorCount++;
                    continue;
                }

                // Update application
                await pool.query(
                    'UPDATE applications SET status = ?, officer_id = ?, officer_comments = ?, reviewed_at = NOW() WHERE id = ?',
                    [newStatus, officerId, comments || '', applicationId]
                );

                // Create notification for farmer
                const notificationTitle = action === 'approve' ? 'Application Approved' : 'Application Rejected';
                const notificationMessage = action === 'approve'
                    ? 'Your application has been approved. You can now download your certificate.'
                    : `Your application has been rejected. Reason: ${comments || 'No reason provided'}`;

                await pool.query(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                    [apps[0].user_id, notificationTitle, notificationMessage, action === 'approve' ? 'approval' : 'rejection']
                );

                successCount++;
            } catch (error) {
                console.error(`Error processing application ${applicationId}:`, error);
                errorCount++;
            }
        }

        res.json({
            success: true,
            message: `Successfully processed ${successCount} applications (${errorCount} failed)`,
            data: {
                successCount,
                errorCount
            }
        });
    } catch (error) {
        console.error('Bulk review error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
