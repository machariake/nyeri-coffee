import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      final stats = await apiService.getDashboardStats();

      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: EdgeInsets.all(16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome
                    Text(
                      'Welcome, Administrator',
                      style: TextStyle(
                        fontSize: 24.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      'System Overview',
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    SizedBox(height: 24.h),
                    // Stats Grid
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12.w,
                      mainAxisSpacing: 12.h,
                      children: [
                        _StatCard(
                          title: 'Total Users',
                          value: _getUserCount(),
                          icon: Icons.people,
                          color: Colors.blue,
                        ),
                        _StatCard(
                          title: 'Applications',
                          value: _getAppCount(),
                          icon: Icons.description,
                          color: AppTheme.primaryColor,
                        ),
                        _StatCard(
                          title: 'Pending',
                          value: _getPendingCount(),
                          icon: Icons.pending_actions,
                          color: AppTheme.statusSubmitted,
                        ),
                        _StatCard(
                          title: 'Certificates',
                          value: _getCertCount(),
                          icon: Icons.verified,
                          color: AppTheme.successColor,
                        ),
                      ],
                    ),
                    SizedBox(height: 24.h),
                    // Quick Actions
                    Text(
                      'Quick Actions',
                      style: TextStyle(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 16.h),
                    _ActionCard(
                      icon: Icons.people_outline,
                      title: 'User Management',
                      subtitle: 'Manage system users and officers',
                      onTap: () {
                        // Navigate to user management
                      },
                    ),
                    SizedBox(height: 12.h),
                    _ActionCard(
                      icon: Icons.bar_chart,
                      title: 'Reports & Analytics',
                      subtitle: 'View system performance metrics',
                      onTap: () {
                        // Navigate to reports
                      },
                    ),
                    SizedBox(height: 12.h),
                    _ActionCard(
                      icon: Icons.settings,
                      title: 'System Settings',
                      subtitle: 'Configure system parameters',
                      onTap: () {
                        // Navigate to settings
                      },
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  String _getUserCount() {
    if (_stats == null || _stats!['users'] == null) return '0';
    final users = _stats!['users'] as List;
    return users.fold<int>(0, (sum, u) => sum + (u['count'] as int)).toString();
  }

  String _getAppCount() {
    if (_stats == null || _stats!['applications'] == null) return '0';
    final apps = _stats!['applications'] as List;
    return apps.fold<int>(0, (sum, a) => sum + (a['count'] as int)).toString();
  }

  String _getPendingCount() {
    if (_stats == null || _stats!['applications'] == null) return '0';
    final apps = _stats!['applications'] as List;
    final pending = apps.firstWhere(
      (a) => a['status'] == 'submitted',
      orElse: () => {'count': 0},
    );
    return pending['count'].toString();
  }

  String _getCertCount() {
    if (_stats == null || _stats!['certificates'] == null) return '0';
    return _stats!['certificates']['total'].toString();
  }

  void _logout(BuildContext context) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.logout();
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 32.w),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 28.sp,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12.sp,
                  color: color.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        leading: Container(
          width: 48.w,
          height: 48.w,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12.r),
          ),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
