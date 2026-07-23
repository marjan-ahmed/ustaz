/**
 * BorderBeam — an animated light that travels around a card's border.
 * Built via a rotating gradient layer behind an inset content slot (the
 * child's own opaque background covers the center, leaving only a thin ring
 * where the rotating gradient shows through) — transform-only, GPU-cheap,
 * no animated SVG stroke and no masked-view dependency.
 */
import { PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { color } from '../../theme/tokens';

export function BorderBeam({
  children,
  width,
  height,
  borderRadius = 20,
  colors = [color.primary, color.primaryLight, color.navy, color.primary] as const,
  duration = 3000,
  active = true,
  strokeWidth = 2,
}: PropsWithChildren<{
  width: number;
  height: number;
  borderRadius?: number;
  colors?: readonly [string, string, ...string[]];
  duration?: number;
  active?: boolean;
  strokeWidth?: number;
}>) {
  const reduce = useReducedMotion();
  const rotate = useSharedValue(0);
  const diag = Math.sqrt(width * width + height * height) * 1.4;

  useEffect(() => {
    if (!active || reduce) return;
    rotate.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rotate);
  }, [active, reduce, duration, rotate]);

  const gradientStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
      {active && (
        <Animated.View
          style={[
            { position: 'absolute', width: diag, height: diag, top: (height - diag) / 2, left: (width - diag) / 2 },
            gradientStyle,
          ]}
        >
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        </Animated.View>
      )}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth, left: strokeWidth, right: strokeWidth, bottom: strokeWidth,
          borderRadius: Math.max(0, borderRadius - strokeWidth),
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default BorderBeam;
