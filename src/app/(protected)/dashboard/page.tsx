import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Alert } from "@/components/ui/alert";
import { CheckIcon, CookieIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel",
};

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" });
const formatDate = (iso: string | null | undefined) => (iso ? dateFormat.format(new Date(iso)) : "—");

/**
 * Página privada. requireUser() verifica la sesión con Supabase Auth (getUser)
 * ANTES de leer datos; el proxy solo hace una comprobación preliminar.
 * Se renderiza en cada petición (lee cookies) y se envía con Cache-Control privado.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "";
  const provider = typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : "email";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {params.verificado === "1" && <Alert variant="success">Tu correo quedó verificado. ¡Bienvenido!</Alert>}
        {params.bienvenida === "1" && <Alert variant="success">Cuenta creada correctamente.</Alert>}
        {params.password === "actualizada" && (
          <Alert variant="success">Contraseña actualizada. Se cerraron las demás sesiones abiertas.</Alert>
        )}
      </div>

      <header className="flex flex-col gap-4 rounded-3xl bg-night-950 p-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-accent">
            <UserIcon size={26} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white/60">Sesión verificada en el servidor</p>
            <h1 className="truncate font-display text-2xl font-bold">{displayName || "Tu panel"}</h1>
            <p className="truncate text-sm text-white/80">{user.email}</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Autenticado
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Tu cuenta" icon={<UserIcon size={18} />}>
          <dl className="space-y-3 text-sm">
            <Item label="Correo">{user.email}</Item>
            <Item label="Correo confirmado">{user.email_confirmed_at ? formatDate(user.email_confirmed_at) : "Pendiente"}</Item>
            <Item label="Cuenta creada">{formatDate(user.created_at)}</Item>
            <Item label="Último acceso">{formatDate(user.last_sign_in_at)}</Item>
            <Item label="Método">{provider === "email" ? "Correo y contraseña" : provider}</Item>
          </dl>
        </Panel>

        <Panel title="Perfil" icon={<ShieldIcon size={18} />} className="lg:col-span-2">
          <ProfileForm displayName={displayName} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Protección de esta sesión" icon={<CookieIcon size={18} />}>
          <ul className="space-y-2.5 text-sm text-ink-muted">
            {[
              "La sesión se guarda en cookies httpOnly: el JavaScript de la página no puede leerla.",
              "Las cookies usan SameSite=Lax y, en producción, el atributo Secure (solo HTTPS).",
              "Cada petición renueva la sesión en el servidor y los tokens rotan al caducar.",
              "Esta página verificó tu identidad con Supabase Auth antes de mostrar estos datos.",
              "Las respuestas privadas se envían con Cache-Control: private, no-store.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckIcon size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sesiones" icon={<ShieldIcon size={18} />}>
          <p className="text-sm text-ink-muted">
            Cerrar sesión revoca la sesión en Supabase y elimina las cookies. Si sospechas de un acceso no autorizado, cierra
            todas las sesiones de tu cuenta.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <LogoutButton />
            <LogoutButton scope="global" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, children, className = "" }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-white p-6 shadow-card ${className}`}>
      <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="text-brand-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="break-words font-medium text-ink">{children}</dd>
    </div>
  );
}
