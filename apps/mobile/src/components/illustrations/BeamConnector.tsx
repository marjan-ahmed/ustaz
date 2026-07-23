/**
 * BeamConnector — a glowing dot that travels along a curved path between two
 * points, with the path itself drawn as a soft static stroke underneath.
 * Used to visualize a "you <-> provider" connection (tracking card, onboarding
 * "we find your pro" moment) instead of a flat static illustration.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color } from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Point = { x: number; y: number };

export function BeamConnector({
  from,
  to,
  width,
  height,
  color: beamColor = color.primary,
  dotSize = 7,
  duration = 2200,
}: {
  from: Point;
  to: Point;
  width: number;
  height: number;
  color?: string;
  dotSize?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);

  // Control point bows the curve upward from the straight line between from/to.
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const bow = Math.min(60, len * 0.3);
  const cx = midX - (dy / len) * bow;
  const cy = midY + (dx / len) * bow;

  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [reduce, duration, t]);

  const animatedProps = useAnimatedProps(() => {
    const p = reduce ? 0.5 : t.value;
    const bx = (1 - p) * (1 - p) * from.x + 2 * (1 - p) * p * cx + p * p * to.x;
    const by = (1 - p) * (1 - p) * from.y + 2 * (1 - p) * p * cy + p * p * to.y;
    return { cx: bx, cy: by };
  });

  return (
    <View style={{ position: 'absolute' }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Path
          d={`M${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
          stroke={beamColor}
          strokeWidth={1.5}
          strokeDasharray="4 6"
          opacity={0.25}
          fill="none"
        />
        <AnimatedCircle animatedProps={animatedProps} r={dotSize} fill={beamColor} opacity={0.9} />
        <AnimatedCircle animatedProps={animatedProps} r={dotSize * 2} fill={beamColor} opacity={0.18} />
      </Svg>
    </View>
  );
}

export default BeamConnector;
