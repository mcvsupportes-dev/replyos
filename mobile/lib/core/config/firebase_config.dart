import 'package:firebase_core/firebase_core.dart';

/// Firebase configuration for ReplyOS.
/// Connects to the replyos-af4d3 project.
class FirebaseConfig {
  FirebaseConfig._();

  static const FirebaseOptions options = FirebaseOptions(
    apiKey: 'AIzaSyDT6mK57wM0jdKNFtSGbzVohh2dcntV0Ek',
    authDomain: 'replyos-af4d3.firebaseapp.com',
    databaseURL: 'https://replyos-af4d3-default-rtdb.firebaseio.com',
    projectId: 'replyos-af4d3',
    storageBucket: 'replyos-af4d3.firebasestorage.app',
    messagingSenderId: '637515594302',
    appId: '1:637515594302:web:2dc67974fb815062b52f6f',
  );
}

/// Firebase Realtime Database node names.
class DbNodes {
  DbNodes._();

  static const String users = 'users';
  static const String profiles = 'profiles';
  static const String rules = 'rules';
  static const String chats = 'chats';
  static const String messages = 'messages';
  static const String contacts = 'contacts';
  static const String uploads = 'uploads';
  static const String settings = 'settings';
  static const String customApiKeys = 'customApiKeys';
  static const String analytics = 'analytics';
  static const String subscriptions = 'subscriptions';
  static const String whatsappConnections = 'whatsappConnections';
}
