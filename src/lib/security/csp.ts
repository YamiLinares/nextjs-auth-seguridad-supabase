/**
 * Content-Security-Policy con nonce por petición (patrón oficial de Next.js).
 * - Solo se ejecutan scripts propios con el nonce correcto ('strict-dynamic').
 * - Sin 'unsafe-inline' para scripts; 'unsafe-eval' solo en desarrollo (React lo usa para depurar).
 * - connect-src 'self': el navegador nunca habla directamente con Supabase.
 * - form-action 'self' impide enviar formularios a otros dominios.
 * - frame-ancestors 'none' impide incrustar la app en iframes (clickjacking).
 */
export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}
