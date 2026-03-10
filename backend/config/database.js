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

// Since node-postgres doesn't have a direct equivalent to mysql2's standard .query(sql, [params]) returning an array of [rows, fields],
// We add a helper wrapper to make our queries mostly backward compatible with how mysql2 behaved
const queryWrapper = {
    query: async (text, params) => {
        // Postgres uses $1, $2 instead of ? for params, so we optionally convert ? to $1 etc if needed,
        // but for safety we'll assume standard pg syntax in routes or adjust routes individually.
        // Actually, we can do a quick Regex to convert `?` to `$1`, `$2` if the project was heavily using `?` for mysql
        let pgSql = text;
        if (params && params.length > 0) {
            let i = 1;
            pgSql = text.replace(/\?/g, () => `$${i++}`);
        }
        
        try {
            const result = await pool.query(pgSql, params);
            // Return in [rows] format to match mysql2 destructuring: const [users] = await pool.query(...)
            return [result.rows, result.fields]; 
        } catch (err) {
            throw err;
        }
    },
    getConnection: async () => {
        const client = await pool.connect();
        return client;
    }
};

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

module.exports = { pool: queryWrapper, testConnection };
