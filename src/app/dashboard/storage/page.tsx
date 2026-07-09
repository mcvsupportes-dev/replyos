import { getFiles, getDashboardStats } from "@/lib/admin-data";
import { StorageClient } from "@/components/admin/storage-client";

export default async function StoragePage() {
  const [files, stats] = await Promise.all([getFiles(), getDashboardStats()]);
  return <StorageClient files={files} storageUsedMb={stats.storageUsedMb} />;
}
