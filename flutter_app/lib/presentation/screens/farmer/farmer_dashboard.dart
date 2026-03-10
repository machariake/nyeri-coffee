import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import 'farmer_home_screen.dart';
import 'farmer_applications_screen.dart';
import 'farmer_certificates_screen.dart';
import 'farmer_profile_screen.dart';

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FarmerHomeScreen(),
    const FarmerApplicationsScreen(),
    const FarmerCertificatesScreen(),
    const FarmerProfileScreen(),
  ];

  final List<String> _titles = [
    'Home',
    'My Applications',
    'Certificates',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Show notifications
            },
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.description_outlined),
            activeIcon: Icon(Icons.description),
            label: 'Applications',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.verified_outlined),
            activeIcon: Icon(Icons.verified),
            label: 'Certificates',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 1
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.pushNamed(context, '/farmer/apply');
              },
              icon: const Icon(Icons.add),
              label: const Text('New Application'),
            )
          : null,
    );
  }
}
