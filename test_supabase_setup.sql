-- ============================================
-- Test Supabase Setup
-- Run this to verify your schema is correct
-- ============================================

-- Check if tables exist
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'certificates', COUNT(*) FROM certificates
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'applications', 'documents', 'certificates', 'notifications');

-- Check if trigger exists
SELECT 
    trigger_name,
    event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Create a test user (optional - for testing)
-- Uncomment only if you want to create a test admin user
/*
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    created_at,
    updated_at
) VALUES (
    'test@example.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Admin","role":"admin"}',
    'authenticated',
    NOW(),
    NOW()
);
*/
