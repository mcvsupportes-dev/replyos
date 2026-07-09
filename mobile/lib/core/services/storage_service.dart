import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'database_service.dart';

/// Firebase Storage wrapper.
class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final FirebaseStorage _storage = FirebaseStorage.instance;
  final DatabaseService _db = DatabaseService.instance;

  /// Uploads a local [file] for the given [uid], records metadata in RTDB,
  /// and returns the public download URL.
  Future<String> uploadFile({
    required String uid,
    required File file,
    required String fileName,
    String? mimeType,
  }) async {
    final ext = fileName.split('.').last;
    final path = 'uploads/$uid/${DateTime.now().millisecondsSinceEpoch}_$fileName';

    final ref = _storage.ref().child(path);
    final metadata = SettableMetadata(
      contentType: mimeType,
      customMetadata: {'uid': uid, 'originalName': fileName},
    );

    final task = await ref.putFile(file, metadata);
    final url = await task.ref.getDownloadURL();
    final meta = await task.ref.getMetadata();

    await _db.addUpload(uid, {
      'uid': uid,
      'name': fileName,
      'url': url,
      'path': path,
      'mimeType': meta.contentType ?? mimeType ?? 'application/octet-stream',
      'sizeBytes': meta.size ?? file.lengthSync(),
      'createdAt': DateTime.now().toIso8601String(),
    });

    return url;
  }

  Future<void> deleteFile({
    required String uid,
    required String path,
    required String uploadId,
  }) async {
    try {
      await _storage.ref(path).delete();
    } catch (_) {
      // ignore — file may already be gone; still remove the RTDB record
    }
    await _db.deleteUpload(uid, uploadId);
  }

  Future<String> getDownloadURL(String path) {
    return _storage.ref(path).getDownloadURL();
  }
}
