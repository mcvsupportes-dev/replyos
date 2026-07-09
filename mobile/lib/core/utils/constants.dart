import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// App-wide constants: dimensions, durations, demo data.
class AppConstants {
  AppConstants._();

  // Sizing
  static const double radiusXs = 8;
  static const double radiusSm = 12;
  static const double radiusMd = 16;
  static const double radiusLg = 20;
  static const double radiusXl = 28;

  static const double spacingXs = 4;
  static const double spacingSm = 8;
  static const double spacingMd = 16;
  static const double spacingLg = 24;
  static const double spacingXl = 32;
  static const double spacing2xl = 48;

  // Animations
  static const Duration durationFast = Duration(milliseconds: 200);
  static const Duration durationMedium = Duration(milliseconds: 350);
  static const Duration durationSlow = Duration(milliseconds: 600);

  // Local storage keys (mirror AppConfig.pref*)
  static const String prefIsGuest = 'is_guest';
  static const String prefGuestId = 'guest_id';
  static const String prefGuestName = 'guest_name';
  static const String prefThemeMode = 'theme_mode';
  static const String prefLocale = 'locale';
  static const String prefRtl = 'rtl';
  static const String prefOnboardingDone = 'onboarding_done';
  static const String prefProfileSetupDone = 'profile_setup_done';
}

/// Arabic strings used across the app.
/// (Arabic-first app — strings are inline.)
class AppStrings {
  AppStrings._();

  static const String appName = 'ReplyOS';
  static const String appTagline = 'مساعدك الذكي للرد على واتساب';

  // Auth
  static const String login = 'تسجيل الدخول';
  static const String signup = 'إنشاء حساب';
  static const String logout = 'تسجيل الخروج';
  static const String email = 'البريد الإلكتروني';
  static const String password = 'كلمة المرور';
  static const String confirmPassword = 'تأكيد كلمة المرور';
  static const String forgotPassword = 'نسيت كلمة المرور؟';
  static const String continueWithGoogle = 'المتابعة عبر Google';
  static const String continueAsGuest = 'المتابعة كزائر';
  static const String noAccount = 'ليس لديك حساب؟';
  static const String haveAccount = 'لديك حساب بالفعل؟';

  // Navigation
  static const String home = 'الرئيسية';
  static const String aiAssistant = 'المساعد الذكي';
  static const String whatsapp = 'واتساب';
  static const String settings = 'الإعدادات';
  static const String rules = 'القواعد';
  static const String contacts = 'جهات الاتصال';
  static const String uploads = 'الملفات';
  static const String analytics = 'الإحصائيات';
  static const String subscription = 'الاشتراك';
  static const String apiSettings = 'إعدادات API';
  static const String replySettings = 'إعدادات الرد';
  static const String profileSetup = 'إعداد الملف';

  // Generic
  static const String save = 'حفظ';
  static const String cancel = 'إلغاء';
  static const String delete = 'حذف';
  static const String edit = 'تعديل';
  static const String create = 'إنشاء';
  static const String confirm = 'تأكيد';
  static const String next = 'التالي';
  static const String back = 'رجوع';
  static const String finish = 'إنهاء';
  static const String skip = 'تخطي';
  static const String search = 'بحث';
  static const String loading = 'جارٍ التحميل...';
  static const String retry = 'إعادة المحاولة';
  static const String test = 'اختبار';
  static const String connect = 'ربط';
  static const String disconnect = 'قطع الاتصال';
  static const String enabled = 'مفعّل';
  static const String disabled = 'معطّل';
  static const String upgrade = 'ترقية';
  static const String currentPlan = 'الباقة الحالية';
}

/// Demo data for UI previews (when offline / guest mode).
class AppDemoData {
  AppDemoData._();

  static const List<Map<String, String>> onboardingSlides = [
    {
      'icon': 'sparkles',
      'title': 'ردود ذكية في ثوانٍ',
      'description': 'دع الذكاء الاصطناعي يرد على عملائك عبر واتساب باحترافية وسرعة.',
    },
    {
      'icon': 'whatsapp',
      'title': 'تكامل مع واتساب للأعمال',
      'description': 'اربط حساب واتساب بيزنس بضغطة زر وابدأ أتمتة المحادثات فوراً.',
    },
    {
      'icon': 'sliders',
      'title': 'قواعد ونبرة قابلة للتخصيص',
      'description': 'اضبط نبرة الرد، طول الرسالة، وساعات العمل بما يناسب نشاطك.',
    },
    {
      'icon': 'chart',
      'title': 'إحصائيات لحظية',
      'description': 'تابع عدد الردود، الرسائل، وأكثر الأسئلة شيوعاً في لوحة واحدة.',
    },
  ];

  static const List<Map<String, dynamic>> quickActions = [
    {'icon': 'sparkles', 'title': 'المساعد الذكي', 'route': '/ai'},
    {'icon': 'whatsapp', 'title': 'واتساب', 'route': '/whatsapp'},
    {'icon': 'sliders', 'title': 'إعدادات الرد', 'route': '/reply-settings'},
    {'icon': 'list', 'title': 'القواعد', 'route': '/rules'},
  ];

  static const List<Map<String, String>> sampleRules = [
    {
      'text': 'إذا سأل العميل عن السعر، أرسل رابط قائمة الأسعار',
      'status': 'active',
    },
    {
      'text': 'خارج ساعات العمل اعتذر وأخبره بمواعيد العمل',
      'status': 'active',
    },
    {
      'text': 'إذا ذكر العميل كلمة "شكوى" حوّله لموظف بشري',
      'status': 'paused',
    },
  ];

  static const List<Map<String, String>> sampleContacts = [
    {'name': 'أحمد محمد', 'phone': '+20 100 123 4567', 'last': 'منذ 5 دقائق'},
    {'name': 'سارة علي', 'phone': '+966 50 987 6543', 'last': 'منذ ساعة'},
    {'name': 'خالد عبدالله', 'phone': '+971 55 222 1188', 'last': 'منذ 3 ساعات'},
    {'name': 'منى حسن', 'phone': '+20 111 444 5566', 'last': 'أمس'},
    {'name': 'يوسف إبراهيم', 'phone': '+966 53 010 2030', 'last': 'أمس'},
  ];
}
