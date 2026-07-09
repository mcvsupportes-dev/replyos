"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";
import { DatabaseBackup, Download, RefreshCw, Trash2, Play, Clock, CheckCircle2, HardDrive, Cloud } from "lucide-react";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";

export function BackupsClient() {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [autoBackup, setAutoBackup] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const backups = [
    { id: "bk_001", date: Date.now() - 3600000, size: "245 MB", status: "completed", type: "auto" },
    { id: "bk_002", date: Date.now() - 90000000, size: "241 MB", status: "completed", type: "auto" },
    { id: "bk_003", date: Date.now() - 172800000, size: "238 MB", status: "completed", type: "manual" },
    { id: "bk_004", date: Date.now() - 259200000, size: "235 MB", status: "completed", type: "auto" },
    { id: "bk_005", date: Date.now() - 345600000, size: "230 MB", status: "completed", type: "auto" },
  ];

  const handleCreate = async () => {
    setCreating(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success(lang === "ar" ? "تم إنشاء نسخة احتياطية" : "Backup created");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "النسخ الاحتياطي" : "Backups"}
        description={lang === "ar" ? "إدارة نسخ احتياطية لقاعدة البيانات" : "Manage database backups"}
        action={
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin me-2" />
            ) : (
              <Play className="w-4 h-4 me-2" />
            )}
            {lang === "ar" ? "نسخ احتياطي الآن" : "Backup Now"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <DatabaseBackup className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "إجمالي النسخ" : "Total Backups"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{backups.length}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-violet-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "الحجم الإجمالي" : "Total Size"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">1.2 GB</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "آخر نسخة" : "Last Backup"}</span>
          </div>
          <p className="text-sm font-bold text-foreground">{format(backups[0].date, "MMM d, HH:mm", { locale })}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</span>
          </div>
          <p className="text-sm font-bold text-primary">{lang === "ar" ? "سليم" : "Healthy"}</p>
        </Card>
      </div>

      <Card className="p-5 premium-shadow mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{lang === "ar" ? "النسخ التلقائي" : "Automatic Backups"}</p>
              <p className="text-xs text-muted-foreground">{lang === "ar" ? "نسخ يومي في ٣ صباحاً" : "Daily at 3:00 AM"}</p>
            </div>
          </div>
          <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
        </div>
      </Card>

      <Card className="premium-shadow overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{lang === "ar" ? "سجل النسخ" : "Backup History"}</h3>
        </div>
        <div className="divide-y divide-border">
          {backups.map((backup) => (
            <div key={backup.id} className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <DatabaseBackup className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground">{format(backup.date, "MMM d, yyyy - HH:mm", { locale })}</p>
                  <Badge variant="outline" className="text-xs capitalize">{backup.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{backup.id} · {backup.size}</p>
              </div>
              <Badge className="capitalize">
                <CheckCircle2 className="w-3 h-3 me-1" />
                {backup.status}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info(lang === "ar" ? "استعادة..." : "Restoring...")}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success(lang === "ar" ? "جاري التنزيل" : "Downloading")}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => toast.success(lang === "ar" ? "تم الحذف" : "Deleted")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
