/**
 * OrbitRing — positions icons on a circular path that continuously rotates
 * around a center. Used to make hero illustrations feel alive (e.g. service
 * icons orbiting IsoServiceScene) instead of one static centered graphic.
 */
import { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

function OrbitItem({
  angle,
  angleOffset,
  radius,
  reverse,
  itemSize,
  icon,
}: {
  angle: SharedValue<number>;
  angleOffset: number;
  radius: number;
  reverse: boolean;
  itemSize: number;
  icon: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const a = (reverse ? -angle.value : angle.value) + angleOffset;
    return {
      transform: [{ translateX: radius * Math.cos(a) }, { translateY: radius * Math.sin(a) }],
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: '50%', left: '50%', marginLeft: -itemSize / 2, marginTop: -itemSize / 2 },
        style,
      ]}
    >
      {icon}
    </Animated.View>
  );
}

export function OrbitRing({
  size,
  radius,
  duration = 14000,
  reverse = false,
  itemSize = 36,
  items,
}: {
  size: number;
  radius: number;
  duration?: number;
  reverse?: boolean;
  itemSize?: number;
  items: { icon: ReactNode; angleOffset: number }[];
}) {
  const reduce = useReducedMotion();
  const angle = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    angle.value = withRepeat(withTiming(Math.PI * 2, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(angle);
  }, [duration, reduce, angle]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {items.map((item, i) => (
        <OrbitItem
          key={i}
          angle={angle}
          angleOffset={item.angleOffset}
          radius={radius}
          reverse={reverse}
          itemSize={itemSize}
          icon={item.icon}
        />
      ))}
    </View>
  );
}

export default OrbitRing;
