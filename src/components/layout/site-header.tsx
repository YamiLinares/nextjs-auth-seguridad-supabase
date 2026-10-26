import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { ShieldIcon } from "@/components/ui/icons";
import { getSessionUserId } from "@/lib/auth/dal";

/**
 * Navegación que cambia según la sesión. Es solo interfaz: la protección real
 * está en el servidor (proxy.ts, requireUser() y las Server Actions).
 */
export async function SiteHeader() {
  const userId = await getSessionUserId();

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
          {userId ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                Sesión activa
              </span>
              <Link href="/dashboard" className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 sm:px-3">
                Panel
              </Link>
              <div className="[&_button]:h-9 [&_button]:border-white/20 [&_button]:bg-transparent [&_button]:text-white [&_button]:hover:bg-white/10">
                <LogoutButton compact />
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 sm:px-3">
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 sm:px-3.5"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
