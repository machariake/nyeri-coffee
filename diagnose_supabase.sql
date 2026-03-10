-- ============================================
-- COMPLETE SUPABASE SETUP CHECK
-- Run this FIRST to see what's wrong
-- ============================================

-- 1. Check if users table exists
SELECT 
    'USERS TABLE' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status;

-- 2. Check if applications table exists
SELECT 
    'APPLICATIONS TABLE' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status;

-- 3. Check RLS status on users table
SELECT 
    'USERS RLS' as check_name,
    CASE 
        WHEN rowsecurity THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- 4. Check auth users count
SELECT 
    'AUTH USERS COUNT' as check_name,
    COUNT(*)::TEXT as status
FROM auth.users;

-- 5. Check database users count
SELECT 
    'DATABASE USERS COUNT' as check_name,
    COUNT(*)::TEXT as status
FROM users;

-- 6. Check if policies exist
SELECT 
    'RLS POLICIES COUNT' as check_name,
    COUNT(*)::TEXT as status
FROM pg_policies
WHERE schemaname = 'public';

-- 7. Check storage bucket
SELECT 
    'STORAGE BUCKET' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status;

-- 8. Show all tables in public schema
SELECT 
    'ALL TABLES' as check_name,
    string_agg(tablename, ', ') as status
FROM pg_tables 
WHERE schemaname = 'public';

-- 9. Check a specific user (debug)
SELECT 
    'SAMPLE USER' as check_name,
    COALESCE(
        (SELECT email FROM users LIMIT 1),
        'NO USERS YET'
    ) as status;

-- 10. Check auth schema
SELECT 
    'AUTH SCHEMA' as check_name,
    COUNT(*)::TEXT || ' users' as status
FROM auth.users;
