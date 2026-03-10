# Coffee Nursery Certificate Management System (CNCMS)

A comprehensive digital solution for managing coffee nursery certification in Nyeri County, Kenya. The system replaces manual, paper-based processes with an efficient online platform.

## System Components

### 1. Backend API (`/backend`)
- **Technology**: Node.js, Express.js, MySQL
- **Features**:
  - RESTful API with JWT authentication
  - Role-based access control (Farmer, Officer, Admin)
  - Document upload and management
  - PDF certificate generation with QR codes
  - Email/SMS notification system
  - Comprehensive reporting

### 2. Flutter Mobile App (`/flutter_app`)
- **Technology**: Flutter, Dart
- **Target Users**: Farmers and Agricultural Officers
- **Features**:
  - User registration and login
  - Certificate application submission
  - Document upload (PDF, images)
  - Real-time status tracking
  - QR code certificate verification
  - Push notifications

### 3. Web Admin Panel (`/web_admin`)
- **Technology**: React, Ant Design
- **Target Users**: System Administrators
- **Features**:
  - Dashboard with analytics
  - User management
  - Application oversight
  - Certificate management
  - Reports and statistics

### 4. Web App (`/web_app`) - NEW!
- **Technology**: React, Tailwind CSS
- **Target Users**: Farmers and Agricultural Officers
- **Features**:
  - Time-based personalized greetings ☀️🌙
  - Multi-language support (English, Kiswahili, French) 🌍
  - Dark/Light mode toggle
  - Responsive design for all devices
  - Progressive Web App (PWA) ready
  - All mobile app features in web format

## Project Structure

```
cncms/
├── backend/                 # Node.js API
│   ├── config/             # Database configuration
│   ├── database/           # SQL schema
│   ├── i18n/               # Translations
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions (greetings)
│   ├── server.js           # Main server file
│   └── package.json
├── flutter_app/            # Flutter mobile app
│   ├── lib/
│   │   ├── core/          # Constants, theme, models
│   │   ├── presentation/  # Screens and widgets
│   │   └── main.dart
│   └── pubspec.yaml
├── web_admin/              # React admin panel
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── App.js
│   └── package.json
└── web_app/                # React web app (NEW!)
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── store/         # State management
    │   ├── i18n/          # Translations
    │   └── App.js
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- Flutter SDK (v3.0+)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cncms
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8080
```

4. Set up the database:
```bash
mysql -u root -p < database/schema.sql
```

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Flutter App Setup

1. Navigate to the Flutter app directory:
```bash
cd flutter_app
```

2. Install dependencies:
```bash
flutter pub get
```

3. Update the API URL in `lib/core/constants/app_constants.dart`:
```dart
static const String baseUrl = 'http://YOUR_API_URL:3000/api';
```

4. Run the app:
```bash
flutter run
```

### Web Admin Setup

1. Navigate to the web admin directory:
```bash
cd web_admin
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

The admin panel will be available at `http://localhost:3001`

### Web App Setup

1. Navigate to the web app directory:
```bash
cd web_app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

The web app will be available at `http://localhost:3002`

## New Features Added! 🎉

### 1. Time-Based Greeting System
- **Morning** (5 AM - 12 PM): "Good morning! ☀️"
- **Afternoon** (12 PM - 5 PM): "Good afternoon! 🌤️"
- **Evening** (5 PM - 9 PM): "Good evening! 🌅"
- **Night** (9 PM - 5 AM): "Good night! 🌙"
- Personalized with user's name
- Daily tips based on user role

### 2. Multi-Language Support (i18n) 🌍
Supported languages:
- 🇬🇧 **English** (default)
- 🇰🇪 **Kiswahili**
- 🇫🇷 **French**

Language switcher available in:
- Web app header
- Settings page
- Login/Register pages

### 3. Dark Mode 🌙
- System-wide dark theme
- Toggle in settings
- Persistent preference

### 4. Smart Notifications System 📨
- **Email notifications** via Nodemailer
- **SMS notifications** via Africa's Talking
- **Push notifications** via Firebase Cloud Messaging
- Notification templates for all scenarios
- User preference management
- Delivery tracking

### 5. M-Pesa Payment Integration 💰
- STK Push for mobile payments
- Payment status tracking
- Callback handling
- Payment history
- Statistics and reporting

### 6. Weather API Integration 🌤️
- Current weather data
- 5-day forecasts
- Farming advisory based on conditions
- Coffee-specific recommendations
- Location-based weather

### 7. Gamification System 🏆
- **Points system** for user activities
- **Badges** (13 types including First Steps, Certified Farmer, Top Contributor)
- **Level progression** (8 levels from Beginner to Legend)
- **Login streak tracking**
- **Leaderboards**
- Points for various actions

### 8. Audit Logging & Activity Tracking 📋
- Complete activity tracking
- User action history
- Security events monitoring
- Data change tracking (old/new values)
- Export functionality (CSV/JSON)
- Compliance reporting

### 9. Document Scanner with OCR 📄
- **Tesseract.js** for text extraction
- Support for multiple document types:
  - National ID
  - Land Title Deed
  - Business Registration Certificate
  - KRA PIN Certificate
  - Nursery Operator License
- Document validation
- Tampering detection
- Batch processing

### 10. Digital Certificate Wallet 👛
- Store certificates digitally
- QR code generation for each certificate
- Certificate hash for blockchain-style verification
- Share certificates via secure links
- Wallet statistics
- Favorite and tag certificates

### 11. In-App Chat System 💬
- Real-time messaging
- Chat rooms (support, application, group, direct)
- Message types (text, image, document, voice)
- Read receipts
- Message editing and deletion
- Search functionality

### 12. GPS Location Services 📍
- Nursery location capture
- Nearby nursery finder
- Geofencing support
- Distance calculations
- Location history
- Map integration ready

### 13. Calendar & Reminders 📅
- Event scheduling
- Certificate expiry reminders
- Inspection scheduling
- Recurring events
- Email/push reminders
- Upcoming events summary

### 14. Offline Mode & Sync 🔄
- Queue operations when offline
- Automatic sync when connected
- Conflict resolution
- Sync status tracking
- Multiple device support

### 15. AI-Powered Document Verification 🤖
- Image integrity checks
- Text consistency validation
- Tampering detection
- Risk level assessment
- Fraud statistics
- Batch verification

### 16. Video Tutorials Module 🎥
- Educational video content
- Progress tracking
- User ratings and feedback
- Categories and difficulty levels
- Related tutorials
- Learning statistics

### 17. Advanced Search & Filters 🔍
- Full-text search
- Multi-field filtering
- Date range filters
- Status filters
- Real-time search with debouncing
- Filter tags display

### 18. Data Export/Import 📊
- Export formats: CSV, Excel, PDF, JSON
- Export entities: Applications, Certificates, Users, Audit Logs, Payments
- Import from CSV/Excel/JSON
- Data validation
- Export filtering

### 19. Professional UI Components 🎨
- Animated cards with Framer Motion
- Stat cards with trends
- Toast notifications
- Loading spinners
- Badge components
- Progress bars
- Modal dialogs
- Custom buttons and inputs
- Data tables with pagination
- Search and filter components

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/greeting` - Get personalized greeting
- `GET /api/auth/languages` - Get supported languages
- `PUT /api/auth/language` - Update language preference

### Applications
- `GET /api/applications` - List all applications (Admin)
- `GET /api/applications/my-applications` - Get user's applications
- `POST /api/applications` - Create new application
- `POST /api/applications/:id/submit` - Submit application
- `POST /api/applications/:id/review` - Review application (Officer)

### Certificates
- `GET /api/certificates` - List all certificates
- `GET /api/certificates/my-certificates` - Get user's certificates
- `POST /api/certificates/generate/:id` - Generate certificate
- `GET /api/certificates/verify/:number` - Verify certificate (Public)

### Certificate Wallet
- `GET /api/wallet` - Get user's certificate wallet
- `POST /api/wallet` - Add certificate to wallet
- `GET /api/wallet/stats` - Get wallet statistics
- `GET /api/wallet/:walletId` - Get wallet certificate details
- `PUT /api/wallet/:walletId` - Update wallet certificate
- `DELETE /api/wallet/:walletId` - Remove from wallet
- `POST /api/wallet/:walletId/share` - Share certificate
- `GET /api/wallet/verify/hash/:hash` - Verify by hash (Public)
- `GET /api/wallet/shared/:token` - View shared certificate (Public)

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/devices` - Register device
- `POST /api/notifications/test` - Send test notification (Admin)

### Payments (M-Pesa)
- `POST /api/payments/stk-push` - Initiate STK Push
- `GET /api/payments/status/:merchantRequestId` - Check payment status
- `POST /api/payments/callback` - M-Pesa callback
- `GET /api/payments/history` - Payment history
- `GET /api/payments/stats` - Payment statistics

### Gamification
- `GET /api/gamification/stats` - Get user gamification stats
- `GET /api/gamification/badges` - Get user's badges
- `GET /api/gamification/leaderboard` - Get leaderboard
- `POST /api/gamification/streak` - Update login streak
- `GET /api/gamification/badges/all` - Get all available badges

### Weather
- `GET /api/weather/current` - Current weather
- `GET /api/weather/forecast` - 5-day forecast
- `GET /api/weather/advisory` - Farming advisory
- `GET /api/weather/coffee-recommendations` - Coffee-specific recommendations

### Audit Logs
- `GET /api/audit/logs` - Get audit logs (Admin)
- `GET /api/audit/user/:userId` - Get user activity
- `GET /api/audit/security` - Get security events (Admin)
- `GET /api/audit/export` - Export audit logs (Admin)

### OCR / Document Scanner
- `POST /api/ocr/scan` - Scan document
- `POST /api/ocr/verify` - Verify document
- `GET /api/ocr/history` - Get OCR history
- `GET /api/ocr/document-types` - Get supported document types
- `POST /api/ocr/batch` - Batch process documents

### Chat
- `GET /api/chat/rooms` - Get user's chat rooms
- `POST /api/chat/rooms` - Create chat room
- `GET /api/chat/rooms/:roomId/messages` - Get messages
- `POST /api/chat/rooms/:roomId/messages` - Send message
- `POST /api/chat/rooms/:roomId/read` - Mark as read
- `PUT /api/chat/messages/:messageId` - Edit message
- `DELETE /api/chat/messages/:messageId` - Delete message
- `GET /api/chat/support` - Get or create support chat

### GPS Location
- `POST /api/gps/nurseries/:nurseryId/location` - Save location
- `GET /api/gps/nurseries/:nurseryId/location` - Get location
- `GET /api/gps/nearby` - Find nearby nurseries
- `POST /api/gps/nurseries/:nurseryId/geofence` - Create geofence
- `GET /api/gps/nurseries/:nurseryId/geofence/check` - Check geofence
- `POST /api/gps/bounds` - Get nurseries in map bounds
- `GET /api/gps/report` - Generate location report

### Calendar
- `GET /api/calendar/events` - Get events
- `POST /api/calendar/events` - Create event
- `GET /api/calendar/events/summary` - Get upcoming summary
- `GET /api/calendar/events/:eventId` - Get event details
- `PUT /api/calendar/events/:eventId` - Update event
- `DELETE /api/calendar/events/:eventId` - Delete event
- `POST /api/calendar/inspections` - Schedule inspection

### Offline Sync
- `POST /api/sync/queue` - Queue operation
- `GET /api/sync/pending` - Get pending operations
- `POST /api/sync/sync-all` - Sync all pending
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/resolve/:syncId` - Resolve conflict

### AI Verification
- `POST /api/ai/verify` - Analyze document
- `POST /api/ai/verify/batch` - Batch verify
- `GET /api/ai/verify/history` - Get verification history
- `GET /api/ai/verify/stats` - Get fraud statistics

### Video Tutorials
- `GET /api/tutorials` - Get all tutorials
- `GET /api/tutorials/categories` - Get categories
- `GET /api/tutorials/progress` - Get user progress
- `GET /api/tutorials/:tutorialId` - Get tutorial
- `POST /api/tutorials/:tutorialId/progress` - Update progress
- `POST /api/tutorials/:tutorialId/rate` - Rate tutorial
- `GET /api/tutorials/admin/statistics` - Get statistics (Admin)

### Data Export/Import
- `POST /api/export` - Export data
- `GET /api/export/entities` - Get exportable entities
- `GET /api/export/formats` - Get export formats
- `POST /api/import` - Import data (Admin)

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/applications` - Applications report
- `GET /api/reports/performance` - Performance metrics

## User Roles

### Farmer
- Register and login
- Create certificate applications
- Upload supporting documents
- Track application status
- Download approved certificates
- View certificate QR codes

### Officer
- Review submitted applications
- Approve or reject applications
- Add review comments
- View assigned ward applications

### Admin
- Full system access
- User management
- View all applications
- Generate reports
- System configuration

## Features

### Core Features
- ✅ Online registration and authentication
- ✅ Digital application forms
- ✅ Document upload (PDF, JPG, PNG)
- ✅ Approval workflow
- ✅ Real-time status tracking
- ✅ PDF certificate generation with QR codes
- ✅ Email/SMS notifications
- ✅ Mobile-responsive design
- ✅ **Time-based personalized greetings** ☀️🌙
- ✅ **Multi-language support (EN/SW/FR)** 🌍
- ✅ **Dark/Light mode toggle** 🌙☀️
- ✅ **Smart notifications (Email, SMS, Push)** 📨
- ✅ **M-Pesa payment integration** 💰
- ✅ **Weather API with farming advisory** 🌤️
- ✅ **Gamification (points, badges, leaderboards)** 🏆
- ✅ **Audit logging & activity tracking** 📋
- ✅ **Document OCR scanner** 📄
- ✅ **Digital certificate wallet** 👛
- ✅ **In-app chat system** 💬
- ✅ **GPS location services** 📍
- ✅ **Calendar & reminders** 📅
- ✅ **Offline mode & sync** 🔄
- ✅ **AI document verification** 🤖
- ✅ **Video tutorials module** 🎥
- ✅ **Advanced search & filters** 🔍
- ✅ **Data export/import (CSV, Excel, PDF, JSON)** 📊
- ✅ **Professional UI components** 🎨

### Security
- JWT-based authentication
- Role-based access control
- Encrypted password storage
- Secure file uploads
- Input validation
- Rate limiting

### Reporting
- Dashboard statistics
- Application reports
- Officer performance metrics
- Ward-wise distribution
- Monthly trends

## Database Schema

### Core Tables
- `users` - User accounts
- `applications` - Certificate applications
- `documents` - Uploaded documents
- `certificates` - Generated certificates
- `notifications` - User notifications
- `activity_logs` - System activity logs

### Notification System
- `user_devices` - Push notification devices
- `notification_preferences` - User notification settings

### Payment System
- `payments` - M-Pesa payment records

### Gamification
- `badges` - Available badges
- `user_badges` - User earned badges
- `user_points` - User points
- `point_transactions` - Points history

### Audit & Logging
- `audit_logs` - Complete audit trail

### OCR & Document Verification
- `document_ocr` - OCR scan results
- `ai_document_verifications` - AI verification results

### Chat System
- `chat_rooms` - Chat rooms
- `chat_room_participants` - Room participants
- `chat_messages` - Chat messages

### Certificate Wallet
- `user_certificate_wallet` - User's certificate wallet
- `certificate_shares` - Certificate share links

### GPS & Location
- `nursery_locations` - Nursery GPS coordinates
- `nursery_location_history` - Location history
- `nursery_geofences` - Geofence definitions

### Calendar & Events
- `calendar_events` - Calendar events
- `event_reminders` - Event reminders

### Offline Sync
- `offline_sync_queue` - Pending sync operations

### Weather
- `weather_data` - Cached weather data

### Video Tutorials
- `video_tutorials` - Tutorial content
- `tutorial_views` - User tutorial progress

### Application Templates
- `application_templates` - Pre-filled templates

### Forum (Community)
- `forum_categories` - Forum categories
- `forum_topics` - Forum topics
- `forum_replies` - Topic replies

## Deployment

### Backend Deployment
1. Set up a production MySQL database
2. Configure environment variables
3. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name cncms-api
```

### Flutter App Deployment
1. Build for Android:
```bash
flutter build apk --release
```
2. Build for iOS:
```bash
flutter build ios --release
```

### Web Admin Deployment
1. Build for production:
```bash
npm run build
```
2. Deploy the `build` folder to your web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, contact the ICT Directorate at Nyeri County Government.

---

**© 2025 County Government of Nyeri - Department of Agriculture**
