import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: {
    default: 'SchoolERP Pro — Gestion Scolaire Intégrée',
    template: '%s | SchoolERP Pro'
  },
  description: 'Logiciel de gestion scolaire premium pour établissements maliens. Gestion des élèves, notes, paie, et finance en un seul lieu.',
  keywords: ['école', 'gestion scolaire', 'Mali', 'ERP', 'bulletin de notes', 'logiciel éducation'],
  robots: 'index, follow',
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
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
