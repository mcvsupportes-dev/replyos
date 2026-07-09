import 'dart:async';
import 'package:firebase_database/firebase_database.dart';
import '../config/firebase_config.dart';

/// Firebase Realtime Database wrapper.
/// Provides read / write / update / delete / stream operations per node.
class DatabaseService {
  DatabaseService._();
  static final DatabaseService instance = DatabaseService._();

  final FirebaseDatabase _db = FirebaseDatabase.instance;

  DatabaseReference _root() => _db.ref();

  DatabaseReference node(String name) => _root().child(name);

  // === Read ===

  Future<DataSnapshot> read(String path) async {
    return _root().child(path).get();
  }

  Future<Map<String, dynamic>?> readMap(String path) async {
    final snap = await read(path);
    if (!snap.exists) return null;
    final v = snap.value;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }

  Future<List<Map<String, dynamic>>> readList(String path) async {
    final snap = await read(path);
    if (!snap.exists) return [];
    final v = snap.value;
    if (v is Map) {
      return v.entries.map((e) {
        final m = Map<String, dynamic>.from(e.value as Map);
        m['id'] = e.key;
        return m;
      }).toList();
    } else if (v is List) {
      return v.asMap().entries.map((e) {
        final m = Map<String, dynamic>.from((e.value as Map?) ?? {});
        m['id'] = '${e.key}';
        return m;
      }).toList();
    }
    return [];
  }

  // === Write / Update ===

  Future<void> write(String path, Map<String, dynamic> data) async {
    await _root().child(path).set(data);
  }

  Future<String> push(String path, Map<String, dynamic> data) async {
    final ref = _root().child(path).push();
    await ref.set(data);
    return ref.key!;
  }

  Future<void> update(String path, Map<String, dynamic> data) async {
    await _root().child(path).update(data);
  }

  // === Delete ===

  Future<void> delete(String path) async {
    await _root().child(path).remove();
  }

  // === Stream ===

  Stream<DatabaseEvent> stream(String path) {
    return _root().child(path).onValue;
  }

  Stream<Map<String, dynamic>?> streamMap(String path) {
    return _root().child(path).onValue.map((event) {
      if (!event.snapshot.exists) return null;
      final v = event.snapshot.value;
      if (v is Map) return Map<String, dynamic>.from(v);
      return null;
    });
  }

  Stream<List<Map<String, dynamic>>> streamList(String path) {
    return _root().child(path).onValue.map((event) {
      if (!event.snapshot.exists) return <Map<String, dynamic>>[];
      final v = event.snapshot.value;
      if (v is Map) {
        return v.entries.map((e) {
          final m = Map<String, dynamic>.from(e.value as Map);
          m['id'] = e.key;
          return m;
        }).toList();
      } else if (v is List) {
        return v.asMap().entries.map((e) {
          final m = Map<String, dynamic>.from((e.value as Map?) ?? {});
          m['id'] = '${e.key}';
          return m;
        }).toList();
      }
      return <Map<String, dynamic>>[];
    });
  }

  // === Convenience per-node helpers ===

  Future<void> saveProfile(String uid, Map<String, dynamic> profile) {
    return write('${DbNodes.profiles}/$uid', profile);
  }

  Future<Map<String, dynamic>?> getProfile(String uid) {
    return readMap('${DbNodes.profiles}/$uid');
  }

  Future<void> saveSettings(String uid, Map<String, dynamic> settings) {
    return write('${DbNodes.settings}/$uid', settings);
  }

  Future<Map<String, dynamic>?> getSettings(String uid) {
    return readMap('${DbNodes.settings}/$uid');
  }

  Stream<Map<String, dynamic>?> streamSettings(String uid) {
    return streamMap('${DbNodes.settings}/$uid');
  }

  Future<String> addRule(String uid, Map<String, dynamic> rule) {
    return push('${DbNodes.rules}/$uid', rule);
  }

  Future<void> updateRule(String uid, String ruleId, Map<String, dynamic> rule) {
    return update('${DbNodes.rules}/$uid/$ruleId', rule);
  }

  Future<void> deleteRule(String uid, String ruleId) {
    return delete('${DbNodes.rules}/$uid/$ruleId');
  }

  Stream<List<Map<String, dynamic>>> streamRules(String uid) {
    return streamList('${DbNodes.rules}/$uid');
  }

  Future<String> addMessage(String uid, Map<String, dynamic> msg) {
    return push('${DbNodes.messages}/$uid', msg);
  }

  Stream<List<Map<String, dynamic>>> streamMessages(String uid) {
    return streamList('${DbNodes.messages}/$uid');
  }

  Future<void> clearMessages(String uid) {
    return delete('${DbNodes.messages}/$uid');
  }

  Future<String> addUpload(String uid, Map<String, dynamic> file) {
    return push('${DbNodes.uploads}/$uid', file);
  }

  Stream<List<Map<String, dynamic>>> streamUploads(String uid) {
    return streamList('${DbNodes.uploads}/$uid');
  }

  Future<void> deleteUpload(String uid, String uploadId) {
    return delete('${DbNodes.uploads}/$uid/$uploadId');
  }

  Future<void> saveCustomApiKey(String uid, Map<String, dynamic> key) {
    return write('${DbNodes.customApiKeys}/$uid', key);
  }

  Future<Map<String, dynamic>?> getCustomApiKey(String uid) {
    return readMap('${DbNodes.customApiKeys}/$uid');
  }

  Future<void> saveWhatsappConnection(String uid, Map<String, dynamic> conn) {
    return write('${DbNodes.whatsappConnections}/$uid', conn);
  }

  Future<Map<String, dynamic>?> getWhatsappConnection(String uid) {
    return readMap('${DbNodes.whatsappConnections}/$uid');
  }

  Future<void> saveAnalytics(String uid, Map<String, dynamic> data) {
    return write('${DbNodes.analytics}/$uid', data);
  }

  Future<Map<String, dynamic>?> getAnalytics(String uid) {
    return readMap('${DbNodes.analytics}/$uid');
  }

  Future<void> saveSubscription(String uid, Map<String, dynamic> sub) {
    return write('${DbNodes.subscriptions}/$uid', sub);
  }

  Future<Map<String, dynamic>?> getSubscription(String uid) {
    return readMap('${DbNodes.subscriptions}/$uid');
  }
}
