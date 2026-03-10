# 🚀 FIX LOGIN/REGISTRATION - 3 SIMPLE STEPS

## ❌ Problem
Can't register or login in Flutter app

## ✅ Solution (3 Steps)

---

## STEP 1️⃣: Run SQL in Supabase (2 minutes)

```
1. Open: https://app.supabase.com
2. Select project: iafxrxlrjspwbltsjzqz
3. Click: SQL Editor (left sidebar)
4. Click: New Query
5. Open file: COMPLETE_SUPABASE_SETUP.sql
6. Copy ALL text
7. Paste in SQL Editor
8. Click: RUN ▶️
```

**Wait for:** `✅ Setup Complete!`

---

## STEP 2️⃣: Verify Setup (30 seconds)

Run this in SQL Editor:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'applications', 'documents');
```

**Should see:** `users`, `applications`, `documents`

---

## STEP 3️⃣: Test Flutter App (1 minute)

```bash
cd flutter_app
flutter run
```

**Try to register:**
- Email: `test@example.com`
- Password: `Test123!`
- Name: `Test User`

**Expected:** ✅ Registration successful!

---

## 🎯 That's It!

**What this does:**
- ✅ Creates all database tables
- ✅ Sets up security (RLS)
- ✅ Creates storage for documents
- ✅ Sets up automatic user creation

---

## 📖 Need More Help?

See: `LOGIN_REGISTRATION_FIX.md` for detailed troubleshooting

---

**Files You Need:**
- `COMPLETE_SUPABASE_SETUP.sql` ← **RUN THIS**
- `diagnose_supabase.sql` ← Check setup
- `LOGIN_REGISTRATION_FIX.md` ← Full guide

**Status:** Ready to fix ✅
