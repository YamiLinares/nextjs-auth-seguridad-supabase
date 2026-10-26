export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Cargando tu panel…</span>
      <div className="h-28 animate-pulse rounded-3xl bg-night-900/90" aria-hidden="true" />
      <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div className="h-64 animate-pulse rounded-3xl bg-white shadow-card" />
        <div className="h-64 animate-pulse rounded-3xl bg-white shadow-card lg:col-span-2" />
      </div>
    </div>
  );
}
