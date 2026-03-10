class AppConstants {
  // App Info
  static const String appName = 'AgriCertify';
  static const String appVersion = '1.0.0';

  // API Configuration
  // For Android Emulator: use http://10.0.2.2:3000/api
  // For iOS Simulator: use http://localhost:3000/api
  // For Physical Device: use http://YOUR_COMPUTER_IP:3000/api
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  static const int apiTimeout = 30000; // milliseconds
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  
  // User Roles
  static const String roleFarmer = 'farmer';
  static const String roleOfficer = 'officer';
  static const String roleAdmin = 'admin';
  
  // Application Status
  static const String statusDraft = 'draft';
  static const String statusSubmitted = 'submitted';
  static const String statusUnderReview = 'under_review';
  static const String statusApproved = 'approved';
  static const String statusRejected = 'rejected';
  static const String statusExpired = 'expired';
  
  // Document Types
  static const String docLandRegistration = 'land_registration';
  static const String docLeaseAgreement = 'lease_agreement';
  static const String docIdDocument = 'id_document';
  static const String docBusinessRegistration = 'business_registration';
  static const String docOther = 'other';
}
