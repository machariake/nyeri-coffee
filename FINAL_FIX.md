# ✅ FINAL FIX - Both Issues

## Current Status:

1. ✅ **MySQL Password**: Set to `root` in backend\.env
2. ❌ **Web Admin**: Dependencies corrupted - needs reinstall

---

## 🔧 FIX WEB ADMIN (Do This Now)

### Run the Reinstall Script:

```bash
# Double-click this file:
REINSTALL_WEB_ADMIN.bat

# Or run manually:
cd web_admin
rmdir /s /q node_modules
del package-lock.json
npm install --legacy-peer-deps
npm start
```

**This will take 5-10 minutes** ⏳

---

## ✅ AFTER REINSTALL COMPLETE

### Step 1: Verify Backend is Running

Backend should already be running on port 3000.

Check: http://localhost:3000/api/health

Should see: `{"status":"OK"}`

### Step 2: Web Admin Will Start Automatically

The reinstall script will start it.

Open: http://localhost:3001

### Step 3: Test Registration

Try registering a user!

---

## 🎯 If Backend is NOT Running

```bash
cd backend
npm run dev
```

Should see:
```
Server running on port 3000
Database connected successfully ✅
```

---

## 📝 Quick Reference

| Service | Command | URL |
|---------|---------|-----|
| Backend | `cd backend && npm run dev` | http://localhost:3000 |
| Web Admin | `cd web_admin && npm start` | http://localhost:3001 |
| Web App | `cd web_app && npm start` | http://localhost:3002 |
| Flutter | `cd flutter_app && flutter run` | Mobile only |

---

## 🔧 Common Issues

### Port 3000 already in use

**Fix:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Web Admin still shows errors

**Fix:** Run `REINSTALL_WEB_ADMIN.bat` again

### MySQL password wrong

**Current:** `DB_PASSWORD=root`

If it doesn't work, your MySQL might have different password. Try:
- `DB_PASSWORD=` (empty)
- `DB_PASSWORD=password`
- `DB_PASSWORD=mysql`

---

## ✅ Expected Flow

1. ✅ Run `REINSTALL_WEB_ADMIN.bat`
2. ✅ Wait 5-10 minutes
3. ✅ Web Admin starts on port 3001
4. ✅ Backend already running on port 3000
5. ✅ Test registration!

---

**Status**: MySQL password set ✅, Web Admin reinstalling...
**Next**: Run REINSTALL_WEB_ADMIN.bat
