import { getAIProviders } from "@/lib/admin-data";
import { AIProvidersClient } from "@/components/admin/ai-providers-client";

export default async function AIProvidersPage() {
  const providers = await getAIProviders();
  return <AIProvidersClient providers={providers} />;
}
