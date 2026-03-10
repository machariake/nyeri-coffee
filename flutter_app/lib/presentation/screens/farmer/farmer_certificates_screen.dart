import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:ui' as ui;

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/user_model.dart';

class FarmerCertificatesScreen extends StatefulWidget {
  const FarmerCertificatesScreen({super.key});

  @override
  State<FarmerCertificatesScreen> createState() => _FarmerCertificatesScreenState();
}

class _FarmerCertificatesScreenState extends State<FarmerCertificatesScreen> {
  List<Certificate> _certificates = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCertificates();
  }

  Future<void> _loadCertificates() async {
    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      apiService.setAuthToken(authService.token!);

      final certificates = await apiService.getMyCertificates();

      setState(() {
        _certificates = certificates;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadCertificates,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _certificates.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: EdgeInsets.all(16.w),
                    itemCount: _certificates.length,
                    itemBuilder: (context, index) {
                      final cert = _certificates[index];
                      return _CertificateCard(
                        certificate: cert,
                        onTap: () => _showCertificateDetails(cert),
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.verified_outlined,
            size: 80.w,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16.h),
          Text(
            'No certificates yet',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'Your certificates will appear here after approval',
            style: TextStyle(
              fontSize: 14.sp,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ),
    );
  }

  void _showCertificateDetails(Certificate certificate) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => CertificateDetailsSheet(
        certificate: certificate,
        onShare: () => _shareCertificate(certificate),
      ),
    );
  }

  Future<void> _shareCertificate(Certificate certificate) async {
    // Generate PDF and share using printing package (Cross-Platform / Web Safe)
    try {
      final pdf = await _generateCertificatePDF(certificate);
      final bytes = await pdf.save();

      await Printing.sharePdf(
        bytes: bytes,
        filename: 'certificate_${certificate.certificateNumber}.pdf',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to share: $e')),
      );
    }
  }

  Future<pw.Document> _generateCertificatePDF(Certificate certificate) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        build: (pw.Context context) => pw.Center(
          child: pw.Column(
            mainAxisAlignment: pw.MainAxisAlignment.center,
            children: [
              pw.Text(
                'Coffee Nursery Certificate',
                style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 30),
              pw.Text('Certificate Number: ${certificate.certificateNumber}'),
              pw.Text('Nursery Name: ${certificate.nurseryName}'),
              pw.Text('Issue Date: ${certificate.issueDate.toString().split(' ')[0]}'),
              pw.Text('Expiry Date: ${certificate.expiryDate.toString().split(' ')[0]}'),
              pw.SizedBox(height: 30),
              pw.Container(
                padding: pw.EdgeInsets.all(20),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.green),
                ),
                child: pw.Text(
                  certificate.isActive ? 'VALID' : 'EXPIRED',
                  style: pw.TextStyle(
                    fontSize: 20,
                    fontWeight: pw.FontWeight.bold,
                    color: certificate.isActive ? PdfColors.green : PdfColors.red,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return pdf;
  }
}

class _CertificateCard extends StatelessWidget {
  final Certificate certificate;
  final VoidCallback onTap;

  const _CertificateCard({
    required this.certificate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isExpired = certificate.isExpired;
    
    return Card(
      margin: EdgeInsets.only(bottom: 12.h),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Row(
            children: [
              Container(
                width: 60.w,
                height: 60.w,
                decoration: BoxDecoration(
                  color: isExpired 
                      ? Colors.grey[200] 
                      : AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(
                  Icons.verified,
                  size: 32.w,
                  color: isExpired ? Colors.grey : AppTheme.successColor,
                ),
              ),
              SizedBox(width: 16.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      certificate.nurseryName,
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      certificate.certificateNumber,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8.w,
                            vertical: 2.h,
                          ),
                          decoration: BoxDecoration(
                            color: isExpired 
                                ? Colors.grey[200] 
                                : AppTheme.successColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          child: Text(
                            isExpired ? 'EXPIRED' : 'ACTIVE',
                            style: TextStyle(
                              fontSize: 10.sp,
                              fontWeight: FontWeight.w600,
                              color: isExpired ? Colors.grey : AppTheme.successColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppTheme.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CertificateDetailsSheet extends StatelessWidget {
  final Certificate certificate;
  final VoidCallback? onShare;

  const CertificateDetailsSheet({
    super.key,
    required this.certificate,
    this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    final isExpired = certificate.isExpired;
    
    return Container(
      padding: EdgeInsets.all(24.w),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Certificate Details',
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
          SizedBox(height: 24.h),
          // Certificate Card
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isExpired 
                    ? [Colors.grey[400]!, Colors.grey[300]!]
                    : [AppTheme.primaryColor, AppTheme.primaryLight],
              ),
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.verified,
                  size: 48.w,
                  color: Colors.white,
                ),
                SizedBox(height: 12.h),
                Text(
                  'COFFEE NURSERY',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.white.withOpacity(0.8),
                    letterSpacing: 2,
                  ),
                ),
                Text(
                  'CERTIFICATE',
                  style: TextStyle(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  certificate.certificateNumber,
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  certificate.nurseryName,
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (certificate.nurseryLocation != null)
                  Text(
                    certificate.nurseryLocation!,
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(height: 24.h),
          // QR Code
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12.r),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                ),
              ],
            ),
            child: QrImageView(
              data: certificate.certificateNumber,
              version: QrVersions.auto,
              size: 150.w,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'Scan to verify',
            style: TextStyle(
              fontSize: 12.sp,
              color: AppTheme.textHint,
            ),
          ),
          SizedBox(height: 24.h),
          // Dates
          Row(
            children: [
              Expanded(
                child: _DateItem(
                  label: 'Issue Date',
                  date: certificate.issueDate,
                ),
              ),
              Expanded(
                child: _DateItem(
                  label: 'Expiry Date',
                  date: certificate.expiryDate,
                  isWarning: isExpired,
                ),
              ),
            ],
          ),
          SizedBox(height: 24.h),
          // Share and Download buttons
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 52.h,
                  child: OutlinedButton.icon(
                    onPressed: onShare,
                    icon: const Icon(Icons.share),
                    label: const Text('Share'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: SizedBox(
                  height: 52.h,
                  child: ElevatedButton.icon(
                    onPressed: isExpired ? null : () {
                      // Download certificate
                    },
                    icon: const Icon(Icons.download),
                    label: const Text('Download'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DateItem extends StatelessWidget {
  final String label;
  final DateTime date;
  final bool isWarning;

  const _DateItem({
    required this.label,
    required this.date,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
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
          '${date.day}/${date.month}/${date.year}',
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w600,
            color: isWarning ? AppTheme.errorColor : AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}
