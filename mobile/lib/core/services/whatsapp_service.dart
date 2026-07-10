import 'dart:convert';
import 'package:firebase_database/firebase_database.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../config/firebase_config.dart';
import 'database_service.dart';

/// Manages WhatsApp connection via the remote bridge (proxied through the
/// Next.js dashboard API). All calls require a Firebase ID token (userToken)
/// obtained at login. The dashboard verifies the token and forwards the
/// request to the WhatsApp Bridge on the VPS.
class WhatsappService {
  WhatsappService._();
  static final WhatsappService instance = WhatsappService._();

  final DatabaseService _db = DatabaseService.instance;

  /// Get the cached user token from SharedPreferences.
  Future<String?> _getUserToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.prefUserToken);
  }

  /// Get the cached WhatsApp phone number.
  Future<String?> getPhoneNumber() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.prefWhatsappPhone);
  }

  /// Save the WhatsApp phone number locally.
  Future<void> savePhoneNumber(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefWhatsappPhone, phone);
  }

  /// Save the WhatsApp status locally.
  Future<void> saveWhatsappStatus(String status) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefWhatsappStatus, status);
  }

  // ─── Legacy Firebase Realtime DB helpers (kept for backwards compat) ────
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

  // ─── Bridge-backed WhatsApp operations ───────────────────────────────────

  /// Request a pairing code from the bridge. The user enters this 8-digit
  /// code in their phone's WhatsApp → Linked Devices → Link with phone number.
  ///
  /// Returns the pairing code as a string (e.g. "5D4H9ZFL").
  Future<String> requestPairingCode({required String phoneNumber}) async {
    final userToken = await _getUserToken();
    if (userToken == null) {
      throw Exception('Not authenticated — please login first');
    }

    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.whatsappPairEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'phoneNumber': phoneNumber,
            'userToken': userToken,
          }),
        )
        .timeout(const Duration(seconds: 60));

    final data = jsonDecode(res.body);

    if (res.statusCode >= 400) {
      throw Exception(data['error'] ?? 'فشل الحصول على رمز الربط');
    }

    if (data['pairingCode'] == null) {
      throw Exception('لم يتم استلام رمز الربط من الخادم');
    }

    // Cache the phone number locally
    await savePhoneNumber(phoneNumber.replaceAll(RegExp(r'[^\d]'), ''));
    await saveWhatsappStatus('pairing');

    return data['pairingCode'] as String;
  }

  /// Check the current connection status for the given phone number.
  /// Returns a map with: { status, state, phoneNumber, pairingCode?, user?, ... }
  Future<Map<String, dynamic>> getStatus({required String phoneNumber}) async {
    final userToken = await _getUserToken();
    if (userToken == null) {
      throw Exception('Not authenticated — please login first');
    }

    final phone = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.whatsappPairEndpoint}'
      '?phoneNumber=$phone&userToken=$userToken',
    );

    final res = await http.get(url).timeout(const Duration(seconds: 15));

    if (res.statusCode >= 400) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'فشل جلب حالة الاتصال');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;

    // Cache the status locally
    final status = (data['status'] ?? data['state'] ?? 'disconnected') as String;
    await saveWhatsappStatus(status);

    return data;
  }

  /// Send a WhatsApp message via the bridge.
  ///
  /// [phoneNumber] is the connected WhatsApp number (the user's own number),
  /// [to] is the recipient's phone number,
  /// [text] is the message body.
  Future<bool> sendMessage({
    required String phoneNumber,
    required String to,
    required String text,
  }) async {
    final userToken = await _getUserToken();
    if (userToken == null) {
      throw Exception('Not authenticated — please login first');
    }

    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.whatsappSendEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'phoneNumber': phoneNumber,
            'to': to,
            'message': text,
            'userToken': userToken,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (res.statusCode >= 400) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'فشل إرسال رسالة واتساب');
    }

    final data = jsonDecode(res.body);
    return (data['success'] as bool?) ?? true;
  }

  /// Disconnect a WhatsApp session.
  Future<void> disconnectWhatsApp({required String phoneNumber}) async {
    final userToken = await _getUserToken();
    if (userToken == null) {
      throw Exception('Not authenticated — please login first');
    }

    final phone = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.whatsappPairEndpoint}'
      '?phoneNumber=$phone&userToken=$userToken',
    );

    final res = await http.delete(url).timeout(const Duration(seconds: 15));

    if (res.statusCode >= 400) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'فشل قطع الاتصال');
    }

    await saveWhatsappStatus('disconnected');
  }

  /// Legacy: sends via uid (kept for backwards compat with old callers).
  Future<bool> sendMessageLegacy({
    required String uid,
    required String to,
    required String text,
  }) async {
    final phone = await getPhoneNumber();
    if (phone == null) {
      throw Exception('No WhatsApp number linked');
    }
    return sendMessage(phoneNumber: phone, to: to, text: text);
  }

  /// Quick test of the connection — checks if the bridge health endpoint responds.
  Future<bool> testConnection(String uid) async {
    try {
      final phone = await getPhoneNumber();
      if (phone == null) return false;
      final status = await getStatus(phoneNumber: phone);
      return status['status'] == 'open' || status['state'] == 'open';
    } catch (_) {
      return false;
    }
  }
}
