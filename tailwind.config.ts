// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // This is where you'd extend your fonts based on your CSS variables
      fontFamily: {
        'urdu': ['var(--font-urdu)', 'serif'],
        'arabic': ['var(--font-arabic)', 'serif'],
        'atkinson': ['var(--font-atkinson)', 'sans-serif'],
        'anton': ['var(--font-anton)', 'sans-serif'],
        'geist-sans': ['var(--font-geist-sans)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
      // ... other theme extensions
    },
  },
  plugins: [
    // require('@tailwindcss/typography'), // Example plugin
  ],
};
export default config;