import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-100" aria-hidden="true">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Página no encontrada</h1>
      <p className="mt-3 text-ink-muted">La dirección que buscas no existe o se movió.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
