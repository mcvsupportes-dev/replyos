"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";
import { Shield, ShieldCheck, Lock, Key, Eye, AlertTriangle, CheckCircle2, Fingerprint, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import type { LogData } from "@/lib/admin-data";

interface Props {
  events: LogData[];
}

export function SecurityClient({ events }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;

  const [twoFA, setTwoFA] = React.useState(true);
  const [rateLimit, setRateLimit] = React.useState(true);
  const [ipWhitelist, setIpWhitelist] = React.useState(false);
  const [auditLog, setAuditLog] = React.useState(true);

  const securitySettings = [
    {
      icon: Fingerprint,
      title: lang === "ar" ? "المصادقة الثنائية" : "Two-Factor Authentication",
      description: lang === "ar" ? "حماية إضافية لحساب المدير" : "Extra protection for admin account",
      checked: twoFA,
      onChange: setTwoFA,
    },
    {
      icon: Lock,
      title: lang === "ar" ? "تحديد المعدل" : "Rate Limiting",
      description: lang === "ar" ? "منع الهجمات بإغراق الطلبات" : "Prevent brute force attacks",
      checked: rateLimit,
      onChange: setRateLimit,
    },
    {
      icon: Key,
      title: lang === "ar" ? "قائمة IP المسموحة" : "IP Whitelist",
      description: lang === "ar" ? "تقييد الوصول لعناوين محددة" : "Restrict access to specific IPs",
      checked: ipWhitelist,
      onChange: setIpWhitelist,
    },
    {
      icon: Eye,
      title: lang === "ar" ? "سجل التدقيق" : "Audit Logging",
      description: lang === "ar" ? "تسجيل جميع الإجراءات الحساسة" : "Log all sensitive actions",
      checked: auditLog,
      onChange: setAuditLog,
    },
  ];

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الأمان" : "Security"}
        description={lang === "ar" ? "إدارة إعدادات الأمان والمراقبة" : "Manage security settings and monitoring"}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">A+</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "درجة الأمان" : "Security Score"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <Lock className="w-8 h-8 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{twoFA ? lang === "ar" ? "مفعّل" : "Enabled" : lang === "ar" ? "معطل" : "Disabled"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "2FA" : "2FA"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "تهديدات نشطة" : "Active Threats"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">12</p>
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? "جلسات نشطة" : "Active Sessions"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {securitySettings.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-5 premium-shadow animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
                <Switch checked={s.checked} onCheckedChange={s.onChange} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 premium-shadow animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-foreground">{lang === "ar" ? "أحداث الأمان الأخيرة" : "Recent Security Events"}</h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{lang === "ar" ? "لا توجد أحداث" : "No events"}</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  event.level === "error" ? "bg-rose-500" :
                  event.level === "warn" ? "bg-amber-500" :
                  "bg-primary"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{event.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.source} · {format(event.timestamp, "MMM d, HH:mm:ss", { locale })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
