"use client";

import * as React from "react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";
import { Save, RotateCcw, Settings as SettingsIcon, Globe, Palette, Bell, Shield, Database } from "lucide-react";
import { toast } from "sonner";

interface Props {
  settings: Record<string, unknown>;
}

export function SettingsClient({ settings: initial }: Props) {
  const { lang, setLang } = useLanguage();
  const [settings, setSettings] = React.useState({
    appName: (initial.appName as string) || "ReplyOS",
    defaultLanguage: (initial.defaultLanguage as string) || "ar",
    defaultTheme: (initial.defaultTheme as string) || "light",
    maintenanceMode: (initial.maintenanceMode as boolean) || false,
    signupEnabled: (initial.signupEnabled as boolean) || true,
    notificationsEnabled: true,
    rateLimitPerMinute: 60,
    maxUploadSizeMb: 10,
  });
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
        return;
      }
      toast.success(lang === "ar" ? "تم حفظ الإعدادات" : "Settings saved");
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: lang === "ar" ? "عام" : "General",
      icon: SettingsIcon,
      fields: (
        <>
          <Field label={lang === "ar" ? "اسم التطبيق" : "App Name"}>
            <Input value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
          </Field>
          <Field label={lang === "ar" ? "اللغة الافتراضية" : "Default Language"}>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="ar">{lang === "ar" ? "العربية" : "Arabic"}</option>
              <option value="en">{lang === "ar" ? "الإنجليزية" : "English"}</option>
            </select>
          </Field>
          <Field label={lang === "ar" ? "السمة الافتراضية" : "Default Theme"}>
            <select
              value={settings.defaultTheme}
              onChange={(e) => setSettings({ ...settings, defaultTheme: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="light">{lang === "ar" ? "فاتح" : "Light"}</option>
              <option value="dark">{lang === "ar" ? "داكن" : "Dark"}</option>
              <option value="system">{lang === "ar" ? "النظام" : "System"}</option>
            </select>
          </Field>
        </>
      ),
    },
    {
      title: lang === "ar" ? "الأمان" : "Security",
      icon: Shield,
      fields: (
        <>
          <ToggleField
            label={lang === "ar" ? "وضع الصيانة" : "Maintenance Mode"}
            description={lang === "ar" ? "إيقاف الوصول للتطبيق مؤقتاً" : "Temporarily disable app access"}
            checked={settings.maintenanceMode}
            onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
          />
          <ToggleField
            label={lang === "ar" ? "السماح بالتسجيل" : "Allow Signups"}
            description={lang === "ar" ? "السماح لمستخدمين جدد بالتسجيل" : "Allow new user registrations"}
            checked={settings.signupEnabled}
            onChange={(v) => setSettings({ ...settings, signupEnabled: v })}
          />
          <Field label={lang === "ar" ? "حد المعدل (لكل دقيقة)" : "Rate Limit (per minute)"}>
            <Input
              type="number"
              value={settings.rateLimitPerMinute}
              onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: Number(e.target.value) })}
            />
          </Field>
        </>
      ),
    },
    {
      title: lang === "ar" ? "التخزين" : "Storage",
      icon: Database,
      fields: (
        <>
          <Field label={lang === "ar" ? "أقصى حجم رفع (MB)" : "Max Upload Size (MB)"}>
            <Input
              type="number"
              value={settings.maxUploadSizeMb}
              onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: Number(e.target.value) })}
            />
          </Field>
        </>
      ),
    },
    {
      title: lang === "ar" ? "الإشعارات" : "Notifications",
      icon: Bell,
      fields: (
        <ToggleField
          label={lang === "ar" ? "تفعيل الإشعارات" : "Enable Notifications"}
          description={lang === "ar" ? "إرسال إشعارات للمستخدمين" : "Send notifications to users"}
          checked={settings.notificationsEnabled}
          onChange={(v) => setSettings({ ...settings, notificationsEnabled: v })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الإعدادات" : "Settings"}
        description={lang === "ar" ? "إدارة إعدادات النظام" : "Manage system settings"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info(lang === "ar" ? "تم الاستعادة" : "Reset")}>
              <RotateCcw className="w-4 h-4 me-2" />
              {lang === "ar" ? "استعادة" : "Reset"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin me-2" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <Card key={i} className="p-5 premium-shadow animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
              </div>
              <div className="space-y-4">{section.fields}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
