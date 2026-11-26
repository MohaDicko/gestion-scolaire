import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#070F1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CFP-PAS Gao • Portail Numérique Officiel",
  description: "Portail officiel de gestion académique, pédagogique, financière et administrative du Centre de Formation Professionnelle Agro-Pastorale (CFP-PAS) de Gao (Mali).",
  keywords: ["CFP-PAS", "Gao", "Agro-Pastorale", "Élevage", "Agriculture", "Formation Professionnelle", "Mali"],
  authors: [{ name: "Direction Générale CFP-PAS Gao" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CFP-PAS Gao",
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
    <html lang="fr" suppressHydrationWarning>
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
      <body className="antialiased font-sans text-[#051638] bg-[#F4F7FB] dark:bg-[#070F1E] dark:text-[#F1F5F9] selection:bg-sky-500 selection:text-white" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
