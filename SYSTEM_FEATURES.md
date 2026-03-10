# System Settings, Promotions & Alerts Feature

## Overview
This feature allows administrators to:
- Enable/disable maintenance mode
- Create and manage promotional messages
- Create and manage system alerts
- Control user registrations

## Database Changes

### New Tables Created:
1. **system_settings** - Stores system-wide configuration
2. **promotions** - Stores promotional messages
3. **system_alerts** - Stores system alerts

### Run SQL Migration:
```bash
cd c:\Users\mashupke\Desktop\nyeri_farmer
mysql.exe -u root -proot cncms < add_system_tables.sql
```

## Backend API Endpoints

### System Settings
- `GET /api/system/settings` - Get all system settings (public)
- `PUT /api/system/settings/:key` - Update a setting (admin only)

### Promotions
- `GET /api/system/promotions?role=farmer` - Get active promotions (public)
- `POST /api/system/promotions` - Create promotion (admin only)
- `PUT /api/system/promotions/:id` - Update promotion (admin only)
- `DELETE /api/system/promotions/:id` - Delete promotion (admin only)

### Alerts
- `GET /api/system/alerts?role=farmer` - Get active alerts (public)
- `POST /api/system/alerts` - Create alert (admin only)
- `PUT /api/system/alerts/:id` - Update alert (admin only)
- `DELETE /api/system/alerts/:id` - Delete alert (admin only)

## Web Admin Panel

### New Pages:
1. **Promotions & Alerts** (`/promotions`)
   - Create, edit, delete promotions
   - View all active promotions and alerts
   - Set target audience (all, farmers, officers, admins)
   - Schedule start/end dates

2. **System Settings** (`/settings`)
   - Toggle maintenance mode
   - Edit maintenance message
   - Enable/disable registrations
   - View app version

### Access:
- Login as admin at `http://localhost:3001`
- Use credentials: `admin@cncms.go.ke` / `admin123`
- Navigate to "Promotions & Alerts" or "System Settings" in the sidebar

## Mobile App Integration

### New Features:
1. **Maintenance Screen**
   - Automatically shown when maintenance mode is enabled
   - Admins can bypass maintenance mode
   - Beautiful UI with maintenance message

2. **Alerts Banner Widget**
   - Shows active alerts and promotions
   - Color-coded by type (info, success, warning, error, urgent)
   - Displays validity dates
   - Role-based filtering

### Files Added:
- `lib/core/services/system_service.dart` - System service
- `lib/presentation/screens/maintenance_screen.dart` - Maintenance UI
- `lib/presentation/widgets/alerts_banner.dart` - Alerts/Promotions display

## Usage Examples

### Enable Maintenance Mode:
1. Login to web admin as admin
2. Go to System Settings
3. Toggle "Enable Maintenance Mode"
4. Click "Save Settings"
5. All non-admin users will see maintenance screen

### Create a Promotion:
1. Go to Promotions & Alerts
2. Click "New Promotion"
3. Fill in:
   - Title: "Special Coffee Variety Offer"
   - Message: "Get 20% off on premium coffee seedlings this month!"
   - Type: promo
   - Show To: farmers
   - Priority: 5
4. Click "Create"

### Create an Alert:
1. Go to Promotions & Alerts
2. Click "New Promotion" (works for alerts too)
3. Fill in:
   - Title: "System Maintenance Scheduled"
   - Message: "System will be down on Sunday 2AM-4AM for maintenance"
   - Type: warning
   - Show To: all
   - Priority: 10
4. Click "Create"

## Promotion/Alert Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| info | Blue | ℹ️ | General information |
| success | Green | ✓ | Successful operations |
| warning | Orange | ⚠️ | Warnings, cautions |
| error | Red | ✕ | Errors, critical issues |
| promo | Purple | 🏷️ | Promotional offers |
| urgent | Red | ⚡ | Urgent alerts |

## Target Audience Options

- **all** - Show to all users
- **farmers** - Only farmers see it
- **officers** - Only officers see it
- **admins** - Only admins see it

## Maintenance Mode Behavior

### When Enabled:
- ❌ Farmers cannot access the app
- ❌ Officers cannot access the app
- ✅ Admins can still access (for management)
- 📝 Custom maintenance message is displayed

### API Behavior:
- All API endpoints return 503 Service Unavailable
- Response includes maintenance message
- Admin token bypasses maintenance check

## Testing

1. **Test Maintenance Mode:**
   ```bash
   # Enable via API (requires admin token)
   curl -X PUT http://localhost:3000/api/system/settings/maintenance_mode \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"value": "true"}'
   ```

2. **Test Promotion Display:**
   - Create a promotion in web admin
   - Open mobile app as farmer
   - Should see promotion banner on home screen

3. **Test Maintenance Screen:**
   - Enable maintenance mode
   - Logout and login as farmer
   - Should see maintenance screen instead of dashboard
