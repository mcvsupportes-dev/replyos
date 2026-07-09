import { getLogs } from "@/lib/admin-data";
import { LogsClient } from "@/components/admin/logs-client";

export default async function LogsPage() {
  const logs = await getLogs();
  return <LogsClient logs={logs} />;
}
