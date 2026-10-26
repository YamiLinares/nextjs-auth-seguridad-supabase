"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/profile-actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { DISPLAY_NAME_MAX } from "@/lib/validation/auth-schemas";
import { IDLE_STATE } from "@/types/action-state";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction] = useActionState(updateProfileAction, IDLE_STATE);
  const value = state.status === "error" ? (state.fields?.displayName ?? displayName) : displayName;

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && <Alert variant="error">{state.message}</Alert>}
      {state.status === "success" && <Alert variant="success">{state.message}</Alert>}
      <Field
        name="displayName"
        label="Nombre visible"
        required
        maxLength={DISPLAY_NAME_MAX}
        defaultValue={value}
        key={value}
        autoComplete="nickname"
        errors={state.status === "error" ? state.fieldErrors?.displayName : undefined}
        hint="Se guarda en la tabla profiles, protegida con Row Level Security."
      />
      <SubmitButton pendingLabel="Guardando…" fullWidth={false}>
        Guardar perfil
      </SubmitButton>
    </form>
  );
}
