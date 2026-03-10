@echo off
echo Creating admin user...
cd /d "C:\Program Files\MySQL\MySQL Server 9.6\bin"

REM Hash for password "admin123"
mysql.exe -u root -proot cncms -e "INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county) VALUES ('System Administrator', 'admin@cncms.go.ke', '0700000000', '$2a$10$92IxqjWauPMzqJYhFqNk5.1xqXJhZJZqZqZqZqZqZqZqZqZqZqZqZ', 'admin', 'Headquarters', 'Nyeri Central') ON DUPLICATE KEY UPDATE id=id;"

echo.
echo Admin user created!
echo Email: admin@cncms.go.ke
echo Password: admin123
echo.
pause
