-- ============================================
-- DEBUG: Check Supabase Setup Status
-- Run this to see what's wrong with registration
-- ============================================

-- 1. Check if users table exists
SELECT 
    'USERS TABLE' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌ - Run MINIMAL_USERS_SETUP.sql'
    END as status;

-- 2. Check if auth.users has any users
SELECT 
    'AUTH USERS' as check_item,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) > 0
        THEN (SELECT COUNT(*)::TEXT || ' users found' FROM auth.users)
        ELSE 'NO USERS - Registration might work'
    END as status;

-- 3. Check if database users table has users
SELECT 
    'DATABASE USERS' as check_item,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0
        THEN (SELECT COUNT(*)::TEXT || ' profiles found' FROM users)
        ELSE 'NO PROFILES - Trigger might not be working'
    END as status;

-- 4. Check RLS on users table
SELECT 
    'USERS RLS' as check_item,
    CASE 
        WHEN rowsecurity THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌ - Run: ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- 5. Check policies count
SELECT 
    'USERS POLICIES' as check_item,
    COUNT(*)::TEXT || ' policies found' as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 6. Show all policies on users table
SELECT 
    'POLICY LIST' as check_item,
    policyname as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 7. Check if trigger exists
SELECT 
    'USER CREATION TRIGGER' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        )
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌ - Run MINIMAL_USERS_SETUP.sql'
    END as status;

-- 8. Check storage bucket
SELECT 
    'STORAGE BUCKET' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status;

-- 9. Test: Try to see if we can query users
SELECT 
    'QUERY TEST' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users LIMIT 1)
        THEN (SELECT email FROM users LIMIT 1) || ' - Query works'
        ELSE 'No users or cannot query'
    END as status;

-- 10. Summary
SELECT '=== SUMMARY ===' as check_item;
SELECT 'If you see any ❌ above, run MINIMAL_USERS_SETUP.sql in SQL Editor' as recommendation;
