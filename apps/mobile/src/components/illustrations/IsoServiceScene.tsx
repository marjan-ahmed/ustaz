/**
 * IsoServiceScene — the redesign's signature illustration.
 *
 * A hand-authored isometric "service world": a raised brand platform, a phone
 * showing a live location pin (the core Ustaz promise: a tracked pro on the way),
 * and floating tool badges. Vector (react-native-svg) so it's crisp at any size,
 * KB-sized, and animatable. Mirrors the website hero's isometric language.
 *
 * `variant` swaps the floating badge icons/colors and (for wallet/celebration)
 * the phone-screen content, so the same base geometry reads as a different
 * moment per screen instead of one flat illustration reused everywhere.
 *
 * Floating accents bob via Reanimated; honours reduce-motion.
 */
import Svg, { Circle, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { useEffect } from 'react';
import { View } from 'react-native';
import { color } from '../../theme/tokens';

export type SceneVariant =
  | 'general' | 'tracking'
  | 'electrician' | 'plumber' | 'carpenter' | 'ac' | 'solar'
  | 'wallet' | 'celebration';

function useBob(amplitude: number, delay = 0) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-amplitude, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(y);
  }, [amplitude, delay, reduce, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

/** Icon glyphs — simple hand-drawn strokes/paths centered in a ~44x44 box. */
function badgeIcon(kind: string, tint: string) {
  switch (kind) {
    case 'bolt':
      return <Path d="M24 10 L15 24 L21 24 L19 34 L29 19 L23 19 Z" fill={tint} />;
    case 'wrench':
      return <Path d="M28 15 a6 6 0 0 0 -8 7 l-6 6 3 3 6-6 a6 6 0 0 0 7-8 l-3 3 -2-2 z" fill={tint} />;
    case 'drop':
      return <Path d="M22 8 C22 8 12 21 12 28 a10 10 0 0 0 20 0 C32 21 22 8 22 8 Z" fill={tint} />;
    case 'hammer':
      return (
        <>
          <Path d="M14 30 L24 20" stroke={tint} strokeWidth={4} strokeLinecap="round" />
          <Path d="M20 12 L32 24 L27 29 L15 17 Z" fill={tint} />
        </>
      );
    case 'snow':
      return (
        <>
          <Path d="M22 10 L22 34 M12 15 L32 29 M32 15 L12 29" stroke={tint} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case 'sun':
      return (
        <>
          <Circle cx="22" cy="22" r="7" fill={tint} />
          <Path d="M22 6 L22 11 M22 33 L22 38 M6 22 L11 22 M33 22 L38 22 M11 11 L14.5 14.5 M29.5 29.5 L33 33 M33 11 L29.5 14.5 M14.5 29.5 L11 33" stroke={tint} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case 'check':
      return <Path d="M13 23 L19 29 L31 14" stroke={tint} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    case 'coin':
      return (
        <>
          <Circle cx="22" cy="22" r="10" fill="none" stroke={tint} strokeWidth={2.6} />
          <Path d="M22 16 L22 28 M18.5 19 a4 3.4 0 0 1 7 0 M18.5 25 a4 3.4 0 0 0 7 0" stroke={tint} strokeWidth={2} strokeLinecap="round" fill="none" />
        </>
      );
    case 'star':
      return <Path d="M22 8 L25.5 18 L36 18 L27.5 24.5 L30.5 35 L22 28.5 L13.5 35 L16.5 24.5 L8 18 L18.5 18 Z" fill={tint} />;
    default:
      return <Path d="M28 15 a6 6 0 0 0 -8 7 l-6 6 3 3 6-6 a6 6 0 0 0 7-8 l-3 3 -2-2 z" fill={tint} />;
  }
}

const VARIANT_BADGES: Record<SceneVariant, { a: string; b: string }> = {
  general: { a: 'wrench', b: 'bolt' },
  tracking: { a: 'wrench', b: 'bolt' },
  electrician: { a: 'bolt', b: 'wrench' },
  plumber: { a: 'drop', b: 'wrench' },
  carpenter: { a: 'hammer', b: 'wrench' },
  ac: { a: 'snow', b: 'bolt' },
  solar: { a: 'sun', b: 'bolt' },
  wallet: { a: 'coin', b: 'check' },
  celebration: { a: 'check', b: 'star' },
};

export function IsoServiceScene({ size = 260, variant = 'general' }: { size?: number; variant?: SceneVariant }) {
  const badgeA = useBob(6, 0);
  const badgeB = useBob(7, 400);
  const pin = useBob(5, 200);
  const badges = VARIANT_BADGES[variant] ?? VARIANT_BADGES.general;
  const isCelebratory = variant === 'wallet' || variant === 'celebration';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Static isometric base + phone */}
      <Svg width={size} height={size} viewBox="0 0 260 260">
        <LinearGradient id="plat" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A2440" />
          <Stop offset="1" stopColor="#0F1729" />
        </LinearGradient>
        <LinearGradient id="platSide" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1120" />
          <Stop offset="1" stopColor="#070D1A" />
        </LinearGradient>
        <LinearGradient id="phone" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A2440" />
          <Stop offset="1" stopColor="#0F1729" />
        </LinearGradient>

        {/* soft ground shadow */}
        <Ellipse cx="130" cy="212" rx="96" ry="26" fill={color.navy} opacity={0.08} />

        {/* isometric platform: top diamond + two sides for depth */}
        <Path d="M130 120 L214 162 L130 204 L46 162 Z" fill="url(#plat)" />
        <Path d="M46 162 L130 204 L130 232 L46 190 Z" fill="url(#platSide)" />
        <Path d="M214 162 L130 204 L130 232 L214 190 Z" fill="#0B1120" />

        {/* phone standing on platform (isometric) */}
        <G>
          <Path d="M110 70 L150 92 L150 150 L110 128 Z" fill="url(#phone)" />
          <Path d="M150 92 L164 84 L164 142 L150 150 Z" fill="#0B1120" />
          {/* screen */}
          <Path d="M114 78 L146 96 L146 142 L114 124 Z" fill="#FFF7ED" />
          {isCelebratory ? (
            /* celebratory screen glyph: checkmark or coin, instead of route lines */
            variant === 'wallet' ? (
              <>
                <Circle cx="130" cy="108" r="10" fill="none" stroke={color.primary} strokeWidth={2.4} />
                <Path d="M130 102 L130 114" stroke={color.primary} strokeWidth={2.2} strokeLinecap="round" />
              </>
            ) : (
              <Path d="M120 108 L128 116 L140 100" stroke={color.success} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )
          ) : (
            <>
              {/* map lines on screen */}
              <Path d="M118 96 L140 108" stroke="#FF6B4A" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
              <Path d="M118 108 L134 117" stroke="#DB4B0D" strokeWidth={2.4} strokeLinecap="round" />
            </>
          )}
        </G>
      </Svg>

      {/* Animated live pin above the phone (skip for celebration — badges carry the moment) */}
      {variant !== 'celebration' && (
        <Animated.View style={[{ position: 'absolute', top: size * 0.16, left: size * 0.46 }, pin]}>
          <Svg width={38} height={44} viewBox="0 0 38 44">
            <Path d="M19 2 C10 2 3 9 3 18 C3 30 19 42 19 42 C19 42 35 30 35 18 C35 9 28 2 19 2 Z" fill={color.primary} />
            <Circle cx="19" cy="17" r="6.5" fill="#FFF7ED" />
          </Svg>
        </Animated.View>
      )}

      {/* Floating tool badges (depth accents) — icon/tint driven by variant */}
      <Animated.View style={[{ position: 'absolute', top: size * 0.3, left: size * 0.05 }, badgeA]}>
        <Svg width={46} height={46} viewBox="0 0 46 46">
          <Circle cx="23" cy="23" r="21" fill={color.white} />
          <Circle cx="23" cy="23" r="21" fill={color.primary} opacity={0.08} />
          {badgeIcon(badges.a, color.primary)}
        </Svg>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', top: size * 0.5, right: size * 0.04 }, badgeB]}>
        <Svg width={44} height={44} viewBox="0 0 44 44">
          <Circle cx="22" cy="22" r="20" fill={color.navy} />
          {badgeIcon(badges.b, color.primaryLight)}
        </Svg>
      </Animated.View>
    </View>
  );
}

export default IsoServiceScene;
