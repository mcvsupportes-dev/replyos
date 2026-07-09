"use client";

import * as React from "react";
import { StatCard } from "./stat-card";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import {
  Users,
  CreditCard,
  Bot,
  HardDrive,
  DollarSign,
  MessageSquare,
  Zap,
  Smartphone,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { DashboardStats, UserData, LogData } from "@/lib/admin-data";

interface Props {
  stats: DashboardStats;
  recentUsers: UserData[];
  recentLogs: LogData[];
}

export function DashboardClient({ stats, recentUsers, recentLogs }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;

  // Fetch real analytics from the API
  const [chartData, setChartData] = React.useState<
    Array<{ date: string; replies: number; messages: number }>
  >([]);
  const [planDistribution, setPlanDistribution] = React.useState<
    Array<{ name: string; value: number; fill: string }>
  >([
    { name: lang === "ar" ? "مجاني" : "Free", value: 0, fill: "hsl(142 71% 45%)" },
    { name: lang === "ar" ? "احترافي" : "Pro", value: 0, fill: "hsl(173 58% 39%)" },
    { name: lang === "ar" ? "أعمال" : "Business", value: 0, fill: "hsl(197 37% 40%)" },
  ]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics?range=weekly", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.data)) {
          setChartData(
            data.data.map((d: { date: string; replies: number; messages: number }) => ({
              date: new Date(d.date).toLocaleDateString(
                lang === "ar" ? "ar-EG" : "en-US",
                { month: "short", day: "numeric" }
              ),
              replies: d.replies || 0,
              messages: d.messages || 0,
            }))
          );
        }
      } catch {
        // ignore
      }

      // Fetch real plan distribution from users
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.users)) {
          const counts: Record<string, number> = {};
          for (const u of data.users) {
            const plan = (u as { plan: string }).plan || "free";
            counts[plan] = (counts[plan] || 0) + 1;
          }
          setPlanDistribution([
            { name: lang === "ar" ? "مجاني" : "Free", value: counts["free"] || 0, fill: "hsl(142 71% 45%)" },
            { name: lang === "ar" ? "احترافي" : "Pro", value: counts["pro"] || 0, fill: "hsl(173 58% 39%)" },
            { name: lang === "ar" ? "أعمال" : "Business", value: counts["business"] || 0, fill: "hsl(197 37% 40%)" },
          ]);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const statCards = [
    {
      title: lang === "ar" ? "إجمالي المستخدمين" : "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: 12,
      color: "primary" as const,
    },
    {
      title: lang === "ar" ? "اشتراكات نشطة" : "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      change: 8,
      color: "blue" as const,
    },
    {
      title: lang === "ar" ? "ردود الذكاء اليوم" : "AI Replies Today",
      value: stats.aiRepliesToday.toLocaleString(),
      icon: Bot,
      change: 23,
      color: "violet" as const,
    },
    {
      title: lang === "ar" ? "التخزين المستخدم" : "Storage Used",
      value: `${(stats.storageUsedMb / 1024).toFixed(1)} GB`,
      icon: HardDrive,
      change: 5,
      color: "amber" as const,
    },
    {
      title: lang === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: 15,
      color: "primary" as const,
    },
    {
      title: lang === "ar" ? "رسائل اليوم" : "Messages Today",
      value: stats.messagesToday.toLocaleString(),
      icon: MessageSquare,
      change: 18,
      color: "blue" as const,
    },
    {
      title: lang === "ar" ? "واتساب متصل" : "WhatsApp Connected",
      value: stats.whatsappConnected.toLocaleString(),
      icon: Smartphone,
      change: 6,
      color: "violet" as const,
    },
    {
      title: lang === "ar" ? "قواعد نشطة" : "Active Rules",
      value: stats.activeRules.toLocaleString(),
      icon: Zap,
      change: -2,
      color: "amber" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "نظرة عامة" : "Overview"}
        description={
          lang === "ar"
            ? "ملخص شامل لأداء النظام"
            : "Comprehensive system performance summary"
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              change={card.change}
              color={card.color}
            />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Activity chart */}
        <Card className="p-5 lg:col-span-2 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">
                {lang === "ar" ? "النشاط خلال ١٤ يوم" : "Activity (14 days)"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "ar" ? "الردود والرسائل" : "Replies and messages"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {lang === "ar" ? "ردود" : "Replies"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">
                  {lang === "ar" ? "رسائل" : "Messages"}
                </span>
              </div>
            </div>
          </div>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repliesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="messagesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  fill="url(#messagesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="replies"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  fill="url(#repliesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Plan distribution */}
        <Card className="p-5 premium-shadow animate-fade-in">
          <h3 className="font-semibold text-foreground mb-1">
            {lang === "ar" ? "توزيع الباقات" : "Plan Distribution"}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {lang === "ar" ? "المشتركون حسب الباقة" : "Subscribers by plan"}
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {planDistribution.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                  <span className="text-foreground">{p.name}</span>
                </div>
                <span className="font-medium text-foreground tabular-nums">{p.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent users */}
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {lang === "ar" ? "أحدث المستخدمين" : "Recent Users"}
            </h3>
            <a href="/dashboard/users" className="text-xs text-primary flex items-center gap-1 hover:opacity-80">
              {lang === "ar" ? "الكل" : "View all"}
              <ArrowUpRight className="w-3 h-3 rtl-flip" />
            </a>
          </div>
          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {lang === "ar" ? "لا يوجد مستخدمون بعد" : "No users yet"}
              </p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"}>
                    {user.plan}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent logs */}
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {lang === "ar" ? "السجلات الأخيرة" : "Recent Logs"}
            </h3>
            <a href="/dashboard/logs" className="text-xs text-primary flex items-center gap-1 hover:opacity-80">
              {lang === "ar" ? "الكل" : "View all"}
              <ArrowUpRight className="w-3 h-3 rtl-flip" />
            </a>
          </div>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {lang === "ar" ? "لا توجد سجلات" : "No logs"}
              </p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.level === "error" ? "bg-rose-500" :
                      log.level === "warn" ? "bg-amber-500" :
                      log.level === "debug" ? "bg-muted-foreground" :
                      "bg-primary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.source} · {formatDistanceToNow(log.timestamp, { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
