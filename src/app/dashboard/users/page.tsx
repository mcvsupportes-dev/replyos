import { getUsers } from "@/lib/admin-data";
import { UsersClient } from "@/components/admin/users-client";

export default async function UsersPage() {
  const users = await getUsers();
  return <UsersClient users={users} />;
}
