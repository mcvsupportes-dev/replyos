"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { Activity, Cpu, MemoryStick, HardDrive, Network, Database, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

export function SystemHealthClient() {
  const { lang } = useLanguage();
  const [uptime] = React.useState(99.97);
  const [latency] = React.useState(142);

  const services = [
    { name: "Next.js Server", status: "operational", latency: 12, icon: Activity, color: "text-primary" },
    { name: "Firebase Auth", status: "operational", latency: 45, icon: Database, color: "text-amber-500" },
    { name: "Realtime Database", status: "operational", latency: 28, icon: Database, color: "text-amber-500" },
    { name: "Firebase Storage", status: "operational", latency: 67, icon: HardDrive, color: "text-amber-500" },
    { name: "AI Provider (Z.ai)", status: "operational", latency: 320, icon: Zap, color: "text-violet-500" },
    { name: "WhatsApp API", status: "degraded", latency: 890, icon: Network, color: "text-blue-500" },
  ];

  const resources = [
    { label: lang === "ar" ? "المعالج" : "CPU", value: 34, icon: Cpu, unit: "%" },
    { label: lang === "ar" ? "الذاكرة" : "Memory", value: 58, icon: MemoryStick, unit: "%" },
    { label: lang === "ar" ? "التخزين" : "Disk", value: 42, icon: HardDrive, unit: "%" },
    { label: lang === "ar" ? "الشبكة" : "Network", value: 23, icon: Network, unit: "%" },
  ];

  const statusColors: Record<string, string> = {
    operational: "bg-primary/10 text-primary",
    degraded: "bg-amber-500/10 text-amber-500",
    down: "bg-rose-500/10 text-rose-500",
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "صحة النظام" : "System Health"}
        description={lang === "ar" ? "مراقبة حالة جميع الخدمات" : "Monitor all services status"}
        action={
          <Button variant="outline" onClick={() => toast.success(lang === "ar" ? "تم التحديث" : "Refreshed")}>
            <Activity className="w-4 h-4 me-2" />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "وقت التشغيل" : "Uptime"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{uptime}%</p>
          <p className="text-xs text-primary mt-1">{lang === "ar" ? "آخر ٣٠ يوم" : "Last 30 days"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "زمن الاستجابة" : "Avg Latency"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{latency}ms</p>
          <p className="text-xs text-primary mt-1">-12% {lang === "ar" ? "هذا الأسبوع" : "this week"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "الخدمات" : "Services"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{services.filter((s) => s.status === "operational").length}/{services.length}</p>
          <p className="text-xs text-primary mt-1">{lang === "ar" ? "تعمل بشكل طبيعي" : "operational"}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "الطلبات/ث" : "Req/sec"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">1,247</p>
          <p className="text-xs text-primary mt-1">+8% {lang === "ar" ? "اليوم" : "today"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services */}
        <Card className="p-5 premium-shadow animate-fade-in">
          <h3 className="font-semibold text-foreground mb-4">{lang === "ar" ? "حالة الخدمات" : "Service Status"}</h3>
          <div className="space-y-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${service.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.latency}ms</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusColors[service.status]}`}>
                    {service.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Resources */}
        <Card className="p-5 premium-shadow animate-fade-in">
          <h3 className="font-semibold text-foreground mb-4">{lang === "ar" ? "استخدام الموارد" : "Resource Usage"}</h3>
          <div className="space-y-4">
            {resources.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{r.label}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground tabular-nums">{r.value}{r.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        r.value > 80 ? "bg-rose-500" : r.value > 60 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${r.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
