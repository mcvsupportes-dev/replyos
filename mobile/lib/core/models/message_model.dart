/// Chat message used by the AI assistant.
class MessageModel {
  final String id;
  final String uid;
  final String role; // 'user' | 'assistant' | 'system'
  final String content;
  final String? tone;
  final String? length;
  final String? providerId;
  final DateTime createdAt;

  MessageModel({
    required this.id,
    required this.uid,
    required this.role,
    required this.content,
    this.tone,
    this.length,
    this.providerId,
    required this.createdAt,
  });

  factory MessageModel.user({
    required String uid,
    required String content,
    String? tone,
    String? length,
  }) {
    return MessageModel(
      id: '${DateTime.now().millisecondsSinceEpoch}',
      uid: uid,
      role: 'user',
      content: content,
      tone: tone,
      length: length,
      createdAt: DateTime.now(),
    );
  }

  factory MessageModel.assistant({
    required String uid,
    required String content,
    String? providerId,
  }) {
    return MessageModel(
      id: '${DateTime.now().millisecondsSinceEpoch}_ai',
      uid: uid,
      role: 'assistant',
      content: content,
      providerId: providerId,
      createdAt: DateTime.now(),
    );
  }

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as String,
      uid: json['uid'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      tone: json['tone'] as String?,
      length: json['length'] as String?,
      providerId: json['providerId'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'uid': uid,
        'role': role,
        'content': content,
        'tone': tone,
        'length': length,
        'providerId': providerId,
        'createdAt': createdAt.toIso8601String(),
      };

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
}
