/**
 * GPS Location Routes
 */

const express = require('express');
const router = express.Router();
const gpsService = require('../services/gpsService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route POST /api/gps/nurseries/:nurseryId/location
 * @desc Save nursery location
 * @access Private (Officers only)
 */
router.post('/nurseries/:nurseryId/location', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { nurseryId } = req.params;
    const { latitude, longitude, accuracy, address, applicationId, metadata } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const result = await gpsService.saveNurseryLocation({
      nurseryId: parseInt(nurseryId),
      applicationId,
      latitude,
      longitude,
      accuracy,
      address,
      capturedBy: req.user.id,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving location'
    });
  }
});

/**
 * @route GET /api/gps/nurseries/:nurseryId/location
 * @desc Get nursery location
 * @access Private
 */
router.get('/nurseries/:nurseryId/location', authenticate, async (req, res) => {
  try {
    const { nurseryId } = req.params;
    const result = await gpsService.getNurseryLocation(parseInt(nurseryId));

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location'
    });
  }
});

/**
 * @route GET /api/gps/nearby
 * @desc Find nearby nurseries
 * @access Private
 */
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const nurseries = await gpsService.findNearbyNurseries(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 10
    );

    res.json({
      success: true,
      data: nurseries
    });
  } catch (error) {
    console.error('Find nearby nurseries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby nurseries'
    });
  }
});

/**
 * @route POST /api/gps/nurseries/:nurseryId/geofence
 * @desc Create geofence for nursery
 * @access Private (Officers and Admins)
 */
router.post('/nurseries/:nurseryId/geofence', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { nurseryId } = req.params;
    const { centerLatitude, centerLongitude, radiusKm, name } = req.body;

    if (!centerLatitude || !centerLongitude || !radiusKm) {
      return res.status(400).json({
        success: false,
        message: 'Center coordinates and radius are required'
      });
    }

    const result = await gpsService.createGeofence({
      nurseryId: parseInt(nurseryId),
      centerLatitude,
      centerLongitude,
      radiusKm,
      name,
      createdBy: req.user.id
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating geofence'
    });
  }
});

/**
 * @route GET /api/gps/nurseries/:nurseryId/geofence/check
 * @desc Check if nursery is within geofence
 * @access Private
 */
router.get('/nurseries/:nurseryId/geofence/check', authenticate, async (req, res) => {
  try {
    const { nurseryId } = req.params;
    const result = await gpsService.checkGeofence(parseInt(nurseryId));

    res.json(result);
  } catch (error) {
    console.error('Check geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking geofence'
    });
  }
});

/**
 * @route GET /api/gps/nurseries/:nurseryId/history
 * @desc Get location history for nursery
 * @access Private (Officers and Admins)
 */
router.get('/nurseries/:nurseryId/history', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { nurseryId } = req.params;
    const history = await gpsService.getLocationHistory(parseInt(nurseryId));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location history'
    });
  }
});

/**
 * @route POST /api/gps/bounds
 * @desc Get nurseries in map bounds
 * @access Private
 */
router.post('/bounds', authenticate, async (req, res) => {
  try {
    const { north, south, east, west } = req.body;

    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        message: 'Map bounds (north, south, east, west) are required'
      });
    }

    const nurseries = await gpsService.getNurseriesInBounds({ north, south, east, west });

    res.json({
      success: true,
      data: nurseries
    });
  } catch (error) {
    console.error('Get nurseries in bounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nurseries'
    });
  }
});

/**
 * @route GET /api/gps/report
 * @desc Generate location report
 * @access Private (Officers and Admins)
 */
router.get('/report', authenticate, authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { county, subCounty, fromDate, toDate } = req.query;
    
    const result = await gpsService.generateLocationReport({
      county,
      subCounty,
      fromDate,
      toDate
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Generate location report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});

/**
 * @route POST /api/gps/distance
 * @desc Calculate distance between two points
 * @access Private
 */
router.post('/distance', authenticate, async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.body;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({
        success: false,
        message: 'Both coordinates are required'
      });
    }

    const distance = gpsService.calculateDistance(lat1, lng1, lat2, lng2);

    res.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        unit: 'km'
      }
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating distance'
    });
  }
});

module.exports = router;
