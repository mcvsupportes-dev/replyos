"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { Search, Download, RefreshCw, CreditCard, Receipt, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { SubscriptionData } from "@/lib/admin-data";
import { StatCard } from "./stat-card";
import { toast } from "sonner";

interface Props {
  subs: SubscriptionData[];
}

export function SubscriptionsClient({ subs }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [search, setSearch] = React.useState("");

  const filtered = subs.filter((s) =>
    s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    s.planName.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subs.filter((s) => s.status === "active").length;
  const totalRevenue = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const canceledCount = subs.filter((s) => s.status === "canceled").length;
  const trialCount = subs.filter((s) => s.status === "trialing").length;

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "trialing": return "secondary";
      case "canceled": return "destructive";
      case "past_due": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الاشتراكات" : "Subscriptions"}
        description={lang === "ar" ? "إدارة جميع اشتراكات المستخدمين" : "Manage all user subscriptions"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success(lang === "ar" ? "تم التصدير" : "Exported")}>
              <Download className="w-4 h-4 me-2" />
              {lang === "ar" ? "تصدير" : "Export"}
            </Button>
            <Button variant="outline" onClick={() => toast.success(lang === "ar" ? "تم التحديث" : "Refreshed")}>
              <RefreshCw className="w-4 h-4 me-2" />
              {lang === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={lang === "ar" ? "إجمالي الاشتراكات" : "Total Subscriptions"}
          value={subs.length}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          title={lang === "ar" ? "نشطة" : "Active"}
          value={activeCount}
          icon={CreditCard}
          color="violet"
        />
        <StatCard
          title={lang === "ar" ? "تجريبية" : "Trials"}
          value={trialCount}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title={lang === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"}
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="primary"
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث..." : "Search..."}
            className="ps-10"
          />
        </div>
      </div>

      <Card className="premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "المستخدم" : "User"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "الباقة" : "Plan"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "المبلغ" : "Amount"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  {lang === "ar" ? "ينتهي في" : "Renews"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد اشتراكات" : "No subscriptions"}</td></tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-medium text-foreground">{sub.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{sub.id}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">{sub.planName}</Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        ${sub.amount}/{sub.currency}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={statusVariant(sub.status)} className="capitalize">{sub.status}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(sub.currentPeriodEnd, "MMM d, yyyy", { locale })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
