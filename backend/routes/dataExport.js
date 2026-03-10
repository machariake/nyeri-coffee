/**
 * Data Export/Import Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const exportService = require('../services/dataExportService');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route POST /api/export
 * @desc Export data
 * @access Private (Officers and Admins)
 */
router.post('/', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { entity, format, filters, columns } = req.body;

    if (!entity || !format) {
      return res.status(400).json({
        success: false,
        message: 'Entity and format are required'
      });
    }

    const result = await exportService.exportData({
      entity,
      format,
      filters,
      columns,
      userId: req.user.id
    });

    if (result.success) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data'
    });
  }
});

/**
 * @route GET /api/export/entities
 * @desc Get available export entities
 * @access Private (Officers and Admins)
 */
router.get('/entities', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.entries(exportService.EXPORT_ENTITIES).map(([key, value]) => ({
        key,
        value,
        label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    });
  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entities'
    });
  }
});

/**
 * @route GET /api/export/formats
 * @desc Get available export formats
 * @access Private
 */
router.get('/formats', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.entries(exportService.EXPORT_FORMATS).map(([key, value]) => ({
        key,
        value,
        label: value.toUpperCase()
      }))
    });
  } catch (error) {
    console.error('Get formats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching formats'
    });
  }
});

/**
 * @route POST /api/import
 * @desc Import data
 * @access Private (Admin only)
 */
router.post('/import', authenticate, authorize(['admin']), upload.single('file'), async (req, res) => {
  try {
    const { entity, format, skipValidation } = req.body;

    if (!entity || !format || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Entity, format, and file are required'
      });
    }

    const result = await exportService.importData({
      entity,
      format,
      data: req.file.buffer,
      userId: req.user.id,
      skipValidation: skipValidation === 'true'
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing data'
    });
  }
});

module.exports = router;
