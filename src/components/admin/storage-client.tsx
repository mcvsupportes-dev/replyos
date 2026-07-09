"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { HardDrive, RefreshCw, Trash2, FileText, Image, Music, Video, Database } from "lucide-react";
import { toast } from "sonner";
import type { FileData } from "@/lib/admin-data";

interface Props {
  files: FileData[];
  storageUsedMb: number;
}

export function StorageClient({ files, storageUsedMb }: Props) {
  const { lang } = useLanguage();

  const totalGb = storageUsedMb / 1024;
  const totalQuotaGb = 50; // demo quota
  const usagePercent = Math.min((totalGb / totalQuotaGb) * 100, 100);

  const byType = {
    image: files.filter((f) => f.type === "image"),
    document: files.filter((f) => f.type === "document"),
    audio: files.filter((f) => f.type === "audio"),
    video: files.filter((f) => f.type === "video"),
  };

  const typeStats = [
    { type: "image", label: lang === "ar" ? "صور" : "Images", icon: Image, count: byType.image.length, size: byType.image.reduce((s, f) => s + f.size, 0), color: "text-emerald-500" },
    { type: "document", label: lang === "ar" ? "مستندات" : "Documents", icon: FileText, count: byType.document.length, size: byType.document.reduce((s, f) => s + f.size, 0), color: "text-blue-500" },
    { type: "audio", label: lang === "ar" ? "صوت" : "Audio", icon: Music, count: byType.audio.length, size: byType.audio.reduce((s, f) => s + f.size, 0), color: "text-violet-500" },
    { type: "video", label: lang === "ar" ? "فيديو" : "Video", icon: Video, count: byType.video.length, size: byType.video.reduce((s, f) => s + f.size, 0), color: "text-amber-500" },
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "التخزين" : "Storage"}
        description={lang === "ar" ? "إدارة تخزين Firebase Storage" : "Manage Firebase Storage"}
        action={
          <Button variant="outline" onClick={() => toast.success(lang === "ar" ? "تم التحديث" : "Refreshed")}>
            <RefreshCw className="w-4 h-4 me-2" />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      {/* Usage overview */}
      <Card className="p-6 premium-shadow mb-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HardDrive className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === "ar" ? "إجمالي الاستخدام" : "Total Usage"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalGb.toFixed(2)} GB {lang === "ar" ? "من" : "of"} {totalQuotaGb} GB
            </p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{usagePercent.toFixed(1)}%</span>
          <span>{(totalQuotaGb - totalGb).toFixed(2)} GB {lang === "ar" ? "متاح" : "available"}</span>
        </div>
      </Card>

      {/* By type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {typeStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.type} className="p-5 premium-shadow animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{stat.count}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatSize(stat.size)}</p>
            </Card>
          );
        })}
      </div>

      {/* Firebase info */}
      <Card className="p-6 premium-shadow animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Firebase Storage</h3>
            <p className="text-xs text-muted-foreground">{process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "replyos-af4d3.firebasestorage.app"}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">{lang === "ar" ? "عدد الملفات" : "Total files"}</span>
            <span className="font-medium text-foreground">{files.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 border-b border-border">
            <span className="text-muted-foreground">{lang === "ar" ? "إجمالي الحجم" : "Total size"}</span>
            <span className="font-medium text-foreground">{formatSize(files.reduce((s, f) => s + f.size, 0))}</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-muted-foreground">{lang === "ar" ? "القاعدة" : "Bucket"}</span>
            <code className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">gs://replyos-af4d3.firebasestorage.app</code>
          </div>
        </div>
      </Card>
    </div>
  );
}
