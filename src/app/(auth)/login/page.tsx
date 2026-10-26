import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Alert } from "@/components/ui/alert";
import { AuthCard } from "@/components/ui/auth-card";
import { safeRedirectPath } from "@/lib/security/redirect";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de SecureGate.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = safeRedirectPath(rawNext);
  const loggedOut = params.sesion === "cerrada";
  const needsLogin = rawNext !== undefined && !loggedOut;

  return (
    <AuthCard
      title="Inicia sesión"
      description="Introduce tus credenciales para acceder a tu panel."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-600 hover:text-brand-700">
            Crear una cuenta
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {loggedOut && <Alert variant="success">Cerraste la sesión correctamente.</Alert>}
        {needsLogin && <Alert variant="info">Inicia sesión para acceder a esa página.</Alert>}
        <LoginForm next={next} />
      </div>
    </AuthCard>
  );
}
