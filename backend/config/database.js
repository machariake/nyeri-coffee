const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// Force IPv4 connections (Render free tier doesn't support IPv6 outbound)
dns.setDefaultResultOrder('ipv4first');

// Build connection config
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

let poolConfig;

if (dbUrl) {
    console.log('🔗 Using DATABASE_URL for connection');
    try {
        const urlObj = new URL(dbUrl);
        console.log(`   Host: ${urlObj.hostname}`);
        console.log(`   Port: ${urlObj.port || '5432'}`);
        console.log(`   Database: ${urlObj.pathname.slice(1)}`);
        console.log(`   User: ${urlObj.username}`);
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
    console.log('🔗 No DATABASE_URL found, using individual DB_* variables');
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: {
            rejectUnauthorized: false
        }
    };
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
        console.error('   💡 TIP: Check your DATABASE_URL environment variable');
    }
};

module.exports = { pool, testConnection };
