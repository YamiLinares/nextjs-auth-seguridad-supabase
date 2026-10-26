import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AuthCard } from "@/components/ui/auth-card";

export const metadata: Metadata = {
  title: "Enlace no válido",
  robots: { index: false, follow: false },
};

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const { motivo } = await searchParams;
  const expired = motivo === "expirado";

  return (
    <div className="px-4 py-16">
      <AuthCard
        title={expired ? "El enlace caducó" : "Enlace no válido"}
        description="Los enlaces de confirmación y recuperación solo se pueden usar una vez y caducan por seguridad."
      >
        <div className="space-y-4">
          <Alert variant="error">
            {expired
              ? "Este enlace ya caducó. Solicita uno nuevo para continuar."
              : "No pudimos verificar este enlace. Puede que ya se haya usado o que esté incompleto."}
          </Alert>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/recuperar-password"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Solicitar nuevo enlace
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
