// src/api/profile.ts
import { api } from "./client";

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  markets: string[];
  categories: string[];
}

export async function getProfile(): Promise<ProfileData> {
  const res = await api.get<ProfileData>("/profile");
  return res.data;
}

export async function updateProfilePreferences(payload: {
  markets: string[];
  categories: string[];
}): Promise<ProfileData> {
  const res = await api.patch<ProfileData>("/profile/preferences", payload);
  return res.data;
}
