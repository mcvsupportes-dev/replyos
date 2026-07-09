import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';

/// Authentication wrapper for Firebase Auth + Google + Guest mode.
/// Guest mode stores a local user id/name in shared_preferences.
class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  FirebaseAuth get firebaseAuth => _auth;

  /// Stream of the current Firebase user (null when signed out).
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  bool get isGuest {
    return _cachedIsGuest;
  }

  bool _cachedIsGuest = false;

  // === Email / password ===

  Future<UserModel> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    _cachedIsGuest = false;
    await _clearGuestLocal();
    return UserModel.fromFirebaseUser(cred.user!, provider: 'password');
  }

  Future<UserModel> signUp({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    if (displayName != null && displayName.trim().isNotEmpty) {
      await cred.user!.updateDisplayName(displayName.trim());
    }
    _cachedIsGuest = false;
    await _clearGuestLocal();
    return UserModel.fromFirebaseUser(cred.user!, provider: 'password');
  }

  Future<void> sendPasswordReset(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  // === Google Sign-In ===

  Future<UserModel?> signInWithGoogle() async {
    final account = await _googleSignIn.signIn();
    if (account == null) return null;
    final googleAuth = await account.authentication;
    final credential = GoogleAuthProvider.credential(
      idToken: googleAuth.idToken,
      accessToken: googleAuth.accessToken,
    );
    final cred = await _auth.signInWithCredential(credential);
    _cachedIsGuest = false;
    await _clearGuestLocal();
    return UserModel.fromFirebaseUser(cred.user!, provider: 'google');
  }

  // === Guest mode (local only) ===

  Future<UserModel> signInAsGuest({String? name}) async {
    final prefs = await SharedPreferences.getInstance();
    String guestId = prefs.getString(AppConfig.prefGuestId) ?? '';
    if (guestId.isEmpty) {
      guestId = 'guest_${DateTime.now().millisecondsSinceEpoch}';
    }
    await prefs.setBool(AppConfig.prefIsGuest, true);
    await prefs.setString(AppConfig.prefGuestId, guestId);
    await prefs.setString(
      AppConfig.prefGuestName,
      name ?? 'زائر ReplyOS',
    );
    _cachedIsGuest = true;
    return UserModel.guest(uid: guestId, name: name);
  }

  Future<UserModel?> loadGuestUser() async {
    final prefs = await SharedPreferences.getInstance();
    final isGuest = prefs.getBool(AppConfig.prefIsGuest) ?? false;
    if (!isGuest) return null;
    final guestId = prefs.getString(AppConfig.prefGuestId);
    if (guestId == null || guestId.isEmpty) return null;
    final name = prefs.getString(AppConfig.prefGuestName) ?? 'زائر';
    _cachedIsGuest = true;
    return UserModel.guest(uid: guestId, name: name);
  }

  Future<void> _clearGuestLocal() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.prefIsGuest);
    await prefs.remove(AppConfig.prefGuestId);
    await prefs.remove(AppConfig.prefGuestName);
  }

  // === Sign out ===

  Future<void> signOut() async {
    if (await _googleSignIn.isSignedIn()) {
      await _googleSignIn.signOut();
    }
    if (_auth.currentUser != null) {
      await _auth.signOut();
    }
    await _clearGuestLocal();
    _cachedIsGuest = false;
  }
}
