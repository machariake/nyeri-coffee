-- Migration: Add support contact settings to system_settings table
-- Run this in your MySQL database to add the support contact configuration

USE cncms;

-- Insert support contact settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('support_phone', '+254 700 000 000', 'string', 'Support phone number for voice calls'),
('support_email', 'support@cncms.go.ke', 'string', 'Support email address'),
('support_whatsapp', '+254 700 000 000', 'string', 'WhatsApp number for chat support'),
('support_hours', 'Mon-Fri, 8AM-5PM', 'string', 'Support business hours')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- Verify the settings were added
SELECT * FROM system_settings WHERE setting_key LIKE 'support_%';
