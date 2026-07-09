/// A natural-language rule that guides AI replies.
class RuleModel {
  final String id;
  final String uid;
  final String text;
  final String status; // 'active' | 'paused' | 'draft'
  final int priority;
  final DateTime createdAt;
  final DateTime? updatedAt;

  RuleModel({
    required this.id,
    required this.uid,
    required this.text,
    this.status = 'active',
    this.priority = 0,
    required this.createdAt,
    this.updatedAt,
  });

  factory RuleModel.fromJson(Map<String, dynamic> json) {
    return RuleModel(
      id: json['id'] as String,
      uid: json['uid'] as String,
      text: json['text'] as String,
      status: (json['status'] as String?) ?? 'active',
      priority: (json['priority'] as int?) ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  factory RuleModel.fromRtdb(String id, Map<String, dynamic> json) {
    return RuleModel(
      id: id,
      uid: (json['uid'] as String?) ?? '',
      text: (json['text'] as String?) ?? '',
      status: (json['status'] as String?) ?? 'active',
      priority: (json['priority'] as int?) ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              (json['createdAt'] as num).toInt(),
              isUtc: false,
            )
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              (json['updatedAt'] as num).toInt(),
              isUtc: false,
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'uid': uid,
        'text': text,
        'status': status,
        'priority': priority,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };

  Map<String, dynamic> toRtdb() => {
        'uid': uid,
        'text': text,
        'status': status,
        'priority': priority,
        'createdAt': createdAt.millisecondsSinceEpoch,
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      };

  RuleModel copyWith({
    String? id,
    String? uid,
    String? text,
    String? status,
    int? priority,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return RuleModel(
      id: id ?? this.id,
      uid: uid ?? this.uid,
      text: text ?? this.text,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get isActive => status == 'active';
}
