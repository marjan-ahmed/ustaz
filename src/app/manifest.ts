import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ustaz',
    short_name: 'Ustaz',
    description: 'Book trusted electricians, plumbers, and carpenters in Pakistan with Ustaz',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/ustaz_logo_dark.png', sizes: '192x192', type: 'image/png' },
      { src: '/ustaz_logo_dark.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
