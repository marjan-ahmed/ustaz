import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

export const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com'
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com'
      }
    ]
  }

};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);