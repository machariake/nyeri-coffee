import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/user_model.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/alerts_banner.dart';

class FarmerHomeScreen extends StatefulWidget {
  const FarmerHomeScreen({super.key});

  @override
  State<FarmerHomeScreen> createState() => _FarmerHomeScreenState();
}

class _FarmerHomeScreenState extends State<FarmerHomeScreen> {
  List<Application> _recentApplications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);
      
      final applications = await apiService.getMyApplications();
      
      setState(() {
        _recentApplications = applications.take(5).toList();
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
    final authService = Provider.of<AuthService>(context);
    final user = authService.currentUser;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Alerts and Promotions Banner
            AlertsBanner(userRole: 'farmer'),

            // Welcome Card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(20.w),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20.r),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28.w,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Icon(
                          Icons.person,
                          size: 28.w,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 16.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome back,',
                              style: TextStyle(
                                fontSize: 14.sp,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              user?.fullName ?? 'Farmer',
                              style: TextStyle(
                                fontSize: 20.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 20.h),
                  Text(
                    'Manage your coffee nursery certificates easily',
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),
            // Quick Actions
            Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            SizedBox(height: 16.h),
            Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.add_circle,
                    title: 'Apply for\nCertificate',
                    color: AppTheme.primaryColor,
                    onTap: () {
                      Navigator.pushNamed(context, '/farmer/apply');
                    },
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.description,
                    title: 'View\nApplications',
                    color: AppTheme.statusSubmitted,
                    onTap: () {
                      // Switch to applications tab
                    },
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.verified,
                    title: 'My\nCertificates',
                    color: AppTheme.statusApproved,
                    onTap: () {
                      // Switch to certificates tab
                    },
                  ),
                ),
              ],
            ),
            SizedBox(height: 24.h),
            // Recent Applications
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Applications',
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    // Navigate to all applications
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
            SizedBox(height: 12.h),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _recentApplications.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _recentApplications.length,
                        itemBuilder: (context, index) {
                          final app = _recentApplications[index];
                          return _ApplicationCard(application: app);
                        },
                      ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.all(32.w),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 48.w,
            color: Colors.grey[400],
          ),
          SizedBox(height: 12.h),
          Text(
            'No applications yet',
            style: TextStyle(
              fontSize: 16.sp,
              color: AppTheme.textSecondary,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'Start by applying for a coffee nursery certificate',
            style: TextStyle(
              fontSize: 12.sp,
              color: AppTheme.textHint,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32.w, color: color),
            SizedBox(height: 8.h),
            Text(
              title,
              style: TextStyle(
                fontSize: 12.sp,
                fontWeight: FontWeight.w500,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  final Application application;

  const _ApplicationCard({required this.application});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        title: Text(
          application.nurseryName,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 4.h),
            Text(
              application.nurseryLocation,
              style: TextStyle(
                fontSize: 12.sp,
                color: AppTheme.textSecondary,
              ),
            ),
            SizedBox(height: 8.h),
            StatusBadge(status: application.status),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          // Navigate to application details
        },
      ),
    );
  }
}
