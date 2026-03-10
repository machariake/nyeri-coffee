import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/user_model.dart';
import '../../widgets/status_badge.dart';

class FarmerApplicationsScreen extends StatefulWidget {
  const FarmerApplicationsScreen({super.key});

  @override
  State<FarmerApplicationsScreen> createState() => _FarmerApplicationsScreenState();
}

class _FarmerApplicationsScreenState extends State<FarmerApplicationsScreen> {
  List<Application> _applications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      final applications = await apiService.getMyApplications();

      setState(() {
        _applications = applications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadApplications,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildErrorState()
                : _applications.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: EdgeInsets.all(16.w),
                        itemCount: _applications.length,
                        itemBuilder: (context, index) {
                          final app = _applications[index];
                          return _ApplicationCard(
                            application: app,
                            onTap: () => _showApplicationDetails(app),
                          );
                        },
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _showNewApplicationDialog();
        },
        icon: const Icon(Icons.add),
        label: const Text('New Application'),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.description_outlined,
            size: 80.w,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16.h),
          Text(
            'No applications yet',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'Apply for your coffee nursery certificate',
            style: TextStyle(
              fontSize: 14.sp,
              color: AppTheme.textHint,
            ),
          ),
          SizedBox(height: 24.h),
          ElevatedButton.icon(
            onPressed: _showNewApplicationDialog,
            icon: const Icon(Icons.add),
            label: const Text('Apply Now'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64.w,
            color: AppTheme.errorColor,
          ),
          SizedBox(height: 16.h),
          Text(
            'Failed to load applications',
            style: TextStyle(
              fontSize: 16.sp,
              color: AppTheme.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          ElevatedButton(
            onPressed: _loadApplications,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _showNewApplicationDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => const NewApplicationForm(),
    );
  }

  void _showApplicationDetails(Application application) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => ApplicationDetailsSheet(
        application: application,
        onDelete: () => _deleteApplication(application),
      ),
    );
  }

  Future<void> _deleteApplication(Application application) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Application'),
        content: Text(
          'Are you sure you want to delete "${application.nurseryName}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      await apiService.deleteApplication(application.id);

      if (mounted) {
        Navigator.pop(context); // Close details sheet
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Application deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        _loadApplications();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting application: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class _ApplicationCard extends StatelessWidget {
  final Application application;
  final VoidCallback onTap;

  const _ApplicationCard({
    required this.application,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12.h),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      application.nurseryName,
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  StatusBadge(status: application.status),
                ],
              ),
              SizedBox(height: 8.h),
              Text(
                application.nurseryLocation,
                style: TextStyle(
                  fontSize: 14.sp,
                  color: AppTheme.textSecondary,
                ),
              ),
              SizedBox(height: 12.h),
              Row(
                children: [
                  Icon(
                    Icons.folder_outlined,
                    size: 16.w,
                    color: AppTheme.textHint,
                  ),
                  SizedBox(width: 4.w),
                  Text(
                    '${application.documentCount ?? 0} documents',
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: AppTheme.textHint,
                    ),
                  ),
                  const Spacer(),
                  if (application.submittedAt != null)
                    Text(
                      'Submitted: ${_formatDate(application.submittedAt!)}',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppTheme.textHint,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class NewApplicationForm extends StatefulWidget {
  const NewApplicationForm({super.key});

  @override
  State<NewApplicationForm> createState() => _NewApplicationFormState();
}

class _NewApplicationFormState extends State<NewApplicationForm> {
  final _formKey = GlobalKey<FormState>();
  final _nurseryNameController = TextEditingController();
  final _locationController = TextEditingController();
  final _sizeController = TextEditingController();
  final _varietiesController = TextEditingController();
  final _seedlingsController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nurseryNameController.dispose();
    _locationController.dispose();
    _sizeController.dispose();
    _varietiesController.dispose();
    _seedlingsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      await apiService.createApplication(
        nurseryName: _nurseryNameController.text.trim(),
        nurseryLocation: _locationController.text.trim(),
        nurserySize: _sizeController.text.trim().isEmpty ? null : _sizeController.text.trim(),
        coffeeVarieties: _varietiesController.text.trim().isEmpty ? null : _varietiesController.text.trim(),
        expectedSeedlings: int.tryParse(_seedlingsController.text),
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application created successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(24.w),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'New Application',
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          Expanded(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _nurseryNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nursery Name *',
                        hintText: 'Enter nursery name',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Nursery name is required';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16.h),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(
                        labelText: 'Nursery Location *',
                        hintText: 'Enter location address',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Location is required';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16.h),
                    TextFormField(
                      controller: _sizeController,
                      decoration: const InputDecoration(
                        labelText: 'Nursery Size',
                        hintText: 'e.g. 2 acres',
                      ),
                    ),
                    SizedBox(height: 16.h),
                    TextFormField(
                      controller: _varietiesController,
                      decoration: const InputDecoration(
                        labelText: 'Coffee Varieties',
                        hintText: 'e.g. Arabica, Robusta',
                      ),
                    ),
                    SizedBox(height: 16.h),
                    TextFormField(
                      controller: _seedlingsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Expected Seedlings',
                        hintText: 'Number of seedlings',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(height: 16.h),
          SizedBox(
            height: 52.h,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Create Application'),
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationDetailsSheet extends StatelessWidget {
  final Application application;
  final VoidCallback? onDelete;

  const ApplicationDetailsSheet({
    super.key,
    required this.application,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(24.w),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Application Details',
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          StatusBadge(status: application.status, fontSize: 12.sp),
          SizedBox(height: 24.h),
          // Progress Indicator
          _ProgressIndicator(application: application),
          SizedBox(height: 24.h),
          _DetailItem(
            label: 'Application ID',
            value: application.appId,
          ),
          _DetailItem(
            label: 'Nursery Name',
            value: application.nurseryName,
          ),
          _DetailItem(
            label: 'Location',
            value: application.nurseryLocation,
          ),
          if (application.nurserySize != null)
            _DetailItem(
              label: 'Size',
              value: application.nurserySize!,
            ),
          if (application.coffeeVarieties != null)
            _DetailItem(
              label: 'Coffee Varieties',
              value: application.coffeeVarieties!,
            ),
          if (application.expectedSeedlings != null)
            _DetailItem(
              label: 'Expected Seedlings',
              value: application.expectedSeedlings.toString(),
            ),
          if (application.officerComments != null)
            _DetailItem(
              label: 'Officer Comments',
              value: application.officerComments!,
            ),
          const Spacer(),
          if (application.isDraft) ...[
            SizedBox(
              width: double.infinity,
              height: 52.h,
              child: ElevatedButton(
                onPressed: () {
                  // Submit application
                },
                child: const Text('Submit Application'),
              ),
            ),
            SizedBox(height: 12.h),
            SizedBox(
              width: double.infinity,
              height: 52.h,
              child: OutlinedButton.icon(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                label: const Text(
                  'Delete Draft',
                  style: TextStyle(color: Colors.red),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  final String label;
  final String value;

  const _DetailItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12.sp,
              color: AppTheme.textHint,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            value,
            style: TextStyle(
              fontSize: 16.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressIndicator extends StatelessWidget {
  final Application application;

  const _ProgressIndicator({required this.application});

  @override
  Widget build(BuildContext context) {
    final stages = [
      {'label': 'Draft', 'icon': Icons.edit_note},
      {'label': 'Submitted', 'icon': Icons.send},
      {'label': 'Under Review', 'icon': Icons.rate_review},
      {'label': 'Approved', 'icon': Icons.verified},
      {'label': 'Certificate', 'icon': Icons.card_membership},
    ];

    final currentStage = application.progressStage;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Application Progress',
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        SizedBox(height: 16.h),
        Row(
          children: List.generate(stages.length, (index) {
            final stage = stages[index];
            final isCompleted = index < currentStage;
            final isCurrent = index == currentStage - 1;
            
            return Expanded(
              child: Column(
                children: [
                  Container(
                    width: 40.w,
                    height: 40.w,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppTheme.primaryColor
                          : isCurrent
                              ? AppTheme.primaryColor.withOpacity(0.2)
                              : Colors.grey.shade300,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      stage['icon'] as IconData,
                      color: isCompleted || isCurrent
                          ? Colors.white
                          : Colors.grey.shade600,
                      size: 20.w,
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    stage['label'] as String,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.sp,
                      fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                      color: isCompleted || isCurrent
                          ? AppTheme.primaryColor
                          : Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            );
          }),
        ),
        SizedBox(height: 8.h),
        // Progress line
        Stack(
          children: [
            Container(
              height: 2,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            FractionallySizedBox(
              widthFactor: (currentStage - 1) / (stages.length - 1),
              child: Container(
                height: 2,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withOpacity(0.5),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 16.h),
        // Current status description
        Container(
          padding: EdgeInsets.all(12.w),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(
              color: AppTheme.primaryColor.withOpacity(0.3),
            ),
          ),
          child: Row(
            children: [
              Icon(
                currentStage >= 4
                    ? Icons.check_circle
                    : currentStage >= 3
                        ? Icons.info
                        : Icons.schedule,
                color: AppTheme.primaryColor,
                size: 20.w,
              ),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  application.progressLabel,
                  style: TextStyle(
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
