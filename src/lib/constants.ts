/**
 * Core constants for ReplyOS - admin nav, plan definitions, tones, etc.
 */

export const APP_NAME = "ReplyOS";
export const APP_NAME_AR = "ريبلاي أو إس";
export const APP_TAGLINE = "AI Assistant for WhatsApp Business";
export const APP_TAGLINE_AR = "مساعد ذكاء اصطناعي لأعمال واتساب";

export interface NavItem {
  title: string;
  titleAr: string;
  href: string;
  icon: string;
  group?: string;
}

export const ADMIN_NAV: NavItem[] = [
  { title: "Overview", titleAr: "نظرة عامة", href: "/dashboard", icon: "LayoutDashboard", group: "main" },
  { title: "Users", titleAr: "المستخدمون", href: "/dashboard/users", icon: "Users", group: "main" },
  { title: "WhatsApp", titleAr: "واتساب", href: "/dashboard/whatsapp", icon: "MessageCircle", group: "main" },
  { title: "Plans", titleAr: "الباقات", href: "/dashboard/plans", icon: "CreditCard", group: "billing" },
  { title: "Subscriptions", titleAr: "الاشتراكات", href: "/dashboard/subscriptions", icon: "Receipt", group: "billing" },
  { title: "AI Providers", titleAr: "مزودو الذكاء", href: "/dashboard/ai-providers", icon: "Bot", group: "ai" },
  { title: "Files", titleAr: "الملفات", href: "/dashboard/files", icon: "FileText", group: "content" },
  { title: "Storage", titleAr: "التخزين", href: "/dashboard/storage", icon: "HardDrive", group: "content" },
  { title: "Logs", titleAr: "السجلات", href: "/dashboard/logs", icon: "ScrollText", group: "ops" },
  { title: "Notifications", titleAr: "الإشعارات", href: "/dashboard/notifications", icon: "Bell", group: "ops" },
  { title: "Settings", titleAr: "الإعدادات", href: "/dashboard/settings", icon: "Settings", group: "system" },
  { title: "System Health", titleAr: "صحة النظام", href: "/dashboard/system-health", icon: "Activity", group: "system" },
  { title: "Security", titleAr: "الأمان", href: "/dashboard/security", icon: "Shield", group: "system" },
  { title: "Support", titleAr: "الدعم", href: "/dashboard/support", icon: "LifeBuoy", group: "system" },
  { title: "Feature Flags", titleAr: "ميزات تجريبية", href: "/dashboard/feature-flags", icon: "Flag", group: "system" },
  { title: "Backups", titleAr: "النسخ الاحتياطي", href: "/dashboard/backups", icon: "DatabaseBackup", group: "system" },
];

export const TONES = [
  { id: "friendly", label: "Friendly", labelAr: "ودود" },
  { id: "sad", label: "Sad", labelAr: "حزين" },
  { id: "romantic", label: "Romantic", labelAr: "رومانسي" },
  { id: "serious", label: "Serious", labelAr: "جدي" },
  { id: "professional", label: "Professional", labelAr: "احترافي" },
  { id: "casual", label: "Casual", labelAr: "عادي" },
];

export const RESPONSE_LENGTHS = [
  { id: "short", label: "Short", labelAr: "قصير" },
  { id: "medium", label: "Medium", labelAr: "متوسط" },
  { id: "long", label: "Long", labelAr: "طويل" },
];

export const AI_PROVIDERS = [
  { id: "zai", label: "Z.ai (Default)", labelAr: "Z.ai (افتراضي)" },
  { id: "openai", label: "OpenAI", labelAr: "OpenAI" },
  { id: "anthropic", label: "Anthropic", labelAr: "Anthropic" },
  { id: "google", label: "Google AI", labelAr: "Google AI" },
  { id: "custom", label: "Custom Endpoint", labelAr: "نقطة نهاية مخصصة" },
];

export const DEFAULT_PLANS = [
  {
    id: "free",
    name: "Free",
    nameAr: "مجاني",
    price: 0,
    currency: "USD",
    interval: "month",
    repliesLimit: 100,
    storageLimitMb: 50,
    features: ["AI replies", "1 WhatsApp number", "Basic rules"],
    featuresAr: ["ردود ذكاء اصطناعي", "رقم واتساب واحد", "قواعد أساسية"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    nameAr: "احترافي",
    price: 19,
    currency: "USD",
    interval: "month",
    repliesLimit: 5000,
    storageLimitMb: 2048,
    features: ["Everything in Free", "5 WhatsApp numbers", "Advanced rules", "Custom AI key", "Analytics", "Priority support"],
    featuresAr: ["كل ميزات المجاني", "٥ أرقام واتساب", "قواعد متقدمة", "مفتاح ذكاء مخصص", "تحليلات", "دعم أولوية"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    nameAr: "أعمال",
    price: 49,
    currency: "USD",
    interval: "month",
    repliesLimit: 50000,
    storageLimitMb: 10240,
    features: ["Everything in Pro", "Unlimited WhatsApp numbers", "Team accounts", "API access", "White-label", "Dedicated support"],
    featuresAr: ["كل ميزات الاحترافي", "أرقام غير محدودة", "حسابات فريق", "وصول API", "علامة بيضاء", "دعم مخصص"],
    popular: false,
  },
];

export const DEFAULT_FEATURE_FLAGS = [
  { key: "ai_voice", label: "AI Voice Replies", labelAr: "ردود صوتية", enabled: false },
  { key: "multi_number", label: "Multiple WhatsApp Numbers", labelAr: "أرقام واتساب متعددة", enabled: true },
  { key: "team_accounts", label: "Team Accounts", labelAr: "حسابات الفريق", enabled: false },
  { key: "custom_ai_key", label: "Custom AI Key", labelAr: "مفتاح ذكاء مخصص", enabled: true },
  { key: "white_label", label: "White Label", labelAr: "علامة بيضاء", enabled: false },
  { key: "analytics_export", label: "Analytics Export", labelAr: "تصدير التحليلات", enabled: true },
  { key: "webhooks", label: "Webhooks", labelAr: "Webhooks", enabled: true },
  { key: "auto_rules", label: "Auto Rule Generation", labelAr: "توليد قواعد تلقائي", enabled: true },
];
