"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import {
  MessageCircle,
  Smartphone,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Phone,
  LogOut,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface ConnectionState {
  status: "disconnected" | "connecting" | "pairing" | "open" | "closed" | "error";
  pairingCode?: string;
  phoneNumber?: string;
  user?: { id: string; name?: string };
  connectionAt?: number;
  lastError?: string;
}

export function WhatsAppClient() {
  const { lang } = useLanguage();
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [state, setState] = React.useState<ConnectionState>({ status: "disconnected" });
  const [loading, setLoading] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Test message
  const [testTo, setTestTo] = React.useState("");
  const [testMsg, setTestMsg] = React.useState("");
  const [sending, setSending] = React.useState(false);

  // Remote bridge status
  const [bridgeHealth, setBridgeHealth] = React.useState<{
    ok: boolean;
    uptime?: number;
    sessions?: number;
    url: string;
  } | null>(null);
  const [bridgeSessions, setBridgeSessions] = React.useState<
    Array<{ phone: string; status: string; pairingCode?: string; user?: { id: string; name?: string } }>
  >([]);
  const [bridgeLoading, setBridgeLoading] = React.useState(false);

  const refreshBridge = async () => {
    setBridgeLoading(true);
    try {
      const [healthRes, sessionsRes] = await Promise.all([
        fetch("/api/admin/whatsapp?action=health", { cache: "no-store" }),
        fetch("/api/admin/whatsapp?action=sessions", { cache: "no-store" }),
      ]);
      if (healthRes.ok) {
        const data = await healthRes.json();
        setBridgeHealth(data);
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setBridgeSessions(data.sessions || []);
      }
    } catch {
      // ignore
    } finally {
      setBridgeLoading(false);
    }
  };

  React.useEffect(() => {
    refreshBridge();
  }, []);

  const startPairing = async () => {
    if (!phoneNumber.trim()) {
      toast.error(lang === "ar" ? "أدخل رقم الهاتف" : "Enter phone number");
      return;
    }
    setLoading(true);
    setState({ status: "connecting", phoneNumber: phoneNumber.replace(/[^\d]/g, "") });
    try {
      const res = await fetch("/api/whatsapp/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (lang === "ar" ? "فشل الاتصال" : "Pairing failed"));
        setState({ status: "error", lastError: data.error });
        return;
      }
      if (data.status === "connected") {
        setState({
          status: "open",
          phoneNumber: phoneNumber.replace(/[^\d]/g, ""),
          user: data.user,
        });
        toast.success(lang === "ar" ? "واتساب متصل بالفعل!" : "WhatsApp already connected!");
      } else {
        setState({
          status: "pairing",
          pairingCode: data.pairingCode,
          phoneNumber: phoneNumber.replace(/[^\d]/g, ""),
        });
        toast.success(lang === "ar" ? "تم الحصول على رمز الربط" : "Pairing code generated");
        // Start polling for connection
        startPolling(phoneNumber);
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      setState({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (phone: string) => {
    if (polling) return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/pair?phoneNumber=${encodeURIComponent(phone)}`, { cache: "no-store" });
        const data = await res.json();
        if (data.status === "open" || data.status === "connected") {
          setState({
            status: "open",
            phoneNumber: phone,
            user: data.user,
            connectionAt: data.connectionAt,
          });
          setPolling(false);
          clearInterval(interval);
          toast.success(lang === "ar" ? "تم ربط واتساب بنجاح!" : "WhatsApp connected successfully!");
        } else if (data.status === "closed" || data.status === "error") {
          setState({
            status: data.status,
            lastError: data.lastError,
          });
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    // Stop after 3 minutes
    setTimeout(() => {
      if (polling) {
        clearInterval(interval);
        setPolling(false);
      }
    }, 180000);
  };

  const disconnect = async () => {
    if (!state.phoneNumber) return;
    if (!confirm(lang === "ar" ? "قطع اتصال واتساب؟" : "Disconnect WhatsApp?")) return;
    try {
      await fetch(`/api/whatsapp/pair?phoneNumber=${encodeURIComponent(state.phoneNumber)}`, {
        method: "DELETE",
      });
      setState({ status: "disconnected" });
      setPhoneNumber("");
      toast.success(lang === "ar" ? "تم قطع الاتصال" : "Disconnected");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const copyCode = () => {
    if (!state.pairingCode) return;
    navigator.clipboard.writeText(state.pairingCode);
    setCopied(true);
    toast.success(lang === "ar" ? "تم نسخ الرمز" : "Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendTestMessage = async () => {
    if (!testTo.trim() || !testMsg.trim()) {
      toast.error(lang === "ar" ? "أدخل الرقم والرسالة" : "Enter number and message");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testTo,
          message: testMsg,
          phoneNumber: state.phoneNumber, // connected WhatsApp number — routes to bridge
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(lang === "ar" ? "تم الإرسال!" : "Sent!");
        setTestMsg("");
      } else {
        toast.error(data.error || (lang === "ar" ? "فشل الإرسال" : "Send failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "واتساب" : "WhatsApp"}
        description={
          lang === "ar"
            ? "إدارة اتصالات واتساب عبر رمز الربط"
            : "Manage WhatsApp connections via pairing code"
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection Panel */}
        <Card className="p-6 premium-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {lang === "ar" ? "ربط واتساب جديد" : "Link WhatsApp"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "أدخل رقم هاتفك للحصول على رمز الربط"
                  : "Enter your phone number to get a pairing code"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>
                {lang === "ar" ? "رقم الهاتف" : "Phone Number"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={lang === "ar" ? "مثال: 201234567890" : "e.g. 201234567890"}
                    className="ps-10"
                    dir="ltr"
                  />
                </div>
                <Button onClick={startPairing} disabled={loading || polling}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4 me-2" />
                  )}
                  {lang === "ar" ? "ربط" : "Link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "أدخل الرقم مع رمز الدولة بدون + أو مسافات"
                  : "Enter with country code, no + or spaces"}
              </p>
            </div>
          </div>

          {/* Status display */}
          {state.status !== "disconnected" && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {lang === "ar" ? "الحالة" : "Status"}
                </span>
                <Badge
                  variant={
                    state.status === "open"
                      ? "default"
                      : state.status === "pairing"
                        ? "secondary"
                        : state.status === "error" || state.status === "closed"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {state.status === "open" && (lang === "ar" ? "متصل" : "Connected")}
                  {state.status === "pairing" && (lang === "ar" ? "في انتظار الربط" : "Pairing...")}
                  {state.status === "connecting" && (lang === "ar" ? "جارٍ الاتصال" : "Connecting...")}
                  {state.status === "closed" && (lang === "ar" ? "مغلق" : "Closed")}
                  {state.status === "error" && (lang === "ar" ? "خطأ" : "Error")}
                </Badge>
              </div>

              {state.pairingCode && state.status === "pairing" && (
                <div className="bg-muted/40 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    {lang === "ar" ? "رمز الربط (8 أرقام)" : "Pairing Code (8 digits)"}
                  </p>
                  <div className="text-3xl font-bold tracking-[0.3em] text-foreground font-mono mb-3">
                    {state.pairingCode}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyCode}>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 me-1.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 me-1.5" />
                    )}
                    {lang === "ar" ? "نسخ" : "Copy"}
                  </Button>
                  <ol className="text-start text-xs text-muted-foreground mt-4 space-y-1 list-decimal list-inside">
                    <li>
                      {lang === "ar"
                        ? "افتح واتساب على هاتفك"
                        : "Open WhatsApp on your phone"}
                    </li>
                    <li>
                      {lang === "ar"
                        ? "اذهب إلى الإعدادات → الأجهزة المرتبطة"
                        : "Go to Settings → Linked Devices"}
                    </li>
                    <li>
                      {lang === "ar"
                        ? "اضغط \"ربط جهاز\" واختر \"ربط برقم الهاتف\""
                        : "Tap \"Link a Device\" → choose \"Link with phone number\""}
                    </li>
                    <li>
                      {lang === "ar"
                        ? "أدخل رمز الربط أعلاه"
                        : "Enter the pairing code above"}
                    </li>
                  </ol>
                </div>
              )}

              {state.user && (
                <div className="bg-muted/40 rounded-xl p-3 text-sm">
                  <p className="font-medium text-foreground">
                    {lang === "ar" ? "الحساب المرتبط" : "Linked Account"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {state.user.id}
                    {state.user.name ? ` · ${state.user.name}` : ""}
                  </p>
                </div>
              )}

              {state.lastError && (
                <p className="text-xs text-destructive">{state.lastError}</p>
              )}

              {state.status === "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={disconnect}
                >
                  <LogOut className="w-3.5 h-3.5 me-1.5" />
                  {lang === "ar" ? "قطع الاتصال" : "Disconnect"}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Test Message Panel */}
        <Card className="p-6 premium-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {lang === "ar" ? "إرسال رسالة تجريبية" : "Send Test Message"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "اختبر الاتصال بإرسال رسالة"
                  : "Test the connection by sending a message"}
              </p>
            </div>
          </div>

          {state.status !== "open" ? (
            <div className="text-center py-8">
              <Smartphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? "اربط واتساب أولاً لإرسال الرسائل"
                  : "Link WhatsApp first to send messages"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "إلى (رقم الهاتف)" : "To (Phone Number)"}</Label>
                <Input
                  type="tel"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="201234567890"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "الرسالة" : "Message"}</Label>
                <textarea
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  placeholder={lang === "ar" ? "اكتب الرسالة..." : "Type a message..."}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                />
              </div>
              <Button onClick={sendTestMessage} disabled={sending} className="w-full">
                {sending ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 me-2" />
                )}
                {lang === "ar" ? "إرسال" : "Send"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Remote Bridge Status Panel */}
      <Card className="mt-4 p-6 premium-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {lang === "ar" ? "حالة خادم الربط (Bridge)" : "Bridge Server Status"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "الخادم البعيد الذي يدير اتصالات واتساب"
                  : "Remote server managing WhatsApp connections"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBridge}
            disabled={bridgeLoading}
          >
            {bridgeLoading ? (
              <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 me-1.5" />
            )}
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {bridgeHealth ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {lang === "ar" ? "الحالة" : "Status"}
              </p>
              <Badge variant={bridgeHealth.ok ? "default" : "destructive"}>
                {bridgeHealth.ok
                  ? lang === "ar" ? "يعمل" : "Online"
                  : lang === "ar" ? "لا يعمل" : "Offline"}
              </Badge>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {lang === "ar" ? "الجلسات النشطة" : "Active Sessions"}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {bridgeHealth.sessions ?? "—"}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {lang === "ar" ? "مدة التشغيل" : "Uptime"}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {bridgeHealth.uptime
                  ? `${Math.floor(bridgeHealth.uptime / 60)}m`
                  : "—"}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {lang === "ar" ? "الرابط" : "URL"}
              </p>
              <p className="text-xs font-mono text-foreground truncate" dir="ltr">
                {bridgeHealth.url || "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {lang === "ar"
              ? "اضغط تحديث لفحص حالة الخادم"
              : "Click refresh to check server status"}
          </div>
        )}

        {bridgeSessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              {lang === "ar" ? "الجلسات الحالية" : "Current Sessions"}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bridgeSessions.map((s) => (
                <div
                  key={s.phone}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                >
                  <span className="font-mono" dir="ltr">{s.phone}</span>
                  <Badge
                    variant={
                      s.status === "open" ? "default"
                        : s.status === "connecting" ? "secondary"
                        : "outline"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Info banner */}
      <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              {lang === "ar" ? "كيف يعمل رمز الربط؟" : "How does pairing code work?"}
            </p>
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "بدلاً من QR Code، ندعم رمز ربط من 8 أرقام. أدخل رقم هاتفك، احصل على الرمز، ثم أدخله في تطبيق واتساب على هاتفك تحت: الإعدادات → الأجهزة المرتبطة → ربط جهاز → ربط برقم الهاتف."
                : "Instead of QR codes, we support an 8-digit pairing code. Enter your phone number, get the code, then enter it in your phone's WhatsApp under: Settings → Linked Devices → Link a Device → Link with phone number."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
