import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Home, MessageSquare, MessageCircle, Users, BarChart2, Settings as SettingsIcon,
  ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, Send, Copy, RefreshCw,
  Square, Paperclip, Search, Plus, X, Eye, EyeOff, Upload, Image as ImageIcon,
  FileText, Wifi, WifiOff, Shield, Bell, Moon, Sun, LogOut, CreditCard,
  TrendingUp, Star, Tag, Archive, Trash2, Sparkles, Clock, Zap, ChevronDown,
  MoreVertical, Phone, Mail, Lock, User, MapPin, Briefcase, Check, Loader2,
  Download, RotateCcw, Database, Globe, Building2, Info, PlayCircle, Cake,
  SlidersHorizontal, HelpCircle, Crown, Gem, Rocket, BadgeCheck
} from "lucide-react";

/* ============================================================
   ReplyOS — Premium Arabic-first AI Business Assistant
   UI-only interactive prototype
   ============================================================ */

const PALETTE = {
  dark: {
    bg: "#0A100D", surface: "#12211B", surface2: "#0E1A15",
    border: "#1E332B", text: "#EAF3EE", textMuted: "#8CA69B",
    primary: "#1E9E77", primaryDeep: "#0F6E52", primarySoft: "#153C2F",
    accent: "#3FE6B0", danger: "#F0655C", dangerSoft: "#3A1E1C",
    warn: "#E8B75B", chip: "#182A22",
    gradA: "#1E9E77", gradB: "#0B5A9E", gold: "#F2C572", goldSoft: "#3A2F14",
    hi: "rgba(255,255,255,0.06)", cardTop: "#17281F", cardBot: "#0F1D17",
    navBg: "rgba(18,33,27,0.72)", glassBorder: "rgba(255,255,255,0.08)"
  },
  light: {
    bg: "#F6F4EE", surface: "#FFFFFF", surface2: "#F0EEE6",
    border: "#E4E0D4", text: "#1B241F", textMuted: "#71786F",
    primary: "#0F6E52", primaryDeep: "#0B5A42", primarySoft: "#E3F1EA",
    accent: "#12946F", danger: "#D14C43", dangerSoft: "#FBE7E5",
    warn: "#B87A1E", chip: "#EDEAE0",
    gradA: "#0F6E52", gradB: "#0B5A9E", gold: "#B8860B", goldSoft: "#FBF0DC",
    hi: "rgba(255,255,255,0.9)", cardTop: "#FFFFFF", cardBot: "#F7F4EC",
    navBg: "rgba(255,255,255,0.72)", glassBorder: "rgba(255,255,255,0.6)"
  }
};

function useFonts() {
  useEffect(() => {
    const id = "replyos-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ---------------- shared bits ---------------- */

function Toast({ toast, C }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "absolute", bottom: 92, left: 16, right: 16, zIndex: 60,
        background: C.text, color: C.bg, borderRadius: 14, padding: "10px 14px",
        fontSize: 13, fontWeight: 600, textAlign: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        animation: "riseFade .25s ease"
      }}
    >
      {toast}
    </div>
  );
}

function Toggle({ on, onChange, C }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 999, position: "relative",
        background: on ? `linear-gradient(120deg, ${C.primary}, ${C.accent})` : C.border,
        boxShadow: on ? `0 4px 10px -3px ${C.primary}80` : "none",
        transition: "background .2s, box-shadow .2s", flexShrink: 0
      }}
    >
      <span
        style={{
          position: "absolute", top: 3, [on ? "right" : "left"]: 3,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "all .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
        }}
      />
    </button>
  );
}

function Card({ C, children, style, onClick, glow }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(165deg, ${C.cardTop}, ${C.cardBot})`,
        border: `1px solid ${C.border}`, borderRadius: 22, padding: 14,
        boxShadow: glow
          ? `0 14px 32px -10px ${C.primary}45, inset 0 1px 0 ${C.hi}`
          : `0 6px 20px -12px rgba(0,0,0,0.35), inset 0 1px 0 ${C.hi}`,
        transition: "transform .15s, box-shadow .15s",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Btn({ C, children, onClick, variant = "primary", icon: Icon, style, disabled }) {
  const base = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, padding: "12px 16px", fontWeight: 700, fontSize: 14,
    width: "100%", transition: "transform .15s, opacity .15s, box-shadow .15s",
    opacity: disabled ? 0.5 : 1
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: "#fff", border: "none", boxShadow: `0 10px 22px -8px ${C.primary}80` },
    secondary: { background: C.chip, color: C.text },
    outline: { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.textMuted },
    danger: { background: `linear-gradient(135deg, ${C.danger}, #c8433c)`, color: "#fff", border: "none", boxShadow: `0 10px 20px -8px ${C.danger}70` },
    gold: { background: `linear-gradient(120deg, ${C.gold}, #E8A93C)`, color: "#241a05", boxShadow: `0 10px 20px -8px ${C.gold}70` }
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function Chip({ C, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
        background: active ? `linear-gradient(120deg, ${C.primary}, ${C.accent})` : C.chip,
        color: active ? "#fff" : C.textMuted,
        whiteSpace: "nowrap", border: `1px solid ${active ? "transparent" : C.border}`,
        boxShadow: active ? `0 6px 14px -6px ${C.primary}70` : "none",
        transition: "all .15s"
      }}
    >
      {children}
    </button>
  );
}

function Field({ C, label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
          {label}
        </div>
      )}
      <input
        {...props}
        style={{
          width: "100%", background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14,
          fontFamily: "inherit"
        }}
      />
    </div>
  );
}

/* ---------------- Country code select ---------------- */

const COUNTRIES = [
  { code: "EG", name: "مصر", dial: "+20", flag: "🇪🇬" },
  { code: "SA", name: "السعودية", dial: "+966", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات", dial: "+971", flag: "🇦🇪" },
  { code: "KW", name: "الكويت", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name: "قطر", dial: "+974", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "عمان", dial: "+968", flag: "🇴🇲" },
  { code: "JO", name: "الأردن", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "لبنان", dial: "+961", flag: "🇱🇧" },
  { code: "IQ", name: "العراق", dial: "+964", flag: "🇮🇶" },
  { code: "SY", name: "سوريا", dial: "+963", flag: "🇸🇾" },
  { code: "YE", name: "اليمن", dial: "+967", flag: "🇾🇪" },
  { code: "PS", name: "فلسطين", dial: "+970", flag: "🇵🇸" },
  { code: "LY", name: "ليبيا", dial: "+218", flag: "🇱🇾" },
  { code: "TN", name: "تونس", dial: "+216", flag: "🇹🇳" },
  { code: "DZ", name: "الجزائر", dial: "+213", flag: "🇩🇿" },
  { code: "MA", name: "المغرب", dial: "+212", flag: "🇲🇦" },
  { code: "SD", name: "السودان", dial: "+249", flag: "🇸🇩" },
  { code: "TR", name: "تركيا", dial: "+90", flag: "🇹🇷" },
  { code: "US", name: "أمريكا", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "بريطانيا", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "ألمانيا", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "فرنسا", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "إيطاليا", dial: "+39", flag: "🇮🇹" },
  { code: "IN", name: "الهند", dial: "+91", flag: "🇮🇳" },
  { code: "CN", name: "الصين", dial: "+86", flag: "🇨🇳" }
];

function CountryCodeSelect({ C, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = COUNTRIES.filter(
    (c) => c.name.includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 46, padding: "0 10px",
          borderRadius: 12, background: C.surface2, border: `1px solid ${open ? C.primary : C.border}`,
          transition: "border-color .2s"
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>{value.flag}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, direction: "ltr" }}>{value.dial}</span>
        <ChevronDown size={14} color={C.textMuted} style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, width: 240, zIndex: 80,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
            boxShadow: "0 16px 40px rgba(0,0,0,0.35)", overflow: "hidden",
            animation: "dropIn .18s ease"
          }}
        >
          <div style={{ padding: 8, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: "relative" }}>
              <Search size={13} color={C.textMuted} style={{ position: "absolute", right: 10, top: 10 }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن الدولة أو الكود..."
                style={{
                  width: "100%", background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "8px 30px 8px 10px", color: C.text, fontSize: 12.5,
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  background: c.code === value.code ? C.primarySoft : "transparent",
                  borderBottom: `1px solid ${C.border}`, textAlign: "right"
                }}
              >
                <span style={{ fontSize: 17 }}>{c.flag}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</span>
                <span style={{ fontSize: 12, color: C.textMuted, direction: "ltr" }}>{c.dial}</span>
                {c.code === value.code && <Check size={13} color={C.primary} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 18, textAlign: "center", fontSize: 12, color: C.textMuted }}>لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ C, title, onBack, right }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        background: C.navBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 40 }}>
        {onBack && (
          <button onClick={onBack} style={{ color: C.text, width: 34, height: 34, borderRadius: 11, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 16, color: C.text }}>
        {title}
      </div>
      <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

function SectionLabel({ C, children }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, margin: "18px 2px 8px" }}>
      {children}
    </div>
  );
}

function Avatar({ name, size = 40, color }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: color || "#12694C",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size / 2.6, flexShrink: 0
      }}
    >
      {name?.[0] || "؟"}
    </div>
  );
}

function StatCard({ C, label, value, icon: Icon, sub }) {
  return (
    <Card C={C} style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 11, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px -3px ${C.primary}70` }}>
          <Icon size={15} color="#fff" />
        </div>
      </div>
      <div style={{ fontFamily: "Cairo", fontSize: 24, fontWeight: 800, color: C.text, marginTop: 8 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: C.accent, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </Card>
  );
}

function Row({ C, icon: Icon, label, sub, right, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "13px 4px",
        borderBottom: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default"
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 12, flexShrink: 0,
        background: danger ? `linear-gradient(135deg, ${C.danger}, #c8433c)` : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: danger ? `0 4px 10px -3px ${C.danger}70` : `0 4px 10px -3px ${C.primary}70`
      }}>
        <Icon size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? C.danger : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right !== undefined ? right : <ChevronLeft size={16} color={C.textMuted} />}
    </div>
  );
}

/* ---------------- Splash ---------------- */

function Splash({ C, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 22 }}>
      <div style={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.primary}55, transparent 70%)`,
          animation: "pulseRing 1.8s ease-in-out infinite"
        }} />
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: C.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 30px ${C.primary}66`
        }}>
          <Sparkles size={30} color="#fff" />
        </div>
      </div>
      <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 24, color: C.text, letterSpacing: 0.5 }}>
        ReplyOS
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>مساعدك الذكي للرد على عملائك</div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: C.primary,
            animation: `dotBounce 1.2s ${i * 0.15}s ease-in-out infinite`
          }} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Onboarding ---------------- */

const ONB_SLIDES = [
  { icon: Sparkles, title: "ردود ذكية فورية", desc: "دع الذكاء الاصطناعي يرد على عملائك بأسلوبك، على مدار الساعة." },
  { icon: MessageSquare, title: "ربط واتساب بيزنس", desc: "اربط رقم عملك الرسمي وابدأ الرد التلقائي في دقائق." },
  { icon: SlidersHorizontal, title: "قواعد وأتمتة", desc: "اكتب قاعدة بجملة عادية، وخلي التطبيق ينفذها زي ما تحب." },
  { icon: Globe, title: "عربي وإنجليزي", desc: "واجهة عربية أنيقة بالكامل، وجاهزة للعمل بالإنجليزي كمان." }
];

function Onboarding({ C, onDone }) {
  const [i, setI] = useState(0);
  const slide = ONB_SLIDES[i];
  const Icon = slide.icon;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 16px 0" }}>
        <button onClick={onDone} style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>تخطي</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{
          width: 88, height: 88, borderRadius: 26, background: C.primarySoft,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28
        }}>
          <Icon size={38} color={C.primary} />
        </div>
        <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 21, color: C.text, marginBottom: 10 }}>
          {slide.title}
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.8, maxWidth: 260 }}>
          {slide.desc}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
        {ONB_SLIDES.map((_, idx) => (
          <span key={idx} style={{
            width: idx === i ? 20 : 6, height: 6, borderRadius: 999,
            background: idx === i ? C.primary : C.border, transition: "all .25s"
          }} />
        ))}
      </div>
      <div style={{ padding: "0 20px 28px" }}>
        <Btn C={C} onClick={() => (i < ONB_SLIDES.length - 1 ? setI(i + 1) : onDone())}>
          {i < ONB_SLIDES.length - 1 ? "متابعة" : "ابدأ الآن"}
        </Btn>
      </div>
    </div>
  );
}

/* ---------------- Auth ---------------- */

function Auth({ C, onDone }) {
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, padding: "36px 20px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Sparkles size={26} color="#fff" />
      </div>
      <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 4 }}>
        {mode === "login" ? "أهلاً بعودتك" : "إنشاء حساب جديد"}
      </div>
      <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 24 }}>
        {mode === "login" ? "سجّل دخولك عشان تكمل شغلك" : "خطوة واحدة وتبدأ تستخدم ReplyOS"}
      </div>

      <div style={{ display: "flex", background: C.chip, borderRadius: 14, padding: 4, marginBottom: 22 }}>
        {["login", "signup"].map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "9px 0", borderRadius: 11, fontSize: 13.5, fontWeight: 700,
            background: mode === m ? C.surface : "transparent", color: mode === m ? C.text : C.textMuted
          }}>
            {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      <Btn C={C} variant="outline" icon={Globe} style={{ marginBottom: 10 }}>المتابعة عبر جوجل</Btn>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ fontSize: 12, color: C.textMuted }}>أو بالبريد الإلكتروني</div>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {mode === "signup" && <Field C={C} label="الاسم بالكامل" placeholder="اكتب اسمك" />}
      <Field C={C} label="البريد الإلكتروني" placeholder="example@mail.com" />
      <div style={{ position: "relative" }}>
        <Field C={C} label="كلمة المرور" type={showPass ? "text" : "password"} placeholder="••••••••" />
        <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", left: 14, top: 38, color: C.textMuted }}>
          {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {mode === "login" && (
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <button style={{ fontSize: 12.5, color: C.primary, fontWeight: 600 }}>نسيت كلمة المرور؟</button>
        </div>
      )}

      <Btn C={C} onClick={onDone} style={{ marginTop: 6 }}>{mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</Btn>
      <Btn C={C} variant="ghost" onClick={onDone} style={{ marginTop: 10 }}>المتابعة كزائر</Btn>
    </div>
  );
}

/* ---------------- Profile setup ---------------- */

const PROFILE_STEPS = [
  { key: "name", q: "ما اسمك؟", ph: "اكتب اسمك الأول", icon: User, optional: false },
  { key: "age", q: "كام سنك؟", ph: "مثال: 27", icon: Cake, optional: false },
  { key: "profession", q: "ما مهنتك؟", ph: "مثال: صاحب متجر إلكتروني", icon: Briefcase, optional: false },
  { key: "city", q: "فين ساكن؟", ph: "المدينة (اختياري)", icon: MapPin, optional: true }
];

function ProfileSetup({ C, onDone, profile, setProfile }) {
  const [step, setStep] = useState(0);
  const s = PROFILE_STEPS[step];
  const Icon = s.icon;
  const next = () => (step < PROFILE_STEPS.length - 1 ? setStep(step + 1) : onDone());
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, padding: "24px 20px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {PROFILE_STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? C.primary : C.border }} />
        ))}
      </div>
      <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", animation: "slideIn .3s ease" }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon size={26} color={C.primary} />
        </div>
        <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 16 }}>{s.q}</div>
        <Field C={C} placeholder={s.ph} value={profile[s.key]} onChange={(e) => setProfile({ ...profile, [s.key]: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {step > 0 && <Btn C={C} variant="outline" onClick={() => setStep(step - 1)} style={{ width: 90 }}>رجوع</Btn>}
        {s.optional && <Btn C={C} variant="ghost" onClick={next} style={{ width: 90 }}>تخطي</Btn>}
        <Btn C={C} onClick={next}>{step < PROFILE_STEPS.length - 1 ? "التالي" : "حفظ ومتابعة"}</Btn>
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */

function HomeScreen({ C, profile, go, notify, theme, setTheme, wa, openUpgrade }) {
  const [refreshing, setRefreshing] = useState(false);
  const actions = [
    { label: "المساعد الذكي", icon: Sparkles, go: () => go("tab", "chat") },
    { label: "ربط واتساب", icon: MessageSquare, go: () => go("sub", "whatsapp") },
    { label: "إعدادات الرد", icon: SlidersHorizontal, go: () => go("sub", "reply") },
    { label: "إنشاء قاعدة", icon: Zap, go: () => go("sub", "rules") },
    { label: "رفع ملف", icon: Upload, go: () => go("sub", "uploads") },
    { label: "جهات الاتصال", icon: Users, go: () => go("tab", "contacts") },
    { label: "التحليلات", icon: BarChart2, go: () => go("tab", "analytics") },
    { label: "الإعدادات", icon: SettingsIcon, go: () => go("tab", "settings") }
  ];
  const recent = [
    { name: "مروة سعيد", msg: "تمام شكرًا جدًا 🙏", time: "9:41", color: "#12694C" },
    { name: "أحمد جلال", msg: "الكتالوج وصل امتى؟", time: "9:12", color: "#0F6E52" },
    { name: "سارة يوسف", msg: "عايزة أعرف سعر الشحن", time: "8:55", color: "#1E9E77" }
  ];
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>مرحبًا 👋</div>
          <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 19, color: C.text }}>
            {profile.name || "صديقنا"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={openUpgrade}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px",
              borderRadius: 12, background: `linear-gradient(120deg, ${C.gold}, #E8A93C)`,
              boxShadow: `0 6px 16px ${C.gold}55`, color: "#241a05", fontSize: 12.5, fontWeight: 800,
              flexShrink: 0
            }}
          >
            <Crown size={15} /> ترقية
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ width: 38, height: 38, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {theme === "dark" ? <Sun size={16} color={C.text} /> : <Moon size={16} color={C.text} />}
          </button>
          <button onClick={() => { setRefreshing(true); notify("تم تحديث البيانات"); setTimeout(() => setRefreshing(false), 700); }} style={{ width: 38, height: 38, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={16} color={C.text} style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div
        onClick={openUpgrade}
        style={{
          position: "relative", overflow: "hidden", borderRadius: 20, padding: 16, marginBottom: 14,
          background: `linear-gradient(135deg, ${C.gradA}, ${C.gradB})`, cursor: "pointer",
          boxShadow: `0 12px 30px ${C.primary}33`
        }}
      >
        <div style={{ position: "absolute", top: -30, left: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -40, right: -10, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Sparkles size={14} color="#fff" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>افتح كل الإمكانيات</span>
            </div>
            <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 16, color: "#fff" }}>ترقّي لـ Pro أو Business</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>ردود غير محدودة، تحليلات متقدمة، ودعم أولوية</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Card C={C} glow style={{ flex: 1 }} onClick={() => go("sub", "whatsapp")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: wa ? C.accent : C.danger }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>واتساب</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{wa ? "متصل ونشط" : "غير متصل"}</div>
        </Card>
        <Card C={C} glow style={{ flex: 1 }} onClick={() => go("tab", "chat")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={13} color={C.primary} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>الذكاء الاصطناعي</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>يعمل تلقائيًا</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <StatCard C={C} label="ردود اليوم" value="128" icon={Sparkles} sub="+12% عن أمس" />
        <StatCard C={C} label="رسائل اليوم" value="204" icon={MessageSquare} sub="+5% عن أمس" />
      </div>

      <SectionLabel C={C}>إجراءات سريعة</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.go} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 18,
              background: `linear-gradient(160deg, ${C.cardTop}, ${C.cardBot})`,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 6px 16px -8px rgba(0,0,0,0.3), inset 0 1px 0 ${C.hi}`
            }}>
              <a.icon size={20} color={C.primary} />
            </div>
            <div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 600, textAlign: "center" }}>{a.label}</div>
          </button>
        ))}
      </div>

      <SectionLabel C={C}>محادثات حديثة</SectionLabel>
      <Card C={C} style={{ padding: 6 }}>
        {recent.map((r, i) => (
          <div key={i} onClick={() => go("tab", "contacts")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <Avatar name={r.name} color={r.color} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{r.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.msg}</div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{r.time}</div>
          </div>
        ))}
      </Card>

      <SectionLabel C={C}>الاشتراك والتخزين</SectionLabel>
      <Card C={C} onClick={() => go("sub", "subscription")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>باقة Pro</div>
          <div style={{ fontSize: 11.5, color: C.primary, fontWeight: 700 }}>سارية حتى 12 أغسطس</div>
        </div>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 4 }}>التخزين: 3.2 GB من 10 GB</div>
        <div style={{ height: 6, borderRadius: 999, background: C.chip }}>
          <div style={{ width: "32%", height: "100%", borderRadius: 999, background: C.primary }} />
        </div>
      </Card>
    </div>
  );
}

/* ---------------- AI Chat ---------------- */

const SUGGESTIONS = [
  "اعمل قاعدة لو حد سأل عن السعر",
  "لخص آخر 10 رسائل",
  "حوّل الرد لأسلوب رسمي",
  "ابعت صورة الكتالوج"
];
const TONES = ["ودود", "احترافي", "رسمي", "بسيط"];
const LENGTHS = ["قصير", "متوسط", "طويل"];

function ChatScreen({ C, notify }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "أهلاً بيك! أنا مساعد ReplyOS، اكتب لي أي أمر وهساعدك في ردود عملائك.", time: "9:40" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [tone, setTone] = useState("ودود");
  const [len, setLen] = useState("متوسط");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text) => {
    const t = text ?? input;
    if (!t.trim()) return;
    setMessages((m) => [...m, { role: "user", text: t, time: "الآن" }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, {
        role: "assistant",
        text: `تمام، هطبق ده بأسلوب "${tone}" وطول "${len}". تقدر تدوس "استخدم الرد ده" لو عاجبك.`,
        time: "الآن"
      }]);
    }, 1300);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, overflowX: "auto" }}>
        {TONES.map((t) => <Chip key={t} C={C} active={tone === t} onClick={() => setTone(t)}>{t}</Chip>)}
        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
        {LENGTHS.map((l) => <Chip key={l} C={C} active={len === l} onClick={() => setLen(l)}>{l}</Chip>)}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", maxWidth: "82%", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              {m.role === "assistant" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.primary, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${C.primarySoft}` }}>
                  <Sparkles size={12} color="#fff" />
                </div>
              )}
              <div style={{
                background: m.role === "user" ? C.primary : C.surface,
                color: m.role === "user" ? "#fff" : C.text,
                border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
                borderRadius: 16, padding: "10px 13px", fontSize: 13.5, lineHeight: 1.7
              }}>
                {m.text}
              </div>
            </div>
            {m.role === "assistant" && i > 0 && (
              <div style={{ display: "flex", gap: 12, marginRight: 34 }}>
                <button onClick={() => notify("تم النسخ")} style={{ color: C.textMuted }}><Copy size={13} /></button>
                <button onClick={() => notify("جاري إعادة التوليد")} style={{ color: C.textMuted }}><RefreshCw size={13} /></button>
                <button onClick={() => notify("تم استخدام الرد")} style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>استخدم الرد</button>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={12} color="#fff" />
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "10px 14px", display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.textMuted, animation: `dotBounce 1.2s ${i * 0.15}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "8px 14px", display: "flex", gap: 8, overflowX: "auto" }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => send(s)} style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 600, padding: "8px 12px", borderRadius: 12, background: C.chip, color: C.textMuted }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => notify("تم إرفاق ملف")} style={{ color: C.textMuted, flexShrink: 0 }}><Paperclip size={19} /></button>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب رسالتك..."
          style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "11px 16px", color: C.text, fontSize: 13.5, fontFamily: "inherit" }}
        />
        {typing ? (
          <button onClick={() => setTyping(false)} style={{ width: 46, height: 46, borderRadius: "50%", background: C.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Square size={16} color={C.danger} />
          </button>
        ) : (
          <button onClick={() => send()} style={{ width: 46, height: 46, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 16px ${C.primary}55` }}>
            <Send size={20} color="#fff" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Contacts ---------------- */

const CONTACTS = [
  { name: "مروة سعيد", phone: "+20 100 111 2222", msg: "تمام شكرًا جدًا 🙏", time: "9:41", unread: 2, vip: true, color: "#12694C" },
  { name: "أحمد جلال", phone: "+20 122 333 4444", msg: "الكتالوج وصل امتى؟", time: "9:12", unread: 0, vip: false, color: "#0F6E52" },
  { name: "سارة يوسف", phone: "+20 155 666 7777", msg: "عايزة أعرف سعر الشحن", time: "8:55", unread: 1, vip: false, color: "#1E9E77" },
  { name: "محمد عادل", phone: "+20 111 222 3333", msg: "تم الدفع ✅", time: "أمس", unread: 0, vip: true, color: "#0B5A42" },
  { name: "هدى كمال", phone: "+20 106 555 8888", msg: "ممكن صورة تانية؟", time: "أمس", unread: 0, vip: false, color: "#12694C" }
];

function ContactsScreen({ C, notify }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("الكل");
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const filtered = CONTACTS.filter((c) => {
    if (filter === "VIP" && !c.vip) return false;
    if (filter === "غير مقروء" && c.unread === 0) return false;
    return c.name.includes(q);
  });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "14px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 18, color: C.text }}>جهات الاتصال</div>
        <button onClick={() => { setSyncing(true); notify("تمت مزامنة جهات الاتصال"); setTimeout(() => setSyncing(false), 900); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.primary }}>
          <RefreshCw size={14} style={{ animation: syncing ? "spin .7s linear infinite" : "none" }} /> مزامنة
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={15} color={C.textMuted} style={{ position: "absolute", right: 12, top: 12 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم..." style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 36px 10px 12px", color: C.text, fontSize: 13.5, fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["الكل", "VIP", "غير مقروء"].map((f) => <Chip key={f} C={C} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
      </div>

      <Card C={C} style={{ padding: 6 }}>
        {filtered.map((c, i) => (
          <div key={i} onClick={() => setSelected(c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <Avatar name={c.name} color={c.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{c.name}</div>
                {c.vip && <Star size={11} color={C.warn} fill={C.warn} />}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.msg}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>{c.time}</div>
              {c.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.primary, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.unread}</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>لا يوجد جهات اتصال مطابقة</div>}
      </Card>

      {selected && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: C.bg, borderRadius: "22px 22px 0 0", padding: 18, maxHeight: "78%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: C.border, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar name={selected.name} color={selected.color} size={52} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text, fontFamily: "Cairo" }}>{selected.name}</div>
                <div style={{ fontSize: 12.5, color: C.textMuted, direction: "ltr", textAlign: "right" }}>{selected.phone}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Btn C={C} icon={MessageSquare} onClick={() => notify("تم فتح المحادثة")}>فتح المحادثة</Btn>
              <Btn C={C} variant="outline" icon={Star} onClick={() => notify("تم التمييز كـ VIP")} style={{ width: 110 }}>VIP</Btn>
            </div>
            <SectionLabel C={C}>ملاحظات</SectionLabel>
            <Card C={C} style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>عميلة دايمًا بتطلب توصيل سريع.</Card>
            <SectionLabel C={C}>الوسوم</SectionLabel>
            <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <Chip C={C} active>عميل مميز</Chip>
              <Chip C={C}>+ إضافة وسم</Chip>
            </div>
            <SectionLabel C={C}>آخر تواصل</SectionLabel>
            <Card C={C} style={{ fontSize: 13, color: C.textMuted }}>آخر ظهور: منذ 20 دقيقة</Card>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn C={C} variant="ghost" icon={Archive} onClick={() => notify("تمت الأرشفة")}>أرشفة</Btn>
              <Btn C={C} variant="ghost" icon={Tag} onClick={() => notify("تمت إضافة وسم")}>إضافة وسم</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- WhatsApp connection (sub) ---------------- */

function WhatsAppConnectFlow({ C, step, country, setCountry, phone, setPhone, code, timer, submitPhone, regenerate, copyCode, confirmConnected, close }) {
  const stepIndex = { phone: 0, loading: 1, code: 1 }[step] ?? 0;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="ربط رقم واتساب" onBack={close} />
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= stepIndex ? C.primary : C.border, transition: "background .3s" }} />
          ))}
        </div>
      </div>

      <div key={step} style={{ flex: 1, overflowY: "auto", padding: "26px 24px", animation: "pageIn .25s ease" }}>
        {step === "phone" && (
          <div style={{ maxWidth: 340, margin: "0 auto" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <MessageCircle size={26} color={C.primary} />
            </div>
            <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 8 }}>حط رقم واتساب بيزنس</div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8, marginBottom: 26 }}>اختار كود الدولة وحط رقمك، وهنبعتلك رمز ربط سريع تدخله في تطبيق واتساب بيزنس.</div>

            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>رقم الواتساب</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              <CountryCodeSelect C={C} value={country} onChange={setCountry} />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10xxxxxxxx"
                style={{
                  flex: 1, minWidth: 0, background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14,
                  fontFamily: "inherit", direction: "ltr", textAlign: "right"
                }}
              />
            </div>

            <Btn C={C} onClick={submitPhone} disabled={!phone.trim()}>إرسال الطلب</Btn>
          </div>
        )}

        {step === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <Loader2 size={34} color={C.primary} style={{ animation: "spin .8s linear infinite", marginBottom: 18 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>جاري إرسال الطلب...</div>
            <div style={{ fontSize: 12.5, color: C.textMuted, direction: "ltr" }}>{country.dial} {phone}</div>
          </div>
        )}

        {step === "code" && (
          <div style={{ maxWidth: 340, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <BadgeCheck size={26} color={C.primary} />
            </div>
            <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 19, color: C.text, marginBottom: 8 }}>رمز ربط واتساب</div>
            <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.8, marginBottom: 22 }}>افتح واتساب بيزنس وادخل الرمز ده، وبعد ما تدخله دوس تأكيد الربط تحت</div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 }}>
              {code.split("").map((c, i) => (
                <div key={i} style={{
                  width: 42, height: 50, borderRadius: 12, background: C.surface2, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "monospace", fontSize: 21, fontWeight: 700, color: C.text,
                  animation: `dropIn .25s ease ${i * 0.04}s both`
                }}>{c}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Btn C={C} variant="outline" icon={Copy} onClick={copyCode} style={{ width: 130 }}>نسخ الرمز</Btn>
              <Btn C={C} icon={Check} onClick={confirmConnected}>تأكيد الربط</Btn>
            </div>

            {timer > 0 ? (
              <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>
                تنتهي صلاحية الرمز خلال <span style={{ color: C.primary, fontWeight: 800 }}>{timer}</span> ثانية
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12.5, color: C.danger, fontWeight: 700, marginBottom: 10 }}>انتهت صلاحية الرمز</div>
                <Btn C={C} variant="outline" icon={RefreshCw} onClick={regenerate}>إعادة إرسال الرمز</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WhatsAppScreen({ C, notify, wa, setWa, onBack }) {
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(null);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (step !== "code" || timer <= 0) return;
    const t = setInterval(() => setTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step, timer]);

  const genCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const submitPhone = () => {
    if (!phone.trim()) return;
    setStep("loading");
    setTimeout(() => { setCode(genCode()); setTimer(60); setStep("code"); }, 1500);
  };

  const regenerate = () => {
    setStep("loading");
    setTimeout(() => { setCode(genCode()); setTimer(60); setStep("code"); }, 1200);
  };

  const copyCode = () => {
    try { navigator.clipboard.writeText(code); } catch (e) {}
    notify("تم نسخ الرمز");
  };

  const confirmConnected = () => {
    setWa(true);
    notify("تم الاتصال بنجاح، الجهاز متصل الآن ✅");
    setStep(null); setPhone(""); setCode("");
  };

  const close = () => { setStep(null); setPhone(""); };

  if (step) {
    return (
      <WhatsAppConnectFlow
        C={C} step={step} country={country} setCountry={setCountry}
        phone={phone} setPhone={setPhone} code={code} timer={timer}
        submitPhone={submitPhone} regenerate={regenerate} copyCode={copyCode}
        confirmConnected={confirmConnected} close={close}
      />
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="ربط واتساب بيزنس" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <Card C={C} style={{ textAlign: "center", padding: 22, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 12px" }}>
            {wa && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${C.accent}33`, animation: "pulseRing 1.8s ease-in-out infinite" }} />}
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: wa ? C.primarySoft : C.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {wa ? <Wifi size={26} color={C.primary} /> : <WifiOff size={26} color={C.danger} />}
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{wa ? "متصل ونشط" : "غير متصل حاليًا"}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{wa ? "الحساب متزامن ويستقبل الرسائل" : "اربط رقمك للبدء في الرد التلقائي"}</div>
        </Card>

        <Card C={C} style={{ marginBottom: 14 }}>
          {[
            ["معرف رقم الهاتف", "PNID-88213X"],
            ["حالة حساب الأعمال", wa ? "مفعّل" : "معلّق"],
            ["حالة الـ Webhook", wa ? "يستقبل" : "متوقف"],
            ["حالة المزامنة", wa ? "محدثة الآن" : "—"]
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 13, color: C.textMuted }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, direction: "ltr" }}>{v}</div>
            </div>
          ))}
        </Card>

        <SectionLabel C={C}>تعليمات الإعداد</SectionLabel>
        <Card C={C} style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 2, marginBottom: 14 }}>
          1. افتح Meta Business Suite.<br />2. اربط رقم واتساب بيزنس الرسمي.<br />3. انسخ التوكن وضعه في إعدادات الـ API.<br />4. فعّل الـ Webhook من هنا.
        </Card>

        <SectionLabel C={C}>سجل الأحداث</SectionLabel>
        <Card C={C} style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace", direction: "ltr", textAlign: "left", lineHeight: 1.9 }}>
          09:41 webhook: message received<br />09:40 sync: contacts updated<br />09:12 status: connection healthy
        </Card>
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <Btn C={C} variant="outline" icon={RefreshCw} onClick={() => { setTesting(true); setTimeout(() => { setTesting(false); notify("الاتصال يعمل بنجاح"); }, 900); }}>
          {testing ? "جاري الاختبار..." : "اختبار الاتصال"}
        </Btn>
        <Btn
          C={C}
          variant={wa ? "danger" : "primary"}
          icon={wa ? WifiOff : Wifi}
          onClick={() => { if (wa) { setWa(false); notify("تم فصل الاتصال"); } else { setStep("phone"); } }}
        >
          {wa ? "فصل الاتصال" : "اتصال الآن"}
        </Btn>
      </div>
    </div>
  );
}

/* ---------------- Reply Settings (sub) ---------------- */

function ReplySettingsScreen({ C, notify, onBack }) {
  const [auto, setAuto] = useState(true);
  const [ai, setAi] = useState(true);
  const [style, setStyle] = useState("ودود");
  const [len, setLen] = useState("متوسط");
  const [handoff, setHandoff] = useState(false);
  const [lang, setLang] = useState("عربي");
  const [delay, setDelay] = useState("5 ثواني");
  const [groupReply, setGroupReply] = useState(false);
  const [audience, setAudience] = useState("الكل");
  const [cooldown, setCooldown] = useState("5 دقائق");
  const [dailyCap, setDailyCap] = useState("بدون");
  const [variation, setVariation] = useState(true);
  const [mediaReply, setMediaReply] = useState(true);
  const [readReceipt, setReadReceipt] = useState(true);
  const [sigOn, setSigOn] = useState(false);
  const [sigText, setSigText] = useState("— فريق الدعم");
  const [blocklist, setBlocklist] = useState(["شكوى", "مستعجل", "عايز حد يرد"]);
  const [newWord, setNewWord] = useState("");

  const addWord = () => {
    if (newWord.trim() && !blocklist.includes(newWord.trim())) setBlocklist((b) => [...b, newWord.trim()]);
    setNewWord("");
  };
  const removeWord = (w) => setBlocklist((b) => b.filter((x) => x !== w));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="إعدادات الرد" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>الرد التلقائي</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>الرد على العملاء تلقائيًا</div>
            </div>
            <Toggle C={C} on={auto} onChange={setAuto} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>تفعيل الذكاء الاصطناعي</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>توليد الردود بالـ AI</div>
            </div>
            <Toggle C={C} on={ai} onChange={setAi} />
          </div>
        </Card>

        <SectionLabel C={C}>زمن التأخير قبل الرد</SectionLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {["فوري", "5 ثواني", "15 ثانية", "30 ثانية", "دقيقة"].map((s) => <Chip key={s} C={C} active={delay === s} onClick={() => setDelay(s)}>{s}</Chip>)}
        </div>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 14 }}>محاكاة وقت الكتابة الطبيعي قبل إرسال الرد</div>

        <SectionLabel C={C}>أسلوب الرد</SectionLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {["ودود", "احترافي", "رسمي", "بسيط"].map((s) => <Chip key={s} C={C} active={style === s} onClick={() => setStyle(s)}>{s}</Chip>)}
        </div>

        <SectionLabel C={C}>طول الرد</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["قصير", "متوسط", "طويل"].map((s) => <Chip key={s} C={C} active={len === s} onClick={() => setLen(s)}>{s}</Chip>)}
        </div>

        <SectionLabel C={C}>الجمهور المستهدف</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>الرد داخل المجموعات</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>تفعيل الردود التلقائية في جروبات واتساب</div>
            </div>
            <Toggle C={C} on={groupReply} onChange={setGroupReply} />
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>الرد يشمل:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["الكل", "جهات جديدة فقط", "جهات محفوظة فقط"].map((s) => <Chip key={s} C={C} active={audience === s} onClick={() => setAudience(s)}>{s}</Chip>)}
          </div>
        </Card>

        <SectionLabel C={C}>ساعات العمل</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 8 }}>
            <span>من 9:00 ص</span><span>إلى 10:00 م</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.textMuted }}>خارج هذا الوقت: يتم إرسال رد مؤجل تلقائيًا</div>
        </Card>

        <SectionLabel C={C}>الحماية من الإزعاج</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>فترة الانتظار بين ردين لنفس العميل</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {["بدون", "دقيقة", "5 دقائق", "15 دقيقة"].map((s) => <Chip key={s} C={C} active={cooldown === s} onClick={() => setCooldown(s)}>{s}</Chip>)}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>الحد الأقصى للردود يوميًا لكل عميل</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {["بدون", "10", "20", "50"].map((s) => <Chip key={s} C={C} active={dailyCap === s} onClick={() => setDailyCap(s)}>{s}</Chip>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>تنويع صياغة الردود</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>تجنب تكرار نفس الجملة حرفيًا</div>
            </div>
            <Toggle C={C} on={variation} onChange={setVariation} />
          </div>
        </Card>

        <SectionLabel C={C}>الوسائط وإيصالات القراءة</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>الرد على الصور والرسائل الصوتية</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>رد تلقائي حتى لو الرسالة وسائط</div>
            </div>
            <Toggle C={C} on={mediaReply} onChange={setMediaReply} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>تعليم كمقروءة قبل الرد</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>إظهار ✓✓ زرقاء قبل إرسال الرد</div>
            </div>
            <Toggle C={C} on={readReceipt} onChange={setReadReceipt} />
          </div>
        </Card>

        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>التحويل لموظف بشري</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>عند طلب العميل التحدث مع شخص</div>
            </div>
            <Toggle C={C} on={handoff} onChange={setHandoff} />
          </div>
        </Card>

        <SectionLabel C={C}>كلمات توقف الرد التلقائي</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 10 }}>لو الرسالة فيها أي كلمة من دول، بيتوقف الرد التلقائي ويتحول للموظف</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {blocklist.map((w) => (
              <div key={w} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: C.dangerSoft }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.danger }}>{w}</span>
                <button onClick={() => removeWord(w)}><X size={11} color={C.danger} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newWord} onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWord()}
              placeholder="اكتب كلمة وأضِفها..."
              style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}
            />
            <button onClick={addWord} style={{ width: 42, height: 42, borderRadius: 12, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={16} color={C.primary} />
            </button>
          </div>
        </Card>

        <SectionLabel C={C}>التوقيع التلقائي</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sigOn ? 10 : 0 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>إضافة توقيع لكل رد</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>يُضاف تلقائيًا في نهاية كل رسالة</div>
            </div>
            <Toggle C={C} on={sigOn} onChange={setSigOn} />
          </div>
          {sigOn && (
            <input
              value={sigText} onChange={(e) => setSigText(e.target.value)}
              style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit" }}
            />
          )}
        </Card>

        <SectionLabel C={C}>لغة الرد</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {["عربي", "إنجليزي"].map((s) => <Chip key={s} C={C} active={lang === s} onClick={() => setLang(s)}>{s}</Chip>)}
        </div>
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <Btn C={C} variant="outline" icon={RotateCcw} onClick={() => notify("تمت الاستعادة للوضع الافتراضي")} style={{ width: 110 }}>استعادة</Btn>
        <Btn C={C} icon={Check} onClick={() => notify("تم حفظ الإعدادات")}>حفظ الإعدادات</Btn>
      </div>
    </div>
  );
}

/* ---------------- Rules (sub) ---------------- */

function RulesScreen({ C, notify, onBack }) {
  const [rules, setRules] = useState([
    { title: "استفسار عن السعر", cond: "لو حد سأل عن السعر", action: "ابعت الكتالوج", enabled: true },
    { title: "استفسار عن الشحن", cond: "لو الرسالة فيها كلمة شحن", action: "ابعت صورة الشحن", enabled: true },
    { title: "عملاء VIP", cond: "لو العميل VIP", action: "متردش تلقائي", enabled: false },
    { title: "خارج وقت العمل", cond: "لو خارج وقت العمل", action: "ابعت رد مؤجل", enabled: true }
  ]);
  const [showNew, setShowNew] = useState(false);
  const [newCond, setNewCond] = useState("");
  const [newAction, setNewAction] = useState("");

  const toggle = (i) => setRules((r) => r.map((x, idx) => (idx === i ? { ...x, enabled: !x.enabled } : x)));
  const del = (i) => setRules((r) => r.filter((_, idx) => idx !== i));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <TopBar C={C} title="القواعد" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {rules.map((r, i) => (
          <Card C={C} key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{r.title}</div>
              <Toggle C={C} on={r.enabled} onChange={() => toggle(i)} />
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 1.8 }}>
              <span style={{ color: C.primary, fontWeight: 600 }}>الشرط:</span> {r.cond}<br />
              <span style={{ color: C.primary, fontWeight: 600 }}>الإجراء:</span> {r.action}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              <button onClick={() => notify("جاري اختبار القاعدة...")} style={{ fontSize: 11.5, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><PlayCircle size={13} /> اختبار</button>
              <button onClick={() => notify("تم نسخ القاعدة")} style={{ fontSize: 11.5, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Copy size={13} /> تكرار</button>
              <button onClick={() => del(i)} style={{ fontSize: 11.5, color: C.danger, display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={13} /> حذف</button>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
        <Btn C={C} icon={Plus} onClick={() => setShowNew(true)}>إنشاء قاعدة جديدة</Btn>
      </div>

      {showNew && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: C.bg, borderRadius: "22px 22px 0 0", padding: 18 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: C.border, margin: "0 auto 16px" }} />
            <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 14 }}>قاعدة جديدة</div>
            <Field C={C} label="الشرط" placeholder="مثال: لو حد سأل عن السعر" value={newCond} onChange={(e) => setNewCond(e.target.value)} />
            <Field C={C} label="الإجراء" placeholder="مثال: ابعت الكتالوج" value={newAction} onChange={(e) => setNewAction(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Btn C={C} variant="outline" onClick={() => setShowNew(false)} style={{ width: 100 }}>إلغاء</Btn>
              <Btn C={C} icon={Check} onClick={() => {
                if (newCond && newAction) setRules((r) => [{ title: "قاعدة مخصصة", cond: newCond, action: newAction, enabled: true }, ...r]);
                setNewCond(""); setNewAction(""); setShowNew(false); notify("تم إنشاء القاعدة");
              }}>حفظ القاعدة</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Uploads (sub) ---------------- */

function UploadsScreen({ C, notify, onBack }) {
  const [tab, setTab] = useState("ملفات");
  const [progress, setProgress] = useState(null);
  const files = [
    { name: "كتالوج المنتجات.pdf", size: "2.1 MB", icon: FileText },
    { name: "قائمة الأسعار.xlsx", size: "540 KB", icon: FileText }
  ];
  const images = [
    { name: "صورة_المنتج_1.jpg", size: "1.4 MB", icon: ImageIcon },
    { name: "صورة_الشحن.png", size: "820 KB", icon: ImageIcon },
    { name: "بانر_العرض.jpg", size: "980 KB", icon: ImageIcon }
  ];
  const items = tab === "ملفات" ? files : images;

  const upload = () => {
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); notify("تم الرفع بنجاح"); return null; }
        return p + 20;
      });
    }, 200);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="الملفات والصور" onBack={onBack} />
      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 4 }}>مساحة التخزين: 3.2 GB من 10 GB</div>
        <div style={{ height: 6, borderRadius: 999, background: C.chip, marginBottom: 14 }}>
          <div style={{ width: "32%", height: "100%", borderRadius: 999, background: C.primary }} />
        </div>

        <div style={{ display: "flex", background: C.chip, borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {["ملفات", "صور"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 700, background: tab === t ? C.surface : "transparent", color: tab === t ? C.text : C.textMuted }}>{t}</button>
          ))}
        </div>

        {progress !== null && (
          <Card C={C} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: C.text, marginBottom: 6 }}>جاري الرفع...</div>
            <div style={{ height: 6, borderRadius: 999, background: C.chip }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: C.primary, transition: "width .2s" }} />
            </div>
          </Card>
        )}

        {items.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <f.icon size={17} color={C.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{f.name}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{f.size}</div>
            </div>
            <button onClick={() => notify("تم الحذف")} style={{ color: C.textMuted }}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <Btn C={C} variant="outline" icon={Upload} onClick={upload}>رفع ملف</Btn>
        <Btn C={C} icon={ImageIcon} onClick={upload}>رفع صورة</Btn>
      </div>
    </div>
  );
}

/* ---------------- API Settings (sub) ---------------- */

function ApiSettingsScreen({ C, notify, onBack }) {
  const [provider, setProvider] = useState("Anthropic");
  const [enabled, setEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="إعدادات الـ API" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>استخدام API مخصص</div>
              <div style={{ fontSize: 11.5, color: C.textMuted }}>استخدم مفتاحك الخاص بدل الافتراضي</div>
            </div>
            <Toggle C={C} on={enabled} onChange={setEnabled} />
          </div>
        </Card>

        <SectionLabel C={C}>المزوّد</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Anthropic", "OpenAI", "مخصص"].map((p) => <Chip key={p} C={C} active={provider === p} onClick={() => setProvider(p)}>{p}</Chip>)}
        </div>

        <Field C={C} label="اسم النموذج" placeholder="claude-sonnet-5" defaultValue="claude-sonnet-5" />
        <Field C={C} label="نقطة النهاية (Endpoint)" placeholder="https://api.example.com" />
        <div style={{ position: "relative" }}>
          <Field C={C} label="مفتاح الـ API" type={showKey ? "text" : "password"} placeholder="sk-••••••••••••" />
          <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", left: 14, top: 38, color: C.textMuted }}>
            {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <SectionLabel C={C}>مزوّد احتياطي</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {["بدون", "OpenAI", "الافتراضي"].map((p) => <Chip key={p} C={C}>{p}</Chip>)}
        </div>
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <Btn C={C} variant="outline" onClick={() => { setTesting(true); setTimeout(() => { setTesting(false); notify("الاتصال ناجح ✅"); }, 900); }} style={{ width: 110 }}>
          {testing ? "جاري..." : "اختبار"}
        </Btn>
        <Btn C={C} icon={Check} onClick={() => notify("تم حفظ إعدادات الـ API")}>حفظ</Btn>
      </div>
    </div>
  );
}

/* ---------------- Analytics ---------------- */

function AnalyticsScreen({ C, notify }) {
  const [period, setPeriod] = useState("أسبوعي");
  const data = {
    "يومي": [40, 55, 30, 70, 60, 90, 65],
    "أسبوعي": [220, 260, 190, 310, 280, 340, 300],
    "شهري": [1200, 1500, 1100, 1800]
  }[period];
  const max = Math.max(...data);
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "14px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 18, color: C.text }}>التحليلات</div>
        <button onClick={() => notify("تم تصدير التقرير")} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: C.primary }}>
          <Download size={14} /> تصدير
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["يومي", "أسبوعي", "شهري"].map((p) => <Chip key={p} C={C} active={period === p} onClick={() => setPeriod(p)}>{p}</Chip>)}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <StatCard C={C} label="عدد الردود" value="1,284" icon={Sparkles} sub="+18%" />
        <StatCard C={C} label="سرعة الاستجابة" value="2.3s" icon={Clock} />
      </div>

      <Card C={C} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>حجم الرسائل</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
          {data.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: C.primary, borderRadius: 6, opacity: 0.85 }} />
          ))}
        </div>
      </Card>

      <SectionLabel C={C}>أكثر العملاء تفاعلاً</SectionLabel>
      <Card C={C} style={{ padding: 6, marginBottom: 6 }}>
        {["مروة سعيد", "أحمد جلال", "سارة يوسف"].map((n, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 8px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{n}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{28 - i * 6} رسالة</div>
          </div>
        ))}
      </Card>

      <SectionLabel C={C}>أكثر الأسئلة تكرارًا</SectionLabel>
      <Card C={C} style={{ padding: 6 }}>
        {["السعر والعروض", "مواعيد الشحن", "طرق الدفع"].map((n, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 8px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{n}</div>
            <TrendingUp size={14} color={C.primary} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------------- Plans / Upgrade ---------------- */

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    icon: Rocket,
    monthly: 0,
    yearly: 0,
    tagline: "لتجربة ReplyOS والبدء بخفة",
    features: [
      { text: "300 رد ذكي شهريًا", ok: true },
      { text: "رقم واتساب واحد", ok: true },
      { text: "قاعدتان أوتوماتيك فقط", ok: true },
      { text: "تحليلات أساسية", ok: true },
      { text: "دعم فني أولوية", ok: false },
      { text: "API مخصص", ok: false }
    ]
  },
  {
    key: "pro",
    name: "Pro",
    icon: Gem,
    monthly: 449,
    yearly: 359,
    tagline: "الأنسب للمتاجر والمشاريع النشطة",
    popular: true,
    features: [
      { text: "ردود غير محدودة", ok: true },
      { text: "3 أرقام واتساب متصلة", ok: true },
      { text: "قواعد أوتوميشن غير محدودة", ok: true },
      { text: "تحليلات متقدمة وتصدير تقارير", ok: true },
      { text: "دعم فني أولوية", ok: true },
      { text: "API مخصص", ok: false }
    ]
  },
  {
    key: "business",
    name: "Business",
    icon: Building2,
    monthly: 999,
    yearly: 799,
    tagline: "لفرق العمل والحسابات الكبيرة",
    features: [
      { text: "كل مزايا Pro", ok: true },
      { text: "أرقام واتساب غير محدودة", ok: true },
      { text: "مقاعد فريق متعددة وصلاحيات", ok: true },
      { text: "تحليلات مخصصة لكل عميل", ok: true },
      { text: "دعم فني مخصص 24/7", ok: true },
      { text: "API مخصص + Webhooks", ok: true }
    ]
  }
];

function PlanCard({ C, plan, cycle, onChoose, current }) {
  const Icon = plan.icon;
  const price = cycle === "yearly" ? plan.yearly : plan.monthly;
  const isFree = plan.monthly === 0;
  return (
    <div
      style={{
        position: "relative", borderRadius: 22, padding: 18, flexShrink: 0,
        width: 250, scrollSnapAlign: "center",
        background: plan.popular
          ? `linear-gradient(160deg, ${C.gradA}, ${C.gradB})`
          : C.surface,
        border: plan.popular ? "none" : `1px solid ${C.border}`,
        boxShadow: plan.popular ? `0 16px 34px ${C.primary}40` : "none"
      }}
    >
      {plan.popular && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(120deg, ${C.gold}, #E8A93C)`, color: "#241a05",
          fontSize: 10.5, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
          display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          boxShadow: `0 6px 14px ${C.gold}55`
        }}>
          <Star size={10} fill="#241a05" /> الأكثر طلبًا
        </div>
      )}

      <div style={{
        width: 42, height: 42, borderRadius: 13, marginBottom: 12,
        background: plan.popular ? "rgba(255,255,255,0.16)" : C.primarySoft,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={20} color={plan.popular ? "#fff" : C.primary} />
      </div>

      <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 17, color: plan.popular ? "#fff" : C.text }}>
        {plan.name}
      </div>
      <div style={{ fontSize: 11.5, color: plan.popular ? "rgba(255,255,255,0.8)" : C.textMuted, marginTop: 2, marginBottom: 14, minHeight: 32, lineHeight: 1.6 }}>
        {plan.tagline}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
        <span style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 26, color: plan.popular ? "#fff" : C.text }}>
          {isFree ? "مجانًا" : `${price}`}
        </span>
        {!isFree && (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: plan.popular ? "rgba(255,255,255,0.85)" : C.textMuted }}>ج.م</span>
            <span style={{ fontSize: 11.5, color: plan.popular ? "rgba(255,255,255,0.7)" : C.textMuted }}>/شهريًا</span>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
              background: f.ok ? (plan.popular ? "rgba(255,255,255,0.25)" : C.primarySoft) : (plan.popular ? "rgba(255,255,255,0.1)" : C.chip),
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {f.ok ? (
                <Check size={11} color={plan.popular ? "#fff" : C.primary} />
              ) : (
                <X size={10} color={plan.popular ? "rgba(255,255,255,0.5)" : C.textMuted} />
              )}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, lineHeight: 1.4,
              color: f.ok ? (plan.popular ? "#fff" : C.text) : (plan.popular ? "rgba(255,255,255,0.55)" : C.textMuted),
              textDecoration: f.ok ? "none" : "line-through"
            }}>
              {f.text}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onChoose(plan)}
        style={{
          width: "100%", padding: "11px 0", borderRadius: 13, fontSize: 13.5, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: plan.popular ? "#fff" : (isFree ? C.chip : C.primary),
          color: plan.popular ? C.primaryDeep : (isFree ? C.textMuted : "#fff")
        }}
      >
        {current ? "باقتك الحالية" : isFree ? "البقاء على المجانية" : (
          <>
            <Crown size={14} /> اشترك الآن
          </>
        )}
      </button>
    </div>
  );
}

function UpgradePage({ C, notify, onBack }) {
  const [cycle, setCycle] = useState("yearly");

  const choose = (plan) => {
    if (plan.monthly === 0) { notify("أنت بالفعل على الباقة المجانية"); return; }
    notify(`تم تفعيل باقة ${plan.name} بنجاح 🎉`);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="طوّر تجربتك" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0 24px" }}>
        <div style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, background: `linear-gradient(120deg, ${C.gold}, #E8A93C)`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Crown size={15} color="#241a05" />
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>اختر الباقة الأنسب لحجم شغلك وابدأ فورًا</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "18px 20px 6px" }}>
          <div style={{ display: "flex", background: C.chip, borderRadius: 999, padding: 4, position: "relative" }}>
            {["monthly", "yearly"].map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                style={{
                  padding: "8px 18px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                  background: cycle === c ? C.primary : "transparent",
                  color: cycle === c ? "#fff" : C.textMuted,
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
                }}
              >
                {c === "monthly" ? "شهري" : "سنوي"}
                {c === "yearly" && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, padding: "1px 6px", borderRadius: 999,
                    background: cycle === "yearly" ? "rgba(255,255,255,0.25)" : `${C.gold}33`,
                    color: cycle === "yearly" ? "#fff" : C.gold
                  }}>وفّر 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex", gap: 12, padding: "14px 20px 6px", overflowX: "auto",
          scrollSnapType: "x mandatory"
        }}>
          {PLANS.map((p) => (
            <PlanCard key={p.key} C={C} plan={p} cycle={cycle} onChoose={choose} current={p.key === "pro"} />
          ))}
        </div>

        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 8, color: C.textMuted, fontSize: 11.5 }}>
          <BadgeCheck size={14} color={C.primary} />
          إلغاء في أي وقت — بدون شروط مخفية، وضمان استرجاع خلال 7 أيام
        </div>
      </div>
    </div>
  );
}

/* ---------------- Subscription (sub) ---------------- */

function SubscriptionScreen({ C, notify, profile, onBack, openUpgrade }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar C={C} title="الملف الشخصي والاشتراك" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Avatar name={profile.name || "؟"} size={58} />
          <div>
            <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 16, color: C.text }}>{profile.name || "مستخدم"}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{profile.profession || "صاحب عمل"}</div>
          </div>
          <button onClick={() => notify("فتح تعديل الملف")} style={{ marginRight: "auto", color: C.primary, fontSize: 12, fontWeight: 700 }}>تعديل</button>
        </div>

        <Card
          C={C}
          onClick={openUpgrade}
          style={{
            marginBottom: 14, border: "none", cursor: "pointer", position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${C.gradA}, ${C.gradB})`
          }}
        >
          <div style={{ position: "absolute", top: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>باقتك الحالية</div>
              <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 18, color: "#fff" }}>Pro Plan</div>
            </div>
            <CreditCard size={22} color="#fff" />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>يتجدد في 12 أغسطس 2026 · اضغط لعرض كل الباقات</div>
        </Card>

        <SectionLabel C={C}>الاستخدام</SectionLabel>
        <Card C={C} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>الرسائل: 4,200 / 10,000</div>
          <div style={{ height: 6, borderRadius: 999, background: C.chip, marginBottom: 12 }}><div style={{ width: "42%", height: "100%", background: C.primary, borderRadius: 999 }} /></div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>التخزين: 3.2 / 10 GB</div>
          <div style={{ height: 6, borderRadius: 999, background: C.chip }}><div style={{ width: "32%", height: "100%", background: C.primary, borderRadius: 999 }} /></div>
        </Card>

        <Row C={C} icon={Shield} label="الأمان" sub="تفعيل التحقق بخطوتين" right={<Toggle C={C} on={false} onChange={() => notify("تم تفعيل التحقق بخطوتين")} />} />
      </div>
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <Btn C={C} variant="danger" icon={LogOut} onClick={() => notify("تم تسجيل الخروج")} style={{ width: 130 }}>تسجيل الخروج</Btn>
        <Btn C={C} variant="gold" icon={Crown} onClick={openUpgrade}>ترقية الباقة</Btn>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsScreen({ C, notify, theme, setTheme, go }) {
  const [notifOn, setNotifOn] = useState(true);
  const [rtl, setRtl] = useState(true);
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "14px 16px 24px" }}>
      <div style={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 10 }}>الإعدادات</div>

      <SectionLabel C={C}>عام</SectionLabel>
      <Card C={C} style={{ padding: "2px 10px" }}>
        <Row C={C} icon={Globe} label="اللغة" sub="العربية" onClick={() => notify("تم تغيير اللغة")} />
        <Row C={C} icon={theme === "dark" ? Moon : Sun} label="المظهر" sub={theme === "dark" ? "داكن" : "فاتح"} right={<Toggle C={C} on={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} />} />
        <Row C={C} icon={ArrowLeft} label="اتجاه الواجهة" sub={rtl ? "من اليمين لليسار" : "من اليسار لليمين"} right={<Toggle C={C} on={rtl} onChange={setRtl} />} />
      </Card>

      <SectionLabel C={C}>الإشعارات والخصوصية</SectionLabel>
      <Card C={C} style={{ padding: "2px 10px" }}>
        <Row C={C} icon={Bell} label="الإشعارات" right={<Toggle C={C} on={notifOn} onChange={setNotifOn} />} />
        <Row C={C} icon={Shield} label="الخصوصية والأمان" onClick={() => notify("فتح إعدادات الخصوصية")} />
        <Row C={C} icon={Lock} label="تغيير كلمة المرور" onClick={() => notify("فتح تغيير كلمة المرور")} />
      </Card>

      <SectionLabel C={C}>الذكاء الاصطناعي والبيانات</SectionLabel>
      <Card C={C} style={{ padding: "2px 10px" }}>
        <Row C={C} icon={SlidersHorizontal} label="إعدادات الـ API" onClick={() => go("apiSettings")} />
        <Row C={C} icon={Database} label="نسخ احتياطي الآن" onClick={() => notify("تم عمل نسخة احتياطية")} />
        <Row C={C} icon={RotateCcw} label="استعادة نسخة" onClick={() => notify("تم استعادة النسخة")} />
        <Row C={C} icon={Trash2} label="مسح الذاكرة المؤقتة" onClick={() => notify("تم مسح الذاكرة المؤقتة")} />
      </Card>

      <SectionLabel C={C}>الحساب</SectionLabel>
      <Card C={C} style={{ padding: "2px 10px" }}>
        <Row C={C} icon={User} label="حساب الملف الشخصي" onClick={() => go("subscription")} />
        <Row C={C} icon={HelpCircle} label="المساعدة والدعم" onClick={() => notify("فتح مركز المساعدة")} />
        <Row C={C} icon={LogOut} label="تسجيل الخروج" danger onClick={() => notify("تم تسجيل الخروج")} />
      </Card>
    </div>
  );
}

/* ---------------- WhatsApp quick-connect FAB ---------------- */

function WhatsAppFab({ C, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        position: "absolute", bottom: 14, left: 16, width: 56, height: 56, borderRadius: "50%",
        background: C.primary, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 10px 26px ${C.primary}66`, zIndex: 40
      }}
    >
      <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `${C.primary}33`, animation: "pulseRing 2.4s ease-in-out infinite" }} />
      <MessageCircle size={24} color="#fff" style={{ position: "relative" }} />
    </button>
  );
}

/* ---------------- Bottom nav ---------------- */

function BottomNav({ C, active, setActive }) {
  const tabs = [
    { key: "home", label: "الرئيسية", icon: Home },
    { key: "chat", label: "المساعد", icon: MessageSquare },
    { key: "contacts", label: "جهات الاتصال", icon: Users },
    { key: "analytics", label: "التحليلات", icon: BarChart2 },
    { key: "settings", label: "الإعدادات", icon: SettingsIcon }
  ];
  return (
    <div style={{ padding: "0 10px 10px", flexShrink: 0 }}>
      <div style={{
        display: "flex", background: C.navBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${C.glassBorder}`, borderRadius: 22, padding: 6,
        boxShadow: "0 10px 30px -12px rgba(0,0,0,0.4)"
      }}>
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              className="navTabBtn"
              onClick={() => setActive(t.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "8px 0", borderRadius: 16,
                background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : "transparent",
                boxShadow: isActive ? `0 6px 16px -6px ${C.primary}80` : "none",
                transition: "background .3s ease, box-shadow .3s ease"
              }}
            >
              <t.icon key={isActive ? `${t.key}-on` : `${t.key}-off`} size={18} color={isActive ? "#fff" : C.textMuted} style={{ animation: isActive ? "navPop .45s cubic-bezier(.34,1.56,.64,1)" : "none" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? "#fff" : C.textMuted, transition: "color .25s" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- App root ---------------- */

export default function App() {
  useFonts();
  const [theme, setTheme] = useState("dark");
  const C = PALETTE[theme];
  const [flow, setFlow] = useState("splash");
  const [activeTab, setActiveTab] = useState("home");
  const [subScreen, setSubScreen] = useState(null);
  const [profile, setProfile] = useState({ name: "", age: "", profession: "", city: "" });
  const [wa, setWa] = useState(true);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(window.__t);
    window.__t = setTimeout(() => setToast(null), 2000);
  };

  const go = (kind, key) => {
    if (kind === "tab") { setActiveTab(key); setSubScreen(null); }
    if (kind === "sub") setSubScreen(key);
  };

  const openUpgrade = () => go("sub", "upgrade");
  const openWhatsapp = () => go("sub", "whatsapp");

  const subMap = {
    whatsapp: <WhatsAppScreen C={C} notify={notify} wa={wa} setWa={setWa} onBack={() => setSubScreen(null)} />,
    reply: <ReplySettingsScreen C={C} notify={notify} onBack={() => setSubScreen(null)} />,
    rules: <RulesScreen C={C} notify={notify} onBack={() => setSubScreen(null)} />,
    uploads: <UploadsScreen C={C} notify={notify} onBack={() => setSubScreen(null)} />,
    apiSettings: <ApiSettingsScreen C={C} notify={notify} onBack={() => setSubScreen(null)} />,
    subscription: <SubscriptionScreen C={C} notify={notify} profile={profile} onBack={() => setSubScreen(null)} openUpgrade={openUpgrade} />,
    upgrade: <UpgradePage C={C} notify={notify} onBack={() => setSubScreen(null)} />
  };

  const tabMap = {
    home: <HomeScreen C={C} profile={profile} go={go} notify={notify} theme={theme} setTheme={setTheme} wa={wa} openUpgrade={openUpgrade} />,
    chat: <ChatScreen C={C} notify={notify} />,
    contacts: <ContactsScreen C={C} notify={notify} />,
    analytics: <AnalyticsScreen C={C} notify={notify} />,
    settings: <SettingsScreen C={C} notify={notify} theme={theme} setTheme={setTheme} go={(k) => setSubScreen(k)} />
  };

  return (
    <div dir="rtl" lang="ar" style={{
      minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: theme === "dark"
        ? "radial-gradient(circle at 18% 12%, #123023 0%, #060B08 45%, #020403 100%)"
        : "radial-gradient(circle at 18% 12%, #FDF8ED 0%, #EDE9DC 45%, #E2DDCC 100%)",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: "12px 8px", boxSizing: "border-box"
    }}>
      <style>{`
        @keyframes pulseRing { 0%{transform:scale(0.9); opacity:0.9} 70%{transform:scale(1.5); opacity:0} 100%{opacity:0} }
        @keyframes dotBounce { 0%,60%,100%{transform:translateY(0); opacity:.5} 30%{transform:translateY(-5px); opacity:1} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes riseFade { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0; transform:translateX(12px)} to{opacity:1; transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes sheetUp { from{opacity:0; transform:translateY(28px)} to{opacity:1; transform:translateY(0)} }
        @keyframes dropIn { from{opacity:0; transform:translateY(-8px) scale(.98)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes pageIn { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
        @keyframes navPop { 0%{transform:scale(0.6) translateY(2px)} 55%{transform:scale(1.25) translateY(-3px)} 75%{transform:scale(0.95)} 100%{transform:scale(1) translateY(0)} }
        .navTabBtn { transition: transform .28s cubic-bezier(.34,1.56,.64,1); }
        .navTabBtn:hover { transform: scale(1.1) translateY(-2px); }
        .navTabBtn:active { transform: scale(0.88); }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 380, height: "min(780px, 90vh)",
        background: C.bg, borderRadius: 40, overflow: "hidden",
        position: "relative", boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.glassBorder}, 0 0 60px -20px ${C.primary}30`,
        border: `8px solid ${theme === "dark" ? "#000" : "#111"}`,
        display: "flex", flexDirection: "column"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 22px 2px",
          fontSize: 12, fontWeight: 700, color: C.text, flexShrink: 0,
          background: C.navBg, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)"
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Wifi size={12} /> <span>ReplyOS</span>
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
          {flow === "splash" && <Splash C={C} onDone={() => setFlow("onboarding")} />}
          {flow === "onboarding" && <Onboarding C={C} onDone={() => setFlow("auth")} />}
          {flow === "auth" && <Auth C={C} onDone={() => setFlow("profile")} />}
          {flow === "profile" && <ProfileSetup C={C} profile={profile} setProfile={setProfile} onDone={() => setFlow("app")} />}

          {flow === "app" && (
            <>
              <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <div key={subScreen || activeTab} style={{ height: "100%", animation: "pageIn .22s ease" }}>
                  {subScreen ? subMap[subScreen] : tabMap[activeTab]}
                </div>
                <Toast toast={toast} C={C} />
                {activeTab === "home" && !subScreen && <WhatsAppFab C={C} onOpen={openWhatsapp} />}
              </div>
              <BottomNav C={C} active={activeTab} setActive={(k) => { setActiveTab(k); setSubScreen(null); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
