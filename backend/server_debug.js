const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server initialization...');

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:8080'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

console.log('Loading routes...');

try {
    // Import and register routes one by one
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
    
    const userRoutes = require('./routes/users');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded');
    
    const applicationRoutes = require('./routes/applications');
    app.use('/api/applications', applicationRoutes);
    console.log('✅ Application routes loaded');
    
    const certificateRoutes = require('./routes/certificates');
    app.use('/api/certificates', certificateRoutes);
    console.log('✅ Certificate routes loaded');
    
    const reportRoutes = require('./routes/reports');
    app.use('/api/reports', reportRoutes);
    console.log('✅ Report routes loaded');
    
    const notificationRoutes = require('./routes/notifications');
    app.use('/api/notifications', notificationRoutes);
    console.log('✅ Notification routes loaded');
    
    const paymentRoutes = require('./routes/payments');
    app.use('/api/payments', paymentRoutes);
    console.log('✅ Payment routes loaded');
    
    const gamificationRoutes = require('./routes/gamification');
    app.use('/api/gamification', gamificationRoutes);
    console.log('✅ Gamification routes loaded');
    
    const weatherRoutes = require('./routes/weather');
    app.use('/api/weather', weatherRoutes);
    console.log('✅ Weather routes loaded');
    
    const auditRoutes = require('./routes/audit');
    app.use('/api/audit', auditRoutes);
    console.log('✅ Audit routes loaded');
    
    const ocrRoutes = require('./routes/ocr');
    app.use('/api/ocr', ocrRoutes);
    console.log('✅ OCR routes loaded');
    
    const chatRoutes = require('./routes/chat');
    app.use('/api/chat', chatRoutes);
    console.log('✅ Chat routes loaded');
    
    const certificateWalletRoutes = require('./routes/certificateWallet');
    app.use('/api/wallet', certificateWalletRoutes);
    console.log('✅ Wallet routes loaded');
    
    const gpsRoutes = require('./routes/gps');
    app.use('/api/gps', gpsRoutes);
    console.log('✅ GPS routes loaded');
    
    const calendarRoutes = require('./routes/calendar');
    app.use('/api/calendar', calendarRoutes);
    console.log('✅ Calendar routes loaded');
    
    const offlineSyncRoutes = require('./routes/offlineSync');
    app.use('/api/sync', offlineSyncRoutes);
    console.log('✅ Sync routes loaded');
    
    const aiVerificationRoutes = require('./routes/aiVerification');
    app.use('/api/ai', aiVerificationRoutes);
    console.log('✅ AI Verification routes loaded');
    
    const videoTutorialRoutes = require('./routes/videoTutorials');
    app.use('/api/tutorials', videoTutorialRoutes);
    console.log('✅ Video Tutorial routes loaded');
    
    const dataExportRoutes = require('./routes/dataExport');
    app.use('/api/export', dataExportRoutes);
    console.log('✅ Data Export routes loaded');
    
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    console.error(error.stack);
    process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
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
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 Register: http://localhost:${PORT}/api/auth/register\n`);
    await testConnection();
});

module.exports = app;
