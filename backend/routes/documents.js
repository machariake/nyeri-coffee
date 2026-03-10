const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload document
router.post('/:applicationId/upload', authenticate, authorize('farmer'), upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const applicationId = req.params.applicationId;
        const { documentType } = req.body;
        const userId = req.user.id;

        // Verify ownership
        const [apps] = await pool.query(
            'SELECT id, user_id FROM applications WHERE id = ? AND user_id = ?',
            [applicationId, userId]
        );

        if (apps.length === 0) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Save document record
        const [result] = await pool.query(
            `INSERT INTO documents (application_id, document_type, file_name, file_path, file_size, mime_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [applicationId, documentType || 'other', req.file.originalname, req.file.filename, req.file.size, req.file.mimetype]
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                documentId: result.insertId,
                fileName: req.file.originalname,
                documentType
            }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get application documents
router.get('/:applicationId', authenticate, async (req, res) => {
    try {
        const applicationId = req.params.applicationId;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verify access
        let accessQuery = 'SELECT id FROM applications WHERE id = ?';
        let accessParams = [applicationId];

        if (userRole === 'farmer') {
            accessQuery += ' AND user_id = ?';
            accessParams.push(userId);
        }

        const [apps] = await pool.query(accessQuery, accessParams);
        if (apps.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const [documents] = await pool.query(
            'SELECT id, document_type, file_name, file_size, uploaded_at FROM documents WHERE application_id = ?',
            [applicationId]
        );

        res.json({ success: true, data: { documents } });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Download document
router.get('/download/:documentId', authenticate, async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [docs] = await pool.query(
            `SELECT d.*, a.user_id as application_user_id 
             FROM documents d 
             JOIN applications a ON d.application_id = a.id 
             WHERE d.id = ?`,
            [documentId]
        );

        if (docs.length === 0) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const doc = docs[0];

        // Check access
        if (userRole === 'farmer' && doc.application_user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const filePath = path.join(uploadsDir, doc.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        res.download(filePath, doc.file_name);
    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete document (Farmer only, only for draft applications)
router.delete('/:documentId', authenticate, authorize('farmer'), async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const userId = req.user.id;

        const [docs] = await pool.query(
            `SELECT d.*, a.user_id, a.status 
             FROM documents d 
             JOIN applications a ON d.application_id = a.id 
             WHERE d.id = ? AND a.user_id = ? AND a.status = 'draft'`,
            [documentId, userId]
        );

        if (docs.length === 0) {
            return res.status(404).json({ success: false, message: 'Document not found or cannot be deleted' });
        }

        const doc = docs[0];
        const filePath = path.join(uploadsDir, doc.file_path);

        // Delete from database
        await pool.query('DELETE FROM documents WHERE id = ?', [documentId]);

        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
