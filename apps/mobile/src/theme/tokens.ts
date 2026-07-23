/**
 * Ustaz mobile design tokens — the single source of truth for the redesign.
 *
 * Screens must consume these instead of hardcoding hex/spacing. This kills the
 * pre-existing drift (three "navy" values, ad-hoc greys) called out in the audit.
 * Brand palette is authoritative per the root CLAUDE.md ("brand colors only").
 */
import { colors as brand } from '@ustaz/shared/theme';

// ---- Color ---------------------------------------------------------------
export const color = {
  // Brand (from CLAUDE.md — the only accent hues allowed)
  primary: brand.primary, // #DB4B0D
  primaryLight: brand.primaryLight, // #FF6B4A
  primaryDark: '#C24309', // pressed CTA (CLAUDE.md dark-hover)
  navy: brand.navyDeep, // #0F1729 — the ONE canonical navy (was drifting: 111828/1B1B27/0f1729)
  cream: brand.cream, // #FFF7ED
  creamAlt: brand.creamAlt, // #FEF3C7

  // Neutrals — text/borders only (permitted by CLAUDE.md)
  ink: '#0F1729', // primary text (= navy, single value)
  inkSoft: '#3A4256', // secondary text
  inkMuted: '#6B7280', // tertiary text
  line: '#ECECEF', // hairline borders
  surface: '#FFFFFF',
  surfaceAlt: '#FAF7F3', // warm off-white card fill
  scrim: 'rgba(15,23,41,0.55)', // navy-based modal scrim

  // Semantic (status only — defined once, not per-screen)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  successBg: '#ECFDF5',
  warningBg: '#FFFBEB',
  errorBg: '#FEF2F2',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// Signature gradients (expo-linear-gradient) — from the website's depth vocabulary.
export const gradient = {
  primary: ['#FF6B4A', '#DB4B0D'] as const, // CTAs / heroes
  primaryDeep: ['#DB4B0D', '#C24309'] as const,
  navy: ['#1A2440', '#0F1729'] as const, // dark hero surfaces
  navyOrange: ['#0F1729', '#DB4B0D'] as const, // duotone hero — both signature colors in one surface
  cream: ['#FFF7ED', '#FEF3C7'] as const,
} as const;

// Glass (expo-blur) presets
export const glass = {
  lightTint: 'rgba(255,255,255,0.16)',
  darkTint: 'rgba(15,23,41,0.24)',
  border: 'rgba(255,255,255,0.22)',
} as const;

// ---- Typography ----------------------------------------------------------
// ClashGrotesk = display/headings (matches website), Atkinson = body, Anton = big numbers.
export const font = {
  display: 'ClashGroteskBold',
  heading: 'ClashGroteskSemibold',
  headingMedium: 'ClashGroteskMedium',
  numeric: 'Anton', // large stat numbers only
  body: 'AtkinsonHyperlegible',
  urdu: 'Gulzar',
  arabic: 'IBMPlexSansArabic',
} as const;

// Type scale — 1.25 modular ratio, 16 base (mobile-typography.md: body >=16, <=7 sizes).
// Each entry: [fontSize, lineHeight]. Line-height >= 1.4 for body, 1.15-1.25 for display.
export const type = {
  display: { size: 40, line: 44, family: font.display },
  h1: { size: 32, line: 38, family: font.heading },
  h2: { size: 25, line: 31, family: font.heading },
  h3: { size: 20, line: 26, family: font.headingMedium },
  bodyLg: { size: 17, line: 26, family: font.body },
  body: { size: 16, line: 24, family: font.body },
  label: { size: 14, line: 20, family: font.body },
  caption: { size: 12, line: 16, family: font.body },
} as const;

// ---- Spacing (8pt grid) --------------------------------------------------
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ---- Radii ---------------------------------------------------------------
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  full: 999,
} as const;

// ---- Elevation (soft, brand-tinted — website uses low-alpha depth) -------
export const shadow = {
  sm: {
    shadowColor: color.navy,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  md: {
    shadowColor: color.navy,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  brand: {
    shadowColor: color.primary,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

// ---- Motion (micro-interactions.md: 150-300ms, ease-out entry) -----------
export const motion = {
  duration: { fast: 160, base: 240, slow: 360, ambient: 2400 },
  // Reanimated Easing bezier args (import Easing in components).
  easing: {
    out: [0.22, 1, 0.36, 1] as const, // entry — responsive, settles
    inOut: [0.65, 0, 0.35, 1] as const,
    spring: { damping: 16, stiffness: 180, mass: 0.9 },
  },
  pressScale: 0.97,
} as const;

// ---- Touch (touch-psychology.md) -----------------------------------------
export const touch = {
  minTarget: 48, // Android 48dp / iOS 44pt — use the larger
  gap: 8,
} as const;

export const tokens = {
  color,
  gradient,
  glass,
  font,
  type,
  space,
  radius,
  shadow,
  motion,
  touch,
} as const;

export default tokens;
