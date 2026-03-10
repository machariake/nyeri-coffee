# 🔧 Web App Registration Fix - "Registration Failed"

## Problem Analysis

When trying to register on the web app deployed to Render, you're getting "Registration failed" because:

1. **Backend returns 404** - The health endpoint at `https://cncms-backend.onrender.com/health` returns 404
2. **Wrong API path** - Health endpoint is at `/api/health`, not `/health`
3. **Missing `.env` file** - Web app doesn't have environment variables configured
4. **Database schema mismatch** - Backend expects MySQL syntax but you're using Supabase PostgreSQL

---

## ✅ Solution - Step by Step

### Step 1: Fix Backend Health Endpoint URL

**Update web app to use correct API URL:**

The backend health endpoint is at: `https://cncms-backend.onrender.com/api/health`

**Test it:**
```bash
curl https://cncms-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-03-10T..."
}
```

---

### Step 2: Create Web App `.env.production`

**Create file: `web_app/.env.production`**

```env
REACT_APP_API_URL=https://cncms-backend.onrender.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace:**
- `your-project.supabase.co` with your actual Supabase project URL
- `your-anon-key-here` with your Supabase anon key

**Find your Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **URL** and **anon public** key

---

### Step 3: Create Web Admin `.env.production`

**Create file: `web_admin/.env.production`**

```env
REACT_APP_API_URL=https://cncms-backend.onrender.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 4: Update Web App `authStore.js` to Use Environment Variable

**File: `web_app/src/store/authStore.js`**

The file already has the correct setup:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

This will automatically use `REACT_APP_API_URL` from `.env.production` when deployed.

---

### Step 5: Fix Backend Database Issues

Your backend is using PostgreSQL (Supabase) but the auth routes use MySQL syntax (`?` placeholders, `INSERT ... VALUES (?, ?, ?)`).

The `database.js` has a wrapper that converts `?` to `$1`, `$2`, etc., but there's a problem with how it returns results.

**Update `backend/routes/auth.js` - Register route:**

```javascript
// Replace lines 32-45 in auth/routes/auth.js

// Check if email exists
const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
);
if (existingUsers.length > 0) {
    return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
    });
}

// Hash password
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);

// Insert user - PostgreSQL returns returning: ['id']
const result = await pool.query(
    `INSERT INTO users (full_name, email, phone_number, password_hash, role, ward, sub_county, id_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [fullName, email, phoneNumber, passwordHash, role || 'farmer', ward, subCounty, idNumber]
);

const userId = result.rows[0].id;

// Generate token (assuming generateToken can handle UUID)
const token = generateToken(userId);

res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
        token,
        user: {
            id: userId,
            fullName,
            email,
            role: role || 'farmer',
            ward,
            subCounty
        }
    }
});
```

**Key changes:**
1. Use `$1, $2, $3` instead of `?`
2. Use `RETURNING id` instead of `result.insertId`
3. Access result with `result.rows[0].id`

---

### Step 6: Fix Login Route (PostgreSQL Compatibility)

**Update `backend/routes/auth.js` - Login route:**

```javascript
// Replace the login query section (around line 75-95)

// Build query based on whether email or phoneNumber is provided
let query;
let params;

if (email) {
    query = `SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active 
             FROM users WHERE email = $1`;
    params = [email];
} else {
    query = `SELECT id, full_name, email, phone_number, password_hash, role, ward, sub_county, is_active 
             FROM users WHERE phone_number = $1`;
    params = [phoneNumber];
}

// Get user
const [users] = await pool.query(query, params);

if (users.length === 0) {
    return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
    });
}

const user = users[0];
```

---

### Step 7: Rebuild and Redeploy Web App

After creating `.env.production`:

1. **Commit changes to Git:**
```bash
git add web_app/.env.production web_admin/.env.production
git commit -m "Add production environment variables"
git push origin main
```

2. **Trigger Render rebuild:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click on `cncms-web-app`
   - Click **Manual Deploy** → **Deploy latest commit**
   - Do the same for `cncms-web-admin`

---

### Step 8: Fix Backend on Render (If Needed)

If backend still has issues:

1. **Check Render Logs:**
   - Go to Render Dashboard
   - Click `cncms-backend`
   - Click **Logs** tab
   - Look for errors

2. **Verify Environment Variables on Render:**
   
   Make sure these are set in Render backend service:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:password@host:5432/cncms
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   ALLOWED_ORIGINS=https://cncms-web-app.onrender.com,https://cncms-web-admin.onrender.com
   ```

3. **Redeploy backend:**
   - Click **Manual Deploy** → **Deploy latest commit**

---

### Step 9: Test Registration

1. **Open your deployed web app:**
   ```
   https://cncms-web-app.onrender.com
   ```

2. **Click "Register"**

3. **Fill in the form:**
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 0712345678
   - Password: Test123!
   - Confirm Password: Test123!

4. **Click Register**

5. **Check if successful:**
   - Should redirect to home page
   - Check Supabase Dashboard → Authentication → Users
   - New user should appear

---

## 🔍 Debug Checklist

If still failing, check:

### 1. Browser Console Errors
- Open browser DevTools (F12)
- Go to **Console** tab
- Look for red errors
- Check **Network** tab for failed API calls

### 2. Backend Logs
```bash
# In Render Dashboard → Backend → Logs
```

Look for:
- Database connection errors
- SQL syntax errors
- CORS errors

### 3. Test API Directly
```bash
# Test registration endpoint
curl -X POST https://cncms-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test123@example.com",
    "phoneNumber": "0712345678",
    "password": "Test123!",
    "role": "farmer"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "fullName": "Test User",
      "email": "test123@example.com",
      "role": "farmer"
    }
  }
}
```

### 4. Check CORS
If you see CORS errors in browser console:

**Update backend `server.js`:**
```javascript
app.use(cors({
    origin: function (origin, callback) {
        const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowed.indexOf(origin) !== -1 || origin.includes('onrender.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📋 Quick Fix Summary

1. ✅ Create `web_app/.env.production` with correct API URL
2. ✅ Create `web_admin/.env.production` with correct API URL
3. ✅ Update backend auth routes to use PostgreSQL syntax (`$1` instead of `?`)
4. ✅ Use `RETURNING id` instead of `insertId`
5. ✅ Commit and push changes
6. ✅ Redeploy on Render
7. ✅ Test registration

---

## 🎯 Expected Flow After Fix

```
User fills form
    ↓
Web App → POST /api/auth/register
    ↓
Backend → INSERT INTO users (PostgreSQL)
    ↓
Supabase → Create auth user + users table record
    ↓
Backend → Return token + user data
    ↓
Web App → Store token, redirect to home
    ↓
✅ Registration successful!
```

---

**© 2025 County Government of Nyeri - Department of Agriculture**
