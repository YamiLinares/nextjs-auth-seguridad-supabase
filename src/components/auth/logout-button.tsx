import { signOutAction } from "@/actions/auth-actions";
import { LogOutIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Cierre de sesión por POST (Server Action), nunca por un enlace GET, para que
 * otro sitio no pueda cerrar la sesión del usuario con una simple imagen o enlace.
 */
export function LogoutButton({ scope = "local", compact = false }: { scope?: "local" | "global"; compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="scope" value={scope} />
      <SubmitButton
        variant={scope === "global" ? "danger" : "secondary"}
        fullWidth={!compact}
        pendingLabel="Cerrando sesión…"
      >
        <span className="inline-flex items-center gap-2">
          <LogOutIcon size={16} />
          {scope === "global" ? "Cerrar sesión en todos los dispositivos" : "Cerrar sesión"}
        </span>
      </SubmitButton>
    </form>
  );
}
