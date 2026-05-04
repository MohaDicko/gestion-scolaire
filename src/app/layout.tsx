import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Metadata, Viewport } from "next";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta',
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={jakarta.variable} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
