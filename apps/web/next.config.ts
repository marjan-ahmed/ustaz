// import type { NextConfig } from "next";
// import createNextIntlPlugin from 'next-intl/plugin';
// const withNextIntl = createNextIntlPlugin();

// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development', // don't run PWA in dev
// });

// export const nextConfig: NextConfig = {
//   /* config options here */
//  allowedDevOrigins: [
//     '*.local-origin.dev',
//     'http://192.168.0.105:3000',
//     'http://localhost:3000',
//   ],
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'images.pexels.com'
//       },
//       {
//         protocol: 'https',
//         hostname: 'plus.unsplash.com'
//       },
//       {
//         protocol: 'https',
//         hostname: 'images.unsplash.com'
//       }
//     ]
//   }

// };

// export default withNextIntl(nextConfig);


import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // don't run PWA in dev
});

export const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '*.local-origin.dev',
    'http://192.168.0.105:3000',
    'http://localhost:3000',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com'
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  
  // Cleaned up Webpack ignore pattern
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      // Pass a clean array containing only valid glob strings
      ignored: ['**/node_modules/**', '**/supabase/**'],
    };
    return config;
  }
};

export default withNextIntl(withPWA(nextConfig));