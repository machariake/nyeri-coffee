@echo off
echo ========================================
echo Starting CNCMS Development Services
echo ========================================
echo.

REM Start Backend
echo [1/4] Starting Backend Server...
start "CNCMS Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo ✓ Backend server starting on http://localhost:3000
echo.

REM Start Web Admin
echo [2/4] Starting Web Admin Panel...
start "CNCMS Web Admin" cmd /k "cd web_admin && npm start"
timeout /t 3 /nobreak >nul
echo ✓ Web Admin starting on http://localhost:3001
echo.

REM Start Web App
echo [3/4] Starting Web App...
start "CNCMS Web App" cmd /k "cd web_app && npm start"
timeout /t 3 /nobreak >nul
echo ✓ Web App starting on http://localhost:3002
echo.

echo [4/4] Flutter App should be started separately
echo   Run: cd flutter_app ^&^& flutter run
echo.

echo ========================================
echo All Services Starting...
echo ========================================
echo.
echo Services:
echo   - Backend:    http://localhost:3000
echo   - Web Admin:  http://localhost:3001
echo   - Web App:    http://localhost:3002
echo   - Flutter:    Run separately with 'flutter run'
echo.
echo Press any key to exit this window...
pause >nul
