"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/actions/auth-actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { IDLE_STATE } from "@/types/action-state";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, IDLE_STATE);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const email = state.status === "error" ? (state.fields?.email ?? "") : "";

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && <Alert variant="error">{state.message}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        defaultValue={email}
        key={`email-${email}`}
        errors={fieldErrors?.email}
      />
      <Field
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        maxLength={288}
        errors={fieldErrors?.password}
      />
      <div className="flex justify-end">
        <Link href="/recuperar-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <SubmitButton pendingLabel="Verificando…">Iniciar sesión</SubmitButton>
    </form>
  );
}
