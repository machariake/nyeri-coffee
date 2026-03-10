const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { role, ward, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT id, full_name, email, phone_number, role, ward, sub_county, 
                   is_active, created_at,
                   (SELECT COUNT(*) FROM applications WHERE user_id = users.id) as application_count
            FROM users WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        let params = [];
        let countParams = [];

        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
            countParams.push(role);
        }

        if (ward) {
            query += ' AND ward = ?';
            countQuery += ' AND ward = ?';
            params.push(ward);
            countParams.push(ward);
        }

        if (search) {
            query += ' AND (full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
            countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user by ID
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;

        const [users] = await pool.query(
            `SELECT id, full_name, email, phone_number, role, ward, sub_county, 
                    id_number, is_active, created_at
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's applications
        const [applications] = await pool.query(
            `SELECT id, app_id, nursery_name, status, submitted_at, reviewed_at
             FROM applications WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                user: users[0],
                applications
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create user (Admin only)
router.post('/', authenticate, authorize('admin'), [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['farmer', 'officer', 'admin']).withMessage('Invalid role'),
    body('ward').optional().trim(),
    body('subCounty').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { fullName, email, phoneNumber, password, role, ward, subCounty, idNumber } = req.body;

        // Check if email exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county, id_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [fullName, email, phoneNumber, passwordHash, role, ward, subCounty, idNumber]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                userId: result.insertId,
                fullName,
                email,
                role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullName, phoneNumber, role, ward, subCounty, idNumber, isActive } = req.body;

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (fullName) {
            updates.push('full_name = ?');
            params.push(fullName);
        }
        if (phoneNumber) {
            updates.push('phone_number = ?');
            params.push(phoneNumber);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (ward !== undefined) {
            updates.push('ward = ?');
            params.push(ward);
        }
        if (subCounty !== undefined) {
            updates.push('sub_county = ?');
            params.push(subCounty);
        }
        if (idNumber !== undefined) {
            updates.push('id_number = ?');
            params.push(idNumber);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(userId);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete/Deactivate user (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Soft delete - deactivate user
        await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get wards list (for filters)
router.get('/metadata/wards', authenticate, async (req, res) => {
    try {
        const [wards] = await pool.query(
            'SELECT DISTINCT ward FROM users WHERE ward IS NOT NULL ORDER BY ward'
        );

        res.json({
            success: true,
            data: { wards: wards.map(w => w.ward) }
        });
    } catch (error) {
        console.error('Get wards error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update profile (Current user)
router.put('/profile/update', authenticate, [
    body('fullName').optional().trim(),
    body('phoneNumber').optional().trim(),
    body('ward').optional().trim(),
    body('subCounty').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.id;
        const { fullName, phoneNumber, ward, subCounty } = req.body;

        const updates = [];
        const params = [];

        if (fullName) {
            updates.push('full_name = ?');
            params.push(fullName);
        }
        if (phoneNumber) {
            updates.push('phone_number = ?');
            params.push(phoneNumber);
        }
        if (ward !== undefined) {
            updates.push('ward = ?');
            params.push(ward);
        }
        if (subCounty !== undefined) {
            updates.push('sub_county = ?');
            params.push(subCounty);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(userId);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
