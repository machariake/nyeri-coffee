@echo off
echo ======================================
echo Database Diagnostic Check
echo ======================================
echo.
echo This will check users and applications in your database
echo.
set /p MYSQL_USER="Enter MySQL username (usually root): "
set /p MYSQL_PASS="Enter MySQL password: "
echo.
echo Running diagnostic check...
echo.
mysql -u %MYSQL_USER% -p%MYSQL_PASS% cncms < check_database.sql
echo.
echo ======================================
echo Diagnostic Complete!
echo ======================================
echo.
echo Review the output above to see:
echo - How many users exist
echo - How many applications exist
echo - If you have admin users
echo.
echo If everything shows 0, you need to:
echo 1. Register users through the app
echo 2. Create applications through the farmer app
echo.
pause
