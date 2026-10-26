import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas privadas. Login y registro no se bloquean aquí para que los buscadores
      // puedan leer su etiqueta noindex (bloquearlas lo impediría).
      disallow: ["/dashboard", "/auth/", "/actualizar-password"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
