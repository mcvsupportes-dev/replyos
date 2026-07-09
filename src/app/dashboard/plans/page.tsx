import { getPlans } from "@/lib/admin-data";
import { PlansClient } from "@/components/admin/plans-client";

export default async function PlansPage() {
  const plans = await getPlans();
  return <PlansClient plans={plans} />;
}
