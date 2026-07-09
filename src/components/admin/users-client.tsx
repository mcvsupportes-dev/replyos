"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { Search, UserPlus, MoreVertical, Mail, Trash2, Ban, CheckCircle2, Users as UsersIcon, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { UserData } from "@/lib/admin-data";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  users: UserData[];
}

export function UsersClient({ users: initialUsers }: Props) {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "active" | "trial" | "suspended">("all");

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || u.status === filter;
    return matchesSearch && matchesFilter;
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = async (action: string, user: UserData) => {
    if (action === "delete") {
      if (!confirm(lang === "ar" ? `حذف المستخدم "${user.name}"؟` : `Delete user "${user.name}"?`)) {
        return;
      }
      // optimistic
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error(lang === "ar" ? "فشل الحذف" : "Delete failed");
          await refresh();
        } else {
          toast.success(lang === "ar" ? "تم حذف المستخدم" : "User deleted");
        }
      } catch {
        toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
        await refresh();
      }
    } else if (action === "suspend" || action === "activate") {
      const newStatus = action === "suspend" ? "suspended" : "active";
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          toast.error(lang === "ar" ? "فشل التحديث" : "Update failed");
          await refresh();
        } else {
          toast.success(
            lang === "ar"
              ? action === "suspend" ? "تم تعليق المستخدم" : "تم تفعيل المستخدم"
              : action === "suspend" ? "User suspended" : "User activated"
          );
        }
      } catch {
        toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
        await refresh();
      }
    }
  };

  const filters = [
    { id: "all", label: lang === "ar" ? "الكل" : "All", count: users.length },
    { id: "active", label: lang === "ar" ? "نشط" : "Active", count: users.filter((u) => u.status === "active").length },
    { id: "trial", label: lang === "ar" ? "تجريبي" : "Trial", count: users.filter((u) => u.status === "trial").length },
    { id: "suspended", label: lang === "ar" ? "معلق" : "Suspended", count: users.filter((u) => u.status === "suspended").length },
  ] as const;

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "المستخدمون" : "Users"}
        description={lang === "ar" ? `${users.length} مستخدم مسجل` : `${users.length} registered users`}
        action={
          <Button>
            <UserPlus className="w-4 h-4 me-2" />
            {lang === "ar" ? "مستخدم جديد" : "Add User"}
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
            className="ps-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {f.label}
              <span className="ms-1.5 opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <Card className="premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "المستخدم" : "User"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  {lang === "ar" ? "الباقة" : "Plan"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  {lang === "ar" ? "الردود هذا الشهر" : "Replies/Month"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  {lang === "ar" ? "التخزين" : "Storage"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  {lang === "ar" ? "آخر ظهور" : "Last Active"}
                </th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <UsersIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? "لا يوجد مستخدمون مطابقون" : "No users found"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">{user.plan}</Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm text-foreground tabular-nums">{user.repliesThisMonth.toLocaleString()}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm text-foreground tabular-nums">{(user.storageUsedMb / 1024).toFixed(1)} GB</span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(user.lastActive, { addSuffix: true, locale })}
                      </span>
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info(lang === "ar" ? `إرسال بريد إلى ${user.email}` : `Email ${user.email}`)}>
                            <Mail className="w-4 h-4 me-2" />
                            {lang === "ar" ? "إرسال بريد" : "Send Email"}
                          </DropdownMenuItem>
                          {user.status === "suspended" ? (
                            <DropdownMenuItem onClick={() => handleAction("activate", user)}>
                              <CheckCircle2 className="w-4 h-4 me-2" />
                              {lang === "ar" ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAction("suspend", user)}>
                              <Ban className="w-4 h-4 me-2" />
                              {lang === "ar" ? "تعليق" : "Suspend"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleAction("delete", user)}
                          >
                            <Trash2 className="w-4 h-4 me-2" />
                            {lang === "ar" ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
