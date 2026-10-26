import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name"> {
  name: string;
  label: string;
  errors?: string[] | undefined;
  hint?: ReactNode;
}

/** Campo con etiqueta asociada y errores enlazados por aria-describedby. */
export function Field({ name, label, errors, hint, ...props }: FieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = Boolean(errors?.length);
  const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={`block h-11 w-full rounded-xl border bg-white px-3.5 text-ink shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 ${
          hasError ? "border-red-400" : "border-line hover:border-slate-300"
        }`}
        {...props}
      />
      {hint && (
        <div id={hintId} className="text-xs text-ink-muted">
          {hint}
        </div>
      )}
      {hasError && (
        <ul id={errorId} className="space-y-0.5 text-sm text-red-700">
          {errors?.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
