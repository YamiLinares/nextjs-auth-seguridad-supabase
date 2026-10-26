"use client";

// Client Component: useFormStatus necesita el estado del formulario en el navegador.
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 shadow-sm",
  secondary: "border border-line bg-white text-ink hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

interface SubmitButtonProps {
  children: ReactNode;
  pendingLabel: string;
  variant?: Variant;
  fullWidth?: boolean;
  name?: string;
  value?: string;
}

export function SubmitButton({ children, pendingLabel, variant = "primary", fullWidth = true, name, value }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 ${
        VARIANTS[variant]
      } ${fullWidth ? "w-full" : ""}`}
    >
      {pending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      )}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
