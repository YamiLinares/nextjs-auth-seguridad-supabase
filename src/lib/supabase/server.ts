import "server-only";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Se crea uno nuevo en cada petición (nunca se comparte entre usuarios).
 * Las cookies se escriben siempre con la política endurecida (httpOnly, SameSite=Lax…).
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isProduction, readSupabaseEnv } from "@/lib/env";
import { hardenCookieOptions, sessionCookieBase } from "@/lib/security/cookies";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = readSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: sessionCookieBase(isProduction),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, hardenCookieOptions(options, isProduction));
          }
        } catch {
          // Los Server Components no pueden escribir cookies; la renovación
          // de la sesión la hace proxy.ts en cada petición.
        }
      },
    },
  });
}
