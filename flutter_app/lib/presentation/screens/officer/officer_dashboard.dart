import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/user_model.dart';
import '../../widgets/status_badge.dart';

class OfficerDashboard extends StatefulWidget {
  const OfficerDashboard({super.key});

  @override
  State<OfficerDashboard> createState() => _OfficerDashboardState();
}

class _OfficerDashboardState extends State<OfficerDashboard> {
  List<Application> _applications = [];
  bool _isLoading = true;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      final applications = await apiService.getApplicationsForReview();

      setState(() {
        _applications = applications;
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Officer Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadApplications,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Stats Cards
                  Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            title: 'Pending',
                            value: _applications
                                .where((a) => a.status == 'submitted')
                                .length
                                .toString(),
                            color: AppTheme.statusSubmitted,
                            icon: Icons.pending_actions,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: _StatCard(
                            title: 'Reviewed',
                            value: _applications
                                .where((a) =>
                                    a.status == 'approved' ||
                                    a.status == 'rejected')
                                .length
                                .toString(),
                            color: AppTheme.statusApproved,
                            icon: Icons.check_circle,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Applications List
                  Expanded(
                    child: _applications.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: EdgeInsets.symmetric(horizontal: 16.w),
                            itemCount: _applications.length,
                            itemBuilder: (context, index) {
                              final app = _applications[index];
                              return _ApplicationReviewCard(
                                application: app,
                                onReview: () => _showReviewDialog(app),
                              );
                            },
                          ),
                  ),
                ],
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
            Icons.inbox_outlined,
            size: 80.w,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16.h),
          Text(
            'No applications to review',
            style: TextStyle(
              fontSize: 18.sp,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  void _showReviewDialog(Application application) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => ReviewApplicationSheet(
        application: application,
        onReviewed: _loadApplications,
      ),
    );
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
  final Color color;
  final IconData icon;

  const _StatCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
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
        children: [
          Icon(icon, color: color, size: 28.w),
          SizedBox(height: 12.h),
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
              fontSize: 14.sp,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApplicationReviewCard extends StatelessWidget {
  final Application application;
  final VoidCallback onReview;

  const _ApplicationReviewCard({
    required this.application,
    required this.onReview,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12.h),
      child: InkWell(
        onTap: onReview,
        borderRadius: BorderRadius.circular(16.r),
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      application.nurseryName,
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  StatusBadge(status: application.status),
                ],
              ),
              SizedBox(height: 8.h),
              Text(
                application.nurseryLocation,
                style: TextStyle(
                  fontSize: 14.sp,
                  color: AppTheme.textSecondary,
                ),
              ),
              SizedBox(height: 12.h),
              if (application.isSubmitted)
                SizedBox(
                  width: double.infinity,
                  height: 40.h,
                  child: ElevatedButton(
                    onPressed: onReview,
                    child: const Text('Review Application'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReviewApplicationSheet extends StatefulWidget {
  final Application application;
  final VoidCallback onReviewed;

  const ReviewApplicationSheet({
    super.key,
    required this.application,
    required this.onReviewed,
  });

  @override
  State<ReviewApplicationSheet> createState() => _ReviewApplicationSheetState();
}

class _ReviewApplicationSheetState extends State<ReviewApplicationSheet> {
  final _commentsController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _commentsController.dispose();
    super.dispose();
  }

  Future<void> _review(String action) async {
    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      await apiService.reviewApplication(
        widget.application.id,
        action: action,
        comments: _commentsController.text.trim().isEmpty
            ? null
            : _commentsController.text.trim(),
      );

      if (mounted) {
        Navigator.pop(context);
        widget.onReviewed();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              action == 'approve'
                  ? 'Application approved successfully'
                  : 'Application rejected',
            ),
            backgroundColor:
                action == 'approve' ? AppTheme.successColor : AppTheme.errorColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(24.w),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Review Application',
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          // Application Details
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DetailRow('Nursery', widget.application.nurseryName),
                _DetailRow('Location', widget.application.nurseryLocation),
                if (widget.application.nurserySize != null)
                  _DetailRow('Size', widget.application.nurserySize!),
                if (widget.application.coffeeVarieties != null)
                  _DetailRow('Varieties', widget.application.coffeeVarieties!),
              ],
            ),
          ),
          SizedBox(height: 24.h),
          // Comments
          TextField(
            controller: _commentsController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Comments (Optional)',
              hintText: 'Add your review comments...',
            ),
          ),
          SizedBox(height: 24.h),
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48.h,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : () => _review('approve'),
                    icon: _isLoading
                        ? const SizedBox.shrink()
                        : const Icon(Icons.check),
                    label: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Approve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successColor,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: SizedBox(
                  height: 48.h,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : () => _review('reject'),
                    icon: _isLoading
                        ? const SizedBox.shrink()
                        : const Icon(Icons.close),
                    label: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Reject'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.errorColor,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80.w,
            child: Text(
              '$label:',
              style: TextStyle(
                fontSize: 12.sp,
                color: AppTheme.textHint,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
