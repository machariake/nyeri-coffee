/**
 * Weather Service Integration
 * Fetches weather data and provides farming advisories
 */

const axios = require('axios');
const { pool } = require('../config/database');

// OpenWeatherMap API Configuration
const WEATHER_CONFIG = {
  apiKey: process.env.OPENWEATHER_API_KEY,
  baseUrl: 'https://api.openweathermap.org/data/2.5',
};

// Kenya coordinates for major towns
const LOCATION_COORDINATES = {
  'nyeri': { lat: -0.4167, lon: 36.9500 },
  'nanyuki': { lat: 0.0167, lon: 37.0667 },
  'karatina': { lat: -0.4833, lon: 37.1333 },
  'othaya': { lat: -0.5500, lon: 36.9333 },
  'mweiga': { lat: -0.3333, lon: 36.9167 },
  'chaka': { lat: -0.2667, lon: 36.9167 },
};

// Get current weather
const getCurrentWeather = async (location) => {
  try {
    const coords = LOCATION_COORDINATES[location.toLowerCase()];
    if (!coords) {
      return { success: false, error: 'Location not supported' };
    }

    const response = await axios.get(
      `${WEATHER_CONFIG.baseUrl}/weather`,
      {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          appid: WEATHER_CONFIG.apiKey,
          units: 'metric',
        },
      }
    );

    const data = response.data;
    
    // Save to database
    await pool.query(
      `INSERT INTO weather_data (ward, temperature, humidity, weather_condition, description)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       temperature = VALUES(temperature),
       humidity = VALUES(humidity),
       weather_condition = VALUES(weather_condition),
       description = VALUES(description),
       recorded_at = CURRENT_TIMESTAMP`,
      [
        location,
        data.main.temp,
        data.main.humidity,
        data.weather[0].main,
        data.weather[0].description,
      ]
    );

    return {
      success: true,
      data: {
        location: data.name,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        visibility: data.visibility,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
      },
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return { success: false, error: 'Failed to fetch weather data' };
  }
};

// Get 5-day forecast
const getForecast = async (location) => {
  try {
    const coords = LOCATION_COORDINATES[location.toLowerCase()];
    if (!coords) {
      return { success: false, error: 'Location not supported' };
    }

    const response = await axios.get(
      `${WEATHER_CONFIG.baseUrl}/forecast`,
      {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          appid: WEATHER_CONFIG.apiKey,
          units: 'metric',
        },
      }
    );

    // Group by day
    const dailyForecast = {};
    response.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date,
          temps: [],
          conditions: [],
          humidity: [],
        };
      }
      dailyForecast[date].temps.push(item.main.temp);
      dailyForecast[date].conditions.push(item.weather[0].main);
      dailyForecast[date].humidity.push(item.main.humidity);
    });

    // Process daily data
    const processedForecast = Object.values(dailyForecast).map((day) => ({
      date: day.date,
      minTemp: Math.min(...day.temps).toFixed(1),
      maxTemp: Math.max(...day.temps).toFixed(1),
      avgTemp: (day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1),
      condition: getMostFrequent(day.conditions),
      avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    }));

    return {
      success: true,
      forecast: processedForecast.slice(0, 5),
    };
  } catch (error) {
    console.error('Forecast fetch error:', error);
    return { success: false, error: 'Failed to fetch forecast' };
  }
};

// Get farming advisory based on weather
const getFarmingAdvisory = async (location, language = 'en') => {
  try {
    const weather = await getCurrentWeather(location);
    if (!weather.success) return weather;

    const { data } = weather;
    const advisories = {
      en: {
        irrigation: {
          high: 'High temperature expected. Increase irrigation frequency.',
          normal: 'Normal temperature. Maintain regular irrigation schedule.',
          low: 'Cool temperatures. Reduce irrigation to prevent waterlogging.',
        },
        pest: {
          high: 'High humidity may increase pest activity. Monitor closely.',
          normal: 'Normal pest conditions. Continue regular monitoring.',
          low: 'Low humidity. Good conditions for pest control.',
        },
        harvest: {
          good: 'Good weather for harvesting. Low humidity and clear skies.',
          bad: 'Avoid harvesting. Rain or high humidity expected.',
        },
        planting: {
          good: 'Ideal conditions for planting. Adequate soil moisture expected.',
          bad: 'Delay planting. Unfavorable weather conditions.',
        },
      },
      sw: {
        irrigation: {
          high: 'Joto kali linatarajiwa. Ongeza mara ya umwagiliaji.',
          normal: 'Joto la kawaida. Endelea na ratiba ya umwagiliaji.',
          low: 'Joto baridi. Punguza umwagiliaji kuepuka maji kupitiliza.',
        },
        pest: {
          high: 'Unyevu wa juu unaweza kuongeza wadudu. Fuatilia kwa karibu.',
          normal: 'Hali ya kawaida ya wadudu. Endelea na ufuatiliaji.',
          low: 'Unyevu wa chini. Hali nzuri kwa kudhibiti wadudu.',
        },
        harvest: {
          good: 'Hali nzuri ya kuvuna. Unyevu wa chini na anga wazi.',
          bad: 'Epuka kuvuna. Mvua au unyevu wa juu unatarajiwa.',
        },
        planting: {
          good: 'Hali bora ya kupanda. Unyevu wa kutosha wa udongo unatarajiwa.',
          bad: 'Chelewesha kupanda. Hali mbaya ya hewa.',
        },
      },
    };

    const lang = advisories[language] || advisories.en;
    const advisory = [];

    // Irrigation advisory
    if (data.temperature > 28) {
      advisory.push({ type: 'irrigation', message: lang.irrigation.high, priority: 'high' });
    } else if (data.temperature < 18) {
      advisory.push({ type: 'irrigation', message: lang.irrigation.low, priority: 'medium' });
    } else {
      advisory.push({ type: 'irrigation', message: lang.irrigation.normal, priority: 'low' });
    }

    // Pest advisory
    if (data.humidity > 75) {
      advisory.push({ type: 'pest', message: lang.pest.high, priority: 'high' });
    } else if (data.humidity < 40) {
      advisory.push({ type: 'pest', message: lang.pest.low, priority: 'low' });
    } else {
      advisory.push({ type: 'pest', message: lang.pest.normal, priority: 'medium' });
    }

    // General condition
    if (data.condition === 'Clear' || data.condition === 'Clouds') {
      advisory.push({ type: 'harvest', message: lang.harvest.good, priority: 'low' });
    } else if (data.condition === 'Rain') {
      advisory.push({ type: 'harvest', message: lang.harvest.bad, priority: 'high' });
    }

    return {
      success: true,
      weather: data,
      advisory,
    };
  } catch (error) {
    console.error('Advisory error:', error);
    return { success: false, error: 'Failed to generate advisory' };
  }
};

// Get coffee-specific recommendations
const getCoffeeRecommendations = async (location, stage = 'general') => {
  try {
    const weather = await getCurrentWeather(location);
    if (!weather.success) return weather;

    const { data } = weather;
    const recommendations = [];

    // Temperature-based recommendations
    if (data.temperature >= 18 && data.temperature <= 24) {
      recommendations.push({
        category: 'temperature',
        message: 'Optimal temperature for coffee growth (18-24°C)',
        action: 'Maintain current practices',
        priority: 'low',
      });
    } else if (data.temperature > 24) {
      recommendations.push({
        category: 'temperature',
        message: 'Temperature above optimal range',
        action: 'Increase shade and irrigation',
        priority: 'medium',
      });
    }

    // Humidity-based recommendations
    if (data.humidity >= 60 && data.humidity <= 80) {
      recommendations.push({
        category: 'humidity',
        message: 'Good humidity levels for coffee',
        action: 'Monitor for fungal diseases',
        priority: 'low',
      });
    } else if (data.humidity > 80) {
      recommendations.push({
        category: 'humidity',
        message: 'High humidity - disease risk',
        action: 'Apply fungicide and improve drainage',
        priority: 'high',
      });
    }

    // Stage-specific recommendations
    if (stage === 'flowering') {
      if (data.condition === 'Rain') {
        recommendations.push({
          category: 'flowering',
          message: 'Rain during flowering can reduce yield',
          action: 'Monitor flower drop and consider protected cultivation',
          priority: 'high',
        });
      }
    } else if (stage === 'harvest') {
      if (data.humidity > 70) {
        recommendations.push({
          category: 'harvest',
          message: 'High humidity affects drying',
          action: 'Use mechanical dryers or delay harvest',
          priority: 'high',
        });
      }
    }

    return {
      success: true,
      weather: data,
      recommendations,
    };
  } catch (error) {
    console.error('Coffee recommendations error:', error);
    return { success: false, error: 'Failed to get recommendations' };
  }
};

// Helper function
const getMostFrequent = (arr) => {
  const counts = {};
  arr.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

module.exports = {
  getCurrentWeather,
  getForecast,
  getFarmingAdvisory,
  getCoffeeRecommendations,
  LOCATION_COORDINATES,
};
