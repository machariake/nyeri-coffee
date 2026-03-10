# Supabase Schema - Error Fix

## Problem
You got this error:
```
ERROR: 42710: policy "Users can view their own profile" for table "users" already exists
```

This means **you already ran the schema before** - the policies already exist!

## ✅ Solution

I've updated `supabase_schema.sql` to **drop existing policies first**.

### Run the Updated Schema:

1. Go to https://app.supabase.com
2. Select project: `iafxrxlrjspwbltsjzqz`
3. Go to **SQL Editor**
4. Copy the **updated** `supabase_schema.sql` file
5. Paste and click **Run** ✅

The updated schema now:
- ✅ Drops existing triggers (if they exist)
- ✅ Drops existing policies (if they exist)  
- ✅ Creates tables (if they don't exist)
- ✅ Recreates everything fresh
- ✅ **Won't error if run multiple times**

## Verify Setup

After running the schema, run this test query:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'applications', 'documents', 'certificates', 'notifications');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check storage bucket
SELECT * FROM storage.buckets;
```

You should see:
- ✅ All 5 tables listed
- ✅ `rowsecurity` = `true` for all tables
- ✅ `documents` bucket exists

## Quick Test

Create a test user in Supabase Auth dashboard:
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Create user with email/password
4. Check **Table Editor** → `users` table
5. New user should appear automatically (via trigger)

## Still Having Issues?

**Option 1: Manual Cleanup**
```sql
-- Drop all policies manually
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-- ... etc for all policies

-- Then run schema again
```

**Option 2: Start Fresh**
1. Go to Supabase Dashboard
2. Settings → Database
3. **Reset Database** (⚠️ DELETES ALL DATA)
4. Run `supabase_schema.sql` again

---
**Status**: ✅ Schema updated to handle re-runs
**Date**: 2026-03-08
