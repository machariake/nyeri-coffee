# 🔐 Flutter Login Fix - Complete Guide

## ✅ What Was Fixed

Your Flutter app was using HTTP-based authentication instead of Supabase. I've updated it to use **Supabase Auth**.

---

## 🔄 Changes Made

### **1. Updated AuthService** (`lib/core/services/auth_service.dart`)
- ✅ Removed HTTP client
- ✅ Added Supabase client
- ✅ Updated `login()` to use Supabase Auth
- ✅ Updated `register()` to use Supabase Auth
- ✅ Updated `logout()` to use Supabase sign out
- ✅ Auto-fetch user profile from database

### **2. How It Works Now**

```
Login Screen
    ↓
Supabase Auth (signInWithPassword)
    ↓
Get User ID
    ↓
Fetch Profile from users table
    ↓
Save to SharedPreferences
    ↓
Navigate to Dashboard ✅
```

---

## 🧪 Testing Steps

### **Step 1: Create Test User in Supabase**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/iafxrxlrjspwbltsjzqz/auth/users
   ```

2. **Click "Add User"** → **"Create new user"**
   ```
   Email: test@example.com
   Password: Test123!
   Role: farmer (in metadata)
   ```

3. **Or use SQL:**
   ```sql
   -- Create user in auth.users via Supabase dashboard
   -- Then create profile:
   INSERT INTO users (id, email, full_name, phone_number, role)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'test@example.com'),
     'test@example.com',
     'Test User',
     '0712345678',
     'farmer'
   );
   ```

---

### **Step 2: Run Flutter App**

```bash
cd c:\Users\mashupke\Desktop\nyeri_farmer\flutter_app
flutter pub get
flutter run
```

---

### **Step 3: Test Login**

1. **Open app**
2. **Go to login screen**
3. **Enter credentials:**
   - Email: `test@example.com`
   - Password: `Test123!`
4. **Click Login**
5. **Should navigate to dashboard** ✅

---

## 🆘 Troubleshooting

### ❌ **"Invalid login credentials"**
**Cause:** User doesn't exist in Supabase

**Solution:**
```
1. Go to Supabase Dashboard
2. Authentication → Users
3. Check if user exists
4. If not, create user or register through app
```

---

### ❌ **"Failed to load user profile"**
**Cause:** User exists in auth but not in users table

**Solution:**
```sql
-- Check if user exists in users table
SELECT * FROM users WHERE email = 'your@email.com';

-- If not, create profile:
INSERT INTO users (id, email, full_name, phone_number, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone_number',
  COALESCE(raw_user_meta_data->>'role', 'farmer')
FROM auth.users
WHERE email = 'your@email.com';
```

---

### ❌ **"Invalid API key"**
**Cause:** Wrong Supabase credentials

**Solution:**
```
1. Check main.dart has correct URL and key
2. Verify you're using anon key (not service_role)
3. Restart app
```

---

### ❌ **"No user profile found"**
**Cause:** Trigger not working

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Re-create if needed (run supabase_migration.sql again)
```

---

### ❌ **App stuck on loading**
**Cause:** Network issue or Supabase down

**Solution:**
```
1. Check internet connection
2. Check Supabase status: https://status.supabase.com
3. Check console logs: flutter run --verbose
```

---

## 📊 Debug Commands

### **Check User in Supabase:**
```sql
-- Check auth user
SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';

-- Check profile
SELECT id, email, full_name, role FROM users WHERE email = 'test@example.com';
```

### **Check Flutter Logs:**
```bash
flutter run --verbose
```

Look for:
- ✅ "Login successful"
- ✅ "User profile loaded"
- ❌ Error messages

---

## ✅ Success Indicators

### **Login Works When:**
1. ✅ Enter email/password
2. ✅ Click login
3. ✅ Loading spinner appears
4. ✅ Navigates to dashboard
5. ✅ User name shows in profile
6. ✅ Can logout and login again

### **Check Supabase Dashboard:**
1. ✅ **Authentication** → **Users** - User exists
2. ✅ **Table Editor** → **users** - Profile exists
3. ✅ **Logs** - Login events logged

---

## 🔐 How Authentication Works Now

### **Login Flow:**
```
1. User enters email/password
2. App calls: _supabase.auth.signInWithPassword()
3. Supabase validates credentials
4. Returns: user + session
5. App fetches profile from users table
6. Saves to SharedPreferences
7. Navigates to dashboard
```

### **Register Flow:**
```
1. User fills registration form
2. App calls: _supabase.auth.signUp()
3. Supabase creates auth user
4. Trigger auto-creates profile
5. App fetches profile
6. Saves session
7. Navigates to dashboard
```

### **Logout Flow:**
```
1. User clicks logout
2. App calls: _supabase.auth.signOut()
3. Clears local storage
4. Navigates to login
```

---

## 📝 Quick Reference

| Issue | Solution |
|-------|----------|
| Can't login | Check user exists in Supabase |
| Profile missing | Run SQL to create profile |
| Invalid credentials | Verify email/password |
| Network error | Check internet connection |
| App crashes | Check console logs |

---

## 🎯 Test Checklist

- [ ] User exists in Supabase Auth
- [ ] User profile exists in users table
- [ ] Credentials are correct
- [ ] Internet connection works
- [ ] Supabase credentials correct in main.dart
- [ ] Ran `flutter pub get`
- [ ] App builds without errors
- [ ] Login succeeds
- [ ] Dashboard loads
- [ ] Logout works
- [ ] Can login again

---

## 🆘 Still Having Issues?

### **Collect This Info:**
1. **Error message** - Exact text from app
2. **Console logs** - From `flutter run --verbose`
3. **Supabase logs** - Dashboard → Logs
4. **User exists?** - Screenshot from Supabase

### **Quick Fix:**
```bash
# 1. Clean and rebuild
flutter clean
flutter pub get
flutter run

# 2. Check Supabase connection
# In Supabase SQL Editor:
SELECT current_timestamp;
# Should return current time
```

---

## 🎉 Expected Behavior

**After fixing, you should:**
1. ✅ Login with email/password
2. ✅ See dashboard immediately
3. ✅ User profile shows correctly
4. ✅ Can navigate app
5. ✅ Can logout
6. ✅ Can login again

---

**Your Flutter app now uses Supabase Authentication! 🚀**

---

**© 2025 County Government of Nyeri**  
**AgriCertify - Supabase Authentication**
