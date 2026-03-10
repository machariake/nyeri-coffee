-- ============================================
-- CRITICAL DEBUG: Check EVERYTHING
-- Run this to find the EXACT problem
-- ============================================

-- 1. Check if users table exists
SELECT 
    '1. USERS TABLE' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌ RUN MINIMAL_USERS_SETUP.sql NOW!'
    END as result;

-- 2. Check auth.users count
SELECT 
    '2. AUTH USERS' as test,
    COUNT(*)::TEXT || ' users in auth' as result
FROM auth.users;

-- 3. Check database users count  
SELECT 
    '3. DATABASE USERS' as test,
    COUNT(*)::TEXT || ' profiles in users table' as result
FROM users;

-- 4. Check RLS status
SELECT 
    '4. RLS STATUS' as test,
    CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as result
FROM pg_tables WHERE tablename = 'users';

-- 5. Check policies
SELECT 
    '5. POLICIES COUNT' as test,
    COUNT(*)::TEXT || ' policies on users table' as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 6. List all policies
SELECT 
    '6. POLICY NAMES' as test,
    string_agg(policyname, ', ') as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 7. Check trigger
SELECT 
    '7. TRIGGER' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as result;

-- 8. Check if we can INSERT (test policy)
SELECT 
    '8. INSERT TEST' as test,
    'Skip - would create test user' as result;

-- 9. Check storage
SELECT 
    '9. STORAGE BUCKET' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents')
        THEN 'EXISTS ✅'
        ELSE 'MISSING (not critical for registration)'
    END as result;

-- 10. Show table structure
SELECT 
    '10. USERS TABLE STRUCTURE' as test,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- SUMMARY
SELECT '================================' as info;
SELECT 'If you see ANY ❌ above,' as recommendation;
SELECT 'Run MINIMAL_USERS_SETUP.sql in SQL Editor!' as action;
