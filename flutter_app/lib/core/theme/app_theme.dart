import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF2E7D32);
  static const Color primaryLight = Color(0xFF4CAF50);
  static const Color primaryDark = Color(0xFF1B5E20);
  static const Color accentColor = Color(0xFF81C784);
  
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Colors.white;
  static const Color errorColor = Color(0xFFD32F2F);
  static const Color successColor = Color(0xFF388E3C);
  static const Color warningColor = Color(0xFFF57C00);
  
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  
  // Status Colors
  static const Color statusDraft = Color(0xFF9E9E9E);
  static const Color statusSubmitted = Color(0xFF2196F3);
  static const Color statusUnderReview = Color(0xFFFF9800);
  static const Color statusApproved = Color(0xFF4CAF50);
  static const Color statusRejected = Color(0xFFF44336);
  static const Color statusExpired = Color(0xFF9E9E9E);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        background: backgroundColor,
        error: errorColor,
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: primaryColor,
        titleTextStyle: TextStyle(
          fontSize: 18.sp,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 14.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          textStyle: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor, width: 1.5),
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 14.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          textStyle: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          textStyle: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: const BorderSide(color: errorColor),
        ),
        labelStyle: TextStyle(
          fontSize: 14.sp,
          color: textSecondary,
        ),
        hintStyle: TextStyle(
          fontSize: 14.sp,
          color: textHint,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        margin: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(
          fontSize: 12.sp,
          fontWeight: FontWeight.w500,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 12.sp,
        ),
      ),
      fontFamily: 'Poppins',
      textTheme: TextTheme(
        displayLarge: TextStyle(fontSize: 32.sp, fontWeight: FontWeight.bold, color: textPrimary),
        displayMedium: TextStyle(fontSize: 28.sp, fontWeight: FontWeight.bold, color: textPrimary),
        displaySmall: TextStyle(fontSize: 24.sp, fontWeight: FontWeight.bold, color: textPrimary),
        headlineMedium: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w600, color: textPrimary),
        headlineSmall: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600, color: textPrimary),
        titleLarge: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600, color: textPrimary),
        titleMedium: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w500, color: textPrimary),
        titleSmall: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w500, color: textSecondary),
        bodyLarge: TextStyle(fontSize: 16.sp, color: textPrimary),
        bodyMedium: TextStyle(fontSize: 14.sp, color: textPrimary),
        bodySmall: TextStyle(fontSize: 12.sp, color: textSecondary),
      ),
    );
  }

  static ThemeData get darkTheme {
    return lightTheme.copyWith(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF121212),
    );
  }

  // Helper method to get status color
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return statusDraft;
      case 'submitted':
        return statusSubmitted;
      case 'under_review':
        return statusUnderReview;
      case 'approved':
        return statusApproved;
      case 'rejected':
        return statusRejected;
      case 'expired':
        return statusExpired;
      default:
        return textSecondary;
    }
  }
}
