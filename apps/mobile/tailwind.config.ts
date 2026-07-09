// @ts-nocheck
import type { Config } from 'tailwindcss';
const nativewindPreset = require('nativewind/preset');
import { colors, radii, spacing } from '../../packages/shared/theme';

const config: Config = {
  presets: [nativewindPreset],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ustaz: colors,
      },
      borderRadius: {
        ustazSm: `${radii.sm}px`,
        ustazMd: `${radii.md}px`,
        ustazLg: `${radii.lg}px`,
        ustazXl: `${radii.xl}px`,
      },
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([key, value]) => [key, `${value}px`]),
      ),
      fontFamily: {
        heading: ['ClashGrotesk'],
        anton: ['Anton'],
        atkinson: ['AtkinsonHyperlegible'],
        urdu: ['Gulzar'],
        arabic: ['IBMPlexSansArabic'],
      },
    },
  },
  plugins: [],
};

export default config;