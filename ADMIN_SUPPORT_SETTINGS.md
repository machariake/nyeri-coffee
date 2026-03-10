# Admin Support Contact Management Feature

## 📋 Overview
Admins can now update and manage the support contact information that users see across the application. This includes phone numbers, email, WhatsApp number, and support hours.

---

## ✨ New Features

### 1. **Admin Support Settings Page**
- **Route**: `/admin/settings`
- **Access**: Admin users only
- **Features**:
  - Update support phone number
  - Update support email address
  - Update WhatsApp number
  - Update support hours
  - Live preview of how information appears to users
  - Save/Cancel functionality

### 2. **Dynamic Contact Information**
All user-facing components now fetch contact information from the database:
- **WhatsApp Button**: Uses `support_whatsapp` from settings
- **Help & Support Page**: Displays all contact methods dynamically
- **Real-time Updates**: Changes reflect immediately after admin saves

---

## 🔧 Database Changes

### New System Settings
Run the migration file to add these settings:
```sql
-- File: add_support_settings.sql
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('support_phone', '+254 700 000 000', 'string', 'Support phone number for voice calls'),
('support_email', 'support@cncms.go.ke', 'string', 'Support email address'),
('support_whatsapp', '+254 700 000 000', 'string', 'WhatsApp number for chat support'),
('support_hours', 'Mon-Fri, 8AM-5PM', 'string', 'Support business hours');
```

### Setting Keys
- `support_phone` - Phone number for voice calls
- `support_email` - Email address for support inquiries
- `support_whatsapp` - WhatsApp number (format: +254 XXX XXX XXX)
- `support_hours` - Business hours text

---

## 📱 User-Facing Updates

### 1. WhatsApp Button (`WhatsAppButton.jsx`)
- **Before**: Hardcoded number
- **After**: Fetches `support_whatsapp` from database
- **Behavior**: Automatically formats number for WhatsApp API

### 2. Help & Support Page (`HelpSupport.jsx`)
- **Before**: Static contact information
- **After**: Loads all contact methods from settings
- **Display**:
  - Call Us → `support_phone` + `support_hours`
  - Email Us → `support_email`
  - WhatsApp → `support_whatsapp`
  - Send Message → Contact form

---

## 🎨 Admin Interface

### Support Settings Page Components

#### **Input Fields**
1. **Support Phone Number**
   - Type: Tel
   - Placeholder: +254 700 000 000
   - Used for: Voice call link on Help page

2. **Support Email**
   - Type: Email
   - Placeholder: support@cncms.go.ke
   - Used for: Email link on Help page

3. **WhatsApp Number**
   - Type: Tel
   - Placeholder: +254 700 000 000
   - Used for: WhatsApp click-to-chat button
   - Note: Automatically cleaned (numbers only) for WhatsApp API

4. **Support Hours**
   - Type: Text
   - Placeholder: Mon-Fri, 8AM-5PM
   - Used for: Display on Help page

#### **Preview Section**
Shows live preview of how contact cards will appear to users:
- Phone card with icon, number, and hours
- Email card with icon and address
- WhatsApp card with icon and number

---

## 🔐 Access Control

### Admin Navigation
- **Admin Console** → `/admin/applications` (top of sidebar)
- **Support Settings** → `/admin/settings` (bottom of sidebar)
- Only visible to users with `role: 'admin'`

---

## 📊 How It Works

### Admin Flow
1. Admin navigates to `/admin/settings`
2. Views current settings (loaded from database)
3. Edits any field
4. Clicks "Save Changes"
5. Settings updated in `system_settings` table
6. Preview updates automatically

### User Flow
1. User visits Help & Support page
2. Component fetches settings from `/system/settings`
3. Displays contact methods with updated information
4. User clicks contact method (call/email/chat)
5. Action opens with correct contact details

### WhatsApp Button Flow
1. Button loads on every page
2. Fetches `support_whatsapp` from settings
3. Cleans number (removes non-numeric characters)
4. On click, opens WhatsApp with pre-filled message
5. Uses format: `https://wa.me/{cleanNumber}?text={encodedMessage}`

---

## 🛠️ API Endpoints Used

### GET `/system/settings`
- **Purpose**: Fetch all system settings
- **Response**: 
```json
{
  "success": true,
  "data": {
    "support_phone": "+254 700 000 000",
    "support_email": "support@cncms.go.ke",
    "support_whatsapp": "+254 700 000 000",
    "support_hours": "Mon-Fri, 8AM-5PM",
    ...other settings
  }
}
```

### PUT `/system/settings/:key`
- **Purpose**: Update individual setting
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ "value": "new value" }`
- **Example**:
```javascript
axios.put('/system/settings/support_phone', {
  value: '+254 711 111 111'
}, {
  headers: { 'Authorization': 'Bearer {token}' }
});
```

---

## 📝 Files Modified/Created

### Created
1. `web_app/src/pages/admin/AdminSettings.jsx` - Settings management page
2. `add_support_settings.sql` - Database migration

### Modified
1. `web_app/src/components/WhatsAppButton.jsx` - Now fetches dynamic settings
2. `web_app/src/pages/HelpSupport.jsx` - Loads contact methods from API
3. `web_app/src/App.js` - Added `/admin/settings` route
4. `web_app/src/components/layout/Sidebar.jsx` - Added Support Settings link

---

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
mysql -u root -p cncms < add_support_settings.sql
```

### 2. Restart Backend Server
```bash
cd backend
npm start
```

### 3. Restart Web App
```bash
cd web_app
npm start
```

### 4. Login as Admin
- Email: `admin@cncms.go.ke`
- Navigate to **Support Settings** in sidebar
- Update contact information
- Click **Save Changes**

### 5. Test as User
- Logout and login as regular user
- Visit **Help & Support** page
- Verify updated contact information displays
- Click WhatsApp button to verify number

---

## ✅ Testing Checklist

- [ ] Database migration executed successfully
- [ ] Admin can access `/admin/settings`
- [ ] Settings load correctly on page load
- [ ] All 4 fields can be edited
- [ ] Save button updates settings in database
- [ ] Preview shows updated information
- [ ] WhatsApp button uses updated WhatsApp number
- [ ] Help page shows updated contact info
- [ ] Phone link opens dialer with correct number
- [ ] Email link opens mail client with correct address
- [ ] WhatsApp link opens chat with correct number
- [ ] Non-admin users cannot access settings page

---

## 💡 Best Practices

### Phone Number Format
- Always include country code (e.g., +254 for Kenya)
- No spaces or special characters in WhatsApp number
- Example: `+254 700 000 000`

### Email Format
- Use official support email
- Ensure email inbox is monitored
- Set up auto-responder if possible

### Support Hours
- Be specific about timezone if needed
- Example: "Mon-Fri, 8AM-5PM EAT"

### Response Times
- Update description if response times change
- Manage user expectations appropriately

---

## 🔒 Security Notes

- Settings update requires admin authentication
- Token validation on all API requests
- Only admins can see Support Settings menu
- Regular users only see the contact information

---

## 📞 Support

For issues or questions about this feature:
- Check admin can access settings page
- Verify database settings exist
- Check browser console for errors
- Ensure backend API is running
- Verify token is valid

---

**© 2025 County Government of Nyeri**  
**AgriCertify - Coffee Nursery Certificate Management System**
