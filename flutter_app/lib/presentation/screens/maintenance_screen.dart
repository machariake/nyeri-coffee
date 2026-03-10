import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../core/services/system_service.dart';
import '../../core/theme/app_theme.dart';

class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final systemService = Provider.of<SystemService>(context);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.orange.shade700,
              Colors.orange.shade300,
              Colors.white,
            ],
            stops: const [0.0, 0.5, 0.5],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 120.w,
                    height: 120.w,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.construction,
                      size: 64.w,
                      color: Colors.orange.shade700,
                    ),
                  ),
                  SizedBox(height: 32.h),
                  Text(
                    'Under Maintenance',
                    style: TextStyle(
                      fontSize: 28.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange.shade900,
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    systemService.maintenanceMessage,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16.sp,
                      color: Colors.orange.shade700,
                    ),
                  ),
                  SizedBox(height: 48.h),
                  Container(
                    padding: EdgeInsets.all(24.w),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 48.w,
                          color: Colors.orange.shade300,
                        ),
                        SizedBox(height: 16.h),
                        Text(
                          'We\'re working hard to improve our services.\nPlease check back soon.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14.sp,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 32.h),
                  Text(
                    '© 2025 County Government of Nyeri',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: Colors.orange.shade300,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
