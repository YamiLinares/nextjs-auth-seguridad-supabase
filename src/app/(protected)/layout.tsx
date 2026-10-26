import type { Metadata } from "next";

// Páginas privadas: nunca indexables. La autorización se comprueba en cada página.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</div>;
}
