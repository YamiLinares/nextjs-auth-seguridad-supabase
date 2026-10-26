import "server-only";

/**
 * Capa de acceso a datos de autenticación (DAL).
 *
 * - getSessionUserId(): lectura rápida (getClaims valida la firma del JWT).
 *   Se usa solo para decidir qué mostrar en la navegación.
 * - getVerifiedUser(): getUser() consulta al servidor de Supabase Auth, por
 *   lo que detecta sesiones cerradas o revocadas. Es la ÚNICA base para
 *   entregar datos privados o autorizar operaciones.
 *
 * `cache` de React evita repetir la consulta dentro de una misma petición.
 */
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return !error && typeof data?.claims.sub === "string" ? data.claims.sub : null;
});

export const getVerifiedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

/** Para páginas privadas: redirige al login si no hay una sesión verificada. */
export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getVerifiedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
