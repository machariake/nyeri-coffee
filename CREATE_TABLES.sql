-- ============================================
-- CREATE TABLES FOR BACKEND API
-- Compatible with existing Supabase users table (UUID ids)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to the EXISTING users table (don't recreate it!)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    nursery_name VARCHAR(255) NOT NULL,
    nursery_location VARCHAR(255) NOT NULL,
    nursery_size VARCHAR(100),
    coffee_varieties VARCHAR(255),
    expected_seedlings INTEGER,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired')),
    officer_id UUID REFERENCES users(id),
    review_notes TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    user_id UUID REFERENCES users(id),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(100),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    application_id INTEGER REFERENCES applications(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
SELECT '✅ All tables created successfully!' as status;
