-- ============================================
-- Create Default Admin User
-- Run this in MySQL (not Supabase!)
-- ============================================

-- Use the CNCMS database
USE cncms;

-- Create admin user
-- Default credentials:
-- Email: admin@example.com
-- Password: Admin123!

INSERT INTO users (
    email, 
    password, 
    full_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    'admin@example.com',
    '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', -- Admin123! (bcrypt hash)
    'System Administrator',
    'admin',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    full_name = 'System Administrator',
    role = 'admin';

-- Verify user was created
SELECT '✅ Admin user created!' as status;
SELECT email, full_name, role FROM users WHERE email = 'admin@example.com';

-- Show credentials
SELECT '================================' as info;
SELECT 'LOGIN CREDENTIALS:' as info;
SELECT 'Email: admin@example.com' as info;
SELECT 'Password: Admin123!' as info;
SELECT '================================' as info;
