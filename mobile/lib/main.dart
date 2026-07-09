import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/config/app_config.dart';
import 'core/config/firebase_config.dart';
import 'core/models/user_model.dart';
import 'core/services/auth_service.dart';
import 'core/services/database_service.dart';
import 'core/theme/app_theme.dart';
import 'features/ai_assistant/ai_assistant_screen.dart';
import 'features/analytics/analytics_screen.dart';
import 'features/api_settings/api_settings_screen.dart';
import 'features/auth/forgot_password_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/signup_screen.dart';
import 'features/contacts/contacts_screen.dart';
import 'features/home/home_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/profile_setup/profile_setup_screen.dart';
import 'features/reply_settings/reply_settings_screen.dart';
import 'features/rules/create_rule_screen.dart';
import 'features/rules/rules_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/subscription/subscription_screen.dart';
import 'features/uploads/uploads_screen.dart';
import 'features/whatsapp/whatsapp_connection_screen.dart';

late FlutterLocalNotificationsPlugin _notificationsPlugin;
late AppState _appState;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  Animate.restartOnHotReload = true;

  // Firebase
  await Firebase.initializeApp(
    options: FirebaseConfig.options,
  );
  // Ensure RTDB client created
  try {
    DatabaseService.instance;
  } catch (_) {}

  // Local notifications
  _notificationsPlugin = FlutterLocalNotificationsPlugin();
  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosInit = DarwinInitializationSettings();
  await _notificationsPlugin.initialize(
    const InitializationSettings(android: androidInit, iOS: iosInit),
  );

  // Initialize shared app state before runApp
  _appState = AppState();
  await _appState.init();

  runApp(const ReplyOSApp());
}

/// Root ReplyOS application with global app state and routing.
class ReplyOSApp extends StatelessWidget {
  const ReplyOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _appState,
      builder: (context, _) {
        return MaterialApp(
          title: 'ReplyOS',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme(),
          darkTheme: AppTheme.darkTheme(),
          themeMode: _appState.themeMode,
          builder: (context, child) {
            return Directionality(
              textDirection:
                  _appState.rtl ? TextDirection.rtl : TextDirection.ltr,
              child: child!,
            );
          },
          onGenerateRoute: _appState.generateRoute,
          home: const _SplashGate(),
        );
      },
    );
  }
}

/// Splash gate that decides the initial route based on auth/prefs.
class _SplashGate extends StatefulWidget {
  const _SplashGate();

  @override
  State<_SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<_SplashGate> {
  @override
  void initState() {
    super.initState();
    // Wait for splash animation; then route.
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (!mounted) return;
      _appState.routeAfterSplash(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return const SplashScreen();
  }
}

/// App-level state container.
class AppState extends ChangeNotifier {
  UserModel? user;
  bool isGuest = false;

  String themeModeStr = 'system';
  String locale = 'ar';
  bool rtl = true;
  bool onboardingDone = false;
  bool profileSetupDone = false;

  ThemeMode get themeMode {
    switch (themeModeStr) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  late StreamSubscription _authSub;
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    themeModeStr = _prefs?.getString(AppConfig.prefThemeMode) ?? 'system';
    locale = _prefs?.getString(AppConfig.prefLocale) ?? 'ar';
    rtl = _prefs?.getBool(AppConfig.prefRtl) ?? true;
    onboardingDone = _prefs?.getBool(AppConfig.prefOnboardingDone) ?? false;
    profileSetupDone =
        _prefs?.getBool(AppConfig.prefProfileSetupDone) ?? false;
    isGuest = _prefs?.getBool(AppConfig.prefIsGuest) ?? false;

    // Try loading guest user synchronously (local)
    final guest = await AuthService.instance.loadGuestUser();
    if (guest != null) {
      user = guest;
      isGuest = true;
    }

    // Listen to Firebase auth
    _authSub = AuthService.instance.authStateChanges.listen((fbUser) async {
      if (fbUser != null) {
        user = UserModel.fromFirebaseUser(fbUser);
        isGuest = false;
      } else {
        final g = await AuthService.instance.loadGuestUser();
        user = g;
        isGuest = g != null;
      }
      notifyListeners();
    });

    notifyListeners();
  }

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }

  // === Setters ===

  Future<void> setThemeMode(String mode) async {
    themeModeStr = mode;
    await _prefs?.setString(AppConfig.prefThemeMode, mode);
    notifyListeners();
  }

  Future<void> setLocale(String loc) async {
    locale = loc;
    await _prefs?.setString(AppConfig.prefLocale, loc);
    notifyListeners();
  }

  Future<void> setRtl(bool v) async {
    rtl = v;
    await _prefs?.setBool(AppConfig.prefRtl, v);
    notifyListeners();
  }

  Future<void> markOnboardingDone() async {
    onboardingDone = true;
    await _prefs?.setBool(AppConfig.prefOnboardingDone, true);
    notifyListeners();
  }

  Future<void> markProfileSetupDone() async {
    profileSetupDone = true;
    await _prefs?.setBool(AppConfig.prefProfileSetupDone, true);
    notifyListeners();
  }

  Future<void> onLogout() async {
    await AuthService.instance.signOut();
    user = null;
    isGuest = false;
    notifyListeners();
  }

  /// Initial routing after splash.
  void routeAfterSplash(BuildContext context) {
    if (!onboardingDone) {
      Navigator.pushReplacementNamed(context, '/onboarding');
      return;
    }
    if (user == null) {
      Navigator.pushReplacementNamed(context, '/login');
      return;
    }
    if (!isGuest && !profileSetupDone) {
      Navigator.pushReplacementNamed(context, '/profile-setup');
      return;
    }
    Navigator.pushReplacementNamed(context, '/home');
  }

  /// Named-route generator used by MaterialApp.onGenerateRoute.
  Route<dynamic>? generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/splash':
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case '/onboarding':
        return MaterialPageRoute(
          builder: (_) => OnboardingScreen(
            onComplete: () async {
              await markOnboardingDone();
              Navigator.pushReplacementNamed(_, '/login');
            },
          ),
        );
      case '/login':
        return MaterialPageRoute(
          builder: (_) => LoginScreen(
            onLoginSuccess: () {
              final isGuestNow = AuthService.instance.isGuest;
              if (!isGuestNow && !profileSetupDone) {
                Navigator.pushReplacementNamed(_, '/profile-setup');
              } else {
                Navigator.pushReplacementNamed(_, '/home');
              }
            },
            onSignup: () => Navigator.pushNamed(_, '/signup'),
            onForgotPassword: () => Navigator.pushNamed(_, '/forgot-password'),
            onEmailLogin: (email, pass) => AuthService.instance.signInWithEmail(
                email: email, password: pass),
            onGoogleLogin: () async => AuthService.instance.signInWithGoogle(),
            onGuestLogin: () async {
              await AuthService.instance.signInAsGuest();
            },
          ),
        );
      case '/signup':
        return MaterialPageRoute(
          builder: (_) => SignupScreen(
            onSignupSuccess: () {
              Navigator.pushReplacementNamed(_, '/profile-setup');
            },
            onBackToLogin: () => Navigator.pop(_),
            onSignup: (email, pass, name) => AuthService.instance.signUp(
                email: email, password: pass, displayName: name),
          ),
        );
      case '/forgot-password':
        return MaterialPageRoute(
          builder: (_) => ForgotPasswordScreen(
            onBack: () => Navigator.pop(_),
            onSend: (email) => AuthService.instance.sendPasswordReset(email),
          ),
        );
      case '/profile-setup':
        final uid = user?.uid ?? 'unknown';
        return MaterialPageRoute(
          builder: (_) => ProfileSetupScreen(
            uid: uid,
            onSave: (profile) async {
              await DatabaseService.instance.saveProfile(uid, profile);
              await markProfileSetupDone();
            },
            onComplete: () => Navigator.pushReplacementNamed(_, '/home'),
          ),
        );
      case '/home':
        return MaterialPageRoute(
          builder: (_) => HomeScreen(
            user: user ?? UserModel.guest(uid: 'unknown'),
            aiEnabled: true,
            whatsappConnected: false,
            todayReplies: 12,
            todayMessages: 34,
            activeContacts: 8,
            onGoAi: () => Navigator.pushNamed(_, '/ai'),
            onGoWhatsapp: () => Navigator.pushNamed(_, '/whatsapp'),
            onGoReplySettings: () => Navigator.pushNamed(_, '/reply-settings'),
            onGoRules: () => Navigator.pushNamed(_, '/rules'),
            onGoAnalytics: () => Navigator.pushNamed(_, '/analytics'),
            onGoUploads: () => Navigator.pushNamed(_, '/uploads'),
          ),
        );
      case '/ai':
        return MaterialPageRoute(
          builder: (_) => AiAssistantScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/whatsapp':
        return MaterialPageRoute(
          builder: (_) =>
              WhatsappConnectionScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/reply-settings':
        return MaterialPageRoute(
          builder: (_) =>
              ReplySettingsScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/rules':
        return MaterialPageRoute(
          builder: (_) => RulesScreen(
            uid: user?.uid ?? 'unknown',
            onCreate: () => Navigator.pushNamed(_, '/rules/create'),
          ),
        );
      case '/rules/create':
        return MaterialPageRoute(
          builder: (_) => CreateRuleScreen(
            uid: user?.uid ?? 'unknown',
            onSaved: () => Navigator.pop(_),
          ),
        );
      case '/contacts':
        return MaterialPageRoute(builder: (_) => const ContactsScreen());
      case '/uploads':
        return MaterialPageRoute(
          builder: (_) => UploadsScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/api-settings':
        return MaterialPageRoute(
          builder: (_) => ApiSettingsScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/analytics':
        return MaterialPageRoute(
          builder: (_) => AnalyticsScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/subscription':
        return MaterialPageRoute(
          builder: (_) => SubscriptionScreen(uid: user?.uid ?? 'unknown'),
        );
      case '/settings':
        return MaterialPageRoute(
          builder: (_) => SettingsScreen(
            uid: user?.uid ?? 'unknown',
            isGuest: isGuest,
            themeMode: themeModeStr,
            locale: locale,
            rtl: rtl,
            onThemeModeChanged: (v) => setThemeMode(v),
            onLocaleChanged: (v) => setLocale(v),
            onRtlChanged: (v) => setRtl(v),
            onLogout: onLogout,
          ),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('الصفحة غير موجودة')),
            body: Center(
              child: Text('Route ${settings.name} not found'),
            ),
          ),
        );
    }
  }
}
