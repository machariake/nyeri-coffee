import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:local_auth/local_auth.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _biometricPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureBiometricPassword = true;
  bool _showBiometric = false;
  bool _usePhoneLogin = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final canCheckBiometrics = await _localAuth.canCheckBiometrics;
    final hasSavedCredentials = authService.hasSavedCredentials();
    
    if (canCheckBiometrics && hasSavedCredentials) {
      setState(() {
        _showBiometric = true;
      });
    }
  }

  Future<bool> _authenticateWithBiometric() async {
    try {
      final didAuthenticate = await _localAuth.authenticate(
        localizedReason: 'Authenticate to login with your fingerprint',
        persistAcrossBackgrounding: true,
        biometricOnly: false,
      );
      return didAuthenticate;
    } catch (e) {
      return false;
    }
  }

  Future<void> _loginWithBiometric() async {
    final isAuthentic = await _authenticateWithBiometric();
    if (!isAuthentic) {
      Fluttertoast.showToast(
        msg: 'Biometric authentication failed',
        backgroundColor: AppTheme.errorColor,
      );
      return;
    }

    // Show password dialog for verification
    final password = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter Password'),
        content: TextField(
          controller: _biometricPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Password',
            prefixIcon: Icon(Icons.lock),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, _biometricPasswordController.text),
            child: const Text('Login'),
          ),
        ],
      ),
    );

    if (password == null || password.isEmpty) return;

    final authService = Provider.of<AuthService>(context, listen: false);
    final success = await authService.loginWithBiometric(password);

    if (success) {
      Fluttertoast.showToast(
        msg: 'Login successful!',
        backgroundColor: AppTheme.successColor,
      );

      final role = authService.currentUser?.role;
      if (role == 'farmer') {
        Navigator.pushReplacementNamed(context, '/farmer/dashboard');
      } else if (role == 'officer') {
        Navigator.pushReplacementNamed(context, '/officer/dashboard');
      } else if (role == 'admin') {
        Navigator.pushReplacementNamed(context, '/admin/dashboard');
      }
    } else {
      Fluttertoast.showToast(
        msg: 'Authentication failed. Please try again.',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _biometricPasswordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final authService = Provider.of<AuthService>(context, listen: false);

    String? email;
    String? phoneNumber;
    
    if (_usePhoneLogin) {
      phoneNumber = _phoneController.text.trim();
    } else {
      email = _emailController.text.trim();
    }

    final success = await authService.loginWithEmailOrPhone(
      email: email,
      phoneNumber: phoneNumber,
      password: _passwordController.text,
    );

    if (success) {
      Fluttertoast.showToast(
        msg: 'Login successful!',
        backgroundColor: AppTheme.successColor,
      );
      
      // Navigate based on role
      final role = authService.currentUser?.role;
      if (role == 'farmer') {
        Navigator.pushReplacementNamed(context, '/farmer/dashboard');
      } else if (role == 'officer') {
        Navigator.pushReplacementNamed(context, '/officer/dashboard');
      } else if (role == 'admin') {
        Navigator.pushReplacementNamed(context, '/admin/dashboard');
      } else {
        Fluttertoast.showToast(
          msg: 'Error: Unrecognized role - $role',
          backgroundColor: AppTheme.errorColor,
        );
      }
    } else {
      Fluttertoast.showToast(
        msg: authService.error ?? 'Login failed',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryColor.withOpacity(0.8),
              Colors.white,
            ],
            stops: const [0.0, 0.3, 0.3],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 40.h),
                // Logo
                Center(
                  child: Container(
                    width: 80.w,
                    height: 80.w,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.eco,
                      size: 44.w,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                SizedBox(height: 16.h),
                // Welcome text
                Center(
                  child: Text(
                    'Welcome Back',
                    style: TextStyle(
                      fontSize: 28.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                SizedBox(height: 8.h),
                Center(
                  child: Text(
                    'Sign in to your AgriCertify account',
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ),
                SizedBox(height: 40.h),
                // Login Form
                Container(
                  padding: EdgeInsets.all(24.w),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Toggle between Email and Phone login
                        Row(
                          children: [
                            Expanded(
                              child: ChoiceChip(
                                label: const Text('Email'),
                                selected: !_usePhoneLogin,
                                onSelected: (selected) {
                                  setState(() {
                                    _usePhoneLogin = !selected;
                                  });
                                },
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Expanded(
                              child: ChoiceChip(
                                label: const Text('Phone Number'),
                                selected: _usePhoneLogin,
                                onSelected: (selected) {
                                  setState(() {
                                    _usePhoneLogin = selected;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 16.h),
                        // Email or Phone field based on toggle
                        if (!_usePhoneLogin)
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
                          )
                        else
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Phone Number',
                              hintText: 'Enter your phone number',
                              prefixIcon: Icon(Icons.phone_outlined),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your phone number';
                              }
                              if (value.length < 10) {
                                return 'Please enter a valid phone number';
                              }
                              return null;
                            },
                          ),
                        SizedBox(height: 16.h),
                        // Password field
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            hintText: 'Enter your password',
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
                              return 'Please enter your password';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters';
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 8.h),
                        // Forgot password
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {
                              // TODO: Implement forgot password
                            },
                            child: Text(
                              'Forgot Password?',
                              style: TextStyle(fontSize: 12.sp),
                            ),
                          ),
                        ),
                        SizedBox(height: 16.h),
                        // Login button
                        SizedBox(
                          height: 52.h,
                          child: ElevatedButton(
                            onPressed: authService.isLoading ? null : _login,
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
                                    'Login',
                                    style: TextStyle(fontSize: 16.sp),
                                  ),
                          ),
                        ),
                        SizedBox(height: 16.h),
                        // Biometric login button
                        if (_showBiometric) ...[
                          Row(
                            children: [
                              Expanded(
                                child: Divider(
                                  height: 1.h,
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16.w),
                                child: Text(
                                  'OR',
                                  style: TextStyle(
                                    fontSize: 12.sp,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Divider(
                                  height: 1.h,
                                  color: Colors.grey.shade300,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 16.h),
                          SizedBox(
                            height: 52.h,
                            child: OutlinedButton.icon(
                              onPressed: _loginWithBiometric,
                              icon: Icon(Icons.fingerprint, size: 28.w),
                              label: Text(
                                'Login with Fingerprint',
                                style: TextStyle(fontSize: 16.sp),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: AppTheme.primaryColor),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 24.h),
                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      child: Text(
                        'Register',
                        style: TextStyle(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                // Footer
                Center(
                  child: Text(
                    '© 2025 County Government of Nyeri',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: AppTheme.textHint,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
