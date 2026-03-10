const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const [users] = await pool.query(
            'SELECT id, full_name, email, role, ward, sub_county, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (!users[0].is_active) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check role authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = { authenticate, authorize, generateToken, JWT_SECRET };
