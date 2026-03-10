-- Database Migrations for Advanced Features

-- 1. User Devices for Push Notifications
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_type ENUM('android', 'ios', 'web') NOT NULL,
    fcm_token VARCHAR(500),
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device (user_id, device_id)
);

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    application_updates BOOLEAN DEFAULT TRUE,
    certificate_updates BOOLEAN DEFAULT TRUE,
    reminders BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Enhanced Notifications Table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSON AFTER type;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channels JSON AFTER data;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL AFTER is_read;

-- 4. Chat/Messages System
CREATE TABLE IF NOT EXISTS chat_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_type ENUM('support', 'officer', 'group') DEFAULT 'support',
    name VARCHAR(255),
    created_by INT,
    application_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'document', 'system') DEFAULT 'text',
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Video Tutorials
CREATE TABLE IF NOT EXISTS video_tutorials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    category ENUM('getting_started', 'applications', 'certificates', 'faq', 'tips') DEFAULT 'getting_started',
    duration INT, -- in seconds
    language VARCHAR(10) DEFAULT 'en',
    view_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payments (M-Pesa Integration)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    application_id INT,
    certificate_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    payment_method ENUM('mpesa', 'card', 'bank') DEFAULT 'mpesa',
    mpesa_receipt_number VARCHAR(100),
    mpesa_phone_number VARCHAR(20),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    description TEXT,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL
);

-- 7. Weather Data Cache
CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ward VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100),
    temperature DECIMAL(5, 2),
    humidity INT,
    weather_condition VARCHAR(50),
    description VARCHAR(255),
    forecast JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_location_time (ward, recorded_at)
);

-- 8. Gamification - Badges
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    category ENUM('application', 'certificate', 'engagement', 'special') DEFAULT 'application',
    requirement_type VARCHAR(50),
    requirement_value INT,
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_badge (user_id, badge_id)
);

-- 9. Gamification - Points & Leaderboard
CREATE TABLE IF NOT EXISTS user_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    application_points INT DEFAULT 0,
    certificate_points INT DEFAULT 0,
    engagement_points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    transaction_type ENUM('earned', 'redeemed', 'bonus') DEFAULT 'earned',
    source VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Application Templates
CREATE TABLE IF NOT EXISTS application_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    template_data JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- 12. Calendar Events & Reminders
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('application_deadline', 'certificate_expiry', 'inspection', 'payment', 'custom') DEFAULT 'custom',
    related_id INT,
    related_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_all_day BOOLEAN DEFAULT FALSE,
    reminder_minutes INT DEFAULT 60,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Offline Sync Queue
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    payload JSON,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. GPS Locations
CREATE TABLE IF NOT EXISTS nursery_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    user_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    address TEXT,
    ward VARCHAR(100),
    sub_county VARCHAR(100),
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Document OCR Results
CREATE TABLE IF NOT EXISTS document_ocr (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    extracted_text TEXT,
    extracted_data JSON,
    confidence_score DECIMAL(5, 2),
    verification_status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 16. Community Forum
CREATE TABLE IF NOT EXISTS forum_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS forum_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_reply_id INT,
    is_solution BOOLEAN DEFAULT FALSE,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_reply_id) REFERENCES forum_replies(id) ON DELETE SET NULL
);

-- 17. System Health Logs
CREATE TABLE IF NOT EXISTS system_health_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 2),
    unit VARCHAR(20),
    status ENUM('healthy', 'warning', 'critical') DEFAULT 'healthy',
    details JSON,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_time (metric_name, logged_at)
);

-- Insert Default Badges
INSERT INTO badges (name, description, category, requirement_type, requirement_value, points) VALUES
('First Steps', 'Created your first application', 'application', 'applications_count', 1, 10),
('Application Pro', 'Submitted 5 applications', 'application', 'applications_count', 5, 50),
('Certified Farmer', 'Received your first certificate', 'certificate', 'certificates_count', 1, 100),
('Certificate Collector', 'Received 5 certificates', 'certificate', 'certificates_count', 5, 250),
('Quick Starter', 'Completed application within 24 hours of registration', 'special', 'quick_start', 1, 25),
('Document Master', 'Uploaded all required documents', 'application', 'complete_documents', 1, 15),
('Active Member', 'Logged in for 7 consecutive days', 'engagement', 'login_streak', 7, 30),
('Community Helper', 'Replied to 10 forum topics', 'engagement', 'forum_replies', 10, 40),
('Early Bird', 'Submitted application before 8 AM', 'special', 'early_submission', 1, 20),
('Perfect Score', 'Got first application approved without rejection', 'special', 'first_try_approval', 1, 50);

-- Insert Default Video Tutorials
INSERT INTO video_tutorials (title, description, category, duration, language) VALUES
('Getting Started with AgriCertify', 'Learn how to register and navigate the system', 'getting_started', 180, 'en'),
('How to Apply for a Certificate', 'Step-by-step guide to submitting your application', 'applications', 300, 'en'),
('Uploading Documents', 'Best practices for document uploads', 'applications', 240, 'en'),
('Understanding Your Certificate', 'What your certificate means and how to use it', 'certificates', 180, 'en'),
('Renewing Your Certificate', 'How to renew before expiry', 'certificates', 240, 'en'),
('Frequently Asked Questions', 'Answers to common questions', 'faq', 600, 'en');

-- Insert Forum Categories
INSERT INTO forum_categories (name, description, icon, sort_order) VALUES
('General Discussion', 'General topics about coffee farming', 'message-circle', 1),
('Application Help', 'Get help with your applications', 'help-circle', 2),
('Best Practices', 'Share and learn best practices', 'award', 3),
('Marketplace', 'Buy and sell coffee seedlings', 'shopping-bag', 4),
('Success Stories', 'Share your success stories', 'trending-up', 5);
