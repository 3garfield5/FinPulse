import { api } from "./client";

export type AdminUserRow = {
  id: number;
  email: string;
  roles: string[];
  subscription_tier: "free" | "pro";
};

export async function listUsers(): Promise<AdminUserRow[]> {
  const res = await api.get<AdminUserRow[]>("/admin/users");
  return res.data;
}

export async function setUserRoles(userId: number, roles: string[]) {
  const res = await api.put(`/admin/users/${userId}/roles`, { roles });
  return res.data;
}