"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, APP_NAME } from "@/lib/constants";
import { useLanguage } from "@/components/language-provider";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Bot,
  FileText,
  HardDrive,
  ScrollText,
  Bell,
  Settings,
  Activity,
  Shield,
  LifeBuoy,
  Flag,
  DatabaseBackup,
  Sparkles,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Bot,
  FileText,
  HardDrive,
  ScrollText,
  Bell,
  Settings,
  Activity,
  Shield,
  LifeBuoy,
  Flag,
  DatabaseBackup,
  MessageCircle,
};

const GROUP_LABELS: Record<string, { ar: string; en: string }> = {
  main: { ar: "الرئيسية", en: "Main" },
  billing: { ar: "الفوترة", en: "Billing" },
  ai: { ar: "الذكاء الاصطناعي", en: "AI" },
  content: { ar: "المحتوى", en: "Content" },
  ops: { ar: "العمليات", en: "Operations" },
  system: { ar: "النظام", en: "System" },
};

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { lang, t } = useLanguage();

  // Group items
  const grouped = ADMIN_NAV.reduce((acc, item) => {
    const g = item.group || "main";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof ADMIN_NAV>);

  const groupOrder = ["main", "billing", "ai", "content", "ops", "system"];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-border bg-sidebar h-screen sticky top-0">
      <SidebarContent
        grouped={grouped}
        groupOrder={groupOrder}
        pathname={pathname}
        lang={lang}
        t={t}
        onNavigate={onNavigate}
      />
    </aside>
  );
}

export function AdminSidebarMobile({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { lang, t } = useLanguage();

  const grouped = ADMIN_NAV.reduce((acc, item) => {
    const g = item.group || "main";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof ADMIN_NAV>);

  const groupOrder = ["main", "billing", "ai", "content", "ops", "system"];

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Logo />
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent">
          <X className="w-5 h-5" />
        </button>
      </div>
      <SidebarContent
        grouped={grouped}
        groupOrder={groupOrder}
        pathname={pathname}
        lang={lang}
        t={t}
        onNavigate={onClose}
      />
    </div>
  );
}

function SidebarContent({
  grouped,
  groupOrder,
  pathname,
  lang,
  t,
  onNavigate,
}: {
  grouped: Record<string, typeof ADMIN_NAV>;
  groupOrder: string[];
  pathname: string;
  lang: "ar" | "en";
  t: (k: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="hidden lg:flex items-center gap-2.5 p-5 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groupOrder.map((group) => {
          const items = grouped[group];
          if (!items) return null;
          return (
            <div key={group}>
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {GROUP_LABELS[group]?.[lang] || group}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-primary text-primary-foreground premium-shadow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="truncate">
                        {lang === "ar" ? item.titleAr : item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="rounded-xl bg-accent/50 p-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {lang === "ar" ? "ReplyOS Pro" : "ReplyOS Pro"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "ar"
                ? "نظام إدارة متكامل"
                : "Complete management system"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  const { lang } = useLanguage();
  return (
    <>
      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 premium-shadow">
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <p className="font-bold text-foreground leading-none">
          {lang === "ar" ? "ريبلاي أو إس" : "ReplyOS"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}
        </p>
      </div>
    </>
  );
}
