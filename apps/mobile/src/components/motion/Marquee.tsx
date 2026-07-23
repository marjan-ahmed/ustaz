/**
 * Marquee — infinite horizontal auto-scroll strip (duplicated content looped).
 * Used for trust tickers ("500+ verified pros - live tracking - ...") rather
 * than a static row of text.
 */
import { PropsWithChildren, useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function Marquee({
  children,
  speed = 40,
  gap = 24,
  reverse = false,
}: PropsWithChildren<{ speed?: number; gap?: number; reverse?: boolean }>) {
  const [unitWidth, setUnitWidth] = useState(0);
  const reduce = useReducedMotion();
  const x = useSharedValue(0);

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width + gap;
    if (w > gap && Math.abs(w - unitWidth) > 1) setUnitWidth(w);
  }

  useEffect(() => {
    if (reduce || unitWidth === 0) return;
    const duration = (unitWidth / speed) * 1000;
    x.value = reverse ? -unitWidth : 0;
    x.value = withRepeat(withTiming(reverse ? 0 : -unitWidth, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [unitWidth, reverse, speed, reduce, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={[{ flexDirection: 'row' }, style]}>
        <View style={{ flexDirection: 'row' }} onLayout={onLayout}>
          {children}
        </View>
        <View style={{ flexDirection: 'row', marginLeft: gap }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

export default Marquee;
