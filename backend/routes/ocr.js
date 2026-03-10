/**
 * OCR Routes for Document Scanning
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ocrService = require('../services/ocrService');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ocr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, TIFF) and PDF are allowed'));
    }
  }
});

/**
 * @route POST /api/ocr/scan
 * @desc Scan a document and extract data
 * @access Private
 */
router.post('/scan', authenticate, upload.single('document'), async (req, res) => {
  try {
    const { documentType, applicationId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    const result = await ocrService.scanDocument(
      req.file.path,
      documentType,
      {
        userId: req.user.id,
        applicationId,
        saveResult: true
      }
    );

    res.json(result);
  } catch (error) {
    console.error('OCR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning document',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ocr/verify
 * @desc Verify document authenticity
 * @access Private
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { extractedData, documentType } = req.body;

    if (!extractedData || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'Extracted data and document type are required'
      });
    }

    const result = await ocrService.verifyDocument(extractedData, documentType);
    res.json(result);
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying document',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ocr/history
 * @desc Get user's OCR scan history
 * @access Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit, offset, documentType } = req.query;
    
    const history = await ocrService.getOCRHistory(req.user.id, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      documentType
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get OCR history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching OCR history',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ocr/document-types
 * @desc Get supported document types
 * @access Private
 */
router.get('/document-types', authenticate, async (req, res) => {
  try {
    const documentTypes = ocrService.getDocumentTypes();
    res.json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document types',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ocr/batch
 * @desc Batch process multiple documents
 * @access Private (Officers and Admins only)
 */
router.post('/batch', authenticate, authorize(['officer', 'admin']), upload.array('documents', 10), async (req, res) => {
  try {
    const { documentTypes } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents provided'
      });
    }

    const typesArray = Array.isArray(documentTypes) ? documentTypes : [documentTypes];
    
    const documents = req.files.map((file, index) => ({
      imageSource: file.path,
      documentType: typesArray[index] || typesArray[0] || 'NATIONAL_ID'
    }));

    const results = await ocrService.batchProcess(documents, {
      userId: req.user.id,
      saveResult: true
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch OCR error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing batch documents',
      error: error.message
    });
  }
});

module.exports = router;
