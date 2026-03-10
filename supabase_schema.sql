-- ============================================
-- CNCMS Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING (to avoid conflicts)
-- ============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;

-- Drop existing policies
DO $$ BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can update all users" ON users;
    
    -- Applications policies
    DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
    DROP POLICY IF EXISTS "Users can create applications" ON applications;
    DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
    DROP POLICY IF EXISTS "Users can delete their own applications" ON applications;
    DROP POLICY IF EXISTS "Admins and Officers can view all applications" ON applications;
    DROP POLICY IF EXISTS "Officers can update all applications" ON applications;
    
    -- Documents policies
    DROP POLICY IF EXISTS "Users can view documents for their applications" ON documents;
    DROP POLICY IF EXISTS "Users can upload documents for their applications" ON documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
    
    -- Certificates policies
    DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
    DROP POLICY IF EXISTS "Admins can view all certificates" ON certificates;
    DROP POLICY IF EXISTS "Admins can create certificates" ON certificates;
    
    -- Notifications policies
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can create notifications" ON notifications;
    
    -- Storage policies
    DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
END $$;

-- ============================================
-- 1. USERS TABLE
-- ============================================
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

-- ============================================
-- 2. APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    app_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nursery_name VARCHAR(255) NOT NULL,
    nursery_location VARCHAR(255) NOT NULL,
    nursery_size VARCHAR(50),
    coffee_varieties TEXT,
    expected_seedlings INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CERTIFICATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    application_id BIGINT REFERENCES applications(id),
    user_id UUID REFERENCES users(id),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    qr_code_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Applications table policies
CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
    ON applications FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins and Officers can view all applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'officer')
        )
    );

CREATE POLICY "Officers can update all applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'officer'
        )
    );

-- Documents table policies
CREATE POLICY "Users can view documents for their applications"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = documents.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload documents for their applications"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = documents.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = documents.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Certificates table policies
CREATE POLICY "Users can view their own certificates"
    ON certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
    ON certificates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create certificates"
    ON certificates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications table policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to create user profile after signup
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
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for documents (ignore if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies
CREATE POLICY "Users can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- You can manually create a test admin user in Supabase Auth dashboard
-- Or use the signup flow in your app
