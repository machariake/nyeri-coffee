import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _fullNameController;
  late TextEditingController _phoneNumberController;
  late TextEditingController _wardController;
  late TextEditingController _subCountyController;
  late TextEditingController _idNumberController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final authService = Provider.of<AuthService>(context, listen: false);
    final user = authService.currentUser;

    _fullNameController = TextEditingController(text: user?.fullName ?? '');
    _phoneNumberController = TextEditingController(text: user?.phoneNumber ?? '');
    _wardController = TextEditingController(text: user?.ward ?? '');
    _subCountyController = TextEditingController(text: user?.subCounty ?? '');
    _idNumberController = TextEditingController(text: user?.idNumber ?? '');
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneNumberController.dispose();
    _wardController.dispose();
    _subCountyController.dispose();
    _idNumberController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authService = Provider.of<AuthService>(context, listen: false);
    final success = await authService.updateProfile({
      'fullName': _fullNameController.text.trim(),
      'phoneNumber': _phoneNumberController.text.trim(),
      'ward': _wardController.text.trim(),
      'subCounty': _subCountyController.text.trim(),
      'idNumber': _idNumberController.text.trim(),
    });

    setState(() => _isLoading = false);

    if (success) {
      Fluttertoast.showToast(
        msg: 'Profile updated successfully!',
        backgroundColor: AppTheme.successColor,
      );
      if (mounted) {
        Navigator.pop(context);
      }
    } else {
      Fluttertoast.showToast(
        msg: authService.error ?? 'Failed to update profile',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile Avatar
              CircleAvatar(
                radius: 50.w,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                child: Icon(
                  Icons.person,
                  size: 50.w,
                  color: AppTheme.primaryColor,
                ),
              ),
              SizedBox(height: 24.h),
              // Full Name
              TextFormField(
                controller: _fullNameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your full name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Full name is required';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),
              // Phone Number
              TextFormField(
                controller: _phoneNumberController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: 'Enter your phone number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Phone number is required';
                  }
                  if (value.length < 10) {
                    return 'Enter a valid phone number';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),
              // Ward
              TextFormField(
                controller: _wardController,
                decoration: const InputDecoration(
                  labelText: 'Ward',
                  hintText: 'Enter your ward',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              SizedBox(height: 16.h),
              // Sub-County
              TextFormField(
                controller: _subCountyController,
                decoration: const InputDecoration(
                  labelText: 'Sub-County',
                  hintText: 'Enter your sub-county',
                  prefixIcon: Icon(Icons.map_outlined),
                ),
              ),
              SizedBox(height: 16.h),
              // ID Number
              TextFormField(
                controller: _idNumberController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'ID Number',
                  hintText: 'Enter your ID number',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              SizedBox(height: 32.h),
              // Save Button
              SizedBox(
                width: double.infinity,
                height: 52.h,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  child: _isLoading
                      ? const CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        )
                      : const Text('Save Changes'),
                ),
              ),
              SizedBox(height: 16.h),
              // Cancel Button
              SizedBox(
                width: double.infinity,
                height: 52.h,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
