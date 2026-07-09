"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { LifeBuoy, MessageSquare, Mail, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";

export function SupportClient() {
  const { lang } = useLanguage();
  const locale = lang === "ar" ? arSA : enUS;
  const [search, setSearch] = React.useState("");

  const tickets = [
    { id: "T-001", subject: lang === "ar" ? "مشكلة في ربط واتساب" : "WhatsApp connection issue", user: "ahmed@example.com", status: "open", priority: "high", createdAt: Date.now() - 3600000 },
    { id: "T-002", subject: lang === "ar" ? "طلب استرجاع اشتراك" : "Subscription refund request", user: "sara@example.com", status: "pending", priority: "medium", createdAt: Date.now() - 7200000 },
    { id: "T-003", subject: lang === "ar" ? "كيف أضيف قاعدة جديدة؟" : "How to add a new rule?", user: "khalid@example.com", status: "resolved", priority: "low", createdAt: Date.now() - 86400000 },
    { id: "T-004", subject: lang === "ar" ? "البطء في ردود الذكاء" : "AI replies are slow", user: "fatima@example.com", status: "open", priority: "medium", createdAt: Date.now() - 10800000 },
  ];

  const filtered = tickets.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user.toLowerCase().includes(search.toLowerCase())
  );

  const statusVariant = (s: string) => {
    if (s === "open") return "default";
    if (s === "pending") return "secondary";
    return "outline";
  };

  const priorityColors: Record<string, string> = {
    high: "text-rose-500 bg-rose-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    low: "text-primary bg-primary/10",
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الدعم" : "Support"}
        description={lang === "ar" ? "إدارة تذاكر الدعم الفني" : "Manage support tickets"}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "مفتوحة" : "Open"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter((t) => t.status === "open").length}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "قيد الانتظار" : "Pending"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter((t) => t.status === "pending").length}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "محلولة" : "Resolved"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter((t) => t.status === "resolved").length}</p>
        </Card>
        <Card className="p-5 premium-shadow animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "أولوية عالية" : "High Priority"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{tickets.filter((t) => t.priority === "high").length}</p>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === "ar" ? "بحث في التذاكر..." : "Search tickets..."} className="ps-10" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((ticket) => (
          <Card key={ticket.id} className="p-4 premium-shadow hover:premium-shadow-lg transition-all animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                  <Badge variant="outline" className={`capitalize ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticket.id} · {ticket.user} · {formatDistanceToNow(ticket.createdAt, { addSuffix: true, locale })}
                </p>
              </div>
              <Badge variant={statusVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
              <Button variant="outline" size="sm" onClick={() => toast.info(lang === "ar" ? `فتح ${ticket.id}` : `Opening ${ticket.id}`)}>
                <Mail className="w-3.5 h-3.5 me-1.5" />
                {lang === "ar" ? "رد" : "Reply"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
