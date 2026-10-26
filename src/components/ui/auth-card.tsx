import type { ReactNode } from "react";
import { ShieldIcon } from "@/components/ui/icons";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldIcon size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>}
    </div>
  );
}
