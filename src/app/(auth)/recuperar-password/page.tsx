import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Alert } from "@/components/ui/alert";
import { AuthCard } from "@/components/ui/auth-card";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita un enlace para restablecer tu contraseña.",
};

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/recuperar-password">) {
  const { motivo } = await searchParams;

  return (
    <AuthCard
      title="Recupera tu contraseña"
      description="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva."
      footer={
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Volver a iniciar sesión
        </Link>
      }
    >
      <div className="space-y-4">
        {motivo === "enlace" && (
          <Alert variant="error">El enlace de recuperación caducó o ya se usó. Solicita uno nuevo.</Alert>
        )}
        <ForgotPasswordForm />
      </div>
    </AuthCard>
  );
}
