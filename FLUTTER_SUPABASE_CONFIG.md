# Flutter + Supabase Configuration Guide

## ✅ Your Supabase Credentials

These are already configured in `flutter_app/lib/main.dart`:

```dart
SUPABASE_URL = https://iafxrxlrjspwbltsjzqz.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI
```

## Current Issue

Your `AuthService` is **mixed** between:
- ❌ Supabase (for some operations)
- ❌ Backend API (for other operations)

This causes confusion and connection issues.

## Solution: Pure Supabase Approach

Your Flutter app should use **ONLY Supabase** for:
- ✅ Authentication
- ✅ Database operations
- ✅ Storage
- ✅ Realtime subscriptions

## Required Supabase Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'farmer',
    ward VARCHAR(100),
    sub_county VARCHAR(100),
    id_number VARCHAR(50),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    app_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nursery_name VARCHAR(255) NOT NULL,
    nursery_location VARCHAR(255) NOT NULL,
    nursery_size VARCHAR(50),
    coffee_varieties TEXT,
    expected_seedlings INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    application_id BIGINT REFERENCES applications(id),
    user_id UUID REFERENCES users(id),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    qr_code_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for applications table
CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins and Officers can view all applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'officer')
        )
    );

-- RLS Policies for documents table
CREATE POLICY "Users can view documents for their applications"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = documents.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload documents for their applications"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = documents.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- RLS Policies for certificates table
CREATE POLICY "Users can view their own certificates"
    ON certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
    ON certificates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone_number,
        role,
        ward,
        sub_county,
        id_number
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
        NEW.raw_user_meta_data->>'ward',
        NEW.raw_user_meta_data->>'sub_county',
        NEW.raw_user_meta_data->>'id_number'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents');
```

## Updated AuthService (Pure Supabase)

Replace `flutter_app/lib/core/services/auth_service.dart` with this pure Supabase version:

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/user_model.dart';

class AuthService extends ChangeNotifier {
  SharedPreferences? _prefs;
  User? _currentUser;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  final SupabaseClient _supabase = Supabase.instance.client;

  User? get currentUser => _currentUser;
  String? get token => _supabase.auth.currentSession?.accessToken;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _supabase.auth.currentUser != null;
  bool get isInitialized => _isInitialized;

  // Stream for auth state changes
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  AuthService() {
    _initPrefs();
  }

  Future<void> _initPrefs() async {
    _prefs = await SharedPreferences.getInstance();
    await _loadStoredAuth();
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> _loadStoredAuth() async {
    if (_prefs == null) {
      _prefs = await SharedPreferences.getInstance();
    }
    
    // Check if Supabase has a session
    final session = _supabase.auth.currentSession;
    if (session != null && session.user != null) {
      await _fetchCurrentUser();
    }
    notifyListeners();
  }

  Future<void> _fetchCurrentUser() async {
    try {
      final supabaseUser = _supabase.auth.currentUser;
      if (supabaseUser == null) return;

      final response = await _supabase
          .from('users')
          .select()
          .eq('id', supabaseUser.id)
          .single();

      _currentUser = User.fromJson(response);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching user profile: $e');
      _error = 'Failed to load user profile';
      notifyListeners();
    }
  }

  // ==================== AUTHENTICATION ====================

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        await _fetchCurrentUser();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Network error. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    String role = 'farmer',
    String? ward,
    String? subCounty,
    String? idNumber,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'full_name': fullName,
          'phone_number': phoneNumber,
          'role': role,
          'ward': ward,
          'sub_county': subCounty,
          'id_number': idNumber,
        },
      );

      if (response.user != null) {
        // User profile is created automatically by database trigger
        await _fetchCurrentUser();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Network error. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
    } on AuthException catch (e) {
      _error = e.message;
      notifyListeners();
    }
  }

  // ==================== BIOMETRIC AUTH ====================

  Future<bool> loginWithBiometric(String password) async {
    final savedCreds = await _getSavedCredentials();
    if (savedCreds == null) return false;

    final email = savedCreds['email'];
    return await login(email: email!, password: password);
  }

  bool hasSavedCredentials() {
    final data = _prefs?.getString('saved_credentials');
    return data != null;
  }

  Future<void> _saveCredentials(String identifier, String password) async {
    final creds = {
      'email': identifier.contains('@') ? identifier : null,
      'password_hash': _hashCredentials(identifier, password),
    };
    await _prefs?.setString('saved_credentials', jsonEncode(creds));
  }

  Future<Map<String, String>?> _getSavedCredentials() async {
    final data = _prefs?.getString('saved_credentials');
    if (data == null) return null;
    return Map<String, String>.from(jsonDecode(data));
  }

  String _hashCredentials(String identifier, String password) {
    // Simple hash - in production use a proper hashing library
    return '${identifier}_$password'.hashCode.toString();
  }

  // ==================== PROFILE MANAGEMENT ====================

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;
    notifyListeners();

    try {
      if (_currentUser == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      await _supabase
          .from('users')
          .update(updates)
          .eq('id', _currentUser!.id);

      await _fetchCurrentUser();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to update profile: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
```

## Testing

1. **Run the SQL schema** in Supabase SQL Editor
2. **Update AuthService** with the pure Supabase version
3. **Run Flutter app**:
   ```bash
   cd flutter_app
   flutter run
   ```

## Next Steps

1. ✅ Run SQL schema in Supabase
2. ✅ Update AuthService
3. ✅ Test login/register
4. ✅ Update other services to use Supabase

---
**Status**: Ready for pure Supabase integration
**Date**: 2026-03-08
