"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/actions/auth-actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { IDLE_STATE } from "@/types/action-state";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, IDLE_STATE);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const email = state.status === "error" ? (state.fields?.email ?? "") : "";

  if (state.status === "success") {
    return <Alert variant="info">{state.message}</Alert>;
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
      <SubmitButton pendingLabel="Enviando…">Enviar enlace de recuperación</SubmitButton>
    </form>
  );
}
