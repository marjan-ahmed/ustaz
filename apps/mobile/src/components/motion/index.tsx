/**
 * Motion primitives — thin Reanimated 4 wrappers used across the redesign.
 * All animate transform/opacity only (GPU-accelerated) per mobile-performance.md,
 * and respect the OS reduce-motion setting.
 */
import { PropsWithChildren, useEffect } from 'react';
import { AccessibilityInfo, Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../theme/tokens';

const EASE_OUT = Easing.bezier(motion.easing.out[0], motion.easing.out[1], motion.easing.out[2], motion.easing.out[3]);

/** Fade + rise on mount. Stagger via `delay`. */
export function FadeInUp({
  children,
  delay = 0,
  distance = 16,
  style,
}: PropsWithChildren<{ delay?: number; distance?: number; style?: ViewStyle }>) {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    p.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: EASE_OUT }));
  }, [delay, p, reduce]);

  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * distance }],
  }));

  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Wraps children so each direct child fades up in sequence. */
export function Stagger({
  children,
  step = 70,
  initialDelay = 0,
}: PropsWithChildren<{ step?: number; initialDelay?: number }>) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <>
      {items.map((child, i) => (
        <FadeInUp key={i} delay={initialDelay + i * step}>
          {child}
        </FadeInUp>
      ))}
    </>
  );
}

/** Gentle infinite bob — for floating badges/illustration accents. */
export function Bob({
  children,
  amplitude = 8,
  style,
}: PropsWithChildren<{ amplitude?: number; style?: ViewStyle }>) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: motion.duration.ambient / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: motion.duration.ambient / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(y);
  }, [amplitude, reduce, y]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Gentle rotational sway — for hanging/suspended visual elements. */
export function Sway({
  children,
  degrees = 3,
  duration = 2600,
  style,
}: PropsWithChildren<{ degrees?: number; duration?: number; style?: ViewStyle }>) {
  const reduce = useReducedMotion();
  const r = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    r.value = withRepeat(
      withSequence(
        withTiming(degrees, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-degrees, { duration: duration * 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(r);
  }, [degrees, duration, reduce, r]);

  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Slow combined x/y micro-parallax — for background illustration layers. */
export function Drift({
  children,
  distance = 10,
  duration = 4200,
  style,
}: PropsWithChildren<{ distance?: number; duration?: number; style?: ViewStyle }>) {
  const reduce = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    x.value = withRepeat(
      withSequence(
        withTiming(distance, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-distance, { duration: duration * 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(-distance * 0.6, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(distance * 0.6, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
    };
  }, [distance, duration, reduce, x, y]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that scales down on press — the core "premium" tactile response. */
export function PressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PropsWithChildren<PressableProps & { style?: ViewStyle | ViewStyle[] }>) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        if (!reduce) s.value = withSpring(motion.pressScale, motion.easing.spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, motion.easing.spring);
        onPressOut?.(e);
      }}
      style={[style as ViewStyle, a]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Imperative helper: has the user asked for reduced motion? (for one-off checks) */
export async function prefersReducedMotion() {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

export { OrbitRing } from './OrbitRing';
export { Marquee } from './Marquee';
export { PulseRadar } from './PulseRadar';
export { NumberTicker } from './NumberTicker';
export { TiltCard } from './TiltCard';
