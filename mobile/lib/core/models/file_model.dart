/// Represents an uploaded file/image stored in Firebase Storage.
class FileModel {
  final String id;
  final String uid;
  final String name;
  final String url;
  final String path; // Storage path
  final String mimeType;
  final int sizeBytes;
  final DateTime createdAt;

  FileModel({
    required this.id,
    required this.uid,
    required this.name,
    required this.url,
    required this.path,
    required this.mimeType,
    required this.sizeBytes,
    required this.createdAt,
  });

  factory FileModel.fromJson(Map<String, dynamic> json) {
    return FileModel(
      id: json['id'] as String,
      uid: json['uid'] as String,
      name: json['name'] as String,
      url: json['url'] as String,
      path: json['path'] as String,
      mimeType: (json['mimeType'] as String?) ?? 'application/octet-stream',
      sizeBytes: (json['sizeBytes'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'uid': uid,
        'name': name,
        'url': url,
        'path': path,
        'mimeType': mimeType,
        'sizeBytes': sizeBytes,
        'createdAt': createdAt.toIso8601String(),
      };

  bool get isImage =>
      mimeType.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.gif', '.webp']
          .any((e) => name.toLowerCase().endsWith(e));

  String get sizeReadable {
    const units = ['B', 'KB', 'MB', 'GB'];
    double s = sizeBytes.toDouble();
    int u = 0;
    while (s >= 1024 && u < units.length - 1) {
      s /= 1024;
      u++;
    }
    return '${s.toStringAsFixed(u == 0 ? 0 : 1)} ${units[u]}';
  }
}
