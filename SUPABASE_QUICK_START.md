# 🚀 Supabase Quick Start Guide

## ⚡ 5-Minute Setup

### **Step 1: Create Supabase Project** (2 minutes)

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Fill in:
   - **Name**: AgriCertify
   - **Database Password**: `YourSecurePassword123!` (save this!)
   - **Region**: Choose closest (e.g., Africa - Cape Town)
   - **Plan**: Free (perfect for starting)
4. Click **"Create new project"**
5. Wait 2-3 minutes ⏳

---

### **Step 2: Get Your Credentials** (30 seconds)

1. In Supabase Dashboard → **Settings** (⚙️) → **API**
2. Copy these:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **Step 3: Run Database Migration** (2 minutes)

1. In Supabase Dashboard → **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open file: `supabase_migration.sql`
4. **Copy all SQL** and paste into editor
5. Click **"Run"** (or press Ctrl+Enter)
6. ✅ Success! All tables created!

---

### **Step 4: Enable Realtime** (30 seconds)

1. Go to **Database** → **Replication**
2. Find these tables and toggle **"Enable Realtime"**:
   - ✅ `notifications`
   - ✅ `applications`
3. Click **"Save"**

---

### **Step 5: Create Storage Buckets** (1 minute)

1. Go to **Storage** (left sidebar)
2. Click **"New Bucket"**
3. Create these 3 buckets:

   **Bucket 1:**
   - Name: `documents`
   - Public: ❌ **Private**
   - File size limit: `10485760` (10MB)

   **Bucket 2:**
   - Name: `certificates`
   - Public: ❌ **Private**

   **Bucket 3:**
   - Name: `profile-images`
   - Public: ✅ **Public**

---

### **Step 6: Update Flutter App** (1 minute)

Open `flutter_app/lib/main.dart`:

```dart
await Supabase.initialize(
  url: 'https://xxxxx.supabase.co', // ← Your URL
  anonKey: 'eyJhbGc...', // ← Your anon key
);
```

---

### **Step 7: Install Dependencies** (1 minute)

```bash
cd flutter_app
flutter pub get
```

---

### **Step 8: Test It!** (2 minutes)

1. **Run your Flutter app:**
   ```bash
   flutter run
   ```

2. **Register a test user:**
   - Email: `test@example.com`
   - Password: `Test123!`

3. **Check Supabase Dashboard:**
   - Go to **Authentication** → **Users**
   - You should see your user! ✅

4. **Check Database:**
   - Go to **Table Editor** → **users**
   - Your user profile should be there! ✅

---

## 🎯 You're Done!

Your app is now connected to Supabase! 🎉

---

## 📱 Test Real-time Notifications

1. **Get your user ID:**
   - Supabase Dashboard → **Authentication** → **Users**
   - Copy the UUID (e.g., `123e4567-e89b-12d3-a456-426614174000`)

2. **Send test notification:**
   - Go to **SQL Editor**
   - Run this:
   ```sql
   INSERT INTO notifications (user_id, title, message, type)
   VALUES (
     'YOUR_USER_UUID', -- Replace with your UUID
     'Test Notification',
     'Real-time notifications work! 🎉',
     'system'
   );
   ```

3. **Check your Flutter app:**
   - Notification should appear instantly! ⚡

---

## 🔧 Troubleshooting

### ❌ "Invalid API key"
- Make sure you copied the **anon/public** key (not service role key)
- Check for extra spaces in the key

### ❌ "Table does not exist"
- Re-run the `supabase_migration.sql` script
- Check **Table Editor** to see if tables exist

### ❌ "Real-time not working"
- Make sure you enabled Realtime for `notifications` table
- Check browser console for errors

### ❌ "Cannot upload files"
- Check storage bucket exists and is private
- Verify storage policies are set up

---

## 📚 What You Have Now

| Feature | Status | Where |
|---------|--------|-------|
| **Database** | ✅ Ready | Table Editor |
| **Authentication** | ✅ Ready | Authentication |
| **Real-time** | ✅ Ready | Database → Replication |
| **Storage** | ✅ Ready | Storage |
| **Row Security** | ✅ Enabled | All tables |

---

## 🎓 Next Steps

1. **Customize Email Templates:**
   - Authentication → Email Templates
   - Customize verification emails

2. **Set Up Edge Functions:**
   - Install Supabase CLI
   - Create functions for complex logic

3. **Monitor Usage:**
   - Settings → Usage
   - Track API calls, storage, bandwidth

4. **Backup Your Data:**
   - Settings → Database
   - Enable automated backups

---

## 🆘 Need Help?

- **Documentation**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com (very active!)
- **GitHub**: https://github.com/supabase/supabase

---

**Congratulations! Your AgriCertify app is powered by Supabase! 🚀**
