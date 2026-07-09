import { getSubscriptions } from "@/lib/admin-data";
import { SubscriptionsClient } from "@/components/admin/subscriptions-client";

export default async function SubscriptionsPage() {
  const subs = await getSubscriptions();
  return <SubscriptionsClient subs={subs} />;
}
