-- ============================================
-- AgriCertify Supabase Database Schema
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'farmer' CHECK (role IN ('farmer', 'officer', 'admin')),
  ward VARCHAR(100),
  sub_county VARCHAR(100),
  id_number VARCHAR(50),
  profile_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for faster queries
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_ward_idx ON users(ward);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
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

-- ============================================
-- 2. APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  app_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  nursery_name VARCHAR(255) NOT NULL,
  nursery_location VARCHAR(255) NOT NULL,
  nursery_size VARCHAR(50),
  coffee_varieties TEXT,
  expected_seedlings INTEGER,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired')),
  officer_id UUID REFERENCES users(id),
  officer_comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX applications_user_id_idx ON applications(user_id);
CREATE INDEX applications_app_id_idx ON applications(app_id);
CREATE INDEX applications_status_idx ON applications(status);
CREATE INDEX applications_created_at_idx ON applications(created_at DESC);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policies for applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft applications"
  ON applications FOR DELETE
  USING (
    auth.uid() = user_id AND 
    status = 'draft'
  );

CREATE POLICY "Officers can view all submitted applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'officer'
    ) AND status IN ('submitted', 'under_review')
  );

CREATE POLICY "Officers can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'officer'
    )
  );

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('land_registration', 'lease_agreement', 'id_document', 'business_registration', 'other')),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX documents_application_id_idx ON documents(application_id);
CREATE INDEX documents_type_idx ON documents(document_type);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Users can view documents for their applications"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents for their applications"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- 4. CERTIFICATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  qr_code_data TEXT,
  pdf_path VARCHAR(500),
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX certificates_user_id_idx ON certificates(user_id);
CREATE INDEX certificates_number_idx ON certificates(certificate_number);
CREATE INDEX certificates_expiry_idx ON certificates(expiry_date);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Officers can view all certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'officer'
    )
  );

CREATE POLICY "Admins can manage certificates"
  ON certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('status_change', 'approval', 'rejection', 'reminder', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for faster queries and realtime
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (for backend/edge functions)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_created_at_idx ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 7. SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('boolean', 'string', 'number', 'json')),
  description VARCHAR(255),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
('maintenance_message', 'System is currently under maintenance. Please try again later.', 'string', 'Message shown during maintenance'),
('allow_registrations', 'true', 'boolean', 'Enable/disable user registrations'),
('app_version', '1.0.0', 'string', 'Current app version'),
('support_phone', '+254 700 000 000', 'string', 'Support phone number'),
('support_email', 'support@cncms.go.ke', 'string', 'Support email address'),
('support_whatsapp', '+254 700 000 000', 'string', 'WhatsApp number for support'),
('support_hours', 'Mon-Fri, 8AM-5PM', 'string', 'Support business hours')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "Everyone can view system settings"
  ON system_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 9. ENABLE REALTIME
-- ============================================
-- Note: Enable realtime in Supabase Dashboard → Database → Replication
-- Or run this SQL:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- ============================================
-- 10. STORAGE BUCKETS
-- ============================================
-- Create storage buckets via Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create bucket: 'documents' (Private)
-- 3. Create bucket: 'certificates' (Private)
-- 4. Create bucket: 'profile-images' (Public)

-- Or via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES
('documents', 'documents', false),
('certificates', 'certificates', false),
('profile-images', 'profile-images', true);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- END OF MIGRATION
-- ============================================
