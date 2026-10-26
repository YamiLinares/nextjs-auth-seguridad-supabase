"use client";

// Límite de errores: muestra un mensaje genérico (en producción Next.js nunca envía
// el detalle del error del servidor al navegador, solo un identificador "digest").
import Link from "next/link";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : null;

  return (
    <div role="alert" className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">Algo salió mal</h1>
      <p className="mt-3 text-ink-muted">Ocurrió un error inesperado. Inténtalo de nuevo en unos segundos.</p>
      {digest && <p className="mt-2 font-mono text-xs text-ink-muted">Referencia: {digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Reintentar
        </button>
        <Link href="/" className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-slate-50">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
