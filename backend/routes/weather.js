const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getCurrentWeather,
  getForecast,
  getFarmingAdvisory,
  getCoffeeRecommendations,
  LOCATION_COORDINATES,
} = require('../services/weatherService');

const router = express.Router();

// Get current weather
router.get('/current/:location', authenticate, async (req, res) => {
  try {
    const { location } = req.params;

    const result = await getCurrentWeather(location);

    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get weather forecast
router.get('/forecast/:location', authenticate, async (req, res) => {
  try {
    const { location } = req.params;

    const result = await getForecast(location);

    if (result.success) {
      res.json({ success: true, data: result.forecast });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get farming advisory
router.get('/advisory/:location', authenticate, async (req, res) => {
  try {
    const { location } = req.params;
    const { lang } = req.query;

    const result = await getFarmingAdvisory(location, lang);

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get advisory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get coffee-specific recommendations
router.get('/coffee/:location', authenticate, async (req, res) => {
  try {
    const { location } = req.params;
    const { stage } = req.query;

    const result = await getCoffeeRecommendations(location, stage);

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Get coffee recommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get supported locations
router.get('/locations', authenticate, async (req, res) => {
  try {
    const locations = Object.keys(LOCATION_COORDINATES).map((key) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
    }));

    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
