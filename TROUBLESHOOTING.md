# Troubleshooting Guide

## Login Failed Error

### Common Causes:
1. **Maintenance Mode Enabled** - Most common cause
2. Invalid credentials
3. Backend server not running
4. Database connection issue

### Solution:

#### 1. Check if Maintenance Mode is Enabled
```bash
# Check maintenance mode status
mysql.exe -u root -proot cncms -e "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode';"
```

#### 2. Disable Maintenance Mode
```bash
# Disable maintenance mode
mysql.exe -u root -proot cncms -e "UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'maintenance_mode';"
```

#### 3. Verify Backend is Running
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Or restart the backend
cd backend
node server.js
```

#### 4. Test Login API
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@cncms.go.ke\",\"password\":\"admin123\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "user": {...}
  }
}
```

## Invalid Token Error

### Causes:
1. Token expired (tokens expire after 24 hours)
2. Wrong JWT_SECRET in backend
3. Token not properly attached to requests

### Solutions:

#### 1. Re-login to Get New Token
Simply log out and log in again to get a fresh token.

#### 2. Check JWT_SECRET Configuration
```bash
# View current JWT_SECRET
cd backend
type .env | findstr JWT_SECRET
```

Ensure it matches in `backend/middleware/auth.js`.

#### 3. Clear Browser Storage
```javascript
// Run in browser console to clear old tokens
localStorage.clear();
location.reload();
```

## Maintenance Mode

### Enable/Disable via Database
```bash
# Enable maintenance mode
mysql.exe -u root -proot cncms -e "UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'maintenance_mode';"

# Disable maintenance mode
mysql.exe -u root -proot cncms -e "UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'maintenance_mode';"

# Update maintenance message
mysql.exe -u root -proot cncms -e "UPDATE system_settings SET setting_value = 'Custom message here' WHERE setting_key = 'maintenance_message';"
```

### Enable/Disable via Web Admin
1. Login as admin: `admin@cncms.go.ke` / `admin123`
2. Navigate to **System Settings**
3. Toggle **Enable Maintenance Mode**
4. Click **Save Settings**

### Maintenance Mode Behavior
- ✅ **Admins can still login** - Auth routes are excluded from maintenance check
- ✅ **Admins can access system** - Admin token bypasses maintenance
- ❌ **Regular users see maintenance screen** - Cannot access any features
- ❌ **API calls blocked** - Returns 503 with maintenance message

## Admin Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@cncms.go.ke` |
| Password | `admin123` |

## Reset Admin Password

```bash
# Generate new password hash (replace 'newpassword123')
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword123', 10).then(hash => console.log(hash));"

# Update admin password (replace HASH with generated hash)
mysql.exe -u root -proot cncms -e "UPDATE users SET password_hash = 'HASH' WHERE email = 'admin@cncms.go.ke';"
```

## Quick Database Commands

```bash
# View all system settings
mysql.exe -u root -proot cncms -e "SELECT * FROM system_settings;"

# View all promotions
mysql.exe -u root -proot cncms -e "SELECT * FROM promotions;"

# View all alerts
mysql.exe -u root -proot cncms -e "SELECT * FROM system_alerts;"

# View all users
mysql.exe -u root -proot cncms -e "SELECT id, full_name, email, role FROM users;"
```

## Restart All Services

```bash
# Stop all Node processes
taskkill /F /FI "WINDOWTITLE eq *node*"

# Start backend
cd backend
start "Backend Server" node server.js

# Start web_admin
cd web_admin
start "Web Admin" npm start

# Start web_app
cd web_app
start "Web App" npm start

# Start Flutter app
cd flutter_app
flutter run -d windows
```

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000/api |
| Web Admin | 3001 | http://localhost:3001 |
| Web App | 8080 | http://localhost:8080 |

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Login failed" | Maintenance mode enabled | Disable maintenance mode |
| "Invalid token" | Token expired or wrong secret | Re-login or check JWT_SECRET |
| "Network Error" | Backend not running | Start backend server |
| "Access denied" | Insufficient permissions | Login with admin account |
| "User not found" | Wrong email/password | Verify credentials |
