import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  late SupabaseClient _supabase;
  RealtimeChannel? _realtimeChannel;
  bool _isInitialized = false;
  bool _isOnline = true;

  // Box for storing notifications locally
  static const String _notificationsBox = 'notifications';
  static const String _settingsBox = 'settings';

  // Get current user ID
  String? get currentUserId => _supabase.auth.currentUser?.id;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Initialize Hive boxes
      await Hive.initFlutter();
      if (!Hive.isBoxOpen(_notificationsBox)) {
        await Hive.openBox(_notificationsBox);
      }
      if (!Hive.isBoxOpen(_settingsBox)) {
        await Hive.openBox(_settingsBox);
      }

      // Initialize Supabase
      await _initializeSupabase();

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Check connectivity
      await _checkConnectivity();

      _isInitialized = true;
      debugPrint('Notification service initialized');
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
    }
  }

  Future<void> _initializeSupabase() async {
    // Initialize Supabase client
    _supabase = Supabase.instance.client;

    // Listen to auth changes
    _supabase.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.signedIn) {
        debugPrint('User signed in, subscribing to notifications');
        _subscribeToNotifications();
      } else if (data.event == AuthChangeEvent.signedOut) {
        debugPrint('User signed out, unsubscribing');
        _unsubscribeFromNotifications();
      }
    });

    // If already logged in, subscribe
    if (_supabase.auth.currentUser != null) {
      _subscribeToNotifications();
    }
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Request permissions
    await _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    const androidSettings = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidSettings);
  }

  void _subscribeToNotifications() {
    if (_realtimeChannel != null) return;

    final userId = currentUserId;
    if (userId == null) return;

    // Subscribe to real-time notifications for this user
    _realtimeChannel = _supabase.channel('notifications:$userId')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'notifications',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) {
          debugPrint('New notification received: $payload');
          _handleNewNotification(payload.newRecord);
        },
      )
      .subscribe();

    debugPrint('Subscribed to notifications for user: $userId');
  }

  void _unsubscribeFromNotifications() {
    if (_realtimeChannel != null) {
      _supabase.removeChannel(_realtimeChannel!);
      _realtimeChannel = null;
    }
  }

  void _handleNewNotification(Map<String, dynamic> data) {
    debugPrint('Handling new notification: $data');
    
    // Show local notification
    _showLocalNotification(
      title: data['title'] ?? 'Notification',
      body: data['message'] ?? '',
      payload: jsonEncode({
        'id': data['id'],
        'type': data['type'],
        'isRead': data['is_read'] ?? false,
      }),
    );
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'High Importance Notifications',
      channelDescription: 'This channel is used for important notifications',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );

    // Save to local storage
    await _saveNotification({
      'title': title,
      'body': body,
      'payload': payload,
      'timestamp': DateTime.now().toIso8601String(),
      'isRead': false,
    });
  }

  void _onNotificationTapped(NotificationResponse response) {
    debugPrint('Notification tapped: ${response.payload}');
    if (response.payload != null) {
      final data = jsonDecode(response.payload!);
      _handleNotificationAction(data);
    }
  }

  void _handleNotificationAction(Map<String, dynamic> data) {
    final type = data['type'];
    
    switch (type) {
      case 'status_change':
      case 'approval':
      case 'rejection':
        // Navigate to applications
        debugPrint('Navigate to applications');
        break;
      case 'certificate':
        // Navigate to certificates
        debugPrint('Navigate to certificates');
        break;
      case 'system':
      case 'reminder':
        // Show system message
        debugPrint('Show system message');
        break;
      default:
        debugPrint('Unknown notification type: $type');
    }
  }

  Future<void> _checkConnectivity() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    _isOnline = connectivityResult != ConnectivityResult.none;
    
    // Listen to connectivity changes
    Connectivity().onConnectivityChanged.listen((result) {
      final wasOnline = _isOnline;
      _isOnline = result != ConnectivityResult.none;
      
      if (!wasOnline && _isOnline) {
        debugPrint('Came online, syncing notifications...');
        _syncOfflineNotifications();
      }
    });
  }

  // Sync notifications when coming back online
  Future<void> _syncOfflineNotifications() async {
    try {
      if (!_isOnline || currentUserId == null) return;

      // Fetch unread notifications from Supabase
      final response = await _supabase
          .from('notifications')
          .select()
          .eq('user_id', currentUserId!)
          .eq('is_read', false)
          .order('created_at', ascending: false)
          .limit(50);

      final notifications = response as List;
      for (var notification in notifications) {
        await _saveNotification({
          'id': notification['id'],
          'title': notification['title'],
          'body': notification['message'],
          'type': notification['type'],
          'isRead': notification['is_read'] ?? false,
          'timestamp': notification['created_at'],
        });
      }

      debugPrint('Synced ${notifications.length} notifications');
    } catch (e) {
      debugPrint('Error syncing notifications: $e');
    }
  }

  // Save notification to local storage
  Future<void> _saveNotification(Map<String, dynamic> notification) async {
    final box = Hive.box(_notificationsBox);
    final key = 'notif_${notification['id'] ?? DateTime.now().millisecondsSinceEpoch}';
    await box.put(key, notification);
  }

  List<Map<String, dynamic>> getNotifications() {
    final box = Hive.box(_notificationsBox);
    final notifications = box.keys.map((k) {
      final item = Map<String, dynamic>.from(box.get(k));
      item['key'] = k;
      return item;
    }).toList();
    notifications.sort((a, b) {
      try {
        return DateTime.parse(b['timestamp']).compareTo(DateTime.parse(a['timestamp']));
      } catch (e) {
        return 0;
      }
    });
    return notifications;
  }

  // Mark notification as read in Supabase
  Future<void> markAsRead(String notificationId) async {
    try {
      if (_isOnline) {
        await _supabase
            .from('notifications')
            .update({'is_read': true}).eq('id', int.parse(notificationId.replaceAll('notif_', '')));
      }
      
      // Update local storage
      final box = Hive.box(_notificationsBox);
      final notification = box.get(notificationId);
      if (notification != null) {
        notification['isRead'] = true;
        await box.put(notificationId, notification);
      }
    } catch (e) {
      debugPrint('Error marking as read: $e');
    }
  }

  // Mark all as read
  Future<void> markAllAsRead() async {
    try {
      if (_isOnline && currentUserId != null) {
        await _supabase
            .from('notifications')
            .update({'is_read': true})
            .eq('user_id', currentUserId!)
            .eq('is_read', false);
      }
      
      // Update local storage
      final box = Hive.box(_notificationsBox);
      final keys = box.keys.toList();
      for (final key in keys) {
        final notification = box.get(key);
        if (notification != null) {
          notification['isRead'] = true;
          await box.put(key, notification);
        }
      }
    } catch (e) {
      debugPrint('Error marking all as read: $e');
    }
  }

  // Clear all notifications
  Future<void> clearAll() async {
    await Hive.box(_notificationsBox).clear();
  }

  // Get unread count
  int getUnreadCount() {
    final box = Hive.box(_notificationsBox);
    return box.values.where((e) => !(e['isRead'] ?? false)).length;
  }

  // Dispose
  void dispose() {
    _unsubscribeFromNotifications();
  }
}
