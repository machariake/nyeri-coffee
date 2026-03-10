import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double? fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getStatusColor(status);
    
    String displayStatus = status.replaceAll('_', ' ').toUpperCase();
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        displayStatus,
        style: TextStyle(
          fontSize: fontSize ?? 10.sp,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
