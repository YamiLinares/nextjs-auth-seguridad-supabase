/**
 * Variables de entorno PÚBLICAS (NEXT_PUBLIC_*). Ninguna es un secreto:
 * la URL y la clave publicable de Supabase están pensadas para usarse junto
 * con Row Level Security. Nunca se usa aquí una clave service_role/secret.
 */

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

type Source = Record<string, string | undefined>;

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

export function readSupabaseEnv(env: Source = process.env): SupabaseEnv {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new EnvError(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y complétalo.",
    );
  }
  if (publishableKey.startsWith("sb_secret_") || publishableKey.includes("service_role")) {
    throw new EnvError("La clave configurada es privilegiada. Usa solo la clave publicable (sb_publishable_...).");
  }
  return { url: new URL(url).origin, publishableKey };
}

/** URL pública del sitio (para enlaces de email y metadatos). */
export function getSiteUrl(env: Source = process.env): URL {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return new URL("http://localhost:3000");
}

export const isProduction = process.env.NODE_ENV === "production";
