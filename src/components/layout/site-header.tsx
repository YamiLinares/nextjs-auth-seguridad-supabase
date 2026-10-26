import Link from "next/link";
import { ShieldIcon } from "@/components/ui/icons";

/** Encabezado del sitio. */
export function SiteHeader() {

  return (
    <header className="border-b border-white/10 bg-night-950 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SecureGate, ir al inicio">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-accent">
            <ShieldIcon size={20} />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight min-[380px]:inline">SecureGate</span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-2">
          <Link href="/#capas" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10">
            Seguridad
          </Link>
        </nav>
      </div>
    </header>
  );
}
