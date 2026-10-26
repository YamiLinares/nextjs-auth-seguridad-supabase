import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const heading = Plus_Jakarta_Sans({ variable: "--font-heading", subsets: ["latin"], display: "swap" });

const description =
  "SecureGate: demostración de autenticación segura con Next.js 16 y Supabase. Sesiones en cookies httpOnly, protección CSRF, CSP con nonce y rutas protegidas en el servidor.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "SecureGate — Autenticación segura con cookies httpOnly", template: "%s · SecureGate" },
  description,
  applicationName: "SecureGate",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "SecureGate",
    title: "SecureGate — Autenticación segura con cookies httpOnly",
    description,
  },
  twitter: { card: "summary", title: "SecureGate", description },
  formatDetection: { email: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070b1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
