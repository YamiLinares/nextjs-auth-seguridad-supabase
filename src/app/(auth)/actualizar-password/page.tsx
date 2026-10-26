import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { AuthCard } from "@/components/ui/auth-card";
import { getVerifiedUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Crea una contraseña nueva para tu cuenta.",
};

/**
 * Solo accesible con una sesión verificada: la que crea el enlace de
 * recuperación (/auth/confirm?type=recovery) o una sesión normal.
 */
export default async function UpdatePasswordPage() {
  const user = await getVerifiedUser();
  if (!user) redirect("/recuperar-password?motivo=enlace");

  return (
    <AuthCard
      title="Crea una contraseña nueva"
      description="Al guardarla, se cerrarán las demás sesiones abiertas de tu cuenta."
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
