import { getFiles } from "@/lib/admin-data";
import { FilesClient } from "@/components/admin/files-client";

export default async function FilesPage() {
  const files = await getFiles();
  return <FilesClient files={files} />;
}
