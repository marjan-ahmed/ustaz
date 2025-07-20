import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

export const nextConfig: NextConfig = {
  /* config options here */
   images: {
    domains: ['images.pexels.com'],
  },

};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);