-- Coffee Nursery Certificate Management System Database Schema

CREATE DATABASE IF NOT EXISTS cncms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cncms;

-- System Settings table (for maintenance mode and other settings)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
    description VARCHAR(255),
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
('maintenance_message', 'System is currently under maintenance. Please try again later.', 'string', 'Message shown during maintenance'),
('allow_registrations', 'true', 'boolean', 'Enable/disable user registrations'),
('app_version', '1.0.0', 'string', 'Current app version');

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    promotion_type ENUM('info', 'success', 'warning', 'error', 'promo') DEFAULT 'info',
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    show_to ENUM('all', 'farmers', 'officers', 'admins') DEFAULT 'all',
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- System Alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type ENUM('info', 'success', 'warning', 'error', 'urgent') DEFAULT 'info',
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    requires_acknowledgment BOOLEAN DEFAULT FALSE,
    show_to ENUM('all', 'farmers', 'officers', 'admins') DEFAULT 'all',
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('farmer', 'officer', 'admin') DEFAULT 'farmer',
    ward VARCHAR(100),
    sub_county VARCHAR(100),
    id_number VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    profile_image VARCHAR(500),
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    nursery_name VARCHAR(255) NOT NULL,
    nursery_location VARCHAR(255) NOT NULL,
    nursery_size VARCHAR(50),
    coffee_varieties TEXT,
    expected_seedlings INT,
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired') DEFAULT 'draft',
    officer_id INT,
    officer_comments TEXT,
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_type ENUM('land_registration', 'lease_agreement', 'id_document', 'business_registration', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    application_id INT NOT NULL,
    user_id INT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    qr_code_data TEXT,
    pdf_path VARCHAR(500),
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('status_change', 'approval', 'rejection', 'reminder', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county) 
VALUES ('System Administrator', 'admin@cncms.go.ke', '0700000000', '$2a$10$YourHashedPasswordHere', 'admin', 'Headquarters', 'Nyeri Central')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample officer
INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county) 
VALUES ('Agricultural Officer', 'officer@cncms.go.ke', '0711111111', '$2a$10$YourHashedPasswordHere', 'officer', 'Othaya', 'Othaya Sub-County')
ON DUPLICATE KEY UPDATE id=id;
