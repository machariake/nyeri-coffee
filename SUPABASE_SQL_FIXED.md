# ✅ Supabase SQL Scripts - Fixed!

## Problem
Got error: `syntax error at or near "USE"`

**Reason:** Supabase uses **PostgreSQL**, not MySQL. The `USE database;` command doesn't exist in PostgreSQL.

## Fixed Scripts

### ✅ `check_supabase_setup.sql`
Run this to check your Supabase setup:
- Users count
- Applications status
- RLS enabled/disabled
- Auth users
- Summary stats

### ✅ `check_database.sql`
Updated to work with Supabase (removed MySQL syntax)

### ✅ `create_users_table.sql`
Creates the users table with RLS policies

### ✅ `supabase_schema.sql`
Complete database schema for Supabase

## How to Run SQL in Supabase

1. Go to https://app.supabase.com
2. Select project: `iafxrxlrjspwbltsjzqz`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy SQL from any `.sql` file
6. Paste and click **Run** ▶️

## Quick Diagnostic

Run this to check your setup:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'applications', 'documents');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check user count
SELECT COUNT(*) FROM users;
```

## MySQL vs Supabase (PostgreSQL)

| MySQL | Supabase (PostgreSQL) |
|-------|----------------------|
| `USE database;` | Not needed (uses current schema) |
| `SELECT 'title' as '';` | `SELECT 'title' as info;` |
| `JOIN users` | `LEFT JOIN users` (safer) |
| Backticks \`table\` | Double quotes "table" |

## Test Registration Now

**Step 1:** Run `create_users_table.sql` in Supabase

**Step 2:** Restart Flutter app
```bash
cd flutter_app
flutter run
```

**Step 3:** Try registration ✅

---
**Status**: ✅ SQL scripts fixed for Supabase
**Date**: 2026-03-08
