import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, MailIcon } from "@/components/ui/icons";

type Variant = "error" | "success" | "info";

const STYLES: Record<Variant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-brand-100 bg-brand-50 text-brand-700",
};

const ICONS: Record<Variant, ReactNode> = {
  error: <AlertIcon size={18} />,
  success: <CheckIcon size={18} />,
  info: <MailIcon size={18} />,
};

/** Mensaje de estado accesible: los errores se anuncian de inmediato (role="alert"). */
export function Alert({ variant, children, id }: { variant: Variant; children: ReactNode; id?: string }) {
  return (
    <div
      id={id}
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${STYLES[variant]}`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[variant]}</span>
      <div>{children}</div>
    </div>
  );
}
