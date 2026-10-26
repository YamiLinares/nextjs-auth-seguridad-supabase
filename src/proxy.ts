/**
 * Proxy (Next.js 16, antes "middleware"). Se ejecuta antes de cada página:
 * 1. Rechaza peticiones mutables de otro origen (CSRF).
 * 2. Genera un nonce y la cabecera Content-Security-Policy.
 * 3. Renueva la sesión de Supabase y mantiene las cookies actualizadas.
 * 4. Redirecciones preliminares: /dashboard sin sesión → /login, y
 *    /login o /registro con sesión → /dashboard.
 *
 * El proxy NO es la única barrera: cada página privada y cada Server Action
 * vuelve a verificar al usuario en el servidor (src/lib/auth/dal.ts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";
import { checkRequestOrigin } from "@/lib/security/origin";
import { safeRedirectPath } from "@/lib/security/redirect";
import { redirectPreservingSession, updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/dashboard"];
const GUEST_ONLY_PATHS = ["/login", "/registro"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const originCheck = checkRequestOrigin({
    method: request.method,
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });
  if (!originCheck.allowed) {
    return new NextResponse("Origen no permitido.", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const nonce = createNonce();
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const buildRequestHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", csp);
    return headers;
  };

  const session = await updateSession(request, buildRequestHeaders);
  const { pathname, search } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PREFIXES);
  const isGuestOnly = matches(pathname, GUEST_ONLY_PATHS);

  // En rutas que redirigen según la sesión se verifica con Supabase Auth: un
  // JWT de una sesión ya cerrada sigue siendo válido localmente hasta que caduca.
  const authenticated = isProtected || isGuestOnly ? await session.verifyUser() : session.userId !== null;

  let result: NextResponse = session.response();
  if (!authenticated && isProtected) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", safeRedirectPath(`${pathname}${search}`));
    result = redirectPreservingSession(login, result);
  } else if (authenticated && isGuestOnly) {
    result = redirectPreservingSession(new URL(safeRedirectPath(request.nextUrl.searchParams.get("next")), request.url), result);
  }

  result.headers.set("Content-Security-Policy", csp);
  if (isProtected || authenticated) {
    // Respuestas con datos de un usuario: nunca en cachés compartidas.
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return result;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
