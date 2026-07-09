import { getNotifications } from "@/lib/admin-data";
import { NotificationsClient } from "@/components/admin/notifications-client";

export default async function NotificationsPage() {
  const notifs = await getNotifications();
  return <NotificationsClient notifs={notifs} />;
}
