-- ============================================
-- PHONE LOGIN RLS BYPASS OVERRIDE
-- Because the "users" table has Row Level Security (RLS) blocking
-- all unauthenticated queries, the Flutter app's attempt to map 
-- a phone number to an email address prior to login gets blocked.
--
-- This script creates a secure function that bypasses RLS just 
-- enough to perform this lookup without compromising your DB.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_email_from_phone(search_phone TEXT)
RETURNS JSON AS $$
DECLARE
    user_email TEXT;
    user_id UUID;
BEGIN
    SELECT email, id INTO user_email, user_id 
    FROM public.users 
    WHERE phone_number = search_phone 
    LIMIT 1;

    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN json_build_object('email', user_email, 'id', user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provide execute permission on this function to anonymous users
GRANT EXECUTE ON FUNCTION public.get_email_from_phone(TEXT) TO anon;
