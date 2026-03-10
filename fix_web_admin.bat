@echo off
echo ========================================
echo Fixing Web Admin Dependencies
echo ========================================
echo.

cd web_admin

echo Step 1: Cleaning...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
echo ✓ Cleaned

echo.
echo Step 2: Installing dependencies (this may take 5-10 minutes)...
npm install --legacy-peer-deps

echo.
echo ========================================
echo Done! Starting Web Admin...
echo ========================================
npm start
