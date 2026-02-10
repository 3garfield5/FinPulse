import React, { useEffect, useState } from "react";
import { listUsers, setUserRoles, AdminUserRow } from "../api/adminUsers";

const ROLE_OPTIONS = ["user", "pro", "admin"] as const;

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await listUsers();
      setRows(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeRole(userId: number, role: string) {
    setSavingId(userId);
    setError(null);
    try {
      await setUserRoles(userId, [role]);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось изменить роль");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Admin: Users</h1>
        <button
          onClick={() => void load()}
          className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
          disabled={loading}
        >
          Обновить
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Tier</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const currentRole = u.roles[0] ?? "user";
                const isSaving = savingId === u.id;

                return (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 pr-4">{u.id}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="border rounded px-2 py-1"
                        value={currentRole}
                        disabled={isSaving}
                        onChange={(e) => void changeRole(u.id, e.target.value)}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {isSaving && (
                        <span className="ml-2 text-gray-500 text-xs">saving...</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{u.subscription_tier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}