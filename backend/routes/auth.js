const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');
const { getWelcomePackage, getGreeting, getDailyTip } = require('../utils/greetings');
const { getSupportedLanguages } = require('../i18n/translations');

const router = express.Router();

// Register
router.post('/register', [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['farmer', 'officer']).withMessage('Invalid role'),
    body('ward').optional().trim(),
    body('subCounty').optional().trim(),
    body('idNumber').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { fullName, email, phoneNumber, password, role = 'farmer', ward, subCounty, idNumber } = req.body;

        // Check if email exists (PostgreSQL syntax)
        const existingUsers = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (existingUsers.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user with RETURNING clause (PostgreSQL) - UUID id
        const userId = uuidv4();
        const result = await pool.query(
            `INSERT INTO users (id, full_name, email, phone_number, password_hash, role, ward, sub_county, id_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, full_name, email, phone_number, role, ward, sub_county`,
            [userId, fullName, email, phoneNumber, passwordHash, role, ward, subCounty, idNumber]
        );

        const user = result.rows[0];

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phoneNumber: user.phone_number,
                    role: user.role,
                    ward: user.ward,
                    subCounty: user.sub_county
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration',
            error: error.message 
        });
    }
});

// Login
router.post('/login', [
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, phoneNumber, password, language = 'en' } = req.body;

        // Validate that either email or phoneNumber is provided
        if (!email && !phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email or phone number is required' 
            });
        }

        // Build query based on whether email or phoneNumber is provided (PostgreSQL syntax)
        let query;
        let params;

        if (email) {
            query = `SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active 
                     FROM users WHERE email = $1`;
            params = [email];
        } else {
            query = `SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active 
                     FROM users WHERE phone_number = $1`;
            params = [phoneNumber];
        }

        // Get user
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const user = result.rows[0];

        // Check if user is active
        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Get welcome package
        const welcomePackage = getWelcomePackage(language);
        const dailyTip = getDailyTip(user.role, language);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    phoneNumber: user.phone_number,
                    role: user.role,
                    ward: user.ward,
                    subCounty: user.sub_county
                },
                welcome: {
                    greeting: getGreeting(user.full_name, language),
                    dailyTip
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: error.message 
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, phone_number, role, ward, sub_county, id_number, profile_picture_url
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phoneNumber: user.phone_number,
                role: user.role,
                ward: user.ward,
                subCounty: user.sub_county,
                idNumber: user.id_number,
                profilePictureUrl: user.profile_picture_url
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get greeting
router.get('/greeting', authenticate, async (req, res) => {
    try {
        const language = req.query.lang || 'en';
        const user = req.user;

        const greeting = getGreeting(user.fullName, language);
        const dailyTip = getDailyTip(user.role, language);

        res.json({
            success: true,
            data: {
                greeting,
                dailyTip
            }
        });
    } catch (error) {
        console.error('Greeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get supported languages
router.get('/languages', async (req, res) => {
    try {
        const languages = getSupportedLanguages();
        res.json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Languages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update language preference
router.put('/language', authenticate, [
    body('language').notEmpty().withMessage('Language is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { language } = req.body;

        await pool.query(
            'UPDATE users SET preferred_language = $1 WHERE id = $2',
            [language, req.user.id]
        );

        const greeting = getGreeting(req.user.fullName, language);

        res.json({
            success: true,
            message: 'Language preference updated',
            data: {
                greeting,
                language
            }
        });
    } catch (error) {
        console.error('Update language error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Change password
router.post('/change-password', authenticate, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get current user
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
