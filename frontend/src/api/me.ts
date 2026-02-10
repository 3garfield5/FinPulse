import { api } from "./client";

export type Me = {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
  subscription_tier: "free" | "pro";
};

export async function getMe(): Promise<Me> {
  const res = await api.get<Me>("/me");
  return res.data;
}