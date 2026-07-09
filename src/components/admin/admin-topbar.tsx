"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  Search,
  Languages,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSidebarMobile } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminTopbar({ email }: { email: string }) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Sheet side must be a literal: "right" for RTL (Arabic), "left" for LTR (English)
  const sheetSide: "right" | "left" = lang === "ar" ? "right" : "left";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success(lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={sheetSide} className="w-72 p-0">
          <AdminSidebarMobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={lang === "ar" ? "بحث..." : "Search..."}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          title="Toggle language"
        >
          <Languages className="w-4.5 h-4.5" />
          <span className="sr-only">Toggle language</span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-4.5 h-4.5" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User */}
        <div className="hidden sm:flex items-center gap-2.5 ps-2 ms-1 border-s border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
            {email.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-foreground leading-none truncate max-w-[140px]">
              {email}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "ar" ? "مدير" : "Admin"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title={t("auth.logout")}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4.5 h-4.5" />
        </Button>
      </div>
    </header>
  );
}
