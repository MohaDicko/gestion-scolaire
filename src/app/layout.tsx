import './globals.css';

export const metadata = {
  title: 'SchoolERP - 100% Vercel Edition',
  description: 'SaaS de gestion scolaire tout-en-un.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-theme="dark">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
