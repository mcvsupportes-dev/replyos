"use client";

import * as React from "react";

type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const translations: Record<string, { ar: string; en: string }> = {
  // Nav
  "nav.overview": { ar: "نظرة عامة", en: "Overview" },
  "nav.users": { ar: "المستخدمون", en: "Users" },
  "nav.plans": { ar: "الباقات", en: "Plans" },
  "nav.subscriptions": { ar: "الاشتراكات", en: "Subscriptions" },
  "nav.ai_providers": { ar: "مزودو الذكاء", en: "AI Providers" },
  "nav.files": { ar: "الملفات", en: "Files" },
  "nav.storage": { ar: "التخزين", en: "Storage" },
  "nav.logs": { ar: "السجلات", en: "Logs" },
  "nav.notifications": { ar: "الإشعارات", en: "Notifications" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "nav.system_health": { ar: "صحة النظام", en: "System Health" },
  "nav.security": { ar: "الأمان", en: "Security" },
  "nav.support": { ar: "الدعم", en: "Support" },
  "nav.feature_flags": { ar: "ميزات تجريبية", en: "Feature Flags" },
  "nav.backups": { ar: "النسخ الاحتياطي", en: "Backups" },

  // Common
  "common.search": { ar: "بحث", en: "Search" },
  "common.create": { ar: "إنشاء", en: "Create" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.refresh": { ar: "تحديث", en: "Refresh" },
  "common.export": { ar: "تصدير", en: "Export" },
  "common.enable": { ar: "تفعيل", en: "Enable" },
  "common.disable": { ar: "تعطيل", en: "Disable" },
  "common.test": { ar: "اختبار", en: "Test" },
  "common.view": { ar: "عرض", en: "View" },
  "common.actions": { ar: "إجراءات", en: "Actions" },
  "common.status": { ar: "الحالة", en: "Status" },
  "common.name": { ar: "الاسم", en: "Name" },
  "common.email": { ar: "البريد", en: "Email" },
  "common.plan": { ar: "الباقة", en: "Plan" },
  "common.date": { ar: "التاريخ", en: "Date" },
  "common.loading": { ar: "جارٍ التحميل...", en: "Loading..." },
  "common.no_data": { ar: "لا توجد بيانات", en: "No data" },
  "common.confirm": { ar: "تأكيد", en: "Confirm" },

  // Dashboard
  "dashboard.title": { ar: "لوحة التحكم", en: "Dashboard" },
  "dashboard.total_users": { ar: "إجمالي المستخدمين", en: "Total Users" },
  "dashboard.active_subscriptions": { ar: "الاشتراكات النشطة", en: "Active Subscriptions" },
  "dashboard.ai_replies_today": { ar: "ردود الذكاء اليوم", en: "AI Replies Today" },
  "dashboard.storage_used": { ar: "التخزين المستخدم", en: "Storage Used" },
  "dashboard.recent_activity": { ar: "النشاط الأخير", en: "Recent Activity" },
  "dashboard.quick_stats": { ar: "إحصائيات سريعة", en: "Quick Stats" },
  "dashboard.revenue": { ar: "الإيرادات", en: "Revenue" },

  // Auth
  "auth.login": { ar: "تسجيل الدخول", en: "Login" },
  "auth.email": { ar: "البريد الإلكتروني", en: "Email" },
  "auth.password": { ar: "كلمة المرور", en: "Password" },
  "auth.signin": { ar: "دخول", en: "Sign In" },
  "auth.logout": { ar: "تسجيل الخروج", en: "Logout" },
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function applyLang(l: Lang) {
  const dir = l === "ar" ? "rtl" : "ltr";
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.documentElement.dir = dir;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("ar");

  React.useEffect(() => {
    const saved = localStorage.getItem("replyos-lang") as Lang | null;
    if (saved) {
      setLangState(saved);
      applyLang(saved);
    } else {
      applyLang("ar");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("replyos-lang", l);
    applyLang(l);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang];
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    // Fallback during SSR
    return {
      lang: "ar" as Lang,
      setLang: () => {},
      t: (k: string) => k,
      dir: "rtl" as const,
    };
  }
  return ctx;
}
