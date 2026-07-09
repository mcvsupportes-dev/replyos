"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-provider";
import {
  Plus,
  Bot,
  Trash2,
  Edit,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
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
import type { AIProviderData } from "@/lib/admin-data";

interface Props {
  providers: AIProviderData[];
}

interface ProviderForm {
  id?: string;
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  endpoint: string;
  isActive: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: ProviderForm = {
  name: "",
  provider: "zai",
  model: "",
  apiKey: "",
  endpoint: "https://api.z.ai/api/paas/v4",
  isActive: false,
  isDefault: false,
};

export function AIProvidersClient({ providers: initial }: Props) {
  const { lang } = useLanguage();
  const [providers, setProviders] = React.useState(initial);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProviderForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/ai-providers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.providers)) {
        setProviders(data.providers);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const openAdd = () => {
    setEditing(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: AIProviderData) => {
    setEditing({
      id: p.id,
      name: p.name,
      provider: p.provider,
      model: p.model,
      apiKey: "", // never reuse stored key — user retypes
      endpoint: p.endpoint,
      isActive: p.isActive,
      isDefault: p.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) {
      toast.error(lang === "ar" ? "الاسم مطلوب" : "Name is required");
      return;
    }
    if (!editing.model.trim()) {
      toast.error(
        lang === "ar"
          ? "اسم النموذج مطلوب"
          : "Model name is required"
      );
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!editing.id;
      const url = isEditing
        ? `/api/admin/ai-providers/${editing.id}`
        : "/api/admin/ai-providers";
      const body: Record<string, unknown> = {
        name: editing.name,
        provider: editing.provider,
        model: editing.model,
        endpoint: editing.endpoint,
        isActive: editing.isActive,
        isDefault: editing.isDefault,
      };
      // Only send apiKey if user typed a new one
      if (editing.apiKey.trim()) body.apiKey = editing.apiKey;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
        return;
      }
      toast.success(
        lang === "ar"
          ? isEditing
            ? "تم تحديث المزود"
            : "تم إضافة المزود"
          : isEditing
            ? "Provider updated"
            : "Provider added"
      );
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: AIProviderData) => {
    // optimistic
    setProviders((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
    );
    try {
      const res = await fetch(`/api/admin/ai-providers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) {
        toast.error(lang === "ar" ? "فشل التبديل" : "Toggle failed");
        // revert
        setProviders((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, isActive: p.isActive } : x))
        );
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const handleSetDefault = async (p: AIProviderData) => {
    if (p.isDefault) return;
    setProviders((prev) =>
      prev.map((x) => ({ ...x, isDefault: x.id === p.id }))
    );
    try {
      await fetch(`/api/admin/ai-providers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      toast.success(lang === "ar" ? "تم التعيين كافتراضي" : "Set as default");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const handleTest = async (p: AIProviderData) => {
    setTestingId(p.id);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: p.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          lang === "ar"
            ? `الاتصال ناجح! الرد: ${data.reply?.slice(0, 50)}`
            : `Connection OK! Reply: ${data.reply?.slice(0, 50)}`
        );
      } else {
        toast.error(
          data.error || (lang === "ar" ? "فشل الاتصال" : "Connection failed")
        );
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (p: AIProviderData) => {
    if (p.isDefault) {
      toast.error(
        lang === "ar"
          ? "لا يمكن حذف المزود الافتراضي"
          : "Cannot delete the default provider"
      );
      return;
    }
    if (
      !confirm(
        lang === "ar"
          ? `حذف المزود "${p.name}"؟`
          : `Delete provider "${p.name}"?`
      )
    ) {
      return;
    }
    setProviders((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await fetch(`/api/admin/ai-providers/${p.id}`, { method: "DELETE" });
      toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
      await refresh();
    }
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "مزودو الذكاء الاصطناعي" : "AI Providers"}
        description={
          lang === "ar"
            ? "إدارة مزودي الذكاء الاصطناعي والإعدادات"
            : "Manage AI providers and configurations"
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
              {lang === "ar" ? "مزود جديد" : "Add Provider"}
            </Button>
          </div>
        }
      />

      {providers.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "لا يوجد مزودون بعد. أضف مزودك الأول."
              : "No providers yet. Add your first one."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-5 premium-shadow animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      provider.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {provider.name}
                      </h3>
                      {provider.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          {lang === "ar" ? "افتراضي" : "Default"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provider.provider} · <span className="font-mono">{provider.model}</span>
                    </p>
                  </div>
                </div>
                <Switch
                  checked={provider.isActive}
                  onCheckedChange={() => handleToggleActive(provider)}
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-border">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "مفتاح API" : "API Key"}
                  </span>
                  <code className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">
                    {provider.apiKeyMasked}
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-border">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "نقطة النهاية" : "Endpoint"}
                  </span>
                  <span className="text-xs text-foreground truncate max-w-[200px]">
                    {provider.endpoint}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "الاستخدام هذا الشهر" : "Usage this month"}
                  </span>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {provider.usageThisMonth.toLocaleString()} tokens
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTest(provider)}
                  disabled={testingId === provider.id}
                >
                  {testingId === provider.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
                      {lang === "ar" ? "جارٍ الاختبار..." : "Testing..."}
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 me-1.5" />
                      {lang === "ar" ? "اختبار" : "Test"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(provider)}
                >
                  <Edit className="w-3.5 h-3.5 me-1.5" />
                  {lang === "ar" ? "تعديل" : "Edit"}
                </Button>
                {!provider.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(provider)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 me-1.5" />
                    {lang === "ar" ? "افتراضي" : "Default"}
                  </Button>
                )}
                {!provider.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(provider)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                {provider.isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary">
                      {lang === "ar" ? "نشط ويعمل" : "Active and running"}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {lang === "ar" ? "معطل" : "Disabled"}
                    </span>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit provider dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing.id
                ? lang === "ar"
                  ? "تعديل المزود"
                  : "Edit Provider"
                : lang === "ar"
                  ? "إضافة مزود ذكاء"
                  : "Add AI Provider"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>
                {lang === "ar" ? "الاسم" : "Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder={lang === "ar" ? "مثال: OpenAI الإنتاج" : "e.g. OpenAI Production"}
              />
            </div>

            <div className="space-y-2">
              <Label>{lang === "ar" ? "المزود" : "Provider"}</Label>
              <select
                value={editing.provider}
                onChange={(e) =>
                  setEditing({ ...editing, provider: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="zai">Z.ai (Default)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google AI</option>
                <option value="groq">Groq</option>
                <option value="huggingface">HuggingFace</option>
                <option value="openrouter">OpenRouter</option>
                <option value="custom">Custom</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "النوع فقط — اسم النموذج يدوي بالأسفل"
                  : "Type only — model name is manual below"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                {lang === "ar" ? "اسم النموذج" : "Model Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editing.model}
                onChange={(e) =>
                  setEditing({ ...editing, model: e.target.value })
                }
                placeholder={lang === "ar" ? "اكتب اسم النموذج" : "Type the model name"}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "أدخل اسم النموذج يدوياً — مثال: gpt-4o, glm-4.6, claude-3-opus, llama-3-70b"
                  : "Type the model name manually — e.g. gpt-4o, glm-4.6, claude-3-opus, llama-3-70b"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                {lang === "ar" ? "مفتاح API" : "API Key"}
              </Label>
              <Input
                type="password"
                value={editing.apiKey}
                onChange={(e) =>
                  setEditing({ ...editing, apiKey: e.target.value })
                }
                placeholder={
                  editing.id
                    ? lang === "ar"
                      ? "اتركه فارغاً للإبقاء على المفتاح الحالي"
                      : "Leave empty to keep current key"
                    : "sk-..."
                }
              />
              {editing.id && (
                <p className="text-xs text-muted-foreground">
                  {lang === "ar"
                    ? "أدخل قيمة جديدة فقط لتغيير المفتاح"
                    : "Enter a new value only to change the key"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {lang === "ar" ? "نقطة النهاية" : "Endpoint"}
              </Label>
              <Input
                value={editing.endpoint}
                onChange={(e) =>
                  setEditing({ ...editing, endpoint: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "OpenAI-compatible base URL. لـ Z.ai اتركه كما هو"
                  : "OpenAI-compatible base URL. For Z.ai, leave as is."}
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{lang === "ar" ? "نشط" : "Active"}</Label>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "تفعيل المزود للاستخدام" : "Enable provider for use"}
                </p>
              </div>
              <Switch
                checked={editing.isActive}
                onCheckedChange={(v) => setEditing({ ...editing, isActive: v })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{lang === "ar" ? "افتراضي" : "Default"}</Label>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "استخدمه كالمزود الافتراضي" : "Use as the default provider"}
                </p>
              </div>
              <Switch
                checked={editing.isDefault}
                onCheckedChange={(v) => setEditing({ ...editing, isDefault: v })}
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
