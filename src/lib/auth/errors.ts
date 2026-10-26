/**
 * Traduce errores de Supabase Auth a mensajes seguros en español.
 * No se devuelven mensajes internos del proveedor ni datos que permitan
 * saber si un correo está registrado (enumeración de cuentas).
 */
import { isAuthApiError, isAuthRetryableFetchError, isAuthWeakPasswordError, type AuthError } from "@supabase/supabase-js";

export type AuthOperation = "signIn" | "signUp" | "reset" | "updatePassword" | "verify";

const GENERIC: Record<AuthOperation, string> = {
  signIn: "Correo o contraseña incorrectos.",
  signUp: "No pudimos completar el registro. Inténtalo de nuevo.",
  reset: "No pudimos procesar la solicitud. Inténtalo de nuevo.",
  updatePassword: "No pudimos actualizar la contraseña. Inténtalo de nuevo.",
  verify: "El enlace no es válido o ya caducó.",
};

export function authErrorMessage(error: AuthError | Error, operation: AuthOperation): string {
  if (isAuthRetryableFetchError(error)) {
    return "No se pudo conectar con el servicio de autenticación. Revisa tu conexión e inténtalo de nuevo.";
  }
  if (isAuthWeakPasswordError(error)) {
    return "La contraseña es demasiado débil o aparece en filtraciones conocidas. Elige otra.";
  }
  if (isAuthApiError(error)) {
    switch (error.code) {
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
      case "email_not_confirmed":
        // Solo se obtiene con la contraseña correcta, por lo que no revela cuentas a terceros.
        return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
      case "same_password":
        return "La nueva contraseña debe ser distinta de la anterior.";
      case "otp_expired":
        return GENERIC.verify;
      case "signup_disabled":
        return "El registro de nuevas cuentas está desactivado.";
      default:
        break;
    }
  }
  return GENERIC[operation];
}
