const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get system settings (public - for maintenance check)
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM system_settings');
        const settingsObj = {};
        settings.forEach(setting => {
            if (setting.setting_type === 'boolean') {
                settingsObj[setting.setting_key] = setting.setting_value === 'true';
            } else if (setting.setting_type === 'number') {
                settingsObj[setting.setting_key] = parseFloat(setting.setting_value);
            } else {
                settingsObj[setting.setting_key] = setting.setting_value;
            }
        });

        res.json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update system setting (admin only)
router.put('/settings/:key', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { key } = req.params;
        const { value } = req.body;

        const [result] = await pool.query(
            'UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
            [value, req.user.id, key]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Setting not found' });
        }

        res.json({
            success: true,
            message: 'Setting updated successfully'
        });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all promotions (public for active ones)
router.get('/promotions', async (req, res) => {
    try {
        const userRole = req.query.role || 'all';
        
        let query = `
            SELECT * FROM promotions 
            WHERE is_active = TRUE 
            AND (show_to = 'all' OR show_to = ?)
        `;
        
        const now = new Date();
        query += ` AND (start_date IS NULL OR start_date <= ?)`;
        query += ` AND (end_date IS NULL OR end_date >= ?)`;
        query += ` ORDER BY priority DESC, created_at DESC`;

        const [promotions] = await pool.query(query, [userRole, now, now]);

        res.json({
            success: true,
            data: promotions
        });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create promotion (admin only)
router.post('/promotions', authenticate, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('promotion_type').optional().isIn(['info', 'success', 'warning', 'error', 'promo']),
    body('priority').optional().isInt({ min: 0 }),
    body('show_to').optional().isIn(['all', 'farmers', 'officers', 'admins']),
], async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { title, message, promotion_type = 'info', priority = 0, show_to = 'all', start_date, end_date } = req.body;

        const [result] = await pool.query(
            `INSERT INTO promotions (title, message, promotion_type, priority, show_to, start_date, end_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, message, promotion_type, priority, show_to, start_date, end_date, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Promotion created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update promotion (admin only)
router.put('/promotions/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { title, message, promotion_type, priority, is_active, show_to, start_date, end_date } = req.body;

        // Check if promotion exists
        const [existing] = await pool.query('SELECT id FROM promotions WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (message !== undefined) {
            updates.push('message = ?');
            params.push(message);
        }
        if (promotion_type !== undefined) {
            updates.push('promotion_type = ?');
            params.push(promotion_type);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(priority);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        if (show_to !== undefined) {
            updates.push('show_to = ?');
            params.push(show_to);
        }
        if (start_date !== undefined) {
            updates.push('start_date = ?');
            params.push(start_date);
        }
        if (end_date !== undefined) {
            updates.push('end_date = ?');
            params.push(end_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(id);

        await pool.query(
            `UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Promotion updated successfully'
        });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete promotion (admin only)
router.delete('/promotions/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM promotions WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }

        res.json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all alerts (public for active ones)
router.get('/alerts', async (req, res) => {
    try {
        const userRole = req.query.role || 'all';
        
        let query = `
            SELECT * FROM system_alerts 
            WHERE is_active = TRUE 
            AND (show_to = 'all' OR show_to = ?)
        `;
        
        const now = new Date();
        query += ` AND (start_date IS NULL OR start_date <= ?)`;
        query += ` AND (end_date IS NULL OR end_date >= ?)`;
        query += ` ORDER BY priority DESC, created_at DESC`;

        const [alerts] = await pool.query(query, [userRole, now, now]);

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create alert (admin only)
router.post('/alerts', authenticate, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('alert_type').optional().isIn(['info', 'success', 'warning', 'error', 'urgent']),
    body('priority').optional().isInt({ min: 0 }),
    body('requires_acknowledgment').optional().isBoolean(),
    body('show_to').optional().isIn(['all', 'farmers', 'officers', 'admins']),
], async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { title, message, alert_type = 'info', priority = 0, requires_acknowledgment = false, show_to = 'all', start_date, end_date } = req.body;

        const [result] = await pool.query(
            `INSERT INTO system_alerts (title, message, alert_type, priority, requires_acknowledgment, show_to, start_date, end_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, message, alert_type, priority, requires_acknowledgment, show_to, start_date, end_date, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update alert (admin only)
router.put('/alerts/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const { title, message, alert_type, priority, is_active, requires_acknowledgment, show_to, start_date, end_date } = req.body;

        // Check if alert exists
        const [existing] = await pool.query('SELECT id FROM system_alerts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (message !== undefined) {
            updates.push('message = ?');
            params.push(message);
        }
        if (alert_type !== undefined) {
            updates.push('alert_type = ?');
            params.push(alert_type);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(priority);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        if (requires_acknowledgment !== undefined) {
            updates.push('requires_acknowledgment = ?');
            params.push(requires_acknowledgment);
        }
        if (show_to !== undefined) {
            updates.push('show_to = ?');
            params.push(show_to);
        }
        if (start_date !== undefined) {
            updates.push('start_date = ?');
            params.push(start_date);
        }
        if (end_date !== undefined) {
            updates.push('end_date = ?');
            params.push(end_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(id);

        await pool.query(
            `UPDATE system_alerts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Alert updated successfully'
        });
    } catch (error) {
        console.error('Update alert error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete alert (admin only)
router.delete('/alerts/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM system_alerts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        res.json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
