"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { Flag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface FlagItem {
  key: string;
  label: string;
  labelAr: string;
  enabled: boolean;
}

interface Props {
  flags: FlagItem[];
}

export function FeatureFlagsClient({ flags: initial }: Props) {
  const { lang } = useLanguage();
  const [flags, setFlags] = React.useState(initial);
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/feature-flags", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.flags)) {
        setFlags(data.flags);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFlag = async (key: string) => {
    const flag = flags.find((f) => f.key === key);
    if (!flag) return;
    const newValue = !flag.enabled;
    // optimistic
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: newValue } : f))
    );
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags: [{ key, enabled: newValue }] }),
      });
      if (!res.ok) {
        toast.error(lang === "ar" ? "فشل التحديث" : "Update failed");
        await refresh();
      } else {
        toast.success(
          `${lang === "ar" ? flag.labelAr : flag.label} — ${
            newValue
              ? lang === "ar" ? "مفعّل" : "Enabled"
              : lang === "ar" ? "معطل" : "Disabled"
          }`
        );
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      await refresh();
    }
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "ميزات تجريبية" : "Feature Flags"}
        description={
          lang === "ar"
            ? "تحكم في الميزات دون إعادة النشر"
            : "Toggle features without redeployment"
        }
        action={
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw
              className={`w-4 h-4 me-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      {flags.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {lang === "ar"
              ? "لا توجد ميزات. ستظهر هنا بعد الإعداد."
              : "No flags yet. They will appear here after setup."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flags.map((flag) => (
            <Card
              key={flag.key}
              className="p-5 premium-shadow hover:premium-shadow-lg transition-all animate-fade-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Flag className="w-5 h-5" />
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => toggleFlag(flag.key)}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {lang === "ar" ? flag.labelAr || flag.label : flag.label}
                </p>
                <code className="text-xs text-muted-foreground font-mono mt-1 block">
                  {flag.key}
                </code>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <Badge variant={flag.enabled ? "default" : "secondary"}>
                  {flag.enabled
                    ? lang === "ar" ? "مفعّل" : "Enabled"
                    : lang === "ar" ? "معطل" : "Disabled"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
