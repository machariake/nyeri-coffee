const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if available (standard for Render/Heroku/Supabase)
// Otherwise fallback to individual variables if provided
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase / Heroku / Render connections over SSL
    }
});

// Test connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL Database connected successfully');
        client.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
};

module.exports = { pool, testConnection };
