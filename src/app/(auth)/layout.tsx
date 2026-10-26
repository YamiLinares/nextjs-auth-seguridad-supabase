import type { Metadata } from "next";

// Las páginas de autenticación no deben aparecer en buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-[radial-gradient(ellipse_at_top,_var(--color-brand-50),_transparent_60%)] px-4 py-12 sm:py-16">
      {children}
    </div>
  );
}
