-- Diagnostic Script: Check Applications and Users
-- Run this in Supabase SQL Editor

-- Check total users
SELECT '=== USERS ===' as info;
SELECT COUNT(*) as total_users FROM users;

-- Check admin users
SELECT '=== ADMIN USERS ===' as info;
SELECT id, full_name, email, role, created_at
FROM users
WHERE role = 'admin';

-- Check farmer users
SELECT '=== FARMER USERS ===' as info;
SELECT id, full_name, email, role, ward, sub_county, created_at
FROM users
WHERE role = 'farmer'
LIMIT 10;

-- Check total applications
SELECT '=== APPLICATIONS ===' as info;
SELECT COUNT(*) as total_applications FROM applications;

-- Check applications by status
SELECT '=== APPLICATIONS BY STATUS ===' as info;
SELECT status, COUNT(*) as count
FROM applications
GROUP BY status;

-- Check recent applications
SELECT '=== RECENT APPLICATIONS ===' as info;
SELECT
    a.id,
    a.app_id,
    a.nursery_name,
    a.status,
    a.submitted_at,
    u.full_name as applicant_name,
    u.ward
FROM applications a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;

-- Check if system settings exist
SELECT '=== SYSTEM SETTINGS ===' as info;
SELECT setting_key, setting_value
FROM system_settings
WHERE setting_key LIKE '%support%' OR setting_key LIKE '%maintenance%'
LIMIT 10;

-- Summary
SELECT '=== SUMMARY ===' as info;
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM users WHERE role = 'farmer') as farmer_users,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'submitted') as pending_applications;
