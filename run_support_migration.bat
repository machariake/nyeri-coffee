@echo off
echo ======================================
echo Running Support Settings Migration
echo ======================================
echo.
echo This will add support contact settings to the database
echo.
set /p MYSQL_USER="Enter MySQL username (usually root): "
set /p MYSQL_PASS="Enter MySQL password: "
echo.
echo Running migration...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% cncms < add_support_settings.sql
echo.
echo ======================================
echo Migration Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Restart your backend server
echo 2. Go to http://localhost:3001/admin/debug
echo 3. Check if settings are loaded
echo 4. Go to http://localhost:3001/admin/settings
echo ======================================
pause
