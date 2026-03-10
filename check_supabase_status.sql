-- ============================================
-- Check Supabase Setup Status
-- Run this to see what's configured
-- ============================================

-- Check 1: Do tables exist?
SELECT 
    'TABLES STATUS' as check_type,
    tablename as name,
    'EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'applications', 'documents', 'certificates', 'notifications');

-- Check 2: Is RLS enabled?
SELECT 
    'RLS STATUS' as check_type,
    tablename as name,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'applications', 'documents', 'certificates', 'notifications');

-- Check 3: Do policies exist?
SELECT 
    'POLICIES COUNT' as check_type,
    tablename as name,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;

-- Check 4: Storage bucket
SELECT 
    'STORAGE' as check_type,
    id as bucket_name,
    name as bucket_display,
    public as is_public
FROM storage.buckets
WHERE id = 'documents';

-- Check 5: Auth users count
SELECT 
    'AUTH USERS' as check_type,
    COUNT(*) as user_count
FROM auth.users;

-- Check 6: Database users count
SELECT 
    'DATABASE USERS' as check_type,
    COUNT(*) as user_count
FROM users;
