"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Check,
  X,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PlanData } from "@/lib/admin-data";

interface Props {
  plans: PlanData[];
}

interface PlanForm {
  id?: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  interval: string;
  repliesLimit: number;
  storageLimitMb: number;
  features: string[];
  featuresAr: string[];
  popular: boolean;
}

const EMPTY_FORM: PlanForm = {
  name: "",
  nameAr: "",
  price: 0,
  currency: "USD",
  interval: "month",
  repliesLimit: 100,
  storageLimitMb: 50,
  features: [],
  featuresAr: [],
  popular: false,
};

export function PlansClient({ plans: initialPlans }: Props) {
  const { lang } = useLanguage();
  const [plans, setPlans] = React.useState(initialPlans);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [featureInput, setFeatureInput] = React.useState("");
  const [featureArInput, setFeatureArInput] = React.useState("");

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/plans", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.plans)) {
        setPlans(data.plans);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const openAdd = () => {
    setEditing(EMPTY_FORM);
    setFeatureInput("");
    setFeatureArInput("");
    setDialogOpen(true);
  };

  const openEdit = (p: PlanData) => {
    setEditing({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr || "",
      price: p.price,
      currency: p.currency || "USD",
      interval: p.interval || "month",
      repliesLimit: p.repliesLimit,
      storageLimitMb: p.storageLimitMb,
      features: p.features || [],
      featuresAr: p.featuresAr || [],
      popular: p.popular,
    });
    setFeatureInput("");
    setFeatureArInput("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) {
      toast.error(lang === "ar" ? "الاسم مطلوب" : "Name is required");
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!editing.id;
      const url = isEditing ? `/api/admin/plans/${editing.id}` : "/api/admin/plans";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
        return;
      }
      toast.success(
        lang === "ar"
          ? isEditing
            ? "تم تحديث الباقة"
            : "تمت إضافة الباقة"
          : isEditing
            ? "Plan updated"
            : "Plan added"
      );
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: PlanData) => {
    if (
      !confirm(
        lang === "ar" ? `حذف الباقة "${p.name}"؟` : `Delete plan "${p.name}"?`
      )
    ) {
      return;
    }
    setPlans((prev) => prev.filter((x) => x.id !== p.id));
    try {
      const res = await fetch(`/api/admin/plans/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(lang === "ar" ? "فشل الحذف" : "Delete failed");
        await refresh();
      } else {
        toast.success(lang === "ar" ? "تم حذف الباقة" : "Plan deleted");
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      await refresh();
    }
  };

  const togglePopular = async (p: PlanData) => {
    const newPopular = !p.popular;
    setPlans((prev) =>
      prev.map((x) => ({ ...x, popular: x.id === p.id ? newPopular : false }))
    );
    try {
      await fetch(`/api/admin/plans/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popular: newPopular }),
      });
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      await refresh();
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setEditing((prev) => ({
      ...prev,
      features: [...prev.features, featureInput.trim()],
    }));
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setEditing((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const addFeatureAr = () => {
    if (!featureArInput.trim()) return;
    setEditing((prev) => ({
      ...prev,
      featuresAr: [...prev.featuresAr, featureArInput.trim()],
    }));
    setFeatureArInput("");
  };

  const removeFeatureAr = (idx: number) => {
    setEditing((prev) => ({
      ...prev,
      featuresAr: prev.featuresAr.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الباقات" : "Plans"}
        description={
          lang === "ar"
            ? "إدارة اشتراكات وباقات النظام"
            : "Manage subscription plans"
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw
                className={`w-4 h-4 me-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {lang === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 me-2" />
              {lang === "ar" ? "باقة جديدة" : "Add Plan"}
            </Button>
          </div>
        }
      />

      {plans.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "لا توجد باقات بعد. أضف باقتك الأولى."
              : "No plans yet. Add your first one."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 premium-shadow hover:premium-shadow-lg transition-all duration-300 animate-fade-in ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                  <Badge className="gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {lang === "ar" ? "الأكثر شيوعاً" : "Popular"}
                  </Badge>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "ar" ? plan.nameAr || plan.name : plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.currency} / {plan.interval}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "حد الردود" : "Replies limit"}
                  </span>
                  <span className="font-medium text-foreground">
                    {plan.repliesLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "حد التخزين" : "Storage limit"}
                  </span>
                  <span className="font-medium text-foreground">
                    {(plan.storageLimitMb / 1024).toFixed(1)} GB
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "المشتركون" : "Subscribers"}
                  </span>
                  <span className="font-medium text-foreground">
                    {plan.subscriberCount || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 pt-4 border-t border-border">
                {(lang === "ar" ? plan.featuresAr : plan.features).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {lang === "ar" ? "باقة مميزة" : "Mark as popular"}
                </span>
                <Switch
                  checked={plan.popular}
                  onCheckedChange={() => togglePopular(plan)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(plan)}
                >
                  <Edit className="w-3.5 h-3.5 me-1.5" />
                  {lang === "ar" ? "تعديل" : "Edit"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(plan)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit plan dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing.id
                ? lang === "ar"
                  ? "تعديل الباقة"
                  : "Edit Plan"
                : lang === "ar"
                  ? "باقة جديدة"
                  : "Add Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  {lang === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  placeholder="Pro"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}</Label>
                <Input
                  value={editing.nameAr}
                  onChange={(e) =>
                    setEditing({ ...editing, nameAr: e.target.value })
                  }
                  placeholder="احترافي"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "السعر" : "Price"}</Label>
                <Input
                  type="number"
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "العملة" : "Currency"}</Label>
                <Input
                  value={editing.currency}
                  onChange={(e) =>
                    setEditing({ ...editing, currency: e.target.value })
                  }
                  placeholder="USD"
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "الفترة" : "Interval"}</Label>
                <select
                  value={editing.interval}
                  onChange={(e) =>
                    setEditing({ ...editing, interval: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="month">{lang === "ar" ? "شهري" : "month"}</option>
                  <option value="year">{lang === "ar" ? "سنوي" : "year"}</option>
                  <option value="lifetime">{lang === "ar" ? "مدى الحياة" : "lifetime"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "حد الردود" : "Replies Limit"}</Label>
                <Input
                  type="number"
                  value={editing.repliesLimit}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      repliesLimit: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {lang === "ar" ? "حد التخزين (MB)" : "Storage Limit (MB)"}
                </Label>
                <Input
                  type="number"
                  value={editing.storageLimitMb}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      storageLimitMb: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{lang === "ar" ? "المميزات (إنجليزي)" : "Features (EN)"}</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  placeholder={lang === "ar" ? "أضف ميزة..." : "Add feature..."}
                />
                <Button type="button" size="sm" onClick={addFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {editing.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm bg-muted/40 px-3 py-1.5 rounded-lg"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{lang === "ar" ? "المميزات (عربي)" : "Features (AR)"}</Label>
              <div className="flex gap-2">
                <Input
                  value={featureArInput}
                  onChange={(e) => setFeatureArInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeatureAr();
                    }
                  }}
                  placeholder={lang === "ar" ? "أضف ميزة..." : "Add feature..."}
                  dir="rtl"
                />
                <Button type="button" size="sm" onClick={addFeatureAr}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {editing.featuresAr.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm bg-muted/40 px-3 py-1.5 rounded-lg"
                  >
                    <span dir="rtl">{f}</span>
                    <button
                      type="button"
                      onClick={() => removeFeatureAr(i)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{lang === "ar" ? "باقة مميزة" : "Popular"}</Label>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar"
                    ? "إظهار شارة الأكثر شيوعاً"
                    : "Show the popular badge"}
                </p>
              </div>
              <Switch
                checked={editing.popular}
                onCheckedChange={(v) => setEditing({ ...editing, popular: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
