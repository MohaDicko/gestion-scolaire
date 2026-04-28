import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'SchoolERP Pro — Gestion Scolaire',
  description: 'Solution ERP complète pour établissements scolaires : élèves, RH, finances, notes.',
  keywords: 'ERP scolaire, gestion école, notes, présences, paie, Mali',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#060b18" />
      </head>
      <body className="antialiased font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
