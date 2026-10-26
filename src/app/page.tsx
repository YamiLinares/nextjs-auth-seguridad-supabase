import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CodeIcon, CookieIcon, DatabaseIcon, LockIcon, ServerIcon, ShieldIcon } from "@/components/ui/icons";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const isPublicDomain = siteUrl.protocol === "https:";

export const metadata: Metadata = {
  title: { absolute: "SecureGate — Autenticación segura con cookies httpOnly" },
  // La URL canónica solo se declara cuando existe un dominio público HTTPS configurado.
  ...(isPublicDomain ? { alternates: { canonical: "/" } } : {}),
};

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <CookieIcon />,
    title: "Cookies httpOnly",
    text: "Los tokens de sesión viajan en cookies httpOnly, SameSite=Lax y Secure en producción. JavaScript no puede leerlos.",
  },
  {
    icon: <ServerIcon />,
    title: "Autorización en el servidor",
    text: "Cada página privada y cada Server Action verifica al usuario con Supabase Auth antes de responder.",
  },
  {
    icon: <ShieldIcon />,
    title: "Defensa contra CSRF",
    text: "Mutaciones solo por POST, comprobación de origen y cookies SameSite. Las redirecciones se limitan a rutas internas.",
  },
  {
    icon: <CodeIcon />,
    title: "Mitigación de XSS",
    text: "Content-Security-Policy con nonce por petición, sin inline scripts arbitrarios ni HTML sin escapar.",
  },
  {
    icon: <DatabaseIcon />,
    title: "Row Level Security",
    text: "Cada usuario solo puede leer y modificar su propio perfil gracias a las políticas RLS de PostgreSQL.",
  },
  {
    icon: <LockIcon />,
    title: "Contraseñas robustas",
    text: "Política de contraseña validada en el servidor, recuperación por correo y cierre de las demás sesiones al cambiarla.",
  },
];

export default function HomePage() {

  return (
    <>
      <section className="relative overflow-hidden bg-night-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-80 w-80 rounded-full bg-violet-accent/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Next.js 16 · Supabase Auth · Cookies httpOnly
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Tu cuenta, protegida{" "}
            <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">en el servidor</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">
            SecureGate muestra cómo construir un sistema de autenticación profesional: la sesión vive en cookies que
            JavaScript no puede leer y cada acceso a datos privados se verifica en el servidor.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="#capas" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold shadow-lg hover:bg-brand-500">
              Ver las capas de seguridad
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="capas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 id="capas" className="font-display text-3xl font-bold tracking-tight text-ink">
          Capas de seguridad implementadas
        </h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Ninguna medida es suficiente por sí sola. Estas capas se complementan para reducir el impacto de un ataque.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="flujo" className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="flujo" className="font-display text-3xl font-bold tracking-tight text-ink">
            Cómo fluye una sesión
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Formulario", "El navegador envía el formulario a una Server Action por POST."],
              ["2", "Servidor", "El servidor valida los datos y autentica con Supabase."],
              ["3", "Cookie httpOnly", "La sesión se guarda en cookies httpOnly; el navegador no puede leerlas."],
              ["4", "Verificación", "Cada petición renueva la sesión y las rutas privadas la verifican."],
            ].map(([step, title, text]) => (
              <li key={step} className="rounded-2xl bg-canvas p-5">
                <span className="font-display text-sm font-bold text-brand-600">Paso {step}</span>
                <h3 className="mt-1 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
