const { Pool } = require('pg');
require('dotenv').config();

// Build connection config
let poolConfig;

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (dbUrl) {
    console.log('🔗 Using DATABASE_URL for connection');
    // Log the hostname part only (hide password)
    try {
        const urlObj = new URL(dbUrl);
        console.log(`   Host: ${urlObj.hostname}`);
        console.log(`   Port: ${urlObj.port || '5432'}`);
        console.log(`   Database: ${urlObj.pathname.slice(1)}`);
        console.log(`   User: ${urlObj.username}`);
        console.log(`   Password: ${'*'.repeat(urlObj.password?.length || 0)}`);
    } catch (e) {
        console.log('   ⚠️ Could not parse DATABASE_URL:', e.message);
    }
    
    poolConfig = {
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Fallback to individual env vars
    console.log('🔗 No DATABASE_URL found, using individual DB_* variables');
    poolConfig = {
        host: process.env.DB_HOST || 'db.iafxrxlrjspwbltsjzqz.supabase.co',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: {
            rejectUnauthorized: false
        }
    };
    console.log(`   Host: ${poolConfig.host}`);
    console.log(`   Port: ${poolConfig.port}`);
    console.log(`   Database: ${poolConfig.database}`);
}

const pool = new Pool(poolConfig);

// Test connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL Database connected successfully');
        client.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
};

module.exports = { pool, testConnection };

