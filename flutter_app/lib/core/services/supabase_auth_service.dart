import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseAuthService {
  static final SupabaseAuthService _instance = SupabaseAuthService._internal();
  factory SupabaseAuthService() => _instance;
  SupabaseAuthService._internal();

  final SupabaseClient _supabase = Supabase.instance.client;

  // Get current user
  User? get currentUser => _supabase.auth.currentUser;
  
  // Get current session
  AuthSession? get currentSession => _supabase.auth.currentSession;

  // Stream for auth state changes
  Stream<AuthState> get onAuthStateChange => _supabase.auth.onAuthStateChange;

  // Sign up with email
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    Map<String, dynamic>? userData,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: userData, // Additional user data (name, phone, etc.)
      );
      
      return response;
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Sign up failed: $error');
    }
  }

  // Sign in with email
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      return response;
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Sign in failed: $error');
    }
  }

  // Sign in with phone (OTP)
  Future<void> signInWithPhone({
    required String phone,
  }) async {
    try {
      await _supabase.auth.signInWithOtp(
        phone: phone,
      );
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Phone sign in failed: $error');
    }
  }

  // Verify OTP for phone sign in
  Future<AuthResponse> verifyPhoneOTP({
    required String phone,
    required String token,
  }) async {
    try {
      final response = await _supabase.auth.verifyOTP(
        phone: phone,
        token: token,
        type: OtpType.sms,
      );
      
      return response;
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Phone verification failed: $error');
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _supabase.auth.signOut();
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Sign out failed: $error');
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _supabase.auth.resetPasswordForEmail(email);
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Password reset failed: $error');
    }
  }

  // Update user profile
  Future<UserResponse> updateUser({
    String? email,
    String? phone,
    String? password,
    Map<String, dynamic>? data,
  }) async {
    try {
      final response = await _supabase.auth.updateUser(
        UserAttributes(
          email: email,
          phone: phone,
          password: password,
          data: data,
        ),
      );
      
      return response;
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Update failed: $error');
    }
  }

  // Check if user is logged in
  bool get isLoggedIn => currentUser != null;

  // Get user ID
  String? get userId => currentUser?.id;

  // Get user email
  String? get userEmail => currentUser?.email;

  // Get user metadata
  Map<String, dynamic>? get userMetadata => currentUser?.userMetadata;

  // Refresh session
  Future<AuthSession> refreshSession() async {
    try {
      final response = await _supabase.auth.refreshSession();
      return response.session!;
    } on AuthException catch (error) {
      throw Exception(error.message);
    } catch (error) {
      throw Exception('Session refresh failed: $error');
    }
  }
}
