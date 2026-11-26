import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CFP-PAS Gao - Portail Officiel',
    short_name: 'CFP-PAS',
    description: 'Portail numérique officiel du Centre de Formation Professionnelle Agro-Pastorale (CFP-PAS) de Gao (Mali).',
    start_url: '/',
    display: 'standalone',
    background_color: '#070F1E',
    theme_color: '#047857',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  };
}
