import { getSettings } from "@/lib/admin-data";
import { SettingsClient } from "@/components/admin/settings-client";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient settings={settings} />;
}
