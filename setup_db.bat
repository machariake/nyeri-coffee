@echo off
echo Setting up CNCMS Database...
cd /d "C:\Program Files\MySQL\MySQL Server 9.6\bin"
mysql.exe -u root < "C:\Users\mashupke\Desktop\nyeri_farmer\setup_database.sql"
if %errorlevel% equ 0 (
    echo Database setup completed successfully!
) else (
    echo Database setup failed. Please check MySQL credentials.
)
pause
