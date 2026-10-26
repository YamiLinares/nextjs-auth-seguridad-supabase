import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthCard } from "@/components/ui/auth-card";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de SecureGate.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Te enviaremos un correo para confirmar tu dirección antes de activar la cuenta."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
