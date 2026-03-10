const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    try {
        // Create connection
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'cncms'
        });

        // Hash password
        const passwordHash = await bcrypt.hash('admin123', 10);
        console.log('Password hash:', passwordHash);

        // Insert admin user
        await conn.query(
            `INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE password_hash = ?`,
            ['System Administrator', 'admin@cncms.go.ke', '0700000000', passwordHash, 'admin', 'Headquarters', 'Nyeri Central', passwordHash]
        );

        console.log('\n✅ Admin user created successfully!');
        console.log('\nLogin credentials:');
        console.log('  Email: admin@cncms.go.ke');
        console.log('  Password: admin123');
        console.log('\nAccess the admin panel at: http://localhost:3001\n');

        await conn.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createAdmin();
