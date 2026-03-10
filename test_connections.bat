@echo off
echo ========================================
echo CNCMS Connection Test Script
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js is installed
    node --version
) else (
    echo X Node.js is NOT installed. Please install Node.js first.
    goto :end
)
echo.

REM Check if Flutter is installed
echo [2/6] Checking Flutter installation...
where flutter >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Flutter is installed
    flutter --version
) else (
    echo X Flutter is NOT installed. Please install Flutter first.
)
echo.

REM Check if MySQL is running
echo [3/6] Checking MySQL status...
mysql -u root -e "SELECT 'MySQL is running' AS status;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MySQL is running
) else (
    echo X MySQL is NOT running or not installed
    echo   Please start MySQL service
)
echo.

REM Check backend directory
echo [4/6] Checking backend configuration...
if exist "backend\.env" (
    echo ✓ Backend .env file exists
) else (
    echo X Backend .env file is missing
)

if exist "backend\package.json" (
    echo ✓ Backend package.json exists
    cd backend
    if exist "node_modules" (
        echo ✓ Backend dependencies installed
    ) else (
        echo ! Backend dependencies missing. Run: npm install
    )
    cd ..
) else (
    echo X Backend package.json is missing
)
echo.

REM Check web_app directory
echo [5/6] Checking web_app configuration...
if exist "web_app\.env" (
    echo ✓ Web App .env file exists
) else (
    echo X Web App .env file is missing
)

if exist "web_app\package.json" (
    echo ✓ Web App package.json exists
    cd web_app
    if exist "node_modules" (
        echo ✓ Web App dependencies installed
    ) else (
        echo ! Web App dependencies missing. Run: npm install
    )
    cd ..
) else (
    echo X Web App package.json is missing
)
echo.

REM Check web_admin directory
echo [6/6] Checking web_admin configuration...
if exist "web_admin\.env" (
    echo ✓ Web Admin .env file exists
) else (
    echo X Web Admin .env file is missing
)

if exist "web_admin\package.json" (
    echo ✓ Web Admin package.json exists
    cd web_admin
    if exist "node_modules" (
        echo ✓ Web Admin dependencies installed
    ) else (
        echo ! Web Admin dependencies missing. Run: npm install
    )
    cd ..
) else (
    echo X Web Admin package.json is missing
)
echo.

REM Check Flutter app
echo [Bonus] Checking Flutter app configuration...
if exist "flutter_app\pubspec.yaml" (
    echo ✓ Flutter app pubspec.yaml exists
    cd flutter_app
    if exist ".dart_tool" (
        echo ✓ Flutter dependencies installed
    ) else (
        echo ! Flutter dependencies missing. Run: flutter pub get
    )
    cd ..
) else (
    echo X Flutter app pubspec.yaml is missing
)
echo.

echo ========================================
echo Connection Test Complete
echo ========================================
echo.
echo Next Steps:
echo 1. Ensure MySQL is running
echo 2. Update backend\.env with your MySQL password
echo 3. Install dependencies if missing:
echo    - Backend: cd backend ^&^& npm install
echo    - Web App: cd web_app ^&^& npm install
echo    - Web Admin: cd web_admin ^&^& npm install
echo    - Flutter: cd flutter_app ^&^& flutter pub get
echo 4. Start services:
echo    - Backend: cd backend ^&^& npm run dev
echo    - Web App: cd web_app ^&^& npm start
echo    - Web Admin: cd web_admin ^&^& npm start
echo    - Flutter: cd flutter_app ^&^& flutter run
echo.
echo For detailed instructions, see: SUPABASE_CONNECTION_FIX.md
echo.

:end
pause
