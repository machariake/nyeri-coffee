# 📢 Push Notifications Feature - Web Admin

## ✅ Feature Complete!

You can now send push notifications to users directly from your web admin panel!

---

## 🎯 How to Use

### **Step 1: Access the Notifications Page**

1. **Login to Web Admin**
   ```
   http://localhost:3001/login
   ```

2. **Navigate to "Send Notifications"**
   - Look in the left sidebar menu
   - Click **"Send Notifications"** (🔔 icon)
   - OR go directly to: `http://localhost:3001/notifications`

---

### **Step 2: Compose Your Notification**

1. **Fill in the form:**
   - **Title**: Short, attention-grabbing title
     - Example: "System Maintenance Notice"
   
   - **Message**: Detailed message (max 500 characters)
     - Example: "The system will be under maintenance on Saturday from 2-4 AM."
   
   - **Type**: Choose notification type
     - 📢 System Announcement
     - 🔄 Status Update
     - ✅ Approval
     - ❌ Rejection
     - ⏰ Reminder

---

### **Step 3: Select Recipients**

Choose who should receive the notification:

| Option | Description | Example Use |
|--------|-------------|-------------|
| **All Users** | Sends to everyone | System-wide announcements |
| **Farmers Only** | Only farmers receive it | Application updates, certificate reminders |
| **Officers Only** | Only officers receive it | Review reminders, policy updates |
| **Specific Users** | Choose individual users | Targeted communications |

**Live Counter:**
- As you select, you'll see how many users will receive it
- Example: "Will send to 150 farmers"

---

### **Step 4: Send!**

1. **Click "Send Notification"** button
2. **Wait for confirmation**
   - ✅ Success message shows
   - Shows: "Successfully sent X notifications"
3. **Users receive it instantly** via Supabase Realtime!

---

## 📊 View Notification History

Below the compose form, you'll see a table showing:

- **Title** - Notification title
- **Message** - Preview of message
- **Type** - Color-coded tag
- **Recipients** - How many users received it
- **Sent At** - Date and time sent

---

## 💡 Use Cases

### **1. System Announcements**
```
Title: System Maintenance
Message: The system will be down for maintenance on Sunday 2-4 AM.
Type: System Announcement
Recipients: All Users
```

### **2. Application Reminders**
```
Title: Complete Your Application
Message: You have a draft application. Please complete and submit it before the deadline.
Type: Reminder
Recipients: Farmers Only
```

### **3. Policy Updates**
```
Title: New Certificate Requirements
Message: New document requirements effective next month. Check the guidelines.
Type: Status Update
Recipients: All Users
```

### **4. Urgent Alerts**
```
Title: Deadline Extended
Message: Application deadline extended to end of month. Apply now!
Type: System Announcement
Recipients: Farmers Only
```

---

## 🔔 How It Works

```
Web Admin
    ↓
Send Notification
    ↓
Backend API (/notifications/send)
    ↓
Supabase Database (notifications table)
    ↓
Supabase Realtime
    ↓
Flutter App (instant notification)
```

---

## 📱 What Users See

### **In Flutter App:**
1. **Notification appears instantly** in Notifications screen
2. **Badge icon** shows unread count
3. **Can mark as read**
4. **Can clear all**

### **In Web App:**
1. **Notification bell** shows unread count
2. **Dropdown** shows recent notifications
3. **Click to view** full notification

---

## 🎨 Features

### **Compose Form:**
- ✅ Title input
- ✅ Message textarea (500 char limit)
- ✅ Type selector
- ✅ Recipient selector (radio buttons)
- ✅ User search (for specific users)
- ✅ Live counter
- ✅ Send button

### **History Table:**
- ✅ Paginated table
- ✅ Color-coded types
- ✅ Date/time formatting
- ✅ Recipient count
- ✅ Sortable columns

### **Smart Features:**
- ✅ Multi-select users
- ✅ Search users by name/email
- ✅ Auto-count recipients
- ✅ Error handling
- ✅ Success/error messages
- ✅ Loading states

---

## 🔐 Security

- ✅ **Admin only** - Only admins can access
- ✅ **Authentication required** - Must be logged in
- ✅ **Authorization check** - Role verified
- ✅ **Input validation** - Prevents spam
- ✅ **Rate limiting** - Can be added if needed

---

## 📊 Database

Notifications are stored in:
```sql
notifications (
  id,
  user_id,
  title,
  message,
  type,
  is_read,
  created_at
)
```

---

## 🚀 API Endpoints

### **Send Notification:**
```
POST /api/notifications/send
Headers: Authorization: Bearer {token}
Body: {
  "notifications": [
    {
      "user_id": "uuid",
      "title": "Title",
      "message": "Message",
      "type": "system"
    }
  ]
}
```

### **Get History:**
```
GET /api/notifications/history
Headers: Authorization: Bearer {token}
```

---

## ✅ Testing Checklist

- [ ] Access notifications page
- [ ] Compose a test notification
- [ ] Select "All Users"
- [ ] Send notification
- [ ] Check success message
- [ ] Verify in history table
- [ ] Check Flutter app - notification appears
- [ ] Test with "Farmers Only"
- [ ] Test with "Specific Users"
- [ ] Test search functionality

---

## 🆘 Troubleshooting

### **"No users selected"**
- Make sure you select a recipient type
- If using "Specific Users", select at least one user

### **"Failed to send"**
- Check you're logged in as admin
- Verify backend is running
- Check browser console for errors

### **"Users not appearing in search"**
- Make sure users exist in database
- Check Supabase → users table

---

## 📝 Quick Reference

| Feature | Location | Description |
|---------|----------|-------------|
| **Compose** | Top card | Write notification |
| **Recipients** | Radio buttons | Choose audience |
| **User Search** | Dropdown | Find specific users |
| **Send Button** | Bottom | Send notification |
| **History** | Bottom table | Past notifications |

---

## 🎉 Benefits

| Before | After |
|--------|-------|
| Manual SQL in Supabase | One-click from admin panel |
| No recipient selection | Target specific groups |
| No history tracking | Full history table |
| Error-prone | Validated & safe |

---

**You can now send push notifications to users without going to Supabase! 🎉**

---

**© 2025 County Government of Nyeri**  
**AgriCertify - Push Notification System**
