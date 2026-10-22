import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin"],
  variable: '--font-sans',
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-fiori',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SchoolERP Pro | Excellence en Gestion Scolaire",
  description: "Plateforme ERP premium pour la gestion des établissements scolaires : Académique, Finance, RH et Stock.",
  keywords: ["ERP scolaire", "gestion école", "logiciel éducation", "portail parent", "paie mali"],
  authors: [{ name: "SchoolERP Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SchoolERP Pro",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-512x512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", manrope.variable, inter.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
