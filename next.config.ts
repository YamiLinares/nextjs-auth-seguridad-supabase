import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad para todas las respuestas (incluidos los archivos
 * estáticos). La Content-Security-Policy con nonce la añade src/proxy.ts.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS: los navegadores lo ignoran sobre http://localhost y lo aplican en HTTPS (Vercel).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Todas las páginas leen la sesión (cookies) y usan un nonce de CSP por
  // petición, así que se renderizan dinámicamente; no se usan Cache Components.
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Las páginas de autenticación y privadas no deben indexarse.
        source: "/(dashboard|login|registro|recuperar-password|actualizar-password|auth)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
