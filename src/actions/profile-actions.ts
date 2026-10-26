"use server";

/**
 * Actualización del perfil. Doble autorización:
 * 1. getVerifiedUser() comprueba la sesión con Supabase Auth.
 * 2. La política RLS de la tabla solo permite modificar la fila propia
 *    (auth.uid() = id), aunque se manipulara la petición.
 * El id nunca se toma del formulario.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, profileSchema } from "@/lib/validation/auth-schemas";
import type { ActionState } from "@/types/action-state";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getVerifiedUser();
  if (!user) return { status: "error", message: "Tu sesión caducó. Vuelve a iniciar sesión." };

  const input = formDataToObject(formData, ["displayName"]);
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      fields: { displayName: input.displayName ?? "" },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.warn("[profile] actualización fallida", { code: error?.code });
    return { status: "error", message: "No se pudo guardar el perfil. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Perfil actualizado." };
}
