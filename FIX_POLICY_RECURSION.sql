-- ============================================
-- FIX: Infinite Recursion in Users Policy
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- Step 2: Create a SECURITY DEFINER function to check admin role
-- This avoids the recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    -- Bypass RLS by querying with security definer
    SELECT role INTO user_role FROM users WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create simplified policies that use the function
-- Users can ALWAYS view their own profile
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins can view all users (using the function to avoid recursion)
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        id = auth.uid()  -- User can see their own
        OR 
        public.is_admin()  -- OR admin can see all
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    USING (
        id = auth.uid()  -- User can update their own
        OR 
        public.is_admin()  -- OR admin can update all
    );

-- ============================================
-- FIX: Duplicate Key on Profile Creation
-- ============================================

-- Step 4: Update the handle_new_user function to use INSERT ... ON CONFLICT DO NOTHING
-- This prevents duplicate key errors

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone_number,
        role,
        ward,
        sub_county,
        id_number
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
        NEW.raw_user_meta_data->>'ward',
        NEW.raw_user_meta_data->>'sub_county',
        NEW.raw_user_meta_data->>'id_number'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        ward = EXCLUDED.ward,
        sub_county = EXCLUDED.sub_county,
        id_number = EXCLUDED.id_number,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check function exists
SELECT '✅ is_admin function created' as status 
WHERE EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- Check trigger exists
SELECT '✅ on_auth_user_created trigger created' as status 
WHERE EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
);

SELECT '✅ Policy recursion fix complete!' as result;
