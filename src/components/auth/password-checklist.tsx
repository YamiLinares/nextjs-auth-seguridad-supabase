"use client";

import { CheckIcon } from "@/components/ui/icons";
import { PASSWORD_RULES } from "@/lib/validation/auth-schemas";

/** Política de contraseña visible y actualizada mientras se escribe (ayuda; el servidor valida). */
export function PasswordChecklist({ value, id }: { value: string; id: string }) {
  return (
    <ul id={id} className="grid gap-1 sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-700" : "text-ink-muted"}`}>
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${ok ? "bg-emerald-100" : "bg-slate-100"}`}
              aria-hidden="true"
            >
              {ok && <CheckIcon size={11} />}
            </span>
            {rule.label}
            <span className="sr-only">{ok ? "(cumplido)" : "(pendiente)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
