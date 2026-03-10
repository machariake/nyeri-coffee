/**
 * Data Export/Import Service
 * Handles exporting and importing data in various formats
 */

const { pool } = require('../config/database');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const auditService = require('./auditService');

// Export formats
const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json'
};

// Exportable entities
const EXPORT_ENTITIES = {
  APPLICATIONS: 'applications',
  CERTIFICATES: 'certificates',
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
  PAYMENTS: 'payments'
};

/**
 * Export data
 * @param {Object} exportConfig - Export configuration
 * @returns {Promise<Object>} - Export result with data
 */
const exportData = async (exportConfig) => {
  try {
    const {
      entity,
      format,
      filters = {},
      columns = null, // null = all columns
      userId
    } = exportConfig;

    // Fetch data based on entity
    let data = await fetchEntityData(entity, filters);

    // Filter columns if specified
    if (columns && columns.length > 0) {
      data = data.map(row => {
        const filtered = {};
        columns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filtered[col] = row[col];
          }
        });
        return filtered;
      });
    }

    // Format data
    let formattedData;
    let contentType;
    let filename;

    switch (format) {
      case EXPORT_FORMATS.CSV:
        formattedData = await exportToCSV(data);
        contentType = 'text/csv';
        filename = `${entity}_export_${Date.now()}.csv`;
        break;
      case EXPORT_FORMATS.EXCEL:
        formattedData = await exportToExcel(data, entity);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${entity}_export_${Date.now()}.xlsx`;
        break;
      case EXPORT_FORMATS.PDF:
        formattedData = await exportToPDF(data, entity);
        contentType = 'application/pdf';
        filename = `${entity}_export_${Date.now()}.pdf`;
        break;
      case EXPORT_FORMATS.JSON:
        formattedData = Buffer.from(JSON.stringify(data, null, 2));
        contentType = 'application/json';
        filename = `${entity}_export_${Date.now()}.json`;
        break;
      default:
        return { success: false, error: 'Unsupported export format' };
    }

    // Log export
    await auditService.logAction({
      userId,
      action: 'DATA_EXPORTED',
      entityType: 'data_export',
      newValues: {
        entity,
        format,
        recordCount: data.length
      }
    });

    return {
      success: true,
      data: formattedData,
      contentType,
      filename,
      recordCount: data.length
    };
  } catch (error) {
    console.error('Export data error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch entity data
 */
const fetchEntityData = async (entity, filters) => {
  let query;
  const params = [];

  switch (entity) {
    case EXPORT_ENTITIES.APPLICATIONS:
      query = `
        SELECT 
          a.id,
          a.nursery_name,
          a.nursery_location,
          a.county,
          a.sub_county,
          a.variety_types,
          a.capacity,
          a.status,
          a.created_at,
          a.submitted_at,
          u.first_name as farmer_first_name,
          u.last_name as farmer_last_name,
          u.phone as farmer_phone,
          u.email as farmer_email
        FROM applications a
        JOIN users u ON a.farmer_id = u.id
        WHERE 1=1
      `;
      
      if (filters.status) {
        query += ` AND a.status = ?`;
        params.push(filters.status);
      }
      if (filters.county) {
        query += ` AND a.county = ?`;
        params.push(filters.county);
      }
      if (filters.fromDate) {
        query += ` AND a.created_at >= ?`;
        params.push(filters.fromDate);
      }
      if (filters.toDate) {
        query += ` AND a.created_at <= ?`;
        params.push(filters.toDate);
      }
      break;

    case EXPORT_ENTITIES.CERTIFICATES:
      query = `
        SELECT 
          c.id,
          c.certificate_number,
          c.nursery_name,
          c.nursery_location,
          c.variety_types,
          c.capacity,
          c.issue_date,
          c.expiry_date,
          c.status,
          c.qr_code,
          a.farmer_id,
          u.first_name as farmer_first_name,
          u.last_name as farmer_last_name
        FROM certificates c
        JOIN applications a ON c.application_id = a.id
        JOIN users u ON a.farmer_id = u.id
        WHERE 1=1
      `;
      
      if (filters.status) {
        query += ` AND c.status = ?`;
        params.push(filters.status);
      }
      if (filters.fromDate) {
        query += ` AND c.issue_date >= ?`;
        params.push(filters.fromDate);
      }
      if (filters.toDate) {
        query += ` AND c.issue_date <= ?`;
        params.push(filters.toDate);
      }
      break;

    case EXPORT_ENTITIES.USERS:
      query = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          county,
          sub_county,
          language,
          email_verified,
          phone_verified,
          created_at,
          last_login
        FROM users
        WHERE 1=1
      `;
      
      if (filters.role) {
        query += ` AND role = ?`;
        params.push(filters.role);
      }
      if (filters.county) {
        query += ` AND county = ?`;
        params.push(filters.county);
      }
      break;

    case EXPORT_ENTITIES.AUDIT_LOGS:
      query = `
        SELECT 
          al.id,
          al.action,
          al.entity_type,
          al.entity_id,
          al.old_values,
          al.new_values,
          al.ip_address,
          al.user_agent,
          al.created_at,
          u.first_name,
          u.last_name,
          u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      
      if (filters.action) {
        query += ` AND al.action = ?`;
        params.push(filters.action);
      }
      if (filters.fromDate) {
        query += ` AND al.created_at >= ?`;
        params.push(filters.fromDate);
      }
      if (filters.toDate) {
        query += ` AND al.created_at <= ?`;
        params.push(filters.toDate);
      }
      break;

    case EXPORT_ENTITIES.PAYMENTS:
      query = `
        SELECT 
          p.id,
          p.amount,
          p.currency,
          p.status,
          p.payment_method,
          p.transaction_id,
          p.merchant_request_id,
          p.phone_number,
          p.result_code,
          p.result_desc,
          p.created_at,
          u.first_name,
          u.last_name,
          u.email
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `;
      
      if (filters.status) {
        query += ` AND p.status = ?`;
        params.push(filters.status);
      }
      if (filters.fromDate) {
        query += ` AND p.created_at >= ?`;
        params.push(filters.fromDate);
      }
      if (filters.toDate) {
        query += ` AND p.created_at <= ?`;
        params.push(filters.toDate);
      }
      break;

    default:
      return [];
  }

  query += ` ORDER BY created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(parseInt(filters.limit));
  }

  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Export to CSV
 */
const exportToCSV = async (data) => {
  if (data.length === 0) {
    return Buffer.from('');
  }

  const fields = Object.keys(data[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  return Buffer.from(csv);
};

/**
 * Export to Excel
 */
const exportToExcel = async (data, sheetName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

/**
 * Export to PDF
 */
const exportToPDF = async (data, title) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(20).text(`${title.toUpperCase()} REPORT`, 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
      doc.moveDown(2);

      // Data
      if (data.length === 0) {
        doc.text('No data available');
      } else {
        data.forEach((row, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          
          doc.fontSize(10).text(`Record ${index + 1}:`, 50, doc.y);
          doc.moveDown(0.5);
          
          Object.entries(row).forEach(([key, value]) => {
            const formattedValue = typeof value === 'object' 
              ? JSON.stringify(value) 
              : String(value);
            doc.fontSize(9).text(`  ${key}: ${formattedValue}`, 60, doc.y);
          });
          
          doc.moveDown(1);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Import data
 * @param {Object} importConfig - Import configuration
 * @returns {Promise<Object>} - Import result
 */
const importData = async (importConfig) => {
  try {
    const {
      entity,
      format,
      data,
      userId,
      skipValidation = false
    } = importConfig;

    let parsedData;

    // Parse data based on format
    switch (format) {
      case EXPORT_FORMATS.CSV:
        parsedData = await parseCSV(data);
        break;
      case EXPORT_FORMATS.EXCEL:
        parsedData = await parseExcel(data);
        break;
      case EXPORT_FORMATS.JSON:
        parsedData = JSON.parse(data.toString());
        break;
      default:
        return { success: false, error: 'Unsupported import format' };
    }

    // Validate data
    if (!skipValidation) {
      const validation = validateImportData(entity, parsedData);
      if (!validation.valid) {
        return { success: false, error: 'Validation failed', details: validation.errors };
      }
    }

    // Import data
    const result = await importEntityData(entity, parsedData);

    // Log import
    await auditService.logAction({
      userId,
      action: 'DATA_IMPORTED',
      entityType: 'data_import',
      newValues: {
        entity,
        format,
        recordCount: parsedData.length,
        importedCount: result.importedCount
      }
    });

    return {
      success: true,
      importedCount: result.importedCount,
      failedCount: result.failedCount,
      errors: result.errors
    };
  } catch (error) {
    console.error('Import data error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Parse CSV data
 */
const parseCSV = async (data) => {
  // Simple CSV parsing - in production, use a proper CSV parser
  const lines = data.toString().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    return row;
  });
};

/**
 * Parse Excel data
 */
const parseExcel = async (data) => {
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

/**
 * Validate import data
 */
const validateImportData = (entity, data) => {
  const errors = [];
  const requiredFields = {
    [EXPORT_ENTITIES.APPLICATIONS]: ['nursery_name', 'nursery_location', 'farmer_id'],
    [EXPORT_ENTITIES.USERS]: ['first_name', 'last_name', 'email', 'role']
  };

  const fields = requiredFields[entity] || [];

  data.forEach((row, index) => {
    fields.forEach(field => {
      if (!row[field]) {
        errors.push(`Row ${index + 1}: Missing required field "${field}"`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Import entity data
 */
const importEntityData = async (entity, data) => {
  let importedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const row of data) {
    try {
      switch (entity) {
        case EXPORT_ENTITIES.USERS:
          await db.query(
            `INSERT INTO users (first_name, last_name, email, phone, role, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [row.first_name, row.last_name, row.email, row.phone, row.role]
          );
          break;
        // Add more entities as needed
        default:
          throw new Error(`Import not implemented for entity: ${entity}`);
      }
      importedCount++;
    } catch (error) {
      failedCount++;
      errors.push({ row, error: error.message });
    }
  }

  return { importedCount, failedCount, errors };
};

module.exports = {
  exportData,
  importData,
  EXPORT_FORMATS,
  EXPORT_ENTITIES
};
