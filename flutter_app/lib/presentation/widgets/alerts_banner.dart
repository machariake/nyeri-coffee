import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/services/system_service.dart';

class AlertsBanner extends StatefulWidget {
  final String userRole;

  const AlertsBanner({
    super.key,
    required this.userRole,
  });

  @override
  State<AlertsBanner> createState() => _AlertsBannerState();
}

class _AlertsBannerState extends State<AlertsBanner> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final systemService = Provider.of<SystemService>(context, listen: false);
      systemService.loadAlerts(role: widget.userRole);
      systemService.loadPromotions(role: widget.userRole);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SystemService>(
      builder: (context, systemService, child) {
        if (systemService.isLoading) {
          return const SizedBox.shrink();
        }

        final alerts = systemService.alerts;
        final promotions = systemService.promotions;

        if (alerts.isEmpty && promotions.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          children: [
            // Alerts
            if (alerts.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                margin: EdgeInsets.only(bottom: 8.h),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.campaign,
                          color: Colors.red.shade700,
                          size: 20.w,
                        ),
                        SizedBox(width: 8.w),
                        Text(
                          'Important Alerts',
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.bold,
                            color: Colors.red.shade700,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),
                    ...alerts.map((alert) => _buildAlertItem(alert, systemService)),
                  ],
                ),
              ),
            ],

            // Promotions
            if (promotions.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.local_offer,
                          color: Colors.blue.shade700,
                          size: 20.w,
                        ),
                        SizedBox(width: 8.w),
                        Text(
                          'Promotions & Updates',
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),
                    ...promotions.map((promo) => _buildPromotionItem(promo, systemService)),
                  ],
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildAlertItem(Map<String, dynamic> alert, SystemService systemService) {
    final color = systemService.getAlertColor(alert['alert_type'] ?? 'info');
    final icon = systemService.getAlertIcon(alert['alert_type'] ?? 'info');

    return Container(
      margin: EdgeInsets.only(top: 8.h),
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20.w),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert['title'] ?? '',
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  alert['message'] ?? '',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey.shade700,
                  ),
                ),
                if (alert['end_date'] != null) ...[
                  SizedBox(height: 4.h),
                  Text(
                    'Valid until: ${DateFormat('MMM dd, yyyy').format(DateTime.parse(alert['end_date']))}',
                    style: TextStyle(
                      fontSize: 10.sp,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromotionItem(Map<String, dynamic> promo, SystemService systemService) {
    final color = systemService.getPromotionColor(promo['promotion_type'] ?? 'info');
    final icon = systemService.getPromotionIcon(promo['promotion_type'] ?? 'info');

    return Container(
      margin: EdgeInsets.only(top: 8.h),
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20.w),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  promo['title'] ?? '',
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  promo['message'] ?? '',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey.shade700,
                  ),
                ),
                if (promo['end_date'] != null) ...[
                  SizedBox(height: 4.h),
                  Text(
                    'Valid until: ${DateFormat('MMM dd, yyyy').format(DateTime.parse(promo['end_date']))}',
                    style: TextStyle(
                      fontSize: 10.sp,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
