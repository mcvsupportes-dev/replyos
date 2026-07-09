"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { Sparkles, Mail, Lock, ArrowRight, ArrowLeft, Moon, Sun, Languages, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [email, setEmail] = React.useState("admin@replyos.com");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
        return;
      }
      toast.success(lang === "ar" ? "مرحباً بعودتك!" : "Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Brand panel */}
      <div className="lg:flex-1 bg-gradient-to-br from-primary/90 via-primary to-emerald-700 p-8 lg:p-16 flex flex-col justify-between text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 start-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 end-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-bold">ReplyOS</p>
            <p className="text-sm text-white/80">
              {lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {lang === "ar"
              ? "مساعد ذكاء اصطناعي لأعمال واتساب"
              : "AI Assistant for WhatsApp Business"}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            {lang === "ar"
              ? "إدارة شاملة للمستخدمين والاشتراكات ومزودي الذكاء الاصطناعي من مكان واحد."
              : "Manage users, subscriptions, and AI providers — all from one elegant dashboard."}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === "ar" ? "آمن وموثوق" : "Secure & Trusted"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{lang === "ar" ? "مدعوم بالذكاء" : "AI-Powered"}</span>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="lg:flex-1 flex items-center justify-center p-6 lg:p-16 bg-background">
        <div className="w-full max-w-sm">
          {/* Top controls */}
          <div className="flex justify-end gap-2 mb-8">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <Languages className="w-4.5 h-4.5" />
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {lang === "ar" ? "تسجيل الدخول" : "Admin Login"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === "ar"
                ? "أدخل بياناتك للوصول إلى لوحة الإدارة"
                : "Enter your credentials to access the admin panel"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@replyos.com"
                  className="w-full ps-10 pe-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {lang === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 premium-shadow"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {lang === "ar" ? "دخول" : "Sign In"}
                  {lang === "ar" ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-accent/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              {lang === "ar"
                ? "بيانات الدخول: admin@replyos.com"
                : "Login: admin@replyos.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
