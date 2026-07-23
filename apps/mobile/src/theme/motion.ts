/**
 * Motion Tokens — centralized animation configuration.
 * Single source of truth for durations, easings, spring configs, and reduced-motion fallbacks.
 */
import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    instant: 80,
    fast: 150,
    base: 250,
    slow: 400,
    slower: 600,
    ambient: 4000,
    ambientSlow: 6000,
  },

  easing: {
    out: [0.25, 0.46, 0.45, 0.94] as const,
    inOut: [0.4, 0, 0.2, 1] as const,
    spring: { damping: 14, stiffness: 120, mass: 0.8 },
    springSoft: { damping: 18, stiffness: 100, mass: 1 },
    springBouncy: { damping: 10, stiffness: 180, mass: 0.6 },
    springSnappy: { damping: 12, stiffness: 200, mass: 0.5 },
    ease: Easing.inOut(Easing.cubic),
    easeOut: Easing.out(Easing.cubic),
    easeIn: Easing.in(Easing.cubic),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1.2),
  },

  stagger: {
    tight: 40,
    normal: 70,
    loose: 120,
    section: 200,
  },

  // Common transforms
  scale: {
    press: 0.96,
    hover: 1.02,
    active: 0.98,
  },

  // Parallax multipliers
  parallax: {
    subtle: 0.1,
    normal: 0.2,
    strong: 0.4,
  },

  // Blur/intensity for glass effects
  glass: {
    light: 20,
    medium: 40,
    heavy: 80,
  },

  // Opacity tokens
  opacity: {
    disabled: 0.4,
    overlay: 0.5,
    highlight: 0.08,
    shimmer: 0.65,
  },
} as const;

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
export type MotionStagger = keyof typeof motion.stagger;

export default motion;