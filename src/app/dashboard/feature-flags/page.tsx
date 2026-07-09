import { getFeatureFlags } from "@/lib/admin-data";
import { FeatureFlagsClient } from "@/components/admin/feature-flags-client";

export default async function FeatureFlagsPage() {
  const flags = await getFeatureFlags();
  return <FeatureFlagsClient flags={flags} />;
}
