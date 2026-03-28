import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import SeoHead from "../components/SeoHead";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("Введите имя");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Пароли не совпадают");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await registerUser({ name, email, password });

      // MVP: после регистрации отправляем на логин
      // (можно заменить на onboarding/profile позже)
      navigate("/login");
    } catch (err: any) {
      console.error("Ошибка регистрации", err);
      const detail =
        err?.response?.data?.detail ||
        "Не удалось зарегистрироваться. Попробуйте ещё раз.";

      setErrorMsg(
        Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
          : String(detail)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Регистрация | FinPulse"
        description="Создайте аккаунт FinPulse для персональной ленты и AI-помощника."
        canonicalPath="/register"
      />
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Регистрация</h1>

      {errorMsg && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Почта</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Подтвердите пароль</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {submitting ? "Регистрирую…" : "Зарегистрироваться"}
          </button>
        </div>
      </form>

        <div className="mt-4 text-sm text-gray-500">
          Рынок по умолчанию: 🇷🇺 Россия. Профиль можно настроить после регистрации.
        </div>
      </div>
    </>
  );
};

export default Register;
