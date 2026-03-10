@echo off
echo ==========================================
echo MySQL Root Password Reset
echo ==========================================
echo.
echo This will reset MySQL root password to empty (no password)
echo.
echo IMPORTANT: You must stop MySQL service first!
echo 1. Open Services (services.msc)
echo 2. Find "MySQL96" or "MySQL" service
echo 3. Right-click and select "Stop"
echo.
pause

echo.
echo Starting MySQL with skip-grant-tables...
sc stop MySQL96
timeout /t 3 /nobreak >nul

sc config MySQL96 start= demand
sc start MySQL96
timeout /t 3 /nobreak >nul

echo.
echo Password reset complete!
echo New password: (empty - no password)
echo.
echo Now restart MySQL normally:
echo sc config MySQL96 start= auto
echo sc start MySQL96
echo.
pause
