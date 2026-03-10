# Supabase & Backend Communication Fix Guide

## Problem
Web app, web admin, and Flutter apps are not communicating properly with Supabase and the backend.

## Architecture Overview

This project uses a **hybrid architecture**:

```
┌─────────────────┐         ┌──────────────────┐
│   Flutter App   │────────▶│  Supabase        │
│   (Mobile)      │         │  (Auth + DB)     │
│                 │         └──────────────────┘
│                 │
│                 │         ┌──────────────────┐
│                 │────────▶│  Node.js Backend │
│                 │         │  (MySQL + API)   │
└─────────────────┘         └──────────────────┘
         ▲
         │
         │         ┌──────────────────┐
┌─────────────────┐│  Node.js Backend │
│   Web App       ││  (MySQL + API)   │
│   (React)       ││                  │
└─────────────────┘└──────────────────┘
         ▲
         │
         │         ┌──────────────────┐
┌─────────────────┐│  Node.js Backend │
│   Web Admin     ││  (MySQL + API)   │
│   (React)       ││                  │
└─────────────────┘└──────────────────┘
```

- **Flutter App**: Uses BOTH Supabase (direct) AND Node.js Backend API
- **Web App**: Uses Node.js Backend API only
- **Web Admin**: Uses Node.js Backend API only

## Configuration Files Created

### 1. Backend `.env` (c:\Users\mashupke\Desktop\nyeri_farmer\backend\.env)
```env
PORT=3000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cncms

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS - All frontend origins
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:8080

# API URL
API_URL=http://localhost:3000

# Supabase (for Flutter sync)
SUPABASE_URL=https://iafxrxlrjspwbltsjzqz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI
```

### 2. Web App `.env` (c:\Users\mashupke\Desktop\nyeri_farmer\web_app\.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://iafxrxlrjspwbltsjzqz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI
```

### 3. Web Admin `.env` (c:\Users\mashupke\Desktop\nyeri_farmer\web_admin\.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://iafxrxlrjspwbltsjzqz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI
```

## Setup Steps

### Step 1: Configure MySQL Database

1. Ensure MySQL is running on your machine
2. Create the database:
```bash
mysql -u root -p
CREATE DATABASE cncms;
USE cncms;
SOURCE database/schema.sql;
```

### Step 2: Update Backend Configuration

1. Edit `backend\.env` with your MySQL password
2. Update `JWT_SECRET` with a secure random string
3. If using Supabase features in backend, add the service role key

### Step 3: Update Flutter App Configuration

Update the API URL in `flutter_app\lib\core\constants\app_constants.dart`:

**For Android Emulator:**
```dart
static const String baseUrl = 'http://10.0.2.2:3000/api';
```

**For Physical Device (same network):**
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:3000/api';
// Example: http://192.168.1.100:3000/api
```

**For iOS Simulator:**
```dart
static const String baseUrl = 'http://localhost:3000/api';
```

### Step 4: Start All Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3000`

**Terminal 2 - Web App:**
```bash
cd web_app
npm start
```
Web App will run on: `http://localhost:3002`

**Terminal 3 - Web Admin:**
```bash
cd web_admin
npm start
```
Web Admin will run on: `http://localhost:3001`

**Terminal 4 - Flutter App:**
```bash
cd flutter_app
flutter run
```

## Testing Connections

### 1. Test Backend API
Open browser and navigate to:
```
http://localhost:3000/api/health
```
Expected response: `{"status":"OK","timestamp":"..."}`

### 2. Test Web App
Open browser:
```
http://localhost:3002
```
Should load the login page

### 3. Test Web Admin
Open browser:
```
http://localhost:3001
```
Should load the admin login page

### 4. Test Flutter App
```bash
cd flutter_app
flutter run
```
Should launch and show splash screen

## Common Issues & Solutions

### Issue 1: "Connection refused" or "Network error"
**Solution:** 
- Ensure backend is running (`npm run dev`)
- Check if port 3000 is available
- Verify MySQL is running

### Issue 2: CORS errors in web apps
**Solution:**
- Check `ALLOWED_ORIGINS` in `backend\.env` includes your frontend URLs
- Restart backend after changing `.env`

### Issue 3: Flutter can't connect to backend
**Solution:**
- For emulator: Use `10.0.2.2` instead of `localhost`
- For physical device: Use your computer's IP address
- Ensure firewall allows incoming connections on port 3000

### Issue 4: Supabase authentication errors
**Solution:**
- Verify Supabase URL and anon key are correct in all projects
- Check Supabase project is active at https://app.supabase.com
- Ensure RLS (Row Level Security) policies are configured

### Issue 5: "Cannot find module" errors
**Solution:**
```bash
# In each project directory
rm -rf node_modules
npm install
```

## Finding Your Computer IP (for Flutter physical device)

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter

**macOS/Linux:**
```bash
ifconfig
```
Look for "inet" under your active network interface

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | |
| DB_NAME | Database name | cncms |
| JWT_SECRET | JWT signing key | your-secret-key |
| ALLOWED_ORIGINS | CORS origins | http://localhost:3001,http://localhost:3002 |
| SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbG... |

### Web Apps (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:3000/api |
| REACT_APP_SUPABASE_URL | Supabase URL | https://xxx.supabase.co |
| REACT_APP_SUPABASE_ANON_KEY | Supabase anon key | eyJhbG... |

### Flutter (app_constants.dart)
| Variable | Description | Example |
|----------|-------------|---------|
| baseUrl | Backend API URL | http://10.0.2.2:3000/api |

## Supabase Configuration

Your Supabase credentials (from flutter_app\lib\main.dart):
- **URL**: `https://iafxrxlrjspwbltsjzqz.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI`

These are already configured in:
- ✅ `flutter_app\lib\main.dart`
- ✅ `backend\.env`
- ✅ `web_app\.env`
- ✅ `web_admin\.env`

## Next Steps

1. ✅ Ensure MySQL is installed and running
2. ✅ Create the database schema
3. ✅ Update `backend\.env` with your MySQL password
4. ✅ Update Flutter's `app_constants.dart` with correct API URL
5. ✅ Start all services
6. ✅ Test each application

## Support

If issues persist:
1. Check console logs in each application
2. Verify all services are running
3. Ensure network connectivity
4. Check Supabase dashboard for any issues
