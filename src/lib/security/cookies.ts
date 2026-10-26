/**
 * Endurecimiento de las cookies de sesión de Supabase.
 *
 * @supabase/ssr escribe por defecto sus cookies con `httpOnly: false` (para
 * que el cliente del navegador pueda leerlas) y una duración fija de 400 días.
 * Esta aplicación no usa el cliente de Supabase en el navegador: toda la
 * autenticación pasa por Server Actions y Route Handlers. Por eso es seguro
 * forzar `httpOnly: true` y así JavaScript (incluido un posible XSS) no puede
 * leer los tokens.
 */
import type { CookieOptions } from "@supabase/ssr";

/** Duración de la cookie: 7 días sin actividad. Cada renovación la extiende. */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function sessionCookieBase(isProduction: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    // `secure` solo en producción: en http://localhost el navegador rechazaría la cookie.
    secure: isProduction,
  };
}

/** Aplica la política de seguridad a las opciones que propone @supabase/ssr. */
export function hardenCookieOptions(options: CookieOptions | undefined, isProduction: boolean): CookieOptions {
  const isRemoval = options?.maxAge === 0 || (options?.expires instanceof Date && options.expires.getTime() <= Date.now());
  return {
    ...options,
    ...sessionCookieBase(isProduction),
    maxAge: isRemoval ? 0 : SESSION_COOKIE_MAX_AGE,
  };
}
