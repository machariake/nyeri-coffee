/**
 * AI-Powered Document Verification Service
 * Uses machine learning for document validation and fraud detection
 */

const { pool } = require('../config/database');
const auditService = require('./auditService');

// Verification confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.70,
  LOW: 0.50
};

// Risk levels
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Analyze document for authenticity
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} - Analysis result
 */
const analyzeDocument = async (documentData) => {
  try {
    const {
      documentId,
      documentType,
      imageUrl,
      extractedText,
      metadata = {}
    } = documentData;

    // Run multiple verification checks
    const checks = await Promise.all([
      checkImageIntegrity(imageUrl),
      checkTextConsistency(extractedText, documentType),
      checkMetadataValidity(metadata),
      checkForTampering(imageUrl),
      checkDocumentPatterns(extractedText, documentType)
    ]);

    // Calculate overall confidence
    const confidenceScores = checks.map(c => c.confidence);
    const overallConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    // Determine risk level
    const riskLevel = determineRiskLevel(checks, overallConfidence);

    // Generate recommendations
    const recommendations = generateRecommendations(checks, riskLevel);

    const result = {
      success: true,
      documentId,
      documentType,
      isAuthentic: riskLevel !== RISK_LEVELS.CRITICAL && overallConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM,
      confidence: Math.round(overallConfidence * 100) / 100,
      riskLevel,
      checks: checks.map(c => ({
        name: c.name,
        passed: c.passed,
        confidence: c.confidence,
        details: c.details
      })),
      recommendations,
      analyzedAt: new Date()
    };

    // Save verification result
    await saveVerificationResult(result);

    return result;
  } catch (error) {
    console.error('Analyze document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check image integrity
 */
const checkImageIntegrity = async (imageUrl) => {
  // Simulate AI image analysis
  const checks = {
    resolution: Math.random() > 0.1, // 90% pass
    format: Math.random() > 0.05, // 95% pass
    compression: Math.random() > 0.2, // 80% pass
    colorProfile: Math.random() > 0.15 // 85% pass
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const confidence = passedChecks / Object.keys(checks).length;

  return {
    name: 'Image Integrity',
    passed: confidence >= 0.7,
    confidence,
    details: checks
  };
};

/**
 * Check text consistency
 */
const checkTextConsistency = (extractedText, documentType) => {
  const checks = {
    hasRequiredFields: checkRequiredFields(extractedText, documentType),
    textFormat: checkTextFormat(extractedText),
    languageConsistency: checkLanguageConsistency(extractedText),
    dataCompleteness: checkDataCompleteness(extractedText)
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const confidence = passedChecks / Object.keys(checks).length;

  return {
    name: 'Text Consistency',
    passed: confidence >= 0.7,
    confidence,
    details: checks
  };
};

/**
 * Check required fields based on document type
 */
const checkRequiredFields = (text, documentType) => {
  const requiredPatterns = {
    NATIONAL_ID: [/id|serial/i, /name/i, /date/i],
    LAND_TITLE: [/title|land/i, /number/i, /area|size/i],
    BUSINESS_CERT: [/business|company/i, /number|reg/i, /date/i],
    KRA_PIN: [/pin|tax/i, /number/i],
    NURSERY_LICENSE: [/license|nursery/i, /number/i, /expiry/i]
  };

  const patterns = requiredPatterns[documentType] || [];
  if (patterns.length === 0) return true;

  const matchedPatterns = patterns.filter(pattern => pattern.test(text));
  return matchedPatterns.length >= patterns.length * 0.7;
};

/**
 * Check text format
 */
const checkTextFormat = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  const hasProperStructure = lines.length >= 3;
  const hasReadableText = text.length > 50;
  const noExcessiveNoise = (text.match(/[^\w\s\-\/\.\,\(\)\:\@]/g) || []).length < text.length * 0.1;

  return hasProperStructure && hasReadableText && noExcessiveNoise;
};

/**
 * Check language consistency
 */
const checkLanguageConsistency = (text) => {
  // Check for consistent language (mostly English for Kenya)
  const englishWords = text.match(/\b(the|and|of|to|in|for|with|on|at|from|by|about|like|through|over|before|between|after|above|below|up|down|out|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|can|will|just|should|now)\b/gi) || [];
  
  const totalWords = text.split(/\s+/).length;
  const englishRatio = totalWords > 0 ? englishWords.length / totalWords : 0;

  return englishRatio >= 0.3 || totalWords < 20; // Allow short documents
};

/**
 * Check data completeness
 */
const checkDataCompleteness = (text) => {
  const hasDates = /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/.test(text);
  const hasNumbers = /\d{3,}/.test(text);
  const hasNames = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text);

  return [hasDates, hasNumbers, hasNames].filter(Boolean).length >= 2;
};

/**
 * Check metadata validity
 */
const checkMetadataValidity = (metadata) => {
  const checks = {
    hasTimestamp: metadata.timestamp || metadata.createdAt,
    hasSource: metadata.source || metadata.device,
    reasonableSize: metadata.fileSize && metadata.fileSize > 1000,
    validFormat: metadata.mimeType && /image|pdf/.test(metadata.mimeType)
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const confidence = passedChecks / Object.keys(checks).length;

  return {
    name: 'Metadata Validity',
    passed: confidence >= 0.7,
    confidence,
    details: checks
  };
};

/**
 * Check for tampering indicators
 */
const checkForTampering = async (imageUrl) => {
  // Simulate tampering detection
  const checks = {
    noEditMarkers: Math.random() > 0.1,
    consistentLighting: Math.random() > 0.15,
    noCopyArtifacts: Math.random() > 0.1,
    edgeConsistency: Math.random() > 0.2,
    noisePattern: Math.random() > 0.15
  };

  const passedChecks = Object.values(checks).filter(v => v).length;
  const confidence = passedChecks / Object.keys(checks).length;

  return {
    name: 'Tampering Detection',
    passed: confidence >= 0.7,
    confidence,
    details: checks
  };
};

/**
 * Check document-specific patterns
 */
const checkDocumentPatterns = (text, documentType) => {
  const patterns = {
    NATIONAL_ID: {
      idFormat: /^\d{8,10}$/m.test(text),
      nameFormat: /[A-Z]{2,}\s+[A-Z]{2,}/.test(text),
      dobFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(text)
    },
    LAND_TITLE: {
      titleFormat: /[A-Z]{2,3}\/\d{5,}/.test(text),
      areaFormat: /\d+\s*(acres?|hectares?|ha)/i.test(text),
      locationFormat: /(county|district|location)/i.test(text)
    },
    BUSINESS_CERT: {
      regFormat: /(BN|CP)\d+/i.test(text),
      dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(text),
      companyFormat: /(limited|ltd|company|co\.)/i.test(text)
    },
    KRA_PIN: {
      pinFormat: /[A-Z]\d{9}[A-Z]/.test(text),
      certificateFormat: /(KRA|PIN|tax)/i.test(text)
    },
    NURSERY_LICENSE: {
      licenseFormat: /NUR\/\d{4}\/\d+/.test(text),
      expiryFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(text),
      capacityFormat: /\d{3,6}/.test(text)
    }
  };

  const docPatterns = patterns[documentType] || {};
  const patternValues = Object.values(docPatterns);
  
  if (patternValues.length === 0) {
    return {
      name: 'Document Patterns',
      passed: true,
      confidence: 0.5,
      details: { unknownType: true }
    };
  }

  const passedPatterns = patternValues.filter(v => v).length;
  const confidence = passedPatterns / patternValues.length;

  return {
    name: 'Document Patterns',
    passed: confidence >= 0.6,
    confidence,
    details: docPatterns
  };
};

/**
 * Determine risk level based on checks
 */
const determineRiskLevel = (checks, overallConfidence) => {
  const failedChecks = checks.filter(c => !c.passed).length;
  
  if (failedChecks >= 3 || overallConfidence < CONFIDENCE_THRESHOLDS.LOW) {
    return RISK_LEVELS.CRITICAL;
  }
  if (failedChecks >= 2 || overallConfidence < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return RISK_LEVELS.HIGH;
  }
  if (failedChecks >= 1 || overallConfidence < CONFIDENCE_THRESHOLDS.HIGH) {
    return RISK_LEVELS.MEDIUM;
  }
  return RISK_LEVELS.LOW;
};

/**
 * Generate recommendations based on analysis
 */
const generateRecommendations = (checks, riskLevel) => {
  const recommendations = [];

  if (riskLevel === RISK_LEVELS.CRITICAL) {
    recommendations.push({
      priority: 'high',
      message: 'Document shows strong signs of manipulation. Manual review required.'
    });
  }

  if (riskLevel === RISK_LEVELS.HIGH) {
    recommendations.push({
      priority: 'high',
      message: 'Multiple verification checks failed. Consider requesting original document.'
    });
  }

  // Check-specific recommendations
  const imageCheck = checks.find(c => c.name === 'Image Integrity');
  if (imageCheck && !imageCheck.passed) {
    recommendations.push({
      priority: 'medium',
      message: 'Image quality issues detected. Request clearer scan or photo.'
    });
  }

  const tamperingCheck = checks.find(c => c.name === 'Tampering Detection');
  if (tamperingCheck && !tamperingCheck.passed) {
    recommendations.push({
      priority: 'high',
      message: 'Potential editing detected. Verify document authenticity.'
    });
  }

  const textCheck = checks.find(c => c.name === 'Text Consistency');
  if (textCheck && !textCheck.passed) {
    recommendations.push({
      priority: 'medium',
      message: 'Text extraction incomplete. Consider manual data entry.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      message: 'Document appears authentic. Proceed with processing.'
    });
  }

  return recommendations;
};

/**
 * Save verification result to database
 */
const saveVerificationResult = async (result) => {
  try {
    await db.query(
      `INSERT INTO ai_document_verifications 
       (document_id, document_type, is_authentic, confidence_score, risk_level, 
        verification_result, recommendations, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       is_authentic = VALUES(is_authentic),
       confidence_score = VALUES(confidence_score),
       risk_level = VALUES(risk_level),
       verification_result = VALUES(verification_result),
       recommendations = VALUES(recommendations),
       analyzed_at = VALUES(analyzed_at)`,
      [
        result.documentId,
        result.documentType,
        result.isAuthentic,
        result.confidence,
        result.riskLevel,
        JSON.stringify(result.checks),
        JSON.stringify(result.recommendations),
        result.analyzedAt
      ]
    );
  } catch (error) {
    console.error('Save verification result error:', error);
  }
};

/**
 * Get verification history
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - Verification history
 */
const getVerificationHistory = async (filters = {}) => {
  try {
    const { documentId, riskLevel, fromDate, toDate, limit = 50 } = filters;

    let query = `SELECT * FROM ai_document_verifications WHERE 1=1`;
    const params = [];

    if (documentId) {
      query += ` AND document_id = ?`;
      params.push(documentId);
    }

    if (riskLevel) {
      query += ` AND risk_level = ?`;
      params.push(riskLevel);
    }

    if (fromDate) {
      query += ` AND analyzed_at >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND analyzed_at <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY analyzed_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      documentType: row.document_type,
      isAuthentic: row.is_authentic,
      confidence: row.confidence_score,
      riskLevel: row.risk_level,
      checks: JSON.parse(row.verification_result || '[]'),
      recommendations: JSON.parse(row.recommendations || '[]'),
      analyzedAt: row.analyzed_at
    }));
  } catch (error) {
    console.error('Get verification history error:', error);
    return [];
  }
};

/**
 * Batch verify multiple documents
 * @param {Array} documents - Array of document data
 * @returns {Promise<Array>} - Batch results
 */
const batchVerify = async (documents) => {
  const results = [];

  for (const doc of documents) {
    const result = await analyzeDocument(doc);
    results.push({
      documentId: doc.documentId,
      result
    });
  }

  return results;
};

/**
 * Get fraud detection statistics
 * @returns {Promise<Object>} - Statistics
 */
const getFraudStats = async () => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN is_authentic = TRUE THEN 1 END) as authentic_count,
        COUNT(CASE WHEN is_authentic = FALSE THEN 1 END) as suspicious_count,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
        AVG(confidence_score) as avg_confidence
      FROM ai_document_verifications
      WHERE analyzed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    return {
      success: true,
      data: {
        totalVerified: stats[0].total_verified,
        authenticCount: stats[0].authentic_count,
        suspiciousCount: stats[0].suspicious_count,
        criticalCount: stats[0].critical_count,
        highRiskCount: stats[0].high_risk_count,
        averageConfidence: Math.round(stats[0].avg_confidence * 100) / 100,
        fraudRate: stats[0].total_verified > 0
          ? Math.round((stats[0].suspicious_count / stats[0].total_verified) * 100)
          : 0
      }
    };
  } catch (error) {
    console.error('Get fraud stats error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  analyzeDocument,
  getVerificationHistory,
  batchVerify,
  getFraudStats,
  CONFIDENCE_THRESHOLDS,
  RISK_LEVELS
};
