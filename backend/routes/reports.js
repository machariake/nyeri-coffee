const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistics (Admin & Officer)
router.get('/dashboard', authenticate, authorize('admin', 'officer'), async (req, res) => {
    try {
        const userRole = req.user.role;
        const ward = req.query.ward;

        // Base queries
        let appQuery = 'SELECT status, COUNT(*) as count FROM applications';
        let certQuery = 'SELECT COUNT(*) as total FROM certificates WHERE is_revoked = FALSE';
        let userQuery = 'SELECT role, COUNT(*) as count FROM users WHERE is_active = TRUE';
        
        let appParams = [];
        let certParams = [];

        // Apply ward filter for officers
        if (userRole === 'officer' && ward) {
            appQuery += ' a JOIN users u ON a.user_id = u.id WHERE u.ward = ?';
            appParams.push(ward);
            certQuery += ' c JOIN users u ON c.user_id = u.id WHERE u.ward = ? AND c.is_revoked = FALSE';
            certParams.push(ward);
        }

        appQuery += ' GROUP BY status';
        userQuery += ' GROUP BY role';

        const [appStats] = await pool.query(appQuery, appParams);
        const [certStats] = await pool.query(certQuery, certParams);
        const [userStats] = await pool.query(userQuery);

        // Monthly applications trend
        const [monthlyTrend] = await pool.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
             FROM applications
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month`
        );

        // Recent activity
        const [recentActivity] = await pool.query(
            `SELECT a.app_id, a.status, a.created_at, u.full_name
             FROM applications a
             JOIN users u ON a.user_id = u.id
             ORDER BY a.created_at DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                applications: appStats,
                certificates: certStats[0],
                users: userStats,
                monthlyTrend,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Applications report
router.get('/applications', authenticate, authorize('admin', 'officer'), async (req, res) => {
    try {
        const { startDate, endDate, status, ward } = req.query;

        let query = `
            SELECT a.id, a.app_id, a.nursery_name, a.nursery_location, a.status,
                   a.submitted_at, a.reviewed_at, a.officer_comments,
                   u.full_name as applicant_name, u.ward, u.sub_county,
                   o.full_name as officer_name
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN users o ON a.officer_id = o.id
            WHERE 1=1
        `;
        let params = [];

        if (startDate) {
            query += ' AND a.created_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND a.created_at <= ?';
            params.push(endDate);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        if (ward) {
            query += ' AND u.ward = ?';
            params.push(ward);
        }

        query += ' ORDER BY a.created_at DESC';

        const [applications] = await pool.query(query, params);

        // Summary statistics
        const [summary] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
             FROM applications a
             JOIN users u ON a.user_id = u.id
             WHERE 1=1 ${ward ? 'AND u.ward = ?' : ''}`,
            ward ? [ward] : []
        );

        res.json({
            success: true,
            data: {
                applications,
                summary: summary[0]
            }
        });
    } catch (error) {
        console.error('Applications report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Certificates report
router.get('/certificates', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate, ward } = req.query;

        let query = `
            SELECT c.id, c.certificate_number, c.issue_date, c.expiry_date, c.is_revoked,
                   u.full_name as owner_name, u.ward, u.sub_county,
                   a.nursery_name, a.nursery_location
            FROM certificates c
            JOIN users u ON c.user_id = u.id
            JOIN applications a ON c.application_id = a.id
            WHERE 1=1
        `;
        let params = [];

        if (startDate) {
            query += ' AND c.issue_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND c.issue_date <= ?';
            params.push(endDate);
        }
        if (ward) {
            query += ' AND u.ward = ?';
            params.push(ward);
        }

        query += ' ORDER BY c.issue_date DESC';

        const [certificates] = await pool.query(query, params);

        // Summary
        const [summary] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_revoked = TRUE THEN 1 ELSE 0 END) as revoked,
                SUM(CASE WHEN expiry_date < CURDATE() AND is_revoked = FALSE THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN expiry_date >= CURDATE() AND is_revoked = FALSE THEN 1 ELSE 0 END) as active
             FROM certificates c
             JOIN users u ON c.user_id = u.id
             WHERE 1=1 ${ward ? 'AND u.ward = ?' : ''}`,
            ward ? [ward] : []
        );

        res.json({
            success: true,
            data: {
                certificates,
                summary: summary[0]
            }
        });
    } catch (error) {
        console.error('Certificates report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Performance metrics
router.get('/performance', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Average processing time
        const [processingTime] = await pool.query(
            `SELECT AVG(DATEDIFF(reviewed_at, submitted_at)) as avg_days
             FROM applications
             WHERE status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL`
        );

        // Officer performance
        const [officerPerformance] = await pool.query(
            `SELECT 
                o.full_name as officer_name,
                COUNT(*) as total_reviewed,
                SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                AVG(DATEDIFF(a.reviewed_at, a.submitted_at)) as avg_processing_days
             FROM applications a
             JOIN users o ON a.officer_id = o.id
             WHERE a.status IN ('approved', 'rejected')
             GROUP BY a.officer_id`
        );

        // Ward-wise distribution
        const [wardDistribution] = await pool.query(
            `SELECT 
                u.ward,
                COUNT(*) as total_applications,
                SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved
             FROM applications a
             JOIN users u ON a.user_id = u.id
             WHERE u.ward IS NOT NULL
             GROUP BY u.ward`
        );

        res.json({
            success: true,
            data: {
                averageProcessingTime: processingTime[0].avg_days || 0,
                officerPerformance,
                wardDistribution
            }
        });
    } catch (error) {
        console.error('Performance report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
