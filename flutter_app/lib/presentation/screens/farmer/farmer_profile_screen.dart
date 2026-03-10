import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import 'edit_profile_screen.dart';

class FarmerProfileScreen extends StatelessWidget {
  const FarmerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final user = authService.currentUser;

    return Scaffold(
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          children: [
            // Profile Header
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(24.w),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.primaryLight],
                ),
                borderRadius: BorderRadius.circular(20.r),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50.w,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: Icon(
                      Icons.person,
                      size: 50.w,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    user?.fullName ?? 'User',
                    style: TextStyle(
                      fontSize: 24.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    user?.email ?? '',
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 16.w,
                      vertical: 6.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Text(
                      (user?.role ?? 'USER').toUpperCase(),
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),
            // Profile Details
            _ProfileSection(
              title: 'Personal Information',
              children: [
                _ProfileItem(
                  icon: Icons.phone,
                  label: 'Phone Number',
                  value: user?.phoneNumber ?? 'Not set',
                ),
                if (user?.ward != null)
                  _ProfileItem(
                    icon: Icons.location_on,
                    label: 'Ward',
                    value: user!.ward!,
                  ),
                if (user?.subCounty != null)
                  _ProfileItem(
                    icon: Icons.map,
                    label: 'Sub-County',
                    value: user!.subCounty!,
                  ),
                if (user?.idNumber != null)
                  _ProfileItem(
                    icon: Icons.badge,
                    label: 'ID Number',
                    value: user!.idNumber!,
                  ),
              ],
            ),
            SizedBox(height: 24.h),
            // Actions
            _ProfileSection(
              title: 'Account',
              children: [
                _ActionItem(
                  icon: Icons.edit,
                  label: 'Edit Profile',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const EditProfileScreen(),
                      ),
                    );
                  },
                ),
                _ActionItem(
                  icon: Icons.lock,
                  label: 'Change Password',
                  onTap: () {
                    // Navigate to change password
                  },
                ),
                _ActionItem(
                  icon: Icons.help,
                  label: 'Help & Support',
                  onTap: () {
                    // Show help
                  },
                ),
                _ActionItem(
                  icon: Icons.info,
                  label: 'About',
                  onTap: () {
                    _showAboutDialog(context);
                  },
                ),
              ],
            ),
            SizedBox(height: 24.h),
            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 52.h,
              child: OutlinedButton.icon(
                onPressed: () => _showLogoutDialog(context),
                icon: const Icon(Icons.logout),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: BorderSide(color: AppTheme.errorColor),
                ),
              ),
            ),
            SizedBox(height: 32.h),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final authService = Provider.of<AuthService>(context, listen: false);
              await authService.logout();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About AgriCertify'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.eco,
              size: 64,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 16),
            const Text(
              'AgriCertify',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text('Coffee Nursery Certificate Management System'),
            const SizedBox(height: 8),
            const Text('Version 1.0.0'),
            const SizedBox(height: 16),
            const Text(
              '© 2025 County Government of Nyeri',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _ProfileSection({
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        SizedBox(height: 12.h),
        Card(
          margin: EdgeInsets.zero,
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }
}

class _ProfileItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ProfileItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 12.sp,
          color: AppTheme.textHint,
        ),
      ),
      subtitle: Text(
        value,
        style: TextStyle(
          fontSize: 14.sp,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
