import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseDatabaseService {
  static final SupabaseDatabaseService _instance = SupabaseDatabaseService._internal();
  factory SupabaseDatabaseService() => _instance;
  SupabaseDatabaseService._internal();

  final SupabaseClient _supabase = Supabase.instance.client;

  // Get current user ID
  String? get userId => _supabase.auth.currentUser?.id;

  // ==================== APPLICATIONS ====================

  /// Get all applications for current user
  Future<List<Map<String, dynamic>>> getMyApplications() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      final response = await _supabase
          .from('applications')
          .select('''
            *,
            certificates (
              certificate_number,
              issue_date,
              expiry_date
            )
          ''')
          .eq('user_id', currentUserId)
          .order('created_at', ascending: false);

      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load applications: $error');
    }
  }

  /// Get single application by ID
  Future<Map<String, dynamic>?> getApplication(int applicationId) async {
    try {
      final response = await _supabase
          .from('applications')
          .select('''
            *,
            documents (
              id,
              document_type,
              file_name,
              file_path,
              uploaded_at
            ),
            certificates (
              certificate_number,
              issue_date,
              expiry_date,
              status
            )
          ''')
          .eq('id', applicationId)
          .maybeSingle();

      return response as Map<String, dynamic>?;
    } catch (error) {
      throw Exception('Failed to load application: $error');
    }
  }

  /// Create new application
  Future<Map<String, dynamic>> createApplication({
    required String nurseryName,
    required String nurseryLocation,
    String? nurserySize,
    String? coffeeVarieties,
    int? expectedSeedlings,
  }) async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      // Generate unique app ID
      final appId = 'APP${DateTime.now().millisecondsSinceEpoch}';

      final response = await _supabase
          .from('applications')
          .insert({
            'app_id': appId,
            'user_id': currentUserId,
            'nursery_name': nurseryName,
            'nursery_location': nurseryLocation,
            'nursery_size': nurserySize,
            'coffee_varieties': coffeeVarieties,
            'expected_seedlings': expectedSeedlings,
            'status': 'draft',
          })
          .select()
          .single();

      return response as Map<String, dynamic>;
    } catch (error) {
      throw Exception('Failed to create application: $error');
    }
  }

  /// Submit application
  Future<void> submitApplication(int applicationId) async {
    try {
      await _supabase
          .from('applications')
          .update({
            'status': 'submitted',
            'submitted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', applicationId);
    } catch (error) {
      throw Exception('Failed to submit application: $error');
    }
  }

  /// Update application
  Future<void> updateApplication(int applicationId, Map<String, dynamic> data) async {
    try {
      await _supabase
          .from('applications')
          .update(data)
          .eq('id', applicationId);
    } catch (error) {
      throw Exception('Failed to update application: $error');
    }
  }

  /// Delete application
  Future<void> deleteApplication(int applicationId) async {
    try {
      // First delete associated documents
      await _supabase
          .from('documents')
          .delete()
          .eq('application_id', applicationId);

      // Then delete application
      await _supabase
          .from('applications')
          .delete()
          .eq('id', applicationId);
    } catch (error) {
      throw Exception('Failed to delete application: $error');
    }
  }

  /// Get applications for review (Officer/Admin)
  Future<List<Map<String, dynamic>>> getApplicationsForReview({String? status}) async {
    try {
      var query = _supabase
          .from('applications')
          .select('''
            *,
            users (
              full_name,
              email,
              phone_number
            )
          ''')
          .order('created_at', ascending: false);

      if (status != null) {
        query = query.eq('status', status);
      }

      final response = await query;
      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load applications: $error');
    }
  }

  /// Review application (Officer/Admin)
  Future<void> reviewApplication(int applicationId, {
    required String action,
    String? comments,
  }) async {
    try {
      final status = action == 'approve' ? 'approved' : 'rejected';
      
      await _supabase
          .from('applications')
          .update({
            'status': status,
            'review_comments': comments,
            'reviewed_at': DateTime.now().toIso8601String(),
            'reviewed_by': userId,
          })
          .eq('id', applicationId);
    } catch (error) {
      throw Exception('Failed to review application: $error');
    }
  }

  // ==================== CERTIFICATES ====================

  /// Get my certificates
  Future<List<Map<String, dynamic>>> getMyCertificates() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      final response = await _supabase
          .from('certificates')
          .select()
          .eq('user_id', currentUserId)
          .order('created_at', ascending: false);

      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load certificates: $error');
    }
  }

  /// Get certificate by ID
  Future<Map<String, dynamic>?> getCertificate(int certificateId) async {
    try {
      final response = await _supabase
          .from('certificates')
          .select()
          .eq('id', certificateId)
          .maybeSingle();

      return response as Map<String, dynamic>?;
    } catch (error) {
      throw Exception('Failed to load certificate: $error');
    }
  }

  // ==================== DOCUMENTS ====================

  /// Upload document
  Future<Map<String, dynamic>> uploadDocument({
    required int applicationId,
    required String documentType,
    required String filePath,
    required String fileName,
  }) async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      // Upload file to Supabase Storage
      final file = await _supabase.storage
          .from('documents')
          .upload(
            '$currentUserId/$applicationId/$fileName',
            filePath,
            fileOptions: const FileOptions(upsert: true),
          );

      // Get public URL
      final publicUrl = _supabase.storage
          .from('documents')
          .getPublicUrl('$currentUserId/$applicationId/$fileName');

      // Save document record
      final response = await _supabase
          .from('documents')
          .insert({
            'application_id': applicationId,
            'document_type': documentType,
            'file_name': fileName,
            'file_path': publicUrl,
            'file_size': 0, // Calculate if needed
          })
          .select()
          .single();

      return response as Map<String, dynamic>;
    } catch (error) {
      throw Exception('Failed to upload document: $error');
    }
  }

  /// Get documents for application
  Future<List<Map<String, dynamic>>> getDocuments(int applicationId) async {
    try {
      final response = await _supabase
          .from('documents')
          .select()
          .eq('application_id', applicationId);

      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load documents: $error');
    }
  }

  /// Delete document
  Future<void> deleteDocument(int documentId) async {
    try {
      // Get document to find file path
      final docs = await _supabase
          .from('documents')
          .select('file_path')
          .eq('id', documentId);

      if (docs.isNotEmpty) {
        // Delete from storage
        final filePath = docs.first['file_path'] as String;
        // Extract relative path and delete from storage
        // await _supabase.storage.from('documents').remove([filePath]);
      }

      // Delete record
      await _supabase
          .from('documents')
          .delete()
          .eq('id', documentId);
    } catch (error) {
      throw Exception('Failed to delete document: $error');
    }
  }

  // ==================== USERS ====================

  /// Get user profile
  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      final response = await _supabase
          .from('users')
          .select()
          .eq('id', userId)
          .maybeSingle();

      return response as Map<String, dynamic>?;
    } catch (error) {
      throw Exception('Failed to load user profile: $error');
    }
  }

  /// Get all users (Admin)
  Future<List<Map<String, dynamic>>> getAllUsers({
    String? role,
    String? search,
  }) async {
    try {
      var query = _supabase.from('users').select();

      if (role != null) {
        query = query.eq('role', role);
      }

      if (search != null) {
        query = query.or('full_name.ilike.%$search%,email.ilike.%$search%');
      }

      final response = await query.order('created_at', ascending: false);
      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load users: $error');
    }
  }

  /// Update user profile
  Future<void> updateUserProfile(String userId, Map<String, dynamic> data) async {
    try {
      await _supabase
          .from('users')
          .update(data)
          .eq('id', userId);
    } catch (error) {
      throw Exception('Failed to update profile: $error');
    }
  }

  // ==================== NOTIFICATIONS ====================

  /// Get my notifications
  Future<List<Map<String, dynamic>>> getMyNotifications() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      final response = await _supabase
          .from('notifications')
          .select()
          .eq('user_id', currentUserId)
          .order('created_at', ascending: false);

      return response as List<Map<String, dynamic>>;
    } catch (error) {
      throw Exception('Failed to load notifications: $error');
    }
  }

  /// Mark notification as read
  Future<void> markNotificationAsRead(int notificationId) async {
    try {
      await _supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('id', notificationId);
    } catch (error) {
      throw Exception('Failed to mark notification as read: $error');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsAsRead() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      await _supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', currentUserId)
          .eq('is_read', false);
    } catch (error) {
      throw Exception('Failed to mark notifications as read: $error');
    }
  }

  /// Get unread notification count
  Future<int> getUnreadNotificationCount() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) return 0;

      final response = await _supabase
          .from('notifications')
          .select('id', count: CountOption.exact)
          .eq('user_id', currentUserId)
          .eq('is_read', false);

      return response.length;
    } catch (error) {
      return 0;
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================

  /// Subscribe to application updates
  Stream<Map<String, dynamic>> subscribeToApplication(int applicationId) {
    return _supabase
        .channel('applications:$applicationId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'applications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: applicationId,
          ),
          callback: (payload) {
            // Handle update
          },
        )
        .subscribe()
        .stream
        .map((event) => event as Map<String, dynamic>);
  }

  /// Subscribe to notifications
  Stream<Map<String, dynamic>> subscribeToNotifications() {
    final currentUserId = userId;
    if (currentUserId == null) {
      return const Stream.empty();
    }

    return _supabase
        .channel('notifications:$currentUserId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: currentUserId,
          ),
          callback: (payload) {
            // Handle new notification
          },
        )
        .subscribe()
        .stream
        .map((event) => event as Map<String, dynamic>);
  }

  /// Unsubscribe from channel
  Future<void> unsubscribeFromChannel(String channelName) async {
    await _supabase.removeChannel(channelName);
  }

  // ==================== ANALYTICS ====================

  /// Get dashboard stats
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final currentUserId = userId;
      if (currentUserId == null) throw Exception('User not logged in');

      // Get application counts by status
      final appsResponse = await _supabase
          .from('applications')
          .select('status')
          .eq('user_id', currentUserId);

      final apps = appsResponse as List;
      final stats = <String, int>{};

      for (var app in apps) {
        final status = app['status'] as String;
        stats[status] = (stats[status] ?? 0) + 1;
      }

      // Get certificate count
      final certsResponse = await _supabase
          .from('certificates')
          .select('id')
          .eq('user_id', currentUserId);

      return {
        'total_applications': apps.length,
        'by_status': stats,
        'total_certificates': (certsResponse as List).length,
      };
    } catch (error) {
      throw Exception('Failed to load stats: $error');
    }
  }
}
