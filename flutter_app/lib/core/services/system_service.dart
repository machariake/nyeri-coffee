import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';

class SystemService extends ChangeNotifier {
  bool _isMaintenanceMode = false;
  String _maintenanceMessage = 'System is under maintenance';
  List<Map<String, dynamic>> _promotions = [];
  List<Map<String, dynamic>> _alerts = [];
  bool _isLoading = false;

  bool get isMaintenanceMode => _isMaintenanceMode;
  String get maintenanceMessage => _maintenanceMessage;
  List<Map<String, dynamic>> get promotions => _promotions;
  List<Map<String, dynamic>> get alerts => _alerts;
  bool get isLoading => _isLoading;

  SystemService() {
    _loadSystemSettings();
  }

  Future<void> _loadSystemSettings() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/system/settings'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _isMaintenanceMode = data['data']['maintenance_mode'] ?? false;
          _maintenanceMessage = data['data']['maintenance_message'] ?? 'System is under maintenance';
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error loading system settings: $e');
    }
  }

  Future<void> loadPromotions({String role = 'all'}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/system/promotions?role=$role'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _promotions = List<Map<String, dynamic>>.from(data['data']);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error loading promotions: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAlerts({String role = 'all'}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/system/alerts?role=$role'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _alerts = List<Map<String, dynamic>>.from(data['data']);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error loading alerts: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Color getPromotionColor(String type) {
    switch (type) {
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      case 'promo':
        return Colors.purple;
      default:
        return Colors.blue;
    }
  }

  Color getAlertColor(String type) {
    switch (type) {
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      case 'urgent':
        return Colors.red.shade700;
      default:
        return Colors.blue;
    }
  }

  IconData getPromotionIcon(String type) {
    switch (type) {
      case 'success':
        return Icons.check_circle;
      case 'warning':
        return Icons.warning;
      case 'error':
        return Icons.error;
      case 'promo':
        return Icons.local_offer;
      default:
        return Icons.info;
    }
  }

  IconData getAlertIcon(String type) {
    switch (type) {
      case 'success':
        return Icons.check_circle;
      case 'warning':
        return Icons.warning;
      case 'error':
        return Icons.error;
      case 'urgent':
        return Icons.priority_high;
      default:
        return Icons.info;
    }
  }
}
