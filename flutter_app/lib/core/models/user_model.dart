class User {
  final int id;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String role;
  final String? ward;
  final String? subCounty;
  final String? idNumber;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.role,
    this.ward,
    this.subCounty,
    this.idNumber,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      fullName: json['full_name'] ?? json['fullName'],
      email: json['email'],
      phoneNumber: json['phone_number'] ?? json['phoneNumber'],
      role: json['role'],
      ward: json['ward'],
      subCounty: json['sub_county'] ?? json['subCounty'],
      idNumber: json['id_number'] ?? json['idNumber'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
      'role': role,
      'ward': ward,
      'subCounty': subCounty,
      'idNumber': idNumber,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  bool get isFarmer => role == 'farmer';
  bool get isOfficer => role == 'officer';
  bool get isAdmin => role == 'admin';
}

class Application {
  final int id;
  final String appId;
  final String nurseryName;
  final String nurseryLocation;
  final String? nurserySize;
  final String? coffeeVarieties;
  final int? expectedSeedlings;
  final String status;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;
  final String? officerComments;
  final int? documentCount;
  final String? certificateNumber;
  final DateTime? certificateIssueDate;
  final DateTime? certificateExpiryDate;

  Application({
    required this.id,
    required this.appId,
    required this.nurseryName,
    required this.nurseryLocation,
    this.nurserySize,
    this.coffeeVarieties,
    this.expectedSeedlings,
    required this.status,
    this.submittedAt,
    this.reviewedAt,
    this.officerComments,
    this.documentCount,
    this.certificateNumber,
    this.certificateIssueDate,
    this.certificateExpiryDate,
  });

  factory Application.fromJson(Map<String, dynamic> json) {
    return Application(
      id: json['id'],
      appId: json['app_id'] ?? json['appId'],
      nurseryName: json['nursery_name'] ?? json['nurseryName'],
      nurseryLocation: json['nursery_location'] ?? json['nurseryLocation'],
      nurserySize: json['nursery_size'] ?? json['nurserySize'],
      coffeeVarieties: json['coffee_varieties'] ?? json['coffeeVarieties'],
      expectedSeedlings: json['expected_seedlings'] ?? json['expectedSeedlings'],
      status: json['status'],
      submittedAt: json['submitted_at'] != null
          ? DateTime.parse(json['submitted_at'])
          : null,
      reviewedAt: json['reviewed_at'] != null
          ? DateTime.parse(json['reviewed_at'])
          : null,
      officerComments: json['officer_comments'] ?? json['officerComments'],
      documentCount: json['document_count'] ?? json['documentCount'],
      certificateNumber: json['certificate_number'] ?? json['certificateNumber'],
      certificateIssueDate: json['issue_date'] != null
          ? DateTime.parse(json['issue_date'])
          : null,
      certificateExpiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'])
          : null,
    );
  }

  bool get isDraft => status == 'draft';
  bool get isSubmitted => status == 'submitted';
  bool get isUnderReview => status == 'under_review';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  
  // Get progress stage (1-5)
  int get progressStage {
    switch (status) {
      case 'draft':
        return 1;
      case 'submitted':
        return 2;
      case 'under_review':
        return 3;
      case 'approved':
        return 4;
      case 'rejected':
        return 3; // Back to review stage
      default:
        return 1;
    }
  }
  
  // Get progress status label
  String get progressLabel {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }
}

class Certificate {
  final int id;
  final String certificateNumber;
  final String nurseryName;
  final String? nurseryLocation;
  final DateTime issueDate;
  final DateTime expiryDate;
  final bool isRevoked;

  Certificate({
    required this.id,
    required this.certificateNumber,
    required this.nurseryName,
    this.nurseryLocation,
    required this.issueDate,
    required this.expiryDate,
    this.isRevoked = false,
  });

  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      id: json['id'],
      certificateNumber: json['certificate_number'] ?? json['certificateNumber'],
      nurseryName: json['nursery_name'] ?? json['nurseryName'],
      nurseryLocation: json['nursery_location'] ?? json['nurseryLocation'],
      issueDate: DateTime.parse(json['issue_date'] ?? json['issueDate']),
      expiryDate: DateTime.parse(json['expiry_date'] ?? json['expiryDate']),
      isRevoked: json['is_revoked'] ?? json['isRevoked'] ?? false,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiryDate);
  bool get isActive => !isRevoked && !isExpired;
}

class Notification {
  final int id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.isRead = false,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'],
      title: json['title'],
      message: json['message'],
      type: json['type'],
      isRead: json['is_read'] ?? json['isRead'] ?? false,
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt']),
    );
  }
}
