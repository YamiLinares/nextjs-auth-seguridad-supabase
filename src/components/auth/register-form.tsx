"use client";

import { useActionState, useState } from "react";
import { signUpAction } from "@/actions/auth-actions";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth-schemas";
import { IDLE_STATE } from "@/types/action-state";

export function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, IDLE_STATE);
  const [password, setPassword] = useState("");
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const email = state.status === "error" ? (state.fields?.email ?? "") : "";

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert variant="info">{state.message}</Alert>
        <p className="text-sm text-ink-muted">
          El enlace caduca en 24 horas. Si no lo ves, revisa la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && <Alert variant="error">{state.message}</Alert>}
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
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        errors={fieldErrors?.password}
        hint={<PasswordChecklist value={password} id="password-rules" />}
      />
      <Field
        name="confirmPassword"
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX}
        errors={fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingLabel="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
