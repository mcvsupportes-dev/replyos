import { getDashboardStats, ensureSeedData, getUsers, getLogs } from "@/lib/admin-data";
import { DashboardClient } from "@/components/admin/dashboard-client";

export default async function DashboardPage() {
  // Seed data in background (non-blocking)
  ensureSeedData().catch(() => {});

  const [stats, users, logs] = await Promise.all([
    getDashboardStats(),
    getUsers(),
    getLogs(),
  ]);

  const recentUsers = users.slice(0, 5);
  const recentLogs = logs.slice(0, 6);

  return <DashboardClient stats={stats} recentUsers={recentUsers} recentLogs={recentLogs} />;
}
