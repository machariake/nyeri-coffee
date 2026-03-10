@echo off
cls
echo =============================================
echo CNCMS - All Services Startup
echo =============================================
echo.
echo This script will start:
echo   1. Backend Server (Port 3000)
echo   2. Web Admin (Port 3001)
echo   3. Web App (Port 3002)
echo.
echo Flutter should be started separately
echo.
pause
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "CNCMS Backend" cmd /k "cd backend && echo Starting backend... && npm run dev"
timeout /t 5 /nobreak >nul
echo ✓ Backend starting on http://localhost:3000
echo.

REM Start Web Admin
echo [2/3] Starting Web Admin...
start "CNCMS Web Admin" cmd /k "cd web_admin && echo Starting web admin... && npm start"
timeout /t 3 /nobreak >nul
echo ✓ Web Admin starting on http://localhost:3001
echo.

REM Start Web App
echo [3/3] Starting Web App...
start "CNCMS Web App" cmd /k "cd web_app && echo Starting web app... && npm start"
timeout /t 3 /nobreak >nul
echo ✓ Web App starting on http://localhost:3002
echo.

echo =============================================
echo All Services Starting...
echo =============================================
echo.
echo URLs:
echo   Backend:    http://localhost:3000
echo   Web Admin:  http://localhost:3001
echo   Web App:    http://localhost:3002
echo.
echo Flutter:
echo   cd flutter_app
echo   flutter run
echo.
echo Press Ctrl+C in each terminal to stop services
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

REM Open browsers
start http://localhost:3000/api/health
start http://localhost:3001
start http://localhost:3002

echo Done! Check your browsers.
echo.
pause
