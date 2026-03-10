@echo off
cls
echo =============================================
echo Web Admin - Complete Clean Reinstall
echo =============================================
echo.
echo This will:
echo   1. Delete node_modules
echo   2. Delete package-lock.json
echo   3. Reinstall all dependencies
echo   4. Start the app
echo.
echo This will take 5-10 minutes...
echo.
pause

cd /d "%~dp0web_admin"

echo.
echo [1/4] Stopping any running processes...
taskkill /F /FI "WindowTitle eq *web_admin*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Deleting node_modules...
rmdir /s /q node_modules 2>nul
if exist node_modules (
    echo ERROR: Could not delete node_modules. Please delete manually and run again.
    pause
    exit /b 1
)
echo ✓ node_modules deleted

echo.
echo [3/4] Deleting package-lock.json...
del /q package-lock.json 2>nul
echo ✓ package-lock.json deleted

echo.
echo [4/4] Installing dependencies (please wait)...
echo.
call npm install --legacy-peer-deps --verbose

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo Try running: npm cache clean --force
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo =============================================
echo ✓ Installation Complete!
echo =============================================
echo.
echo Starting Web Admin...
echo.
npm start
