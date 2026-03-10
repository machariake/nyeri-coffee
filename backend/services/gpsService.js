/**
 * GPS Location Services
 * Manages nursery locations, geofencing, and location-based features
 */

const { pool } = require('../config/database');
const auditService = require('./auditService');

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Save nursery location
 * @param {Object} locationData - Location data
 * @returns {Promise<Object>} - Result
 */
const saveNurseryLocation = async (locationData) => {
  try {
    const {
      nurseryId,
      applicationId,
      latitude,
      longitude,
      accuracy,
      address,
      capturedBy,
      metadata = {}
    } = locationData;

    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates'
      };
    }

    // Check if location already exists
    const [existing] = await db.query(
      `SELECT id FROM nursery_locations WHERE nursery_id = ?`,
      [nurseryId]
    );

    let result;
    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE nursery_locations 
         SET latitude = ?, longitude = ?, accuracy = ?, address = ?, 
             captured_by = ?, metadata = ?, updated_at = NOW()
         WHERE nursery_id = ?`,
        [latitude, longitude, accuracy, address, capturedBy, 
         JSON.stringify(metadata), nurseryId]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new
      const [insertResult] = await db.query(
        `INSERT INTO nursery_locations 
         (nursery_id, application_id, latitude, longitude, accuracy, 
          address, captured_by, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [nurseryId, applicationId, latitude, longitude, accuracy, 
         address, capturedBy, JSON.stringify(metadata)]
      );
      result = { id: insertResult.insertId, updated: false };
    }

    // Log audit
    await auditService.logAction({
      userId: capturedBy,
      action: result.updated ? 'NURSERY_LOCATION_UPDATED' : 'NURSERY_LOCATION_CAPTURED',
      entityType: 'nursery_location',
      entityId: result.id,
      newValues: { latitude, longitude, accuracy, address }
    });

    return {
      success: true,
      locationId: result.id,
      updated: result.updated
    };
  } catch (error) {
    console.error('Save nursery location error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} - Is valid
 */
const isValidCoordinates = (latitude, longitude) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Get nursery location
 * @param {number} nurseryId - Nursery ID
 * @returns {Promise<Object>} - Location data
 */
const getNurseryLocation = async (nurseryId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        l.*,
        u.first_name as captured_by_first_name,
        u.last_name as captured_by_last_name
      FROM nursery_locations l
      LEFT JOIN users u ON l.captured_by = u.id
      WHERE l.nursery_id = ?`,
      [nurseryId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Location not found' };
    }

    const row = rows[0];

    return {
      success: true,
      data: {
        id: row.id,
        nurseryId: row.nursery_id,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        address: row.address,
        capturedBy: row.captured_by_first_name 
          ? `${row.captured_by_first_name} ${row.captured_by_last_name}` 
          : null,
        capturedAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: JSON.parse(row.metadata || '{}')
      }
    };
  } catch (error) {
    console.error('Get nursery location error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
};

/**
 * Find nearby nurseries
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<Array>} - Nearby nurseries
 */
const findNearbyNurseries = async (latitude, longitude, radiusKm = 10) => {
  try {
    // Use Haversine formula in SQL for efficient filtering
    const [rows] = await db.query(
      `SELECT 
        l.id,
        l.nursery_id,
        l.latitude,
        l.longitude,
        l.accuracy,
        l.address,
        a.nursery_name,
        c.status as certificate_status,
        (6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(l.latitude)) *
          COS(RADIANS(l.longitude) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(l.latitude))
        )) AS distance
      FROM nursery_locations l
      JOIN applications a ON l.nursery_id = a.id
      LEFT JOIN certificates c ON a.id = c.application_id
      HAVING distance <= ?
      ORDER BY distance`,
      [latitude, longitude, latitude, radiusKm]
    );

    return rows.map(row => ({
      id: row.id,
      nurseryId: row.nursery_id,
      nurseryName: row.nursery_name,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      address: row.address,
      certificateStatus: row.certificate_status,
      distance: Math.round(row.distance * 100) / 100
    }));
  } catch (error) {
    console.error('Find nearby nurseries error:', error);
    return [];
  }
};

/**
 * Check if location is within geofence
 * @param {number} latitude - Point latitude
 * @param {number} longitude - Point longitude
 * @param {number} centerLat - Geofence center latitude
 * @param {number} centerLon - Geofence center longitude
 * @param {number} radiusKm - Geofence radius in km
 * @returns {boolean} - Is within geofence
 */
const isWithinGeofence = (latitude, longitude, centerLat, centerLon, radiusKm) => {
  const distance = calculateDistance(latitude, longitude, centerLat, centerLon);
  return distance <= radiusKm;
};

/**
 * Create geofence for nursery
 * @param {Object} geofenceData - Geofence configuration
 * @returns {Promise<Object>} - Result
 */
const createGeofence = async (geofenceData) => {
  try {
    const {
      nurseryId,
      centerLatitude,
      centerLongitude,
      radiusKm,
      name,
      createdBy
    } = geofenceData;

    const [result] = await db.query(
      `INSERT INTO nursery_geofences 
       (nursery_id, name, center_latitude, center_longitude, radius_km, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [nurseryId, name, centerLatitude, centerLongitude, radiusKm, createdBy]
    );

    return {
      success: true,
      geofenceId: result.insertId
    };
  } catch (error) {
    console.error('Create geofence error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check nursery location against geofence
 * @param {number} nurseryId - Nursery ID
 * @returns {Promise<Object>} - Geofence check result
 */
const checkGeofence = async (nurseryId) => {
  try {
    // Get nursery location
    const locationResult = await getNurseryLocation(nurseryId);
    if (!locationResult.success) {
      return locationResult;
    }

    const location = locationResult.data;

    // Get geofences for nursery
    const [geofences] = await db.query(
      `SELECT * FROM nursery_geofences WHERE nursery_id = ? AND is_active = TRUE`,
      [nurseryId]
    );

    if (geofences.length === 0) {
      return {
        success: true,
        hasGeofence: false,
        message: 'No geofence defined for this nursery'
      };
    }

    const geofence = geofences[0];
    const isInside = isWithinGeofence(
      location.latitude,
      location.longitude,
      geofence.center_latitude,
      geofence.center_longitude,
      geofence.radius_km
    );

    return {
      success: true,
      hasGeofence: true,
      isInsideGeofence: isInside,
      geofence: {
        name: geofence.name,
        centerLatitude: geofence.center_latitude,
        centerLongitude: geofence.center_longitude,
        radiusKm: geofence.radius_km
      },
      actualLocation: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      distanceFromCenter: Math.round(
        calculateDistance(
          location.latitude,
          location.longitude,
          geofence.center_latitude,
          geofence.center_longitude
        ) * 100
      ) / 100,
      message: isInside 
        ? 'Nursery location is within designated area' 
        : 'Nursery location is outside designated area'
    };
  } catch (error) {
    console.error('Check geofence error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get location history for nursery
 * @param {number} nurseryId - Nursery ID
 * @returns {Promise<Array>} - Location history
 */
const getLocationHistory = async (nurseryId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        latitude,
        longitude,
        accuracy,
        address,
        captured_by,
        created_at
      FROM nursery_location_history
      WHERE nursery_id = ?
      ORDER BY created_at DESC
      LIMIT 100`,
      [nurseryId]
    );

    return rows.map(row => ({
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      address: row.address,
      capturedBy: row.captured_by,
      capturedAt: row.created_at
    }));
  } catch (error) {
    console.error('Get location history error:', error);
    return [];
  }
};

/**
 * Get nurseries in bounding box (for map view)
 * @param {Object} bounds - Map bounds
 * @returns {Promise<Array>} - Nurseries in bounds
 */
const getNurseriesInBounds = async (bounds) => {
  try {
    const { north, south, east, west } = bounds;

    const [rows] = await db.query(
      `SELECT 
        l.id,
        l.nursery_id,
        l.latitude,
        l.longitude,
        l.address,
        a.nursery_name,
        c.certificate_number,
        c.status as certificate_status
      FROM nursery_locations l
      JOIN applications a ON l.nursery_id = a.id
      LEFT JOIN certificates c ON a.id = c.application_id
      WHERE l.latitude BETWEEN ? AND ?
        AND l.longitude BETWEEN ? AND ?`,
      [south, north, west, east]
    );

    return rows.map(row => ({
      id: row.id,
      nurseryId: row.nursery_id,
      nurseryName: row.nursery_name,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      certificateNumber: row.certificate_number,
      certificateStatus: row.certificate_status
    }));
  } catch (error) {
    console.error('Get nurseries in bounds error:', error);
    return [];
  }
};

/**
 * Generate location report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} - Report data
 */
const generateLocationReport = async (filters = {}) => {
  try {
    const { county, subCounty, fromDate, toDate } = filters;

    let query = `
      SELECT 
        COUNT(*) as total_nurseries,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as certified_nurseries,
        AVG(l.accuracy) as average_accuracy,
        COUNT(CASE WHEN l.accuracy <= 10 THEN 1 END) as high_accuracy_count
      FROM nursery_locations l
      JOIN applications a ON l.nursery_id = a.id
      LEFT JOIN certificates c ON a.id = c.application_id
      WHERE 1=1
    `;
    const params = [];

    if (county) {
      query += ` AND a.county = ?`;
      params.push(county);
    }

    if (subCounty) {
      query += ` AND a.sub_county = ?`;
      params.push(subCounty);
    }

    if (fromDate) {
      query += ` AND l.created_at >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND l.created_at <= ?`;
      params.push(toDate);
    }

    const [rows] = await db.query(query, params);
    const stats = rows[0];

    return {
      success: true,
      data: {
        totalNurseries: stats.total_nurseries,
        certifiedNurseries: stats.certified_nurseries,
        averageAccuracy: Math.round(stats.average_accuracy * 100) / 100,
        highAccuracyCount: stats.high_accuracy_count,
        certificationRate: stats.total_nurseries > 0
          ? Math.round((stats.certified_nurseries / stats.total_nurseries) * 100)
          : 0
      }
    };
  } catch (error) {
    console.error('Generate location report error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  saveNurseryLocation,
  getNurseryLocation,
  findNearbyNurseries,
  isWithinGeofence,
  createGeofence,
  checkGeofence,
  getLocationHistory,
  getNurseriesInBounds,
  generateLocationReport,
  calculateDistance,
  isValidCoordinates
};
