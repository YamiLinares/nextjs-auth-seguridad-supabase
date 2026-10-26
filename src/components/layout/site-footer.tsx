import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-semibold text-ink">SecureGate</span> · Proyecto académico de autenticación segura con Next.js y Supabase.
        </p>
        <nav aria-label="Pie de página" className="flex gap-4">
          <Link href="/" className="hover:text-ink">
            Inicio
          </Link>
          <a
            href="https://github.com/YamiLinares/nextjs-auth-seguridad-supabase"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            Código fuente
          </a>
        </nav>
      </div>
    </footer>
  );
}
