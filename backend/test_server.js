const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    console.log('Testing backend setup...\n');
    
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        await conn.query('SELECT 1');
        console.log('   ✅ Database connected!\n');
        
        // Check if tables exist
        const [tables] = await conn.query("SHOW TABLES FROM cncms");
        console.log('   Tables found:', tables.length);
        tables.forEach(t => console.log('   -', Object.values(t)[0]));
        console.log();
        
        await conn.end();
    } catch (e) {
        console.log('   ❌ Database error:', e.message, '\n');
    }
    
    // Test 2: Start Express server
    console.log('2. Starting Express server...');
    const app = express();
    app.use(express.json());
    
    app.get('/test', (req, res) => {
        res.json({ status: 'OK', message: 'Server is running!' });
    });
    
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`   ✅ Server running on port ${PORT}`);
        console.log(`   Test URL: http://localhost:${PORT}/test`);
        console.log(`   Health URL: http://localhost:${PORT}/api/health`);
        console.log('\nPress Ctrl+C to stop');
    });
}

test();
