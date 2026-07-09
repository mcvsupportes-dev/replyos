"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { Search, Upload, FileText, Image, Music, Video, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import type { FileData } from "@/lib/admin-data";

interface Props {
  files: FileData[];
}

const FILE_ICONS = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
  other: FileText,
};

export function FilesClient({ files: initial }: Props) {
  const { lang } = useLanguage();
  const [files, setFiles] = React.useState(initial);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || f.type === filter;
    return matchesSearch && matchesFilter;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success(lang === "ar" ? "تم حذف الملف" : "File deleted");
  };

  const filters = ["all", "image", "document", "audio", "video"];
  const filterLabels: Record<string, { ar: string; en: string }> = {
    all: { ar: "الكل", en: "All" },
    image: { ar: "صور", en: "Images" },
    document: { ar: "مستندات", en: "Documents" },
    audio: { ar: "صوت", en: "Audio" },
    video: { ar: "فيديو", en: "Video" },
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الملفات" : "Files"}
        description={lang === "ar" ? `${files.length} ملف مخزن في Firebase Storage` : `${files.length} files in Firebase Storage`}
        action={
          <Button onClick={() => toast.info(lang === "ar" ? "فتح رفع الملفات" : "Opening uploader")}>
            <Upload className="w-4 h-4 me-2" />
            {lang === "ar" ? "رفع ملف" : "Upload"}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث..." : "Search files..."}
            className="ps-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {filterLabels[f][lang]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center premium-shadow">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد ملفات" : "No files found"}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((file) => {
            const Icon = FILE_ICONS[file.type] || FileText;
            return (
              <Card key={file.id} className="p-4 premium-shadow hover:premium-shadow-lg transition-all animate-fade-in group">
                <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center mb-3 overflow-hidden">
                  {file.type === "image" && file.url ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-10 h-10 text-muted-foreground/50" />
                  )}
                </div>
                <div className="mb-2">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Badge variant="outline" className="capitalize mb-3">{file.type}</Badge>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info(lang === "ar" ? "معاينة" : "Preview")}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info(lang === "ar" ? "تنزيل" : "Download")}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(file.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
