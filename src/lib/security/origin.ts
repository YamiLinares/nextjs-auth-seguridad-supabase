/**
 * Defensa CSRF adicional para peticiones que cambian el estado.
 *
 * Next.js ya rechaza Server Actions cuyo Origin no coincide con el Host; esta
 * comprobación se aplica en proxy.ts a TODA petición mutable (también a
 * Route Handlers) antes de que llegue a la aplicación.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface OriginCheckInput {
  method: string;
  origin: string | null;
  secFetchSite: string | null;
  /** Host público de la petición (x-forwarded-host o host). */
  host: string | null;
}

export type OriginCheckResult = { allowed: true } | { allowed: false; reason: string };

export function checkRequestOrigin({ method, origin, secFetchSite, host }: OriginCheckInput): OriginCheckResult {
  if (SAFE_METHODS.has(method.toUpperCase())) return { allowed: true };

  // Los navegadores modernos envían Sec-Fetch-Site: si dice cross-site, se rechaza.
  if (secFetchSite === "cross-site") return { allowed: false, reason: "cross-site" };

  if (origin !== null) {
    if (origin === "null") return { allowed: false, reason: "origin-null" };
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return { allowed: false, reason: "origin-invalido" };
    }
    if (!host || originHost !== host) return { allowed: false, reason: "origin-distinto" };
  }

  // Sin Origin ni Sec-Fetch-Site: no es un navegador (p. ej. curl), así que no
  // puede transportar las cookies de una víctima. Las demás capas siguen aplicando.
  return { allowed: true };
}
