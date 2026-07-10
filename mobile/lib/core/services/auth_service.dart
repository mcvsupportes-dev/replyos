import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';

/// Authentication wrapper for Firebase Auth + Google + Guest mode + API-backed login.
/// Guest mode stores a local user id/name in shared_preferences.
/// API-backed login (signInWithEmailApi / signUpApi) hits the dashboard's
/// /api/public/auth/* endpoints and caches the returned token for subsequent
/// WhatsApp / plans / me calls.
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

  // === Email / password (Firebase direct) ===

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

    // Cache the Firebase ID token for API calls
    final idToken = await cred.user!.getIdToken() ?? '';
    await _cacheUserToken(idToken, cred.user!.uid, cred.user!.email ?? '');

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

    // Cache the Firebase ID token for API calls
    final idToken = await cred.user!.getIdToken() ?? '';
    await _cacheUserToken(idToken, cred.user!.uid, cred.user!.email ?? '');

    return UserModel.fromFirebaseUser(cred.user!, provider: 'password');
  }

  // === Email / password (API-backed — works without Firebase Auth SDK) ===

  /// Sign in via the dashboard's public login endpoint.
  /// Returns a UserModel and caches the token for subsequent WhatsApp/plans calls.
  Future<UserModel> signInWithEmailApi({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.loginEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email.trim(), 'password': password}),
        )
        .timeout(const Duration(seconds: 15));

    final data = jsonDecode(res.body);

    if (res.statusCode >= 400) {
      throw Exception(data['error'] ?? 'فشل تسجيل الدخول');
    }

    final user = data['user'] as Map<String, dynamic>;
    final token = data['token'] as String;

    await _cacheUserToken(token, user['id'] as String, user['email'] as String);
    await _cacheUserPlan((user['plan'] ?? 'free') as String);
    _cachedIsGuest = false;
    await _clearGuestLocal();

    return UserModel(
      uid: user['id'] as String,
      email: user['email'] as String,
      displayName: user['name'] as String?,
      provider: 'password',
    );
  }

  /// Sign up via the dashboard's public signup endpoint.
  Future<UserModel> signUpApi({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.signupEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email.trim(),
            'password': password,
            'name': displayName,
          }),
        )
        .timeout(const Duration(seconds: 15));

    final data = jsonDecode(res.body);

    if (res.statusCode >= 400) {
      throw Exception(data['error'] ?? 'فشل إنشاء الحساب');
    }

    final user = data['user'] as Map<String, dynamic>;
    final token = data['token'] as String;

    await _cacheUserToken(token, user['id'] as String, user['email'] as String);
    await _cacheUserPlan((user['plan'] ?? 'free') as String);
    _cachedIsGuest = false;
    await _clearGuestLocal();

    return UserModel(
      uid: user['id'] as String,
      email: user['email'] as String,
      displayName: user['name'] as String?,
      provider: 'password',
    );
  }

  /// Get the cached user token (or null if not logged in via API).
  Future<String?> getCachedUserToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.prefUserToken);
  }

  /// Get the cached user plan.
  Future<String> getCachedUserPlan() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.prefUserPlan) ?? 'free';
  }

  Future<void> _cacheUserToken(String token, String uid, String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefUserToken, token);
    await prefs.setString(AppConfig.prefUserId, uid);
    await prefs.setString(AppConfig.prefUserEmail, email);
  }

  Future<void> _cacheUserPlan(String plan) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefUserPlan, plan);
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

    // Cache the Firebase ID token for API calls
    final idToken = await cred.user!.getIdToken() ?? '';
    await _cacheUserToken(idToken, cred.user!.uid, cred.user!.email ?? '');

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

    // Clear cached API token
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.prefUserToken);
    await prefs.remove(AppConfig.prefUserId);
    await prefs.remove(AppConfig.prefUserEmail);
    await prefs.remove(AppConfig.prefUserPlan);
    await prefs.remove(AppConfig.prefWhatsappPhone);
    await prefs.remove(AppConfig.prefWhatsappStatus);

    _cachedIsGuest = false;
  }
}
