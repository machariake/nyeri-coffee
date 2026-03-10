-- ============================================
-- QUICK FIX: Check and Fix Registration
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Create users table if missing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'farmer',
    ward VARCHAR(100),
    sub_county VARCHAR(100),
    id_number VARCHAR(50),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Drop old stuff
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- 4. Create RLS policies (allow insert for new users)
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. Create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, email, full_name, phone_number, role,
        ward, sub_county, id_number
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
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Verify
SELECT '✅ Setup Complete!' as status;
SELECT 'Try registration again in Flutter app' as next_step;
