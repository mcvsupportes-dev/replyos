/// Application-level configuration constants for ReplyOS.
class AppConfig {
  AppConfig._();

  /// Next.js backend base URL.
  static const String backendBaseUrl = 'https://replyos-1.vercel.app';

  /// API endpoint paths (relative to [backendBaseUrl]).
  static const String aiChatEndpoint = '/api/ai/chat';
  static const String whatsappSendMessageEndpoint = '/api/whatsapp/send-message';

  /// Shared preferences keys.
  static const String prefIsGuest = 'is_guest';
  static const String prefGuestId = 'guest_id';
  static const String prefGuestName = 'guest_name';
  static const String prefThemeMode = 'theme_mode'; // 'light' | 'dark' | 'system'
  static const String prefLocale = 'locale'; // 'ar' | 'en'
  static const String prefRtl = 'rtl'; // bool
  static const String prefOnboardingDone = 'onboarding_done';
  static const String prefProfileSetupDone = 'profile_setup_done';

  /// App defaults.
  static const String defaultLocale = 'ar';
  static const bool defaultRtl = true;
  static const String appVersion = '1.0.0';

  /// AI providers (for API settings screen).
  static const List<String> aiProviders = ['openai', 'anthropic', 'gemini', 'default'];

  /// Common AI models per provider.
  static const Map<String, List<String>> aiModels = {
    'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    'gemini': ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    'default': ['replyos-default'],
  };

  /// Subscription plans.
  static const List<String> subscriptionPlans = ['free', 'pro', 'business'];

  /// Tone options for AI replies.
  static const List<String> toneOptions = [
    'ودود', 'احترافي', 'رسمي', 'مرح', 'مختصر', 'مفصل'
  ];

  /// Response length options.
  static const List<String> lengthOptions = ['قصير', 'متوسط', 'طويل'];

  /// Response style options.
  static const List<String> styleOptions = ['طبيعي', 'تجاري', 'دعم فني', 'تسويقي'];
}
