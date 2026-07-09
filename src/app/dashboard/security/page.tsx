import { SecurityClient } from "@/components/admin/security-client";
import { getLogs } from "@/lib/admin-data";

export default async function SecurityPage() {
  const logs = await getLogs();
  const securityEvents = logs.filter((l) => l.source === "auth" || l.source === "security").slice(0, 20);
  return <SecurityClient events={securityEvents} />;
}
