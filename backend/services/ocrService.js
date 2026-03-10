/**
 * OCR Service for Document Scanning and Verification
 * Uses Tesseract.js for text extraction and validation
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../config/database');
const auditService = require('./auditService');

// Document type configurations
const DOCUMENT_TYPES = {
  NATIONAL_ID: {
    name: 'National ID',
    requiredFields: ['idNumber', 'fullName', 'dateOfBirth'],
    validationPatterns: {
      idNumber: /^\d{8,10}$/,
      dateOfBirth: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/
    }
  },
  LAND_TITLE: {
    name: 'Land Title Deed',
    requiredFields: ['titleNumber', 'landSize', 'location'],
    validationPatterns: {
      titleNumber: /^[A-Z]{2,3}\/\d{5,10}/,
      landSize: /\d+\s*(acres|hectares|ha)/i
    }
  },
  BUSINESS_CERT: {
    name: 'Business Registration Certificate',
    requiredFields: ['businessNumber', 'businessName', 'registrationDate'],
    validationPatterns: {
      businessNumber: /^(BN|CP|BN\/\d)/i
    }
  },
  KRA_PIN: {
    name: 'KRA PIN Certificate',
    requiredFields: ['pinNumber', 'taxpayerName'],
    validationPatterns: {
      pinNumber: /^[A-Z]\d{9}[A-Z]$/
    }
  },
  NURSERY_LICENSE: {
    name: 'Nursery Operator License',
    requiredFields: ['licenseNumber', 'operatorName', 'expiryDate'],
    validationPatterns: {
      licenseNumber: /^NUR\/\d{4}\/\d{4,6}/
    }
  }
};

/**
 * Preprocess image for better OCR accuracy
 * @param {Buffer} imageBuffer - Raw image buffer
 * @returns {Promise<Buffer>} - Processed image buffer
 */
const preprocessImage = async (imageBuffer) => {
  try {
    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .modulate({ brightness: 1.1, contrast: 1.2 })
      .sharpen({ sigma: 1, flat: 1, jagged: 2 })
      .resize(2000, null, { withoutEnlargement: true })
      .toBuffer();
    
    return processed;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return imageBuffer;
  }
};

/**
 * Extract text from image using OCR
 * @param {string|Buffer} imageSource - Image path or buffer
 * @param {string} language - Language code (default: eng)
 * @returns {Promise<Object>} - Extracted text and confidence
 */
const extractText = async (imageSource, language = 'eng') => {
  try {
    let imageBuffer;
    
    if (typeof imageSource === 'string') {
      imageBuffer = await fs.readFile(imageSource);
    } else {
      imageBuffer = imageSource;
    }

    // Preprocess image
    const processedBuffer = await preprocessImage(imageBuffer);

    // Perform OCR
    const result = await Tesseract.recognize(
      processedBuffer,
      language,
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        }
      }
    );

    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    };
  }
};

/**
 * Parse extracted text based on document type
 * @param {string} text - Extracted OCR text
 * @param {string} documentType - Type of document
 * @returns {Object} - Parsed document data
 */
const parseDocumentData = (text, documentType) => {
  const lines = text.split('\n').filter(line => line.trim());
  const parsedData = {
    rawText: text,
    extractedFields: {},
    confidence: {},
    missingFields: [],
    validationErrors: []
  };

  const docConfig = DOCUMENT_TYPES[documentType];
  if (!docConfig) {
    parsedData.validationErrors.push('Unknown document type');
    return parsedData;
  }

  // Parse based on document type
  switch (documentType) {
    case 'NATIONAL_ID':
      parseNationalID(lines, parsedData);
      break;
    case 'LAND_TITLE':
      parseLandTitle(lines, parsedData);
      break;
    case 'BUSINESS_CERT':
      parseBusinessCert(lines, parsedData);
      break;
    case 'KRA_PIN':
      parseKRAPin(lines, parsedData);
      break;
    case 'NURSERY_LICENSE':
      parseNurseryLicense(lines, parsedData);
      break;
  }

  // Validate required fields
  docConfig.requiredFields.forEach(field => {
    if (!parsedData.extractedFields[field]) {
      parsedData.missingFields.push(field);
    }
  });

  // Validate patterns
  Object.entries(docConfig.validationPatterns).forEach(([field, pattern]) => {
    const value = parsedData.extractedFields[field];
    if (value && !pattern.test(value)) {
      parsedData.validationErrors.push(`Invalid format for ${field}: ${value}`);
    }
  });

  return parsedData;
};

/**
 * Parse National ID document
 */
const parseNationalID = (lines, parsedData) => {
  for (const line of lines) {
    // ID Number patterns
    const idMatch = line.match(/(?:ID|Serial)\s*(?:No|Number)?[:\s]*(\d{8,10})/i) ||
                   line.match(/^(\d{8,10})$/);
    if (idMatch && !parsedData.extractedFields.idNumber) {
      parsedData.extractedFields.idNumber = idMatch[1];
      parsedData.confidence.idNumber = 0.85;
    }

    // Full name patterns
    const nameMatch = line.match(/(?:Name|Full Name)[:\s]*([A-Z\s]{5,40})/i) ||
                     line.match(/^([A-Z]{2,20}\s+[A-Z]{2,20}(?:\s+[A-Z]{2,20})?)$/);
    if (nameMatch && !parsedData.extractedFields.fullName) {
      parsedData.extractedFields.fullName = nameMatch[1].trim();
      parsedData.confidence.fullName = 0.75;
    }

    // Date of birth patterns
    const dobMatch = line.match(/(?:DOB|Date of Birth|Born)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i) ||
                    line.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
    if (dobMatch && !parsedData.extractedFields.dateOfBirth) {
      parsedData.extractedFields.dateOfBirth = dobMatch[1];
      parsedData.confidence.dateOfBirth = 0.80;
    }

    // Sex/Gender
    const sexMatch = line.match(/(?:Sex|Gender)[:\s]*(M|F|Male|Female)/i);
    if (sexMatch && !parsedData.extractedFields.sex) {
      parsedData.extractedFields.sex = sexMatch[1].charAt(0).toUpperCase();
      parsedData.confidence.sex = 0.90;
    }
  }
};

/**
 * Parse Land Title document
 */
const parseLandTitle = (lines, parsedData) => {
  for (const line of lines) {
    // Title number
    const titleMatch = line.match(/(?:Title No|Number)[:\s]*([A-Z]{2,3}\/\d{5,10})/i) ||
                      line.match(/^(LR\/\d{5,10})/i);
    if (titleMatch && !parsedData.extractedFields.titleNumber) {
      parsedData.extractedFields.titleNumber = titleMatch[1];
      parsedData.confidence.titleNumber = 0.90;
    }

    // Land size
    const sizeMatch = line.match(/(\d+(?:\.\d+)?)\s*(acres?|hectares?|ha)\b/i) ||
                     line.match(/Area[:\s]*(\d+(?:\.\d+)?)/i);
    if (sizeMatch && !parsedData.extractedFields.landSize) {
      parsedData.extractedFields.landSize = `${sizeMatch[1]} ${sizeMatch[2] || 'units'}`;
      parsedData.confidence.landSize = 0.85;
    }

    // Location
    const locationMatch = line.match(/(?:Location|District|County)[:\s]*([A-Za-z\s]{3,30})/i);
    if (locationMatch && !parsedData.extractedFields.location) {
      parsedData.extractedFields.location = locationMatch[1].trim();
      parsedData.confidence.location = 0.70;
    }

    // Owner name
    const ownerMatch = line.match(/(?:Registered Owner|Proprietor)[:\s]*([A-Z\s]{5,40})/i);
    if (ownerMatch && !parsedData.extractedFields.ownerName) {
      parsedData.extractedFields.ownerName = ownerMatch[1].trim();
      parsedData.confidence.ownerName = 0.75;
    }
  }
};

/**
 * Parse Business Certificate
 */
const parseBusinessCert = (lines, parsedData) => {
  for (const line of lines) {
    // Business number
    const bnMatch = line.match(/(?:BN|Business Number|Reg No)[:\s]*(BN\/\d{5,10})/i) ||
                   line.match(/(CP\d{6,10})/i);
    if (bnMatch && !parsedData.extractedFields.businessNumber) {
      parsedData.extractedFields.businessNumber = bnMatch[1].toUpperCase();
      parsedData.confidence.businessNumber = 0.90;
    }

    // Business name
    const nameMatch = line.match(/(?:Business Name|Company Name)[:\s]*([A-Za-z0-9\s&.,'-]{5,50})/i);
    if (nameMatch && !parsedData.extractedFields.businessName) {
      parsedData.extractedFields.businessName = nameMatch[1].trim();
      parsedData.confidence.businessName = 0.80;
    }

    // Registration date
    const regDateMatch = line.match(/(?:Date of Registration|Registered on)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
    if (regDateMatch && !parsedData.extractedFields.registrationDate) {
      parsedData.extractedFields.registrationDate = regDateMatch[1];
      parsedData.confidence.registrationDate = 0.85;
    }
  }
};

/**
 * Parse KRA PIN Certificate
 */
const parseKRAPin = (lines, parsedData) => {
  for (const line of lines) {
    // PIN number
    const pinMatch = line.match(/(?:PIN|PIN Number)[:\s]*([A-Z]\d{9}[A-Z])/i) ||
                    line.match(/^([A-Z]\d{9}[A-Z])$/);
    if (pinMatch && !parsedData.extractedFields.pinNumber) {
      parsedData.extractedFields.pinNumber = pinMatch[1].toUpperCase();
      parsedData.confidence.pinNumber = 0.95;
    }

    // Taxpayer name
    const nameMatch = line.match(/(?:Taxpayer|Name)[:\s]*([A-Z\s]{5,40})/i);
    if (nameMatch && !parsedData.extractedFields.taxpayerName) {
      parsedData.extractedFields.taxpayerName = nameMatch[1].trim();
      parsedData.confidence.taxpayerName = 0.80;
    }
  }
};

/**
 * Parse Nursery License
 */
const parseNurseryLicense = (lines, parsedData) => {
  for (const line of lines) {
    // License number
    const licenseMatch = line.match(/(?:License No|Number)[:\s]*(NUR\/\d{4}\/\d{4,6})/i);
    if (licenseMatch && !parsedData.extractedFields.licenseNumber) {
      parsedData.extractedFields.licenseNumber = licenseMatch[1];
      parsedData.confidence.licenseNumber = 0.90;
    }

    // Operator name
    const operatorMatch = line.match(/(?:Operator|Licensee)[:\s]*([A-Z\s]{5,40})/i);
    if (operatorMatch && !parsedData.extractedFields.operatorName) {
      parsedData.extractedFields.operatorName = operatorMatch[1].trim();
      parsedData.confidence.operatorName = 0.75;
    }

    // Expiry date
    const expiryMatch = line.match(/(?:Expiry|Valid Until)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
    if (expiryMatch && !parsedData.extractedFields.expiryDate) {
      parsedData.extractedFields.expiryDate = expiryMatch[1];
      parsedData.confidence.expiryDate = 0.85;
    }

    // Nursery capacity
    const capacityMatch = line.match(/(?:Capacity|Max Plants)[:\s]*(\d{3,7})/i);
    if (capacityMatch && !parsedData.extractedFields.nurseryCapacity) {
      parsedData.extractedFields.nurseryCapacity = capacityMatch[1];
      parsedData.confidence.nurseryCapacity = 0.80;
    }
  }
};

/**
 * Scan and process document
 * @param {string|Buffer} imageSource - Image path or buffer
 * @param {string} documentType - Type of document
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Complete scan result
 */
const scanDocument = async (imageSource, documentType, options = {}) => {
  const { userId, applicationId, saveResult = true } = options;
  
  try {
    // Extract text from image
    const ocrResult = await extractText(imageSource);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: 'OCR extraction failed',
        details: ocrResult.error
      };
    }

    // Parse document data
    const parsedData = parseDocumentData(ocrResult.text, documentType);
    
    // Calculate overall confidence
    const confidenceScores = Object.values(parsedData.confidence);
    const overallConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : ocrResult.confidence / 100;

    const result = {
      success: true,
      documentType,
      documentTypeName: DOCUMENT_TYPES[documentType]?.name || 'Unknown',
      extractedData: parsedData.extractedFields,
      confidence: {
        overall: Math.round(overallConfidence * 100) / 100,
        fields: parsedData.confidence,
        ocr: ocrResult.confidence
      },
      missingFields: parsedData.missingFields,
      validationErrors: parsedData.validationErrors,
      isValid: parsedData.missingFields.length === 0 && parsedData.validationErrors.length === 0,
      rawText: options.includeRawText ? ocrResult.text : undefined
    };

    // Save to database if requested
    if (saveResult && userId) {
      await saveOCRResult(userId, applicationId, result, imageSource);
    }

    // Log audit
    if (userId) {
      await auditService.logAction({
        userId,
        action: 'DOCUMENT_SCANNED',
        entityType: 'document_ocr',
        entityId: applicationId,
        newValues: {
          documentType,
          confidence: result.confidence.overall,
          isValid: result.isValid
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Document scan error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Save OCR result to database
 */
const saveOCRResult = async (userId, applicationId, result, imageSource) => {
  try {
    const ocrData = {
      user_id: userId,
      application_id: applicationId,
      document_type: result.documentType,
      extracted_data: JSON.stringify(result.extractedData),
      confidence_score: result.confidence.overall,
      validation_status: result.isValid ? 'valid' : 'invalid',
      missing_fields: JSON.stringify(result.missingFields),
      validation_errors: JSON.stringify(result.validationErrors),
      raw_text: result.rawText || null,
      created_at: new Date()
    };

    await db.query(
      `INSERT INTO document_ocr SET ?`,
      [ocrData]
    );
  } catch (error) {
    console.error('Save OCR result error:', error);
  }
};

/**
 * Get OCR history for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - OCR history
 */
const getOCRHistory = async (userId, options = {}) => {
  try {
    const { limit = 50, offset = 0, documentType } = options;
    
    let query = 'SELECT * FROM document_ocr WHERE user_id = ?';
    const params = [userId];

    if (documentType) {
      query += ' AND document_type = ?';
      params.push(documentType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    
    return rows.map(row => ({
      id: row.id,
      documentType: row.document_type,
      extractedData: JSON.parse(row.extracted_data || '{}'),
      confidenceScore: row.confidence_score,
      validationStatus: row.validation_status,
      missingFields: JSON.parse(row.missing_fields || '[]'),
      validationErrors: JSON.parse(row.validation_errors || '[]'),
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Get OCR history error:', error);
    return [];
  }
};

/**
 * Verify document authenticity
 * @param {Object} extractedData - Extracted document data
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} - Verification result
 */
const verifyDocument = async (extractedData, documentType) => {
  try {
    const verificationResult = {
      isAuthentic: true,
      checks: [],
      warnings: [],
      verifiedAt: new Date()
    };

    // Check required fields presence
    const docConfig = DOCUMENT_TYPES[documentType];
    if (docConfig) {
      const missingFields = docConfig.requiredFields.filter(
        field => !extractedData[field]
      );
      
      if (missingFields.length > 0) {
        verificationResult.checks.push({
          name: 'Required Fields',
          status: 'failed',
          message: `Missing fields: ${missingFields.join(', ')}`
        });
        verificationResult.isAuthentic = false;
      } else {
        verificationResult.checks.push({
          name: 'Required Fields',
          status: 'passed',
          message: 'All required fields present'
        });
      }

      // Validate field formats
      Object.entries(docConfig.validationPatterns).forEach(([field, pattern]) => {
        const value = extractedData[field];
        if (value) {
          const isValid = pattern.test(value);
          verificationResult.checks.push({
            name: `${field} Format`,
            status: isValid ? 'passed' : 'failed',
            message: isValid ? 'Valid format' : `Invalid format: ${value}`
          });
          if (!isValid) verificationResult.isAuthentic = false;
        }
      });
    }

    // Check for tampering indicators
    const tamperingChecks = checkTamperingIndicators(extractedData);
    verificationResult.checks.push(...tamperingChecks);
    
    if (tamperingChecks.some(check => check.status === 'warning')) {
      verificationResult.warnings.push('Potential tampering indicators detected');
    }

    return verificationResult;
  } catch (error) {
    console.error('Document verification error:', error);
    return {
      isAuthentic: false,
      error: error.message
    };
  }
};

/**
 * Check for document tampering indicators
 */
const checkTamperingIndicators = (extractedData) => {
  const checks = [];

  // Check for suspicious patterns
  const rawText = JSON.stringify(extractedData).toLowerCase();
  
  // Check for common edit markers
  if (rawText.includes('edited') || rawText.includes('modified')) {
    checks.push({
      name: 'Edit Markers',
      status: 'warning',
      message: 'Document may have been edited'
    });
  }

  // Check for unusual characters
  const unusualChars = /[^\w\s\-\/\.\,\(\)\:\@]/g;
  if (unusualChars.test(rawText)) {
    checks.push({
      name: 'Character Integrity',
      status: 'warning',
      message: 'Unusual characters detected'
    });
  }

  // Check date consistency
  const dates = rawText.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g) || [];
  if (dates.length > 0) {
    const parsedDates = dates.map(d => new Date(d.replace(/-/g, '/')));
    const futureDates = parsedDates.filter(d => d > new Date());
    
    if (futureDates.length > 0) {
      checks.push({
        name: 'Date Validity',
        status: 'warning',
        message: 'Future dates detected'
      });
    }
  }

  if (checks.length === 0) {
    checks.push({
      name: 'Tampering Check',
      status: 'passed',
      message: 'No tampering indicators found'
    });
  }

  return checks;
};

/**
 * Batch process multiple documents
 * @param {Array} documents - Array of {imageSource, documentType}
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Batch results
 */
const batchProcess = async (documents, options = {}) => {
  const results = [];
  
  for (const doc of documents) {
    const result = await scanDocument(doc.imageSource, doc.documentType, options);
    results.push({
      documentType: doc.documentType,
      result
    });
  }

  return results;
};

/**
 * Get supported document types
 * @returns {Object} - Document type definitions
 */
const getDocumentTypes = () => {
  return Object.entries(DOCUMENT_TYPES).map(([key, config]) => ({
    type: key,
    name: config.name,
    requiredFields: config.requiredFields
  }));
};

module.exports = {
  scanDocument,
  extractText,
  parseDocumentData,
  verifyDocument,
  getOCRHistory,
  batchProcess,
  getDocumentTypes,
  DOCUMENT_TYPES,
  preprocessImage
};
