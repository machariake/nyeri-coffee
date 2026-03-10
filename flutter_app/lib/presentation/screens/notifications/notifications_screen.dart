import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:hive_flutter/hive_flutter.dart';

import '../../../core/services/notification_service.dart';
import '../../../core/theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService _notificationService = NotificationService();
  List<Map<String, dynamic>> _notifications = [];
  bool _showOnlyUnread = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  void _loadNotifications() {
    setState(() {
      _notifications = _notificationService.getNotifications();
      if (_showOnlyUnread) {
        _notifications = _notifications.where((n) => !(n['isRead'] ?? false)).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          if (_notifications.any((n) => !(n['isRead'] ?? false)))
            IconButton(
              icon: const Icon(Icons.done_all),
              onPressed: () async {
                await _notificationService.markAllAsRead();
                _loadNotifications();
              },
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'clear') {
                _showClearConfirmation();
              } else if (value == 'filter') {
                setState(() {
                  _showOnlyUnread = !_showOnlyUnread;
                  _loadNotifications();
                });
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'filter',
                child: Row(
                  children: [
                    Icon(Icons.filter_list),
                    SizedBox(width: 8),
                    Text('Filter'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'clear',
                child: Row(
                  children: [
                    Icon(Icons.delete_sweep, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Clear All', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _notifications.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: () async {
                _loadNotifications();
              },
              child: ListView.builder(
                padding: EdgeInsets.all(16.w),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  return _NotificationCard(
                    notification: notification,
                    onTap: () => _markAsRead(notification),
                    onDelete: () => _deleteNotification(notification),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _showOnlyUnread ? Icons.notifications_none : Icons.notifications_none,
            size: 80.w,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16.h),
          Text(
            _showOnlyUnread ? 'No unread notifications' : 'No notifications yet',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            _showOnlyUnread
                ? 'All caught up!'
                : 'Your notifications will appear here',
            style: TextStyle(
              fontSize: 14.sp,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ),
    );
  }

  void _markAsRead(Map<String, dynamic> notification) async {
    final key = notification['key'];
    if (key != null && !(notification['isRead'] ?? false)) {
      await _notificationService.markAsRead(key.toString());
      _loadNotifications();
    }
  }

  void _deleteNotification(Map<String, dynamic> notification) async {
    final key = notification['key'];
    if (key != null) {
      await Hive.box('notifications').delete(key);
      _loadNotifications();
    }
  }

  void _showClearConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Notifications'),
        content: const Text('Are you sure you want to clear all notifications? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await _notificationService.clearAll();
              if (context.mounted) {
                Navigator.pop(context);
                _loadNotifications();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  IconData _getIconForType(String type) {
    switch (type) {
      case 'status_change':
        return Icons.update;
      case 'approval':
        return Icons.check_circle;
      case 'rejection':
        return Icons.cancel;
      case 'reminder':
        return Icons.alarm;
      case 'system':
        return Icons.info;
      default:
        return Icons.notifications;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'status_change':
        return Colors.blue;
      case 'approval':
        return Colors.green;
      case 'rejection':
        return Colors.red;
      case 'reminder':
        return Colors.orange;
      case 'system':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRead = notification['isRead'] ?? false;
    final type = notification['type'] ?? 'system';
    final timestamp = notification['timestamp'] != null
        ? DateTime.parse(notification['timestamp'])
        : DateTime.now();

    return Dismissible(
      key: Key(notification['key'] ?? timestamp.toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: EdgeInsets.only(right: 16.w),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: Card(
        margin: EdgeInsets.only(bottom: 12.h),
        color: isRead ? Colors.white : AppTheme.primaryColor.withOpacity(0.05),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12.r),
          child: Padding(
            padding: EdgeInsets.all(16.w),
            child: Row(
              children: [
                Container(
                  width: 48.w,
                  height: 48.w,
                  decoration: BoxDecoration(
                    color: _getColorForType(type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(
                    _getIconForType(type),
                    color: _getColorForType(type),
                    size: 24.w,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification['title'] ?? 'Notification',
                              style: TextStyle(
                                fontSize: 16.sp,
                                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (!isRead)
                            Container(
                              width: 8.w,
                              height: 8.w,
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      SizedBox(height: 4.h),
                      Text(
                        notification['body'] ?? '',
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 8.h),
                      Text(
                        DateFormat('MMM dd, yyyy • hh:mm a').format(timestamp),
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: AppTheme.textHint,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
