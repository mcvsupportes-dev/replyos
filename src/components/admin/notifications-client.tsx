"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import type { NotificationData } from "@/lib/admin-data";

interface Props {
  notifs: NotificationData[];
}

const TYPE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const TYPE_COLORS = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-primary bg-primary/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-rose-500 bg-rose-500/10",
};

export function NotificationsClient({ notifs: initial }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [notifs, setNotifs] = React.useState(initial);

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(
        notifs.filter((n) => !n.read).map((n) =>
          fetch(`/api/admin/notifications/${n.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          })
        )
      );
      toast.success(lang === "ar" ? "تم تحديد الكل كمقروء" : "All marked as read");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // ignore
    }
  };

  const deleteNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الإشعارات" : "Notifications"}
        description={lang === "ar" ? `${unreadCount} غير مقروء من ${notifs.length}` : `${unreadCount} unread of ${notifs.length}`}
        action={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 me-2" />
            {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
          </Button>
        }
      />

      {notifs.length === 0 ? (
        <Card className="p-12 text-center premium-shadow">
          <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((notif) => {
            const Icon = TYPE_ICONS[notif.type];
            return (
              <Card
                key={notif.id}
                className={`p-4 premium-shadow animate-fade-in cursor-pointer hover:premium-shadow-lg transition-all ${
                  !notif.read ? "ring-1 ring-primary/30" : ""
                }`}
                onClick={() => markRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[notif.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                  >
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
