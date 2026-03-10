@echo off
echo ==========================================
echo CNCMS Database Setup
echo ==========================================
echo.

REM Set MySQL path
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 9.6\bin

set /p MYSQL_PASSWORD="Enter MySQL root password: "

echo.
echo Creating database...
"%MYSQL_PATH%\mysql.exe" -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS cncms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create database.
    echo Please check your MySQL password and try again.
    pause
    exit /b 1
)
echo Database created successfully!

echo.
echo Importing schema...
"%MYSQL_PATH%\mysql.exe" -u root -p%MYSQL_PASSWORD% cncms < "%~dp0backend\database\schema.sql"
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to import schema.
    pause
    exit /b 1
)
echo Schema imported successfully!

echo.
echo ==========================================
echo Database setup complete!
echo ==========================================
echo.

REM Update .env with password
echo.
set /p SAVE_PASSWORD="Save password to .env file? (y/n): "
if /i "%SAVE_PASSWORD%"=="y" (
    (
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=%MYSQL_PASSWORD%
        echo DB_NAME=cncms
        echo.
        echo # JWT Secret
        echo JWT_SECRET=cncms-super-secret-jwt-key-2025-change-in-production
        echo.
        echo # CORS
        echo ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:8080
        echo.
        echo # API URL (for QR codes)
        echo API_URL=http://localhost:3000
    ) > "%~dp0backend\.env"
    echo Password saved to backend\.env
)

echo.
echo Next steps:
echo 1. Start the backend: cd backend ^&^& npm run dev
echo 2. Start the web app: cd web_app ^&^& npm start
echo.
pause
