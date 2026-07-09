/// Reply / app settings persisted to Firebase RTDB and shared_preferences.
class SettingsModel {
  final String uid;
  final bool aiEnabled;
  final bool autoReply;
  final String responseStyle; // 'طبيعي' | 'تجاري' | ...
  final String tone; // 'ودود' | 'احترافي' | ...
  final String length; // 'قصير' | 'متوسط' | 'طويل'
  final String? workStart; // "HH:mm"
  final String? workEnd;
  final int replyDelaySeconds;
  final bool notificationsEnabled;
  final bool privacyMode;
  final String language; // 'ar' | 'en'
  final String themeMode; // 'light' | 'dark' | 'system'
  final bool rtl;
  final DateTime updatedAt;

  SettingsModel({
    required this.uid,
    this.aiEnabled = true,
    this.autoReply = true,
    this.responseStyle = 'طبيعي',
    this.tone = 'ودود',
    this.length = 'متوسط',
    this.workStart = '09:00',
    this.workEnd = '18:00',
    this.replyDelaySeconds = 2,
    this.notificationsEnabled = true,
    this.privacyMode = false,
    this.language = 'ar',
    this.themeMode = 'system',
    this.rtl = true,
    required this.updatedAt,
  });

  factory SettingsModel.defaultFor(String uid) {
    return SettingsModel(uid: uid, updatedAt: DateTime.now());
  }

  factory SettingsModel.fromJson(Map<String, dynamic> json) {
    return SettingsModel(
      uid: json['uid'] as String,
      aiEnabled: (json['aiEnabled'] as bool?) ?? true,
      autoReply: (json['autoReply'] as bool?) ?? true,
      responseStyle: (json['responseStyle'] as String?) ?? 'طبيعي',
      tone: (json['tone'] as String?) ?? 'ودود',
      length: (json['length'] as String?) ?? 'متوسط',
      workStart: json['workStart'] as String?,
      workEnd: json['workEnd'] as String?,
      replyDelaySeconds: (json['replyDelaySeconds'] as num?)?.toInt() ?? 2,
      notificationsEnabled: (json['notificationsEnabled'] as bool?) ?? true,
      privacyMode: (json['privacyMode'] as bool?) ?? false,
      language: (json['language'] as String?) ?? 'ar',
      themeMode: (json['themeMode'] as String?) ?? 'system',
      rtl: (json['rtl'] as bool?) ?? true,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'aiEnabled': aiEnabled,
        'autoReply': autoReply,
        'responseStyle': responseStyle,
        'tone': tone,
        'length': length,
        'workStart': workStart,
        'workEnd': workEnd,
        'replyDelaySeconds': replyDelaySeconds,
        'notificationsEnabled': notificationsEnabled,
        'privacyMode': privacyMode,
        'language': language,
        'themeMode': themeMode,
        'rtl': rtl,
        'updatedAt': updatedAt.toIso8601String(),
      };

  SettingsModel copyWith({
    String? uid,
    bool? aiEnabled,
    bool? autoReply,
    String? responseStyle,
    String? tone,
    String? length,
    String? workStart,
    String? workEnd,
    int? replyDelaySeconds,
    bool? notificationsEnabled,
    bool? privacyMode,
    String? language,
    String? themeMode,
    bool? rtl,
    DateTime? updatedAt,
  }) {
    return SettingsModel(
      uid: uid ?? this.uid,
      aiEnabled: aiEnabled ?? this.aiEnabled,
      autoReply: autoReply ?? this.autoReply,
      responseStyle: responseStyle ?? this.responseStyle,
      tone: tone ?? this.tone,
      length: length ?? this.length,
      workStart: workStart ?? this.workStart,
      workEnd: workEnd ?? this.workEnd,
      replyDelaySeconds: replyDelaySeconds ?? this.replyDelaySeconds,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      privacyMode: privacyMode ?? this.privacyMode,
      language: language ?? this.language,
      themeMode: themeMode ?? this.themeMode,
      rtl: rtl ?? this.rtl,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
