# 🔴 LOGIN/REGISTRATION NOT WORKING - COMPLETE FIX

## Your Problem
Can't register or login in the Flutter app.

## Root Cause
Your Supabase database is **not set up correctly** OR missing tables/policies.

---

## ✅ COMPLETE FIX (Follow These Steps)

### STEP 1: Run Complete Setup in Supabase (5 minutes)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Project: `iafxrxlrjspwbltsjzqz`

2. **Go to SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New Query"

3. **Copy and Run Complete Setup**
   - Open file: `COMPLETE_SUPABASE_SETUP.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **RUN** ▶️

4. **Wait for Success**
   - Should see: `✅ Setup Complete!`
   - This creates:
     - ✅ 5 tables (users, applications, documents, certificates, notifications)
     - ✅ RLS policies
     - ✅ Database triggers
     - ✅ Storage bucket
     - ✅ Indexes

---

### STEP 2: Verify Setup (1 minute)

Run this diagnostic query in SQL Editor:

```sql
-- Copy from: diagnose_supabase.sql
```

You should see:
- ✅ USERS TABLE: EXISTS
- ✅ APPLICATIONS TABLE: EXISTS
- ✅ USERS RLS: ENABLED
- ✅ RLS POLICIES COUNT: 20+
- ✅ STORAGE BUCKET: EXISTS

If anything shows "MISSING" or "DISABLED", run STEP 1 again.

---

### STEP 3: Test Registration (2 minutes)

1. **Restart Flutter App**
   ```bash
   cd flutter_app
   flutter run
   ```

2. **Try to Register**
   - Tap "Register"
   - Fill in:
     - Full Name: `Test User`
     - Email: `test@example.com`
     - Phone: `0712345678`
     - Password: `Test123!`
     - Role: `Farmer`
   - Tap "Register"

3. **Expected Result**
   - ✅ "Registration successful!"
   - ✅ Redirects to Farmer Dashboard

4. **If It Fails**
   - Check the error message
   - See "Common Errors" below

---

### STEP 4: Test Login

1. **Logout** (if logged in)
2. **Try to Login**
   - Email: `test@example.com`
   - Password: `Test123!`
   - Tap "Login"

3. **Expected Result**
   - ✅ "Login successful!"
   - ✅ Redirects to Dashboard

---

## 🔧 Common Errors & Fixes

### Error: "Failed to load user profile"

**Cause:** Users table doesn't exist or RLS blocking

**Fix:**
```sql
-- Run in SQL Editor
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'farmer'
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

### Error: "User already exists"

**Cause:** Email already registered

**Fix:** Use a different email address

---

### Error: "Invalid API key" or "Invalid Supabase URL"

**Cause:** Wrong credentials in main.dart

**Fix:** Check these lines in `flutter_app/lib/main.dart`:
```dart
await Supabase.initialize(
  url: 'https://iafxrxlrjspwbltsjzqz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
);
```

---

### Error: "permission denied for table users"

**Cause:** RLS policies not set up

**Fix:** Run `COMPLETE_SUPABASE_SETUP.sql` again

---

### Error: "Network error"

**Cause:** No internet or wrong Supabase URL

**Fix:**
1. Check internet connection
2. Verify Supabase URL is correct
3. Check Supabase project is active

---

## 📊 Check What's in Your Database

Run this to see current state:

```sql
-- Check users
SELECT COUNT(*) as total_users FROM users;

-- Check auth users
SELECT COUNT(*) as auth_users FROM auth.users;

-- Check applications
SELECT COUNT(*) as total_applications FROM applications;

-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 🎯 What Was Fixed in Your Code

### 1. AuthService Updated ✅
File: `flutter_app/lib/core/services/auth_service.dart`

**Before:**
```dart
// Relied on trigger to create profile
await _supabase.auth.signUp(...);
// If trigger missing → fails
```

**After:**
```dart
// Creates auth user
await _supabase.auth.signUp(...);

// Creates profile directly (fallback if trigger missing)
await _supabase.from('users').insert({...});
```

### 2. SQL Scripts Fixed ✅
- Removed MySQL syntax (`USE database`)
- Added PostgreSQL compatible syntax
- Created complete setup script

---

## 📝 Files Created for You

| File | Purpose |
|------|---------|
| `COMPLETE_SUPABASE_SETUP.sql` | **RUN THIS FIRST** - Complete setup |
| `diagnose_supabase.sql` | Check what's configured |
| `create_users_table.sql` | Quick users table creation |
| `check_supabase_setup.sql` | Diagnostic query |
| `REGISTRATION_FIX.md` | Troubleshooting guide |
| `SUPABASE_SQL_FIXED.md` | SQL syntax fixes |

---

## ✅ Checklist

Before testing, make sure:

- [ ] Ran `COMPLETE_SUPABASE_SETUP.sql` in Supabase
- [ ] Verified tables exist (diagnose_supabase.sql)
- [ ] RLS is enabled
- [ ] Storage bucket exists
- [ ] Flutter app restarted
- [ ] Internet connection working

---

## 🚀 Quick Start (TL;DR)

```
1. https://app.supabase.com
2. SQL Editor → New Query
3. Copy COMPLETE_SUPABASE_SETUP.sql
4. Paste → Run
5. cd flutter_app && flutter run
6. Register/Login ✅
```

---

## 📞 Still Not Working?

1. **Check Supabase Logs**
   - Dashboard → Logs
   - Look for errors

2. **Check Flutter Logs**
   ```bash
   flutter run --verbose
   ```

3. **Check Auth Users**
   - Dashboard → Authentication → Users
   - Do you see the user?

4. **Check Database**
   - Dashboard → Table Editor → users
   - Is the user profile there?

---

**Status**: ✅ Ready to fix
**Date**: 2026-03-08
**Supabase**: https://iafxrxlrjspwbltsjzqz.supabase.co

**© 2025 County Government of Nyeri**
