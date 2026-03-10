import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _wardController = TextEditingController();
  final _subCountyController = TextEditingController();
  final _idNumberController = TextEditingController();
  
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _selectedRole = 'farmer';

  final List<String> _roles = ['farmer', 'officer'];

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _wardController.dispose();
    _subCountyController.dispose();
    _idNumberController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      Fluttertoast.showToast(
        msg: 'Passwords do not match',
        backgroundColor: AppTheme.errorColor,
      );
      return;
    }

    final authService = Provider.of<AuthService>(context, listen: false);

    final success = await authService.register(
      fullName: _fullNameController.text.trim(),
      email: _emailController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      password: _passwordController.text,
      role: _selectedRole,
      ward: _wardController.text.trim().isEmpty ? null : _wardController.text.trim(),
      subCounty: _subCountyController.text.trim().isEmpty ? null : _subCountyController.text.trim(),
      idNumber: _idNumberController.text.trim().isEmpty ? null : _idNumberController.text.trim(),
    );

    if (success) {
      Fluttertoast.showToast(
        msg: 'Registration successful! Redirecting...',
        backgroundColor: AppTheme.successColor,
      );

      // Navigate based on role - auto redirect after successful registration
      final role = authService.currentUser?.role;
      if (role == 'farmer') {
        Navigator.pushReplacementNamed(context, '/farmer/dashboard');
      } else if (role == 'officer') {
        Navigator.pushReplacementNamed(context, '/officer/dashboard');
      }
    } else {
      Fluttertoast.showToast(
        msg: authService.error ?? 'Registration failed',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Create Account',
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 16.h),
                // Header
                Center(
                  child: Container(
                    width: 70.w,
                    height: 70.w,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                    child: Icon(
                      Icons.person_add,
                      size: 36.w,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                SizedBox(height: 16.h),
                Center(
                  child: Text(
                    'Create Your AgriCertify Account',
                    style: TextStyle(
                      fontSize: 20.sp,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
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
                      return 'Please enter your full name';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    hintText: 'Enter your email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                // Phone Number
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    hintText: 'e.g. 0712345678',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your phone number';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Create a password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                // Confirm Password
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Confirm your password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureConfirmPassword = !_obscureConfirmPassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                // Role Dropdown
                DropdownButtonFormField<String>(
                  value: _selectedRole,
                  decoration: const InputDecoration(
                    labelText: 'Register as',
                    prefixIcon: Icon(Icons.account_circle_outlined),
                  ),
                  items: _roles.map((role) {
                    return DropdownMenuItem(
                      value: role,
                      child: Text(
                        role.substring(0, 1).toUpperCase() + role.substring(1),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedRole = value!;
                    });
                  },
                ),
                SizedBox(height: 16.h),
                // Ward (Optional)
                TextFormField(
                  controller: _wardController,
                  decoration: const InputDecoration(
                    labelText: 'Ward / Sub-county (for applicants only)',
                    hintText: 'Enter your ward',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                ),
                SizedBox(height: 16.h),
                // ID Number (Optional)
                TextFormField(
                  controller: _idNumberController,
                  decoration: const InputDecoration(
                    labelText: 'ID Number (Optional)',
                    hintText: 'Enter your ID number',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                SizedBox(height: 24.h),
                // Register Button
                SizedBox(
                  height: 52.h,
                  child: ElevatedButton(
                    onPressed: authService.isLoading ? null : _register,
                    child: authService.isLoading
                        ? SizedBox(
                            width: 24.w,
                            height: 24.w,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : Text(
                            'Register',
                            style: TextStyle(fontSize: 16.sp),
                          ),
                  ),
                ),
                SizedBox(height: 16.h),
                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      child: Text(
                        'Login',
                        style: TextStyle(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 24.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
