/**
 * PulseRadar — concentric rings expanding + fading from a center dot, staggered.
 * Used for "live"/"searching"/"en route" moments (tracking card, notification
 * bell, searching-for-provider state) instead of a plain spinner or static dot.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color } from '../../theme/tokens';

function Ring({ delay, size, ringColor, duration }: { delay: number; size: number; ringColor: string; duration: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.ease) }), -1, false));
    return () => cancelAnimation(p);
  }, [delay, duration, reduce, p]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.3 + p.value * 0.7 }],
    opacity: (1 - p.value) * 0.5,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: ringColor },
        style,
      ]}
    />
  );
}

export function PulseRadar({
  color: ringColor = color.primary,
  size = 60,
  ringCount = 3,
}: {
  color?: string;
  size?: number;
  ringCount?: number;
}) {
  const duration = 2400;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {Array.from({ length: ringCount }).map((_, i) => (
        <Ring key={i} delay={(duration / ringCount) * i} size={size} ringColor={ringColor} duration={duration} />
      ))}
      <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: ringColor }} />
    </View>
  );
}

export default PulseRadar;
