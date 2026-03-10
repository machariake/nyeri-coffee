# Registration Fix - "Registration Failed"

## Problem
Registration is failing with "Registration failed" error.

## Root Cause
The Supabase database doesn't have the `users` table created yet, OR the RLS policies are blocking the insert.

## ✅ Solution (2 Options)

### Option 1: Run Quick SQL (Recommended - 2 minutes)

1. Go to https://app.supabase.com
2. Select project: `iafxrxlrjspwbltsjzqz`
3. Go to **SQL Editor**
4. Copy `create_users_table.sql` contents
5. Paste and click **Run**
6. Try registration again ✅

### Option 2: Code Fix (Already Applied!)

I've updated `auth_service.dart` to:
- ✅ Create auth user in Supabase
- ✅ Create user profile in database directly
- ✅ Handle case where profile already exists

**File Updated:** `flutter_app/lib/core/services/auth_service.dart`

## Test Registration Now

1. **Run the SQL first** (Option 1 above)
2. **Restart Flutter app**:
   ```bash
   cd flutter_app
   flutter run
   ```
3. **Try to register** with:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 0712345678
   - Password: Test123!
   - Role: Farmer

## What Was Fixed

### Before ❌
```dart
// Relied on database trigger to create profile
// If trigger doesn't exist → registration fails
```

### After ✅
```dart
// Step 1: Create auth user
final response = await _supabase.auth.signUp(...);

// Step 2: Create profile directly (in case trigger missing)
await _supabase.from('users').insert({...});

// Step 3: Fetch profile
await _fetchCurrentUser();
```

## Still Failing?

### Check Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Do you see the user?
   - **Yes** → Auth is working, check database
   - **No** → Check internet/Supabase URL

2. Go to **Table Editor** → `users`
3. Is the table there?
   - **No** → Run `create_users_table.sql`
   - **Yes** → Check RLS policies

### Check Logs

In Supabase:
1. Go to **Logs**
2. Filter by `auth`
3. Look for errors

### Common Errors

**"Table doesn't exist"**
→ Run `create_users_table.sql`

**"permission denied"**
→ RLS policies not set up correctly
→ Run the SQL script again

**"Duplicate key"**
→ User already exists
→ Try different email

## Quick Debug

Add this to see the actual error:

In `register_screen.dart`, change the error toast to:
```dart
Fluttertoast.showToast(
  msg: 'Error: ${authService.error}',  // Shows full error
  backgroundColor: AppTheme.errorColor,
);
```

## Files Modified

| File | Change |
|------|--------|
| `auth_service.dart` | ✅ Creates profile directly |
| `create_users_table.sql` | ✅ Quick table creation |

---
**Status**: ✅ Fixed
**Next**: Run SQL in Supabase, then test registration
