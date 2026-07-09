"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { Download, RefreshCw, Search, ScrollText } from "lucide-react";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { LogData } from "@/lib/admin-data";

interface Props {
  logs: LogData[];
}

export function LogsClient({ logs }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [search, setSearch] = React.useState("");
  const [level, setLevel] = React.useState<string>("all");

  const filtered = logs.filter((l) => {
    const matchesSearch = l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = level === "all" || l.level === level;
    return matchesSearch && matchesLevel;
  });

  const levels = ["all", "info", "warn", "error", "debug"];
  const levelColors: Record<string, string> = {
    info: "bg-primary/10 text-primary border-primary/20",
    warn: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    debug: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "السجلات" : "Logs"}
        description={lang === "ar" ? `${logs.length} سجل` : `${logs.length} log entries`}
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === "ar" ? "بحث..." : "Search..."} className="ps-10" />
        </div>
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                level === l ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Card className="premium-shadow overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد سجلات" : "No logs found"}</p>
            </div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <Badge variant="outline" className={`capitalize shrink-0 ${levelColors[log.level]}`}>
                  {log.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{log.source}</span> · {format(log.timestamp, "MMM d, HH:mm:ss", { locale })}
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
