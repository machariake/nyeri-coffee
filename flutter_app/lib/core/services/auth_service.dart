import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/user_model.dart' as model;

class AuthService extends ChangeNotifier {
  SharedPreferences? _prefs;
  model.User? _currentUser;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  final SupabaseClient _supabase = Supabase.instance.client;

  // Getters
  model.User? get currentUser => _currentUser;
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

      _currentUser = model.User.fromJson(response);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching user profile: $e');
      _error = 'Failed to load user profile';
      notifyListeners();
    }
  }

  // ==================== AUTHENTICATION ====================

  /// Login with email and password
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
        
        if (_currentUser != null) {
          // Save credentials for biometric login
          await _saveCredentials(email, password);
          
          _isLoading = false;
          notifyListeners();
          return true;
        } else {
          // They authenticated successfully with Auth but have NO profile in the "users" table.
          // This happens if they registered an account BEFORE the database tables were created.
          // Let's AUTO-CREATE the missing profile right now so they don't get stuck!
          try {
            debugPrint('⚠️ Missing profile detected. Attempting to auto-create profile...');
            final meta = response.user?.userMetadata ?? {};
            
            await _supabase.from('users').insert({
              'id': response.user!.id,
              'email': response.user!.email ?? email,
              'full_name': meta['full_name'] ?? 'Unknown User',
              'phone_number': meta['phone_number'] ?? '',
              'role': meta['role'] ?? 'farmer',
            });
            
            // Try fetching one last time
            await _fetchCurrentUser();
            
            if (_currentUser != null) {
              await _saveCredentials(email, password);
              _isLoading = false;
              notifyListeners();
              return true;
            }
          } catch (e) {
            debugPrint('❌ Failed to auto-create profile: $e');
          }

          // If it still failed
          await _supabase.auth.signOut();
          _error = 'User profile is completely missing from the database. Please create a brand new account.';
          _isLoading = false;
          notifyListeners();
          return false;
        }
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

  /// Login with email or phone
  Future<bool> loginWithEmailOrPhone({
    String? email,
    String? phoneNumber,
    required String password,
  }) async {
    if (email != null) {
      return await login(email: email, password: password);
    } else if (phoneNumber != null) {
      // For phone login, we need to find the user first
      return await _loginWithPhone(phoneNumber: phoneNumber, password: password);
    }
    return false;
  }

  /// Login with phone number
  Future<bool> _loginWithPhone({
    required String phoneNumber,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Find user by phone number using RPC to bypass RLS
      final response = await _supabase.rpc(
        'get_email_from_phone',
        params: {'search_phone': phoneNumber},
      );

      if (response != null) {
        final email = response['email'] as String;
        return await login(email: email, password: password);
      } else {
        _error = 'User not found. Please register first, or note that Phone Login requires an RLS Database bypass function.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to lookup phone number. Make sure you are connected.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Register new user
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
      // Step 1: Create auth user in Supabase
      debugPrint('📝 Starting registration for: $email');
      
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

      debugPrint('✅ Auth user created: ${response.user?.id}');

      if (response.user != null) {
        // Step 2: Create user profile in database
        try {
          debugPrint('📝 Creating user profile in database...');
          
          final insertResult = await _supabase.from('users').insert({
            'id': response.user!.id,
            'email': email,
            'full_name': fullName,
            'phone_number': phoneNumber,
            'role': role,
            'ward': ward,
            'sub_county': subCounty,
            'id_number': idNumber,
          });

          debugPrint('✅ Profile created!');
          
        } catch (e) {
          // Profile might already exist from trigger, ignore error
          debugPrint('ℹ️ Profile creation note (might already exist): $e');
        }

        // Step 3: Fetch the user profile
        await Future.delayed(const Duration(milliseconds: 500));
        await _fetchCurrentUser();

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Registration failed - no user created';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (e) {
      debugPrint('❌ AuthException: ${e.code} - ${e.message}');
      _error = 'Error: ${e.message}';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ Exception: $e');
      _error = 'Error: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    await _supabase.auth.signOut();
    _currentUser = null;
    await _prefs?.remove('saved_credentials');
    notifyListeners();
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
    } on AuthException catch (e) {
      _error = e.message;
      notifyListeners();
    }
  }

  // ==================== BIOMETRIC AUTH ====================

  /// Login with biometric authentication
  Future<bool> loginWithBiometric(String password) async {
    final savedCreds = await _getSavedCredentials();
    if (savedCreds == null) return false;

    final email = savedCreds['email'];
    if (email == null) return false;

    return await login(email: email, password: password);
  }

  /// Check if saved credentials exist
  bool hasSavedCredentials() {
    final data = _prefs?.getString('saved_credentials');
    return data != null;
  }

  /// Save credentials for biometric login
  Future<void> _saveCredentials(String identifier, String password) async {
    final creds = {
      'email': identifier,
      'password_hash': _hashCredentials(identifier, password),
    };
    await _prefs?.setString('saved_credentials', jsonEncode(creds));
  }

  /// Get saved credentials
  Future<Map<String, String>?> _getSavedCredentials() async {
    final data = _prefs?.getString('saved_credentials');
    if (data == null) return null;
    return Map<String, String>.from(jsonDecode(data));
  }

  /// Hash credentials for storage
  String _hashCredentials(String identifier, String password) {
    // Simple hash - for production use a proper hashing library
    return '${identifier}_$password'.hashCode.toString();
  }

  // ==================== PROFILE MANAGEMENT ====================

  /// Update user profile
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

  /// Clear error message
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
