# Troubleshooting Guide - Web Admin Connection Issues

## 🔍 Quick Diagnostic Steps

### 1. **Check if Backend is Running**
Open terminal and run:
```bash
cd c:\Users\mashupke\Desktop\nyeri_farmer\backend
npm start
```

Look for:
```
✅ Server running on port 3000
✅ Database connected successfully
```

### 2. **Check if Web App is Running**
Open another terminal and run:
```bash
cd c:\Users\mashupke\Desktop\nyeri_farmer\web_app
npm start
```

Look for:
```
Compiled successfully!
You can now view web_app in the browser.
  Local:            http://localhost:3001
```

### 3. **Use the Debug Page**
Navigate to: **http://localhost:3001/admin/debug**

This page will show:
- ✅ Authentication status
- ✅ User role (must be 'admin')
- ✅ API connection status
- ✅ Direct links to admin pages

### 4. **Check Your User Role**
Open browser console (F12) and type:
```javascript
console.log(JSON.parse(localStorage.getItem('cncms-auth')).user);
```

You should see:
```json
{
  "role": "admin",
  "email": "admin@cncms.go.ke",
  "fullName": "System Administrator"
}
```

If role is NOT 'admin', you won't see admin menu items!

---

## ❌ Common Issues & Solutions

### Issue 1: "Cannot GET /api/system/settings"
**Cause:** Backend not running or wrong port

**Solution:**
1. Check backend is running on port 3000
2. Check `.env` file exists in `web_app/.env` with:
   ```
   REACT_APP_API_URL=http://localhost:3000/api
   ```
3. Restart web app after creating .env file

### Issue 2: No Admin Menu Items
**Cause:** User is not admin role

**Solution:**
1. Login with admin account:
   - Email: `admin@cncms.go.ke`
   - Password: (check your database or setup script)
2. Or update your user role in database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

### Issue 3: CORS Error
**Cause:** Backend CORS not configured

**Solution:**
Check `backend/server.js` has:
```javascript
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

### Issue 4: Token Expired
**Cause:** Old/invalid authentication token

**Solution:**
1. Logout
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login again

### Issue 5: "Network Error"
**Cause:** Backend not reachable

**Solution:**
1. Check backend is running
2. Check firewall isn't blocking port 3000
3. Try accessing: http://localhost:3000/api/system/settings directly

---

## 🧪 Testing Steps

### Step 1: Test Backend Directly
Open browser and go to:
```
http://localhost:3000/api/system/settings
```

Should return JSON with settings.

### Step 2: Test with Curl
```bash
curl http://localhost:3000/api/system/settings
```

### Step 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)
5. Click on failed request to see error

### Step 4: Check Console Logs
1. Open browser Console (F12)
2. Look for red error messages
3. Common errors:
   - `ERR_CONNECTION_REFUSED` → Backend not running
   - `401 Unauthorized` → Token invalid
   - `404 Not Found` → Wrong API URL
   - `CORS` error → Backend CORS config

---

## 🔧 Quick Fixes

### Restart Everything
```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Start backend
cd c:\Users\mashupke\Desktop\nyeri_farmer\backend
npm start

# In new terminal, start web app
cd c:\Users\mashupke\Desktop\nyeri_farmer\web_app
npm start
```

### Clear Cache & Re-login
1. Logout from app
2. Press Ctrl+Shift+Delete
3. Clear "Cached images and files"
4. Clear "Cookies and other site data"
5. Close and reopen browser
6. Login again

### Database Check
```sql
-- Check if settings exist
USE cncms;
SELECT * FROM system_settings WHERE setting_key LIKE 'support_%';

-- If empty, run migration
SOURCE c:/Users/mashupke/Desktop/nyeri_farmer/add_support_settings.sql;
```

---

## 📊 Admin URLs

Access these directly if sidebar not showing:

| Page | URL |
|------|-----|
| Admin Console | http://localhost:3001/admin/applications |
| Support Settings | http://localhost:3001/admin/settings |
| Debug/Diagnostics | http://localhost:3001/admin/debug |
| Help & Support | http://localhost:3001/help |

---

## 🆘 Still Having Issues?

### Collect This Information:
1. **Backend Status:** Is it running? What port?
2. **Web App Status:** Is it running? What port?
3. **User Role:** What does console show for user.role?
4. **Error Messages:** What's in browser console?
5. **Network Errors:** What's in Network tab?

### Take Screenshots:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab)
3. Debug page (/admin/debug)
4. Backend terminal output

### Check These Files Exist:
- ✅ `web_app/.env`
- ✅ `backend/.env` (if using)
- ✅ `backend/server.js`
- ✅ `web_app/src/App.js`

---

## ✅ Success Checklist

- [ ] Backend running on port 3000
- [ ] Web app running on port 3001
- [ ] `.env` file exists with correct API URL
- [ ] Logged in as admin user
- [ ] Debug page shows "Connected"
- [ ] Can access /admin/applications
- [ ] Can access /admin/settings
- [ ] No errors in console
- [ ] No failed requests in Network tab

---

**Last Updated:** 2025-03-07  
**Version:** 1.0.0
