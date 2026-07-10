/// Application-level configuration constants for ReplyOS.
class AppConfig {
  AppConfig._();

  /// Next.js backend base URL (Vercel deployment).
  /// All mobile app API calls go through here — the dashboard proxies
  /// WhatsApp calls to the remote bridge (13.60.186.223) automatically.
  static const String backendBaseUrl = 'https://replyos-bbbmu.vercel.app';

  // ─── Public API endpoints (used by the mobile app) ──────────────────────
  // Auth
  static const String loginEndpoint = '/api/public/auth/login';
  static const String signupEndpoint = '/api/public/auth/signup';
  static const String meEndpoint = '/api/public/me';

  // Plans & Subscriptions
  static const String plansEndpoint = '/api/public/plans';
  static const String subscribeEndpoint = '/api/public/subscribe';

  // WhatsApp (proxied to the remote bridge)
  static const String whatsappPairEndpoint = '/api/public/whatsapp/pair';
  static const String whatsappSendEndpoint = '/api/public/whatsapp/send';

  // AI
  static const String aiChatEndpoint = '/api/ai/chat';

  // Legacy endpoints (kept for backwards compatibility)
  static const String whatsappSendMessageEndpoint = '/api/whatsapp/send-message';

  // ─── Shared preferences keys ────────────────────────────────────────────
  static const String prefIsGuest = 'is_guest';
  static const String prefGuestId = 'guest_id';
  static const String prefGuestName = 'guest_name';
  static const String prefThemeMode = 'theme_mode'; // 'light' | 'dark' | 'system'
  static const String prefLocale = 'locale'; // 'ar' | 'en'
  static const String prefRtl = 'rtl'; // bool
  static const String prefOnboardingDone = 'onboarding_done';
  static const String prefProfileSetupDone = 'profile_setup_done';
  static const String prefUserToken = 'user_token';
  static const String prefUserEmail = 'user_email';
  static const String prefUserId = 'user_id';
  static const String prefUserPlan = 'user_plan';
  static const String prefWhatsappPhone = 'whatsapp_phone';
  static const String prefWhatsappStatus = 'whatsapp_status';

  // ─── App defaults ───────────────────────────────────────────────────────
  static const String defaultLocale = 'ar';
  static const bool defaultRtl = true;
  static const String appVersion = '2.0.0';

  // ─── AI providers (for API settings screen) ─────────────────────────────
  static const List<String> aiProviders = ['openai', 'anthropic', 'gemini', 'default'];

  static const Map<String, List<String>> aiModels = {
    'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    'gemini': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    'default': ['replyos-default'],
  };

  // ─── Subscription plans (fetched live from /api/public/plans) ────────────
  // These are fallback values used when the API is unreachable.
  static const List<String> subscriptionPlans = ['free', 'pro', 'business'];

  // ─── Tone / length / style options ──────────────────────────────────────
  static const List<String> toneOptions = [
    'ودود', 'احترافي', 'رسمي', 'مرح', 'مختصر', 'مفصل'
  ];

  static const List<String> lengthOptions = ['قصير', 'متوسط', 'طويل'];

  static const List<String> styleOptions = ['طبيعي', 'تجاري', 'دعم فني', 'تسويقي'];
}
