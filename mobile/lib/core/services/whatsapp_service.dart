import 'dart:convert';
import 'package:firebase_database/firebase_database.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'database_service.dart';

/// Manages WhatsApp Business Cloud API connection state and outbound messages.
class WhatsappService {
  WhatsappService._();
  static final WhatsappService instance = WhatsappService._();

  final DatabaseService _db = DatabaseService.instance;

  /// Save the WhatsApp connection config (phone_number_id, access_token, etc.)
  Future<void> saveConnection(String uid, Map<String, dynamic> data) {
    return _db.saveWhatsappConnection(uid, data);
  }

  Future<Map<String, dynamic>?> getConnection(String uid) {
    return _db.getWhatsappConnection(uid);
  }

  Stream<DatabaseEvent> watchConnection(String uid) {
    return _db.stream('${DbNodes.whatsappConnections}/$uid');
  }

  Future<void> disconnect(String uid) {
    return _db.delete('${DbNodes.whatsappConnections}/$uid');
  }

  /// Sends a WhatsApp message via the Next.js backend.
  Future<bool> sendMessage({
    required String uid,
    required String to,
    required String text,
  }) async {
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.whatsappSendMessageEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'uid': uid,
            'to': to,
            'text': text,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (res.statusCode >= 400) {
      throw Exception('فشل إرسال رسالة واتساب (${res.statusCode})');
    }

    final data = jsonDecode(res.body);
    return (data['success'] as bool?) ?? true;
  }

  /// Quick test of the connection by sending a self-message or pinging backend.
  Future<bool> testConnection(String uid) async {
    final conn = await getConnection(uid);
    if (conn == null) return false;
    // Simple liveness test: if the backend responds, treat it as reachable.
    try {
      final url = Uri.parse('${AppConfig.backendBaseUrl}/api/whatsapp/status');
      final res = await http.get(url).timeout(const Duration(seconds: 15));
      return res.statusCode < 500;
    } catch (_) {
      return false;
    }
  }
}
