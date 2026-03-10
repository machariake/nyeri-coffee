# 🔴 "Server Error During Registration" - COMPLETE FIX

## Updated Error Messages ✅

I've updated the Flutter app to show **detailed error messages**.

Now when registration fails, you'll see the **exact error** instead of just "Server error".

---

## 🔍 STEP 1: Check Your Supabase Setup

### Run This Diagnostic (30 seconds)

```
1. https://app.supabase.com
2. SQL Editor → New Query
3. Copy: DEBUG_EVERYTHING.sql
4. Paste → Run
```

**Look for any ❌ in results**

---

## ✅ STEP 2: Fix Any Issues Found

### If You See ❌ "USERS TABLE MISSING"

**Run this immediately:**

```
1. SQL Editor → New Query  
2. Copy: MINIMAL_USERS_SETUP.sql
3. Paste → RUN
```

This creates the users table + policies.

---

## 🐛 Common Errors & Fixes

### Error: "User already registered" or "Duplicate email"

**Meaning:** Email already exists

**Fix:** Use a different email address

---

### Error: "Failed to load user profile" or "relation users does not exist"

**Meaning:** Users table is missing

**Fix:** Run `MINIMAL_USERS_SETUP.sql` in SQL Editor

---

### Error: "permission denied for table users"

**Meaning:** RLS policies missing

**Fix:** Run `MINIMAL_USERS_SETUP.sql` again

---

### Error: "Invalid API key" or "Invalid Supabase URL"

**Meaning:** Wrong credentials in main.dart

**Check:** `flutter_app/lib/main.dart` line 25-27

```dart
await Supabase.initialize(
  url: 'https://iafxrxlrjspwbltsjzqz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
);
```

---

### Error: "Network error" or "Connection refused"

**Meaning:** No internet or Supabase down

**Fix:**
1. Check internet connection
2. Verify Supabase project is active
3. Check Supabase status: https://status.supabase.com

---

## 📊 Check Flutter Logs

When registration fails, check the console for detailed errors:

```bash
cd flutter_app
flutter run
```

Look for lines starting with:
- `❌ AuthException:` - Shows exact Supabase error
- `❌ Exception:` - Shows network/other errors
- `📝 Starting registration:` - Shows registration started
- `✅ Auth user created:` - Shows auth worked

---

## 🎯 Quick Fix Checklist

### Before Testing:

- [ ] Ran `MINIMAL_USERS_SETUP.sql` in Supabase
- [ ] Verified users table exists (DEBUG_EVERYTHING.sql)
- [ ] Checked RLS is enabled
- [ ] Flutter app restarted

### Test Registration:

```bash
cd flutter_app
flutter run
```

Try:
- Email: `test123@example.com` (use unique email)
- Password: `Test123!`
- Name: `Test User`

**Watch the console for detailed error messages!**

---

## 📝 Example Error Output

### ✅ Good Registration:
```
📝 Starting registration for: test@example.com
✅ Auth user created: abc123-def456...
📝 Creating user profile in database...
✅ Profile created!
```

### ❌ Bad Registration (Missing Table):
```
📝 Starting registration for: test@example.com
✅ Auth user created: abc123-def456...
📝 Creating user profile in database...
❌ Exception: table "users" does not exist
Error: table "users" does not exist
```

**Fix:** Run `MINIMAL_USERS_SETUP.sql`

---

## 🔧 Still Not Working?

### Option 1: Check Supabase Dashboard

1. Go to https://app.supabase.com
2. Authentication → Users
3. Do you see the user?
   - **Yes** → Auth works, check database
   - **No** → Auth issue (check credentials)

### Option 2: Check Database

1. Go to Table Editor → users
2. Do you see the profile?
   - **Yes** → Everything works
   - **No** → Run MINIMAL_USERS_SETUP.sql

### Option 3: Check Logs

1. Go to Logs
2. Filter by "auth"
3. Look for errors during registration

---

## 📁 Files You Need

| File | Purpose |
|------|---------|
| `DEBUG_EVERYTHING.sql` | Check everything |
| `MINIMAL_USERS_SETUP.sql` | Fix users table |
| `QUICK_FIX_REGISTRATION.sql` | Quick fix |

---

## ✅ What to Do NOW

1. **Run diagnostic:**
   ```
   SQL Editor → DEBUG_EVERYTHING.sql → Run
   ```

2. **If any ❌, run fix:**
   ```
   SQL Editor → MINIMAL_USERS_SETUP.sql → Run
   ```

3. **Restart Flutter:**
   ```bash
   cd flutter_app
   flutter run
   ```

4. **Try registration again**
   - Watch console for detailed error
   - Share the exact error message

---

**Status**: Error messages improved ✅
**Next**: Run diagnostic, check logs
