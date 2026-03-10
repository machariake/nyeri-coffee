-- ============================================
-- Diagnostic Script: Check Supabase Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Check 1: Total users
SELECT '=== USERS ===' as info;
SELECT COUNT(*) as total_users FROM users;

-- Check 2: Admin users
SELECT '=== ADMIN USERS ===' as info;
SELECT id, full_name, email, role, created_at
FROM users
WHERE role = 'admin';

-- Check 3: Farmer users
SELECT '=== FARMER USERS ===' as info;
SELECT id, full_name, email, role, ward, sub_county, created_at
FROM users
WHERE role = 'farmer'
LIMIT 10;

-- Check 4: Auth users (Supabase auth)
SELECT '=== AUTH USERS (Supabase Auth) ===' as info;
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check 5: Total applications
SELECT '=== APPLICATIONS ===' as info;
SELECT COUNT(*) as total_applications FROM applications;

-- Check 6: Applications by status
SELECT '=== APPLICATIONS BY STATUS ===' as info;
SELECT status, COUNT(*) as count
FROM applications
GROUP BY status;

-- Check 7: Recent applications
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

-- Check 8: System settings table
SELECT '=== SYSTEM SETTINGS ===' as info;
SELECT setting_key, setting_value
FROM system_settings
WHERE setting_key LIKE '%support%' OR setting_key LIKE '%maintenance%'
LIMIT 10;

-- Check 9: Summary
SELECT '=== SUMMARY ===' as info;
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM users WHERE role = 'farmer') as farmer_users,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'submitted') as pending_applications;

-- Check 10: RLS Status
SELECT '=== RLS STATUS ===' as info;
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'applications', 'documents', 'certificates', 'notifications');
