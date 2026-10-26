/**
 * Validación de destinos de redirección (evita redirecciones abiertas).
 * Solo se aceptan rutas internas de una lista permitida; cualquier otro
 * valor (URL absoluta, //dominio, rutas desconocidas) usa el destino por defecto.
 */

export const DEFAULT_AFTER_LOGIN = "/dashboard";

const ALLOWED_PREFIXES = ["/dashboard"] as const;

export function safeRedirectPath(value: unknown, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 200) return fallback;
  // Debe empezar por una sola barra: descarta "//evil.com", "/\evil.com" y URLs absolutas.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  let url: URL;
  try {
    url = new URL(value, "http://internal.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://internal.invalid") return fallback;

  const allowed = ALLOWED_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
  return allowed ? `${url.pathname}${url.search}` : fallback;
}
