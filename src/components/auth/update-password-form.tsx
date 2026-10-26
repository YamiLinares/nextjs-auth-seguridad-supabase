"use client";

import { useActionState, useState } from "react";
import { updatePasswordAction } from "@/actions/auth-actions";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth-schemas";
import { IDLE_STATE } from "@/types/action-state";

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, IDLE_STATE);
  const [password, setPassword] = useState("");
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && <Alert variant="error">{state.message}</Alert>}
      <Field
        name="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        errors={fieldErrors?.password}
        hint={<PasswordChecklist value={password} id="new-password-rules" />}
      />
      <Field
        name="confirmPassword"
        label="Repite la nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        maxLength={PASSWORD_MAX}
        errors={fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingLabel="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
