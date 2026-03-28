import { Link } from "react-router-dom";
import SeoHead from "../components/SeoHead";

export default function NotFound() {
  return (
    <>
      <SeoHead
        title="404 — Страница не найдена | FinPulse"
        description="Запрошенная страница не найдена."
        canonicalPath="/404"
        noindex
      />
      <section className="max-w-xl mx-auto bg-white p-6 rounded shadow space-y-3">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="text-sm text-gray-600">Страница не найдена или была перемещена.</p>
        <Link to="/" className="inline-block text-sm text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </section>
    </>
  );
}
