import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'core/services/auth_service.dart';
import 'core/services/system_service.dart';
import 'core/services/notification_service.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/farmer/farmer_dashboard.dart';
import 'presentation/screens/officer/officer_dashboard.dart';
import 'presentation/screens/admin/admin_dashboard.dart';
import 'presentation/screens/notifications/notifications_screen.dart';

// Bypass SSL certificate errors on older Android emulators
class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
  }
}



void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = MyHttpOverrides();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://iafxrxlrjspwbltsjzqz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZnhyeGxyanNwd2JsdHNqenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTIwOTgsImV4cCI6MjA4ODQ4ODA5OH0.3PrPUXMP9tg0v2M_LkqlNLBz3DokRwmAkn5_fRODxyI',
  );
  
  // Initialize notifications
  final notificationService = NotificationService();
  await notificationService.initialize();
  
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthService()),
            ChangeNotifierProvider(create: (_) => SystemService()),
          ],
          child: MaterialApp(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.light,
            initialRoute: '/',
            routes: {
              '/': (context) => const SplashScreen(),
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/farmer/dashboard': (context) => const FarmerDashboard(),
              '/officer/dashboard': (context) => const OfficerDashboard(),
              '/admin/dashboard': (context) => const AdminDashboard(),
              '/notifications': (context) => const NotificationsScreen(),
            },
          ),
        );
      },
    );
  }
}
