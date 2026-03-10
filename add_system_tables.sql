-- Add System Settings, Promotions, and Alerts tables to existing database
-- Run this if you already have the database set up

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

-- Insert default system settings (ignore if already exists)
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
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
