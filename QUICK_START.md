# Quick Start Guide - CNCMS

## Fixed Configuration ✅

All configuration files have been created. Your apps are now configured to communicate properly:

- **Backend**: `backend\.env` ✅
- **Web App**: `web_app\.env` ✅
- **Web Admin**: `web_admin\.env` ✅
- **Flutter**: Updated `flutter_app\lib\core\constants\app_constants.dart` ✅

## Quick Start (3 Steps)

### Step 1: Update MySQL Password

Edit `backend\.env` and set your MySQL password:
```env
DB_PASSWORD=your_mysql_password
```

### Step 2: Start All Services

**Option A - Use the startup script:**
```bash
start_all_services.bat
```

**Option B - Manual start:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Web Admin):
```bash
cd web_admin
npm start
```

Terminal 3 (Web App):
```bash
cd web_app
npm start
```

Terminal 4 (Flutter):
```bash
cd flutter_app
flutter run
```

### Step 3: Test Connections

Open your browser:
- **Backend Health**: http://localhost:3000/api/health
- **Web App**: http://localhost:3002
- **Web Admin**: http://localhost:3001

## URLs Summary

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:3000/api | 3000 |
| Web Admin | http://localhost:3001 | 3001 |
| Web App | http://localhost:3002 | 3002 |

## Supabase Configuration

Your Supabase project is already configured in all apps:
- **URL**: https://iafxrxlrjspwbltsjzqz.supabase.co
- **Status**: ✅ Configured in all projects

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm run dev
```

### Web apps show errors
```bash
# For web_app
cd web_app
npm install
npm start

# For web_admin
cd web_admin
npm install
npm start
```

### Flutter can't connect
Update `flutter_app\lib\core\constants\app_constants.dart`:
- **Emulator**: `http://10.0.2.2:3000/api`
- **Physical Device**: `http://YOUR_IP:3000/api`

Find your IP with: `ipconfig`

### MySQL connection error
1. Start MySQL service
2. Create database:
```bash
mysql -u root -p
CREATE DATABASE cncms;
exit;
```

### CORS errors
Ensure `backend\.env` has:
```env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:8080
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] http://localhost:3000/api/health returns `{"status":"OK"}`
- [ ] Web App loads at http://localhost:3002
- [ ] Web Admin loads at http://localhost:3001
- [ ] Flutter app launches and shows login screen

## Need More Help?

See the detailed guide: [SUPABASE_CONNECTION_FIX.md](SUPABASE_CONNECTION_FIX.md)

## Architecture

```
Flutter App ──┬──> Supabase (Auth + DB)
              └──> Backend API (MySQL)

Web Apps ──────────> Backend API (MySQL)
```

- Flutter uses BOTH Supabase and Backend
- Web apps use Backend only

---
**© 2025 County Government of Nyeri**
