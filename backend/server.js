const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, pool } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const applicationRoutes = require('./routes/applications');
const certificateRoutes = require('./routes/certificates');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const gamificationRoutes = require('./routes/gamification');
const weatherRoutes = require('./routes/weather');
const auditRoutes = require('./routes/audit');
const ocrRoutes = require('./routes/ocr');
const chatRoutes = require('./routes/chat');
const certificateWalletRoutes = require('./routes/certificateWallet');
const gpsRoutes = require('./routes/gps');
const calendarRoutes = require('./routes/calendar');
const offlineSyncRoutes = require('./routes/offlineSync');
const aiVerificationRoutes = require('./routes/aiVerification');
const videoTutorialRoutes = require('./routes/videoTutorials');
const dataExportRoutes = require('./routes/dataExport');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

// Maintenance mode middleware
const checkMaintenanceMode = async (req, res, next) => {
    try {
        // Skip maintenance check for health endpoint, system routes, and auth routes
        if (req.path === '/health' || req.path.startsWith('/system') || req.path.startsWith('/auth')) {
            return next();
        }

        const [settings] = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'"
        );

        const isMaintenance = settings.length > 0 && settings[0].setting_value === 'true';

        if (isMaintenance) {
            // Allow admin to bypass maintenance
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const jwt = require('jsonwebtoken');
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                        if (decoded.role === 'admin') {
                            return next();
                        }
                    } catch (e) {
                        // Invalid token, continue with maintenance check
                    }
                }
            }

            const [msg] = await pool.query(
                "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_message'"
            );
            const message = msg.length > 0 ? msg[0].setting_value : 'System is under maintenance';

            return res.status(503).json({
                success: false,
                maintenance: true,
                message: message
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance check error:', error);
        next();
    }
};

// Apply maintenance check to all API routes
app.use('/api', checkMaintenanceMode);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:8080'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wallet', certificateWalletRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/sync', offlineSyncRoutes);
app.use('/api/ai', aiVerificationRoutes);
app.use('/api/tutorials', videoTutorialRoutes);
app.use('/api/export', dataExportRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await testConnection();
});

module.exports = app;
