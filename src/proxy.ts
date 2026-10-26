/**
 * Proxy (Next.js 16, antes "middleware"): renueva la sesión de Supabase en
 * cada petición y mantiene actualizadas las cookies httpOnly.
 */
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const session = await updateSession(request, () => new Headers(request.headers));
  return session.response();
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
