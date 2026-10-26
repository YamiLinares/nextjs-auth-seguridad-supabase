/**
 * Renovación y verificación de la sesión desde proxy.ts (Next.js 16).
 *
 * - getClaims() valida la firma del JWT y, si el token de acceso caducó, lo
 *   renueva con el refresh token (rotación). Es rápido y se usa en cada petición.
 * - verifyUser() llama a getUser(), que consulta a Supabase Auth y detecta
 *   sesiones cerradas o revocadas (un JWT firmado sigue siendo válido
 *   localmente hasta que caduca). Si la sesión ya no existe, borra las cookies.
 *
 * Las cookies nuevas se escriben tanto en la petición (para que la página las
 * vea) como en la respuesta (para el navegador).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProduction, readSupabaseEnv } from "@/lib/env";
import { hardenCookieOptions, sessionCookieBase } from "@/lib/security/cookies";
import type { Database } from "@/types/database";

const AUTH_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;

export interface ProxySession {
  /** Usuario según el JWT (validación local de firma). */
  userId: string | null;
  /** Confirma con Supabase Auth que la sesión sigue activa; si no, elimina las cookies. */
  verifyUser: () => Promise<boolean>;
  /** Respuesta con las cookies y cabeceras de sesión actualizadas. */
  response: () => NextResponse;
}

/**
 * @param buildRequestHeaders crea las cabeceras que verá la página (p. ej. el nonce de CSP).
 *   Se invoca de nuevo si cambian las cookies, para incluir las renovadas.
 */
export async function updateSession(request: NextRequest, buildRequestHeaders: () => Headers): Promise<ProxySession> {
  const { url, publishableKey } = readSupabaseEnv();
  let response = NextResponse.next({ request: { headers: buildRequestHeaders() } });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: sessionCookieBase(isProduction),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: buildRequestHeaders() } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, hardenCookieOptions(options, isProduction));
        }
        // Cabeceras anti-caché que envía la librería al escribir cookies de sesión.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // No debe haber código entre la creación del cliente y getClaims().
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && typeof data?.claims.sub === "string" ? data.claims.sub : null;

  const clearAuthCookies = () => {
    const names = request.cookies.getAll().map((cookie) => cookie.name).filter((name) => AUTH_COOKIE.test(name));
    for (const name of names) request.cookies.delete(name);
    response = NextResponse.next({ request: { headers: buildRequestHeaders() } });
    for (const name of names) response.cookies.set(name, "", hardenCookieOptions({ maxAge: 0 }, isProduction));
  };

  return {
    userId,
    response: () => response,
    async verifyUser() {
      if (!userId) return false;
      const { data: verified, error: verifyError } = await supabase.auth.getUser();
      if (!verifyError && verified.user) return true;
      clearAuthCookies();
      return false;
    },
  };
}

/** Redirección que conserva las cookies y cabeceras de la respuesta de sesión. */
export function redirectPreservingSession(target: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}
