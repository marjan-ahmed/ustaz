/**
 * CircularGauge — animated circular progress ring (SVG strokeDashoffset).
 * Used for warranty countdown, verification step progress, provider-register
 * progress — anywhere a single static shape's stroke animation is cheap.
 */
import { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularGauge({
  size = 64,
  strokeWidth = 6,
  progress,
  color: fillColor,
  trackColor = '#ECECEF',
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [progress, p]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - p.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && <View style={{ position: 'absolute' }}>{children}</View>}
    </View>
  );
}

export default CircularGauge;
