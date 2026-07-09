import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/message_model.dart';

/// Calls the Next.js backend AI chat endpoint.
class AiService {
  AiService._();
  static final AiService instance = AiService._();

  /// Sends a chat completion request to `${backendBaseUrl}/api/ai/chat`.
  ///
  /// [messages] — full conversation (system + history + user).
  /// [tone] — e.g. 'ودود' / 'احترافي'.
  /// [length] — e.g. 'قصير' / 'متوسط' / 'طويل'.
  /// [providerId] — optional custom provider id from API settings.
  /// [apiKey] — optional user-supplied API key.
  /// [customBaseUrl] — optional override (e.g. direct OpenAI).
  Future<String> chat({
    required List<MessageModel> messages,
    String? tone,
    String? length,
    String? providerId,
    String? apiKey,
    String? customBaseUrl,
  }) async {
    final url = Uri.parse('${AppConfig.backendBaseUrl}${AppConfig.aiChatEndpoint}');

    final payload = {
      'messages': messages
          .map((m) => {'role': m.role, 'content': m.content})
          .toList(),
      if (tone != null) 'tone': tone,
      if (length != null) 'length': length,
      if (providerId != null) 'providerId': providerId,
      if (apiKey != null && apiKey.isNotEmpty) 'apiKey': apiKey,
      if (customBaseUrl != null && customBaseUrl.isNotEmpty)
        'customBaseUrl': customBaseUrl,
    };

    final res = await http
        .post(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode(payload),
        )
        .timeout(const Duration(seconds: 60));

    if (res.statusCode >= 400) {
      throw Exception('فشل الاتصال بالمساعد الذكي (${res.statusCode})');
    }

    final data = jsonDecode(res.body);
    // The backend may return { reply, content, message, ... } — handle gracefully.
    final reply = (data['reply'] ??
            data['content'] ??
            data['message'] ??
            data['text'] ??
            data['answer'])
        ?.toString();
    if (reply == null || reply.trim().isEmpty) {
      throw Exception('استجابة غير متوقعة من الخادم');
    }
    return reply.trim();
  }

  /// Test whether the user-provided API key works by sending a tiny request.
  Future<bool> testKey({
    required String providerId,
    required String apiKey,
    String? model,
    String? customBaseUrl,
  }) async {
    try {
      final reply = await chat(
        messages: [
          MessageModel(
            id: 'test',
            uid: 'test',
            role: 'user',
            content: 'اختبار: رد بكلمة "موافق" فقط.',
            createdAt: DateTime.now(),
          ),
        ],
        providerId: providerId,
        apiKey: apiKey,
        customBaseUrl: customBaseUrl,
      );
      return reply.isNotEmpty;
    } catch (_) {
      return false;
    }
  }
}
