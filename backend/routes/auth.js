const express = require('express');
const bcrypt = require('bcryptjs');
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

        // Generate token
        const token = generateToken(result.insertId);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: result.insertId,
                    fullName,
                    email,
                    role,
                    ward,
                    subCounty
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
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

        const { email, phoneNumber, password } = req.body;

        // Validate that either email or phoneNumber is provided
        if (!email && !phoneNumber) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }

        // Build query based on whether email or phoneNumber is provided
        let query;
        let params;
        
        if (email) {
            query = 'SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active FROM users WHERE email = ?';
            params = [email];
        } else {
            query = 'SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active FROM users WHERE phone_number = ?';
            params = [phoneNumber];
        }

        // Get user
        const [users] = await pool.query(query, params);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id);

        // Get user's preferred language (default to 'en')
        const preferredLang = req.body.language || 'en';

        // Generate welcome package with greeting
        const welcomePackage = getWelcomePackage(user.full_name, preferredLang, user.role);

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
                    subCounty: user.sub_county,
                    preferredLanguage: preferredLang
                },
                welcome: welcomePackage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.ward, u.sub_county, 
                    u.id_number, u.created_at,
                    (SELECT COUNT(*) FROM applications WHERE user_id = u.id) as total_applications,
                    (SELECT COUNT(*) FROM applications WHERE user_id = u.id AND status = 'approved') as approved_applications
             FROM users u WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user: users[0] }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
        const userId = req.user.id;

        // Get current password hash
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get greeting for current user
router.get('/greeting', authenticate, async (req, res) => {
    try {
        const lang = req.query.lang || req.user.preferred_language || 'en';
        const greeting = getGreeting(req.user.full_name, lang);
        const dailyTip = getDailyTip(lang, req.user.role);

        res.json({
            success: true,
            data: {
                greeting,
                dailyTip,
                language: lang
            }
        });
    } catch (error) {
        console.error('Get greeting error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get supported languages
router.get('/languages', async (req, res) => {
    try {
        const languages = getSupportedLanguages();
        res.json({
            success: true,
            data: { languages }
        });
    } catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user language preference
router.put('/language', authenticate, async (req, res) => {
    try {
        const { language } = req.body;
        const supportedLangs = ['en', 'sw', 'fr'];
        
        if (!supportedLangs.includes(language)) {
            return res.status(400).json({ success: false, message: 'Unsupported language' });
        }

        await pool.query(
            'UPDATE users SET preferred_language = ? WHERE id = ?',
            [language, req.user.id]
        );

        // Get new greeting in updated language
        const greeting = getGreeting(req.user.full_name, language);

        res.json({
            success: true,
            message: 'Language updated successfully',
            data: {
                language,
                greeting
            }
        });
    } catch (error) {
        console.error('Update language error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
