"use server";

/**
 * Server Actions de autenticación. Son una frontera de seguridad:
 * - Next.js solo las acepta por POST y compara Origin con Host (CSRF);
 *   proxy.ts añade además su propia comprobación de origen.
 * - Validan de nuevo todos los datos en el servidor (Zod).
 * - Nunca devuelven tokens ni contraseñas, ni registran contraseñas en logs.
 * - Las redirecciones solo van a rutas internas permitidas.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/dal";
import { authErrorMessage } from "@/lib/auth/errors";
import { getSiteUrl } from "@/lib/env";
import { safeRedirectPath } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  formDataToObject,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth-schemas";
import type { ActionState } from "@/types/action-state";

function validationError(error: z.ZodError, fields?: Record<string, string>): ActionState {
  return {
    status: "error",
    message: "Revisa los campos marcados.",
    fieldErrors: z.flattenError(error).fieldErrors,
    ...(fields ? { fields } : {}),
  };
}

function logAuthFailure(operation: string, error: { code?: string; status?: number; name?: string }) {
  // Solo metadatos del error: nunca correos, contraseñas ni tokens.
  console.warn(`[auth] ${operation} falló`, { code: error.code, status: error.status, name: error.name });
}

function confirmUrl(): string {
  return new URL("/auth/confirm", getSiteUrl()).toString();
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const input = formDataToObject(formData, ["email", "password", "confirmPassword"]);
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error, { email: input.email ?? "" });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: confirmUrl() },
  });

  if (error) {
    logAuthFailure("signUp", error);
    return { status: "error", message: authErrorMessage(error, "signUp"), fields: { email: parsed.data.email } };
  }

  // Si la confirmación de email está desactivada, Supabase ya crea la sesión.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard?bienvenida=1");
  }

  // Mensaje idéntico exista o no la cuenta (evita la enumeración de correos).
  return {
    status: "success",
    message: "Si el correo es válido, te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta.",
  };
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const input = formDataToObject(formData, ["email", "password", "next"]);
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error, { email: input.email ?? "" });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthFailure("signIn", error);
    return { status: "error", message: authErrorMessage(error, "signIn"), fields: { email: parsed.data.email } };
  }

  // Comprueba que la sesión recién creada es válida antes de redirigir.
  const { data: verified, error: verifyError } = await supabase.auth.getUser();
  if (verifyError || !verified.user) {
    return { status: "error", message: "No se pudo iniciar la sesión. Inténtalo de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(input.next));
}

export async function signOutAction(formData: FormData): Promise<void> {
  const scope = formData.get("scope") === "global" ? "global" : "local";
  const supabase = await createClient();
  // Revoca la sesión en Supabase y elimina las cookies (scope "global": todos los dispositivos).
  const { error } = await supabase.auth.signOut({ scope });
  if (error) logAuthFailure("signOut", error);
  revalidatePath("/", "layout");
  redirect("/login?sesion=cerrada");
}

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const input = formDataToObject(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error, { email: input.email ?? "" });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: confirmUrl() });
  if (error) {
    logAuthFailure("resetPassword", error);
    // Solo se informan errores que no revelan si la cuenta existe (límite de envíos, red).
    if (error.status === 429 || error.name === "AuthRetryableFetchError") {
      return { status: "error", message: authErrorMessage(error, "reset"), fields: { email: parsed.data.email } };
    }
  }

  return {
    status: "success",
    message: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña. Caduca en 1 hora.",
  };
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Autorización en el propio servidor: requiere una sesión verificada (p. ej. la del enlace de recuperación).
  const user = await getVerifiedUser();
  if (!user) {
    return { status: "error", message: "Tu enlace caducó o la sesión ya no es válida. Solicita uno nuevo." };
  }

  const parsed = updatePasswordSchema.safeParse(formDataToObject(formData, ["password", "confirmPassword"]));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logAuthFailure("updatePassword", error);
    return { status: "error", message: authErrorMessage(error, "updatePassword") };
  }

  // Cierra las demás sesiones abiertas con la contraseña anterior.
  await supabase.auth.signOut({ scope: "others" });
  revalidatePath("/", "layout");
  redirect("/dashboard?password=actualizada");
}
