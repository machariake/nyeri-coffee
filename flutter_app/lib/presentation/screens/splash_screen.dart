import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../core/services/auth_service.dart';
import '../../core/services/system_service.dart';
import '../../core/theme/app_theme.dart';
import 'maintenance_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
    _navigateToNext();
  }

  void _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    final authService = Provider.of<AuthService>(context, listen: false);
    final systemService = Provider.of<SystemService>(context, listen: false);

    // Wait for auth service to initialize
    while (!authService.isInitialized) {
      await Future.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
    }

    // Check for maintenance mode (only for non-admin users)
    if (systemService.isMaintenanceMode) {
      final role = authService.currentUser?.role;
      if (role != 'admin') {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MaintenanceScreen()),
        );
        return;
      }
    }

    if (authService.isAuthenticated) {
      // Navigate based on role
      final role = authService.currentUser?.role;
      if (role == 'farmer') {
        Navigator.pushReplacementNamed(context, '/farmer/dashboard');
      } else if (role == 'officer') {
        Navigator.pushReplacementNamed(context, '/officer/dashboard');
      } else if (role == 'admin') {
        Navigator.pushReplacementNamed(context, '/admin/dashboard');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    } else {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryColor,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo Icon
                    Container(
                      width: 120.w,
                      height: 120.w,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24.r),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.eco,
                        size: 64.w,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    SizedBox(height: 32.h),
                    // App Name
                    Text(
                      'AgriCertify',
                      style: TextStyle(
                        fontSize: 36.sp,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    // Tagline
                    Text(
                      'Coffee Nursery Certificate',
                      style: TextStyle(
                        fontSize: 16.sp,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                    Text(
                      'Management System',
                      style: TextStyle(
                        fontSize: 16.sp,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                    SizedBox(height: 48.h),
                    // Loading indicator
                    SizedBox(
                      width: 40.w,
                      height: 40.w,
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.white.withOpacity(0.8),
                        ),
                        strokeWidth: 3,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
