import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listUsers, setUserRoles, AdminUserRow } from "../api/adminUsers";

const ROLE_OPTIONS = ["", "user", "pro", "admin"] as const;
type SortBy = "created_at" | "email" | "role";
type SortDir = "asc" | "desc";

function toInt(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : def;
}

export default function AdminUsers() {
  const [sp, setSp] = useSearchParams();

  const q = sp.get("q") ?? "";
  const role = sp.get("role") ?? "";
  const sort_by = (sp.get("sort_by") as SortBy) ?? "created_at";
  const sort_dir = (sp.get("sort_dir") as SortDir) ?? "asc";
  const page = toInt(sp.get("page"), 1);
  const page_size_raw = Number(sp.get("page_size"));
  const page_size = Number.isFinite(page_size_raw)
    ? Math.min(100, Math.max(5, Math.floor(page_size_raw)))
    : 5;

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [qDraft, setQDraft] = useState(q);
  useEffect(() => setQDraft(q), [q]);

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(sp);
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    setSp(next, { replace: true });
  }

  function setParamResetPage(key: string, value?: string) {
    const next = new URLSearchParams(sp);
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSp(next, { replace: true });
  }

  function setSort(nextBy: SortBy) {
    const next = new URLSearchParams(sp);
    const curBy = (sp.get("sort_by") as SortBy) ?? "created_at";
    const curDir = (sp.get("sort_dir") as SortDir) ?? "desc";
    const newDir: SortDir = curBy === nextBy ? (curDir === "asc" ? "desc" : "asc") : "desc";
    next.set("sort_by", nextBy);
    next.set("sort_dir", newDir);
    next.set("page", "1");
    setSp(next, { replace: true });
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / page_size)), [total, page_size]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft !== q) {
        const v = qDraft.trim();
        setParamResetPage("q", v || undefined);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await listUsers({
        q: q.trim() || undefined,
        role: role || undefined,
        sort_by,
        sort_dir,
        page,
        page_size,
      });

      setRows(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, sort_by, sort_dir, page, page_size]);

  async function changeRole(userId: number, nextRole: string) {
    setSavingId(userId);
    setError(null);
    try {
      if (!nextRole) return;
      await setUserRoles(userId, [nextRole]);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Не удалось изменить роль");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Users</h1>
        <button
          onClick={() => void load()}
          className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
          disabled={loading}
        >
          Обновить
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Поиск</label>
          <input
            className="border rounded px-3 py-2 w-72"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="email или имя"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Фильтр по роли</label>
          <select
            className="border rounded px-3 py-2 w-56"
            value={role}
            onChange={(e) => setParamResetPage("role", e.target.value || undefined)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r ? r : "All"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Page size</label>
          <select
            className="border rounded px-3 py-2 w-32"
            value={page_size}
            onChange={(e) => {
              const next = new URLSearchParams(sp);
              next.set("page_size", String(Number(e.target.value)));
              next.set("page", "1");
              setSp(next, { replace: true });
            }}
          >
            {[5, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setSp(new URLSearchParams(), { replace: true })}
        >
          Reset
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b bg-gray-50">
              <tr className="text-left">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => setSort("email")}>
                  Email
                </th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => setSort("role")}>
                  Role
                </th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => setSort("created_at")}>
                  Created
                </th>
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
                        {ROLE_OPTIONS.filter(Boolean).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {isSaving && <span className="ml-2 text-gray-500 text-xs">saving...</span>}
                    </td>
                    <td className="py-2 pr-4">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="py-3" colSpan={5}>
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          className="border rounded px-3 py-1"
          disabled={page <= 1}
          onClick={() => setParam("page", String(page - 1))}
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} / {totalPages} (total {total})
        </div>
        <button
          className="border rounded px-3 py-1"
          disabled={page >= totalPages}
          onClick={() => setParam("page", String(page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}