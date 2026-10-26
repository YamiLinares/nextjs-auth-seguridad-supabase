import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

/** Solo la página pública de inicio: las páginas de autenticación y privadas no se listan. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", getSiteUrl()).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
