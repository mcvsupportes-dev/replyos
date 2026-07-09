/// User model representing an authenticated ReplyOS user.
class UserModel {
  final String uid;
  final String? email;
  final String? displayName;
  final String? photoUrl;
  final bool isGuest;
  final String? provider;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;

  UserModel({
    required this.uid,
    this.email,
    this.displayName,
    this.photoUrl,
    this.isGuest = false,
    this.provider,
    this.createdAt,
    this.lastLoginAt,
  });

  factory UserModel.fromFirebaseUser(
    dynamic user, {
    bool isGuest = false,
    String? provider,
  }) {
    return UserModel(
      uid: user.uid as String,
      email: user.email as String?,
      displayName: user.displayName as String?,
      photoUrl: user.photoURL as String?,
      isGuest: isGuest,
      provider: provider,
      createdAt: user.metadata?.creationTime != null
          ? DateTime.parse(user.metadata.creationTime.toString())
          : null,
      lastLoginAt: user.metadata?.lastSignInTime != null
          ? DateTime.parse(user.metadata.lastSignInTime.toString())
          : null,
    );
  }

  factory UserModel.guest({required String uid, String? name}) {
    return UserModel(
      uid: uid,
      displayName: name ?? 'زائر',
      isGuest: true,
      provider: 'guest',
      createdAt: DateTime.now(),
      lastLoginAt: DateTime.now(),
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] as String,
      email: json['email'] as String?,
      displayName: json['displayName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      isGuest: (json['isGuest'] as bool?) ?? false,
      provider: json['provider'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'email': email,
        'displayName': displayName,
        'photoUrl': photoUrl,
        'isGuest': isGuest,
        'provider': provider,
        'createdAt': createdAt?.toIso8601String(),
        'lastLoginAt': lastLoginAt?.toIso8601String(),
      };

  UserModel copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? photoUrl,
    bool? isGuest,
    String? provider,
    DateTime? createdAt,
    DateTime? lastLoginAt,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      isGuest: isGuest ?? this.isGuest,
      provider: provider ?? this.provider,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
    );
  }
}

/// Profile setup data collected during the wizard.
class ProfileModel {
  final String uid;
  final String name;
  final int? age;
  final String? profession;
  final String? location;
  final DateTime updatedAt;

  ProfileModel({
    required this.uid,
    required this.name,
    this.age,
    this.profession,
    this.location,
    required this.updatedAt,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      uid: json['uid'] as String,
      name: json['name'] as String,
      age: json['age'] as int?,
      profession: json['profession'] as String?,
      location: json['location'] as String?,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'name': name,
        'age': age,
        'profession': profession,
        'location': location,
        'updatedAt': updatedAt.toIso8601String(),
      };
}
