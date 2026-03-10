import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as path;

import '../constants/app_constants.dart';
import '../models/user_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;

  void setAuthToken(String token) {
    _authToken = token;
  }

  void clearAuthToken() {
    _authToken = null;
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // Applications
  Future<List<Application>> getMyApplications() async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/applications/my-applications'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final apps = data['data']['applications'] as List;
      return apps.map((a) => Application.fromJson(a)).toList();
    }
    throw Exception(data['message'] ?? 'Failed to load applications');
  }

  Future<Application> createApplication({
    required String nurseryName,
    required String nurseryLocation,
    String? nurserySize,
    String? coffeeVarieties,
    int? expectedSeedlings,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/applications'),
      headers: _headers,
      body: jsonEncode({
        'nurseryName': nurseryName,
        'nurseryLocation': nurseryLocation,
        'nurserySize': nurserySize,
        'coffeeVarieties': coffeeVarieties,
        'expectedSeedlings': expectedSeedlings,
      }),
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return Application.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'Failed to create application');
  }

  Future<void> submitApplication(int applicationId) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/applications/$applicationId/submit'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to submit application');
    }
  }

  // Officer: Get applications for review
  Future<List<Application>> getApplicationsForReview({String? status}) async {
    var url = '${AppConstants.baseUrl}/applications/officer/review-list';
    if (status != null) {
      url += '?status=$status';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final apps = data['data']['applications'] as List;
      return apps.map((a) => Application.fromJson(a)).toList();
    }
    throw Exception(data['message'] ?? 'Failed to load applications');
  }

  // Officer: Review application
  Future<void> reviewApplication(int applicationId, {
    required String action,
    String? comments,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/applications/$applicationId/review'),
      headers: _headers,
      body: jsonEncode({
        'action': action,
        'comments': comments,
      }),
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to review application');
    }
  }

  // Certificates
  Future<List<Certificate>> getMyCertificates() async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/certificates/my-certificates'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final certs = data['data']['certificates'] as List;
      return certs.map((c) => Certificate.fromJson(c)).toList();
    }
    throw Exception(data['message'] ?? 'Failed to load certificates');
  }

  // Notifications
  Future<List<Notification>> getNotifications() async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/notifications'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      final notifs = data['data']['notifications'] as List;
      return notifs.map((n) => Notification.fromJson(n)).toList();
    }
    throw Exception(data['message'] ?? 'Failed to load notifications');
  }

  Future<void> markNotificationAsRead(int notificationId) async {
    final response = await http.put(
      Uri.parse('${AppConstants.baseUrl}/notifications/$notificationId/read'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to mark notification as read');
    }
  }

  // Upload document
  Future<void> uploadDocument(int applicationId, XFile file, String documentType) async {
    final uri = Uri.parse('${AppConstants.baseUrl}/documents/$applicationId/upload');
    final request = http.MultipartRequest('POST', uri);
    
    request.headers['Authorization'] = 'Bearer $_authToken';
    request.fields['documentType'] = documentType;
    
    final bytes = await file.readAsBytes();
    final multipartFile = http.MultipartFile.fromBytes(
      'document',
      bytes,
      filename: file.name,
      contentType: MediaType('application', 'octet-stream'),
    );
    
    request.files.add(multipartFile);
    
    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    final data = jsonDecode(responseData);
    
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to upload document');
    }
  }

  // Admin: Get all users
  Future<List<Map<String, dynamic>>> getAllUsers({
    String? role,
    String? search,
    int page = 1,
  }) async {
    var url = '${AppConstants.baseUrl}/users?page=$page';
    if (role != null) url += '&role=$role';
    if (search != null) url += '&search=$search';

    final response = await http.get(
      Uri.parse(url),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return List<Map<String, dynamic>>.from(data['data']['users']);
    }
    throw Exception(data['message'] ?? 'Failed to load users');
  }

  // Admin: Dashboard stats
  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/reports/dashboard'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load dashboard stats');
  }

  // Delete application
  Future<void> deleteApplication(int applicationId) async {
    final response = await http.delete(
      Uri.parse('${AppConstants.baseUrl}/applications/$applicationId'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to delete application');
    }
  }

  // Promotions Management (Admin)
  Future<List<Map<String, dynamic>>> getPromotions({String role = 'all'}) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}/system/promotions?role=$role'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return List<Map<String, dynamic>>.from(data['data']);
    }
    throw Exception(data['message'] ?? 'Failed to load promotions');
  }

  Future<Map<String, dynamic>> createPromotion({
    required String title,
    required String message,
    String promotionType = 'info',
    int priority = 0,
    String showTo = 'all',
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/system/promotions'),
      headers: _headers,
      body: jsonEncode({
        'title': title,
        'message': message,
        'promotion_type': promotionType,
        'priority': priority,
        'show_to': showTo,
        'start_date': startDate?.toIso8601String(),
        'end_date': endDate?.toIso8601String(),
      }),
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to create promotion');
  }

  Future<void> updatePromotion(int id, {
    String? title,
    String? message,
    String? promotionType,
    int? priority,
    bool? isActive,
    String? showTo,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final response = await http.put(
      Uri.parse('${AppConstants.baseUrl}/system/promotions/$id'),
      headers: _headers,
      body: jsonEncode({
        if (title != null) 'title': title,
        if (message != null) 'message': message,
        if (promotionType != null) 'promotion_type': promotionType,
        if (priority != null) 'priority': priority,
        if (isActive != null) 'is_active': isActive,
        if (showTo != null) 'show_to': showTo,
        if (startDate != null) 'start_date': startDate.toIso8601String(),
        if (endDate != null) 'end_date': endDate.toIso8601String(),
      }),
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to update promotion');
    }
  }

  Future<void> deletePromotion(int id) async {
    final response = await http.delete(
      Uri.parse('${AppConstants.baseUrl}/system/promotions/$id'),
      headers: _headers,
    );

    final data = jsonDecode(response.body);
    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'Failed to delete promotion');
    }
  }
}
