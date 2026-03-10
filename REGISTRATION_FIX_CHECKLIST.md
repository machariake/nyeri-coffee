# ✅ Registration Fix - Deployment Checklist

## Files Updated

The following files have been fixed for PostgreSQL/Supabase compatibility:

- ✅ `backend/routes/auth.js` - Updated to use PostgreSQL syntax (`$1`, `RETURNING`)
- ✅ `backend/middleware/auth.js` - Updated to use PostgreSQL syntax
- ✅ `web_app/.env.production.example` - Created template
- ✅ `web_admin/.env.production.example` - Created template

---

## 🚀 Steps to Fix Registration

### 1️⃣ Create `.env.production` Files

#### Web App:
**Create file: `web_app/.env.production`**

```env
REACT_APP_API_URL=https://cncms-backend.onrender.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_ENV=production
```

#### Web Admin:
**Create file: `web_admin/.env.production`**

```env
REACT_APP_API_URL=https://cncms-backend.onrender.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_ENV=production
```

**Get your Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

---

### 2️⃣ Update Render Backend Environment Variables

Go to [Render Dashboard](https://dashboard.render.com/) → `cncms-backend` → **Environment**

**Add/Update these variables:**

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=generate-a-strong-random-secret-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://cncms-web-app.onrender.com,https://cncms-web-admin.onrender.com
API_URL=https://cncms-backend.onrender.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Get DATABASE_URL from Supabase:**
1. Go to Supabase Dashboard
2. Settings → Database
3. Copy **Connection string** (URI mode)
4. Replace `[YOUR-PASSWORD]` with actual password

---

### 3️⃣ Commit and Push Changes

```bash
# Navigate to project root
cd c:\Users\mashupke\Desktop\nyeri_farmer

# Add all changes
git add .

# Commit
git commit -m "Fix PostgreSQL compatibility for auth routes

- Updated auth.js to use PostgreSQL syntax ($1, $2)
- Updated middleware/auth.js for PostgreSQL
- Added .env.production files for web apps
- Fixed registration and login endpoints

Resolves: Registration failed error on deployed web app"

# Push to GitHub
git push origin main
```

---

### 4️⃣ Redeploy on Render

#### Backend:
1. Go to Render Dashboard → `cncms-backend`
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for deployment (5-10 minutes)
4. Check logs for errors

#### Web App:
1. Go to Render Dashboard → `cncms-web-app`
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for build (3-5 minutes)

#### Web Admin:
1. Go to Render Dashboard → `cncms-web-admin`
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for build (3-5 minutes)

---

### 5️⃣ Test Backend Health Endpoint

```bash
curl https://cncms-backend.onrender.com/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2025-03-10T..."
}
```

If you get 404, check:
- Backend deployed successfully
- Route is `/api/health` not `/health`

---

### 6️⃣ Test Registration API Directly

```bash
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

**Expected response:**
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

---

### 7️⃣ Test Web App Registration

1. **Open web app:**
   ```
   https://cncms-web-app.onrender.com
   ```

2. **Click "Register"**

3. **Fill form:**
   - Full Name: Test User
   - Email: test123@example.com
   - Phone: 0712345678
   - Password: Test123!
   - Confirm Password: Test123!

4. **Click Register**

5. **Should redirect to home page** ✅

---

### 8️⃣ Verify User in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**
4. You should see the new user

---

## 🔍 Troubleshooting

### Backend Returns 404

**Check:**
1. Backend deployed successfully (Render Dashboard → Logs)
2. Environment variables set correctly
3. Database connection working

**View logs:**
```bash
# In Render Dashboard → cncms-backend → Logs
```

Look for:
- `Server running on port 3000`
- `PostgreSQL Database connected successfully`

### Database Connection Error

**Check DATABASE_URL format:**
```
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@[HOST]:5432/postgres
```

**Common issues:**
- Wrong password
- Missing SSL configuration
- Firewall blocking connection

**In `backend/config/database.js`, ensure SSL is enabled:**
```javascript
ssl: {
    rejectUnauthorized: false
}
```

### CORS Error

**Check browser console (F12 → Console tab)**

If you see:
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```

**Fix:**
1. Update `ALLOWED_ORIGINS` in Render backend environment
2. Include all your deployed URLs:
   ```
   ALLOWED_ORIGINS=https://cncms-web-app.onrender.com,https://cncms-web-admin.onrender.com
   ```

### Registration Still Fails

**Debug in browser:**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to register
4. Click on the failed request
5. Check:
   - Request URL (should be `/api/auth/register`)
   - Request payload (should have all fields)
   - Response (error message)

**Common errors:**
- `400 Bad Request` - Validation error (check error message)
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Database error (check backend logs)

---

## 📊 Success Indicators

✅ Backend health endpoint returns 200 OK
✅ Registration API returns token and user data
✅ Web app redirects to home after registration
✅ New user appears in Supabase Authentication → Users
✅ Can login with registered credentials

---

## 🎯 Quick Test Commands

```bash
# Test health
curl https://cncms-backend.onrender.com/api/health

# Test registration
curl -X POST https://cncms-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@example.com","phoneNumber":"0712345678","password":"Test123!"}'

# Test login
curl -X POST https://cncms-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## 📞 Support

If issues persist:

1. **Check Render Logs**: Dashboard → Backend → Logs
2. **Check Supabase Logs**: Dashboard → Database → Logs
3. **Browser Console**: F12 → Console tab
4. **Network Tab**: F12 → Network tab

---

**© 2025 County Government of Nyeri - Department of Agriculture**
