/**
 * ShineText — a light glare band that periodically sweeps across text.
 * Deliberately avoids @react-native-masked-view/masked-view (not installed,
 * would force a native rebuild) — implemented as a translated gradient strip
 * clipped by an overflow:hidden wrapper sized to the text, not true masked
 * gradient-fill text. Use sparingly: once per screen, on a hero headline
 * or key number, never as a default text style.
 */
import { PropsWithChildren, useEffect, useState } from 'react';
import { Text as RNText, View, type StyleProp, type TextStyle, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export function ShineText({
  children,
  style,
  duration = 1400,
  pause = 2200,
}: PropsWithChildren<{ style?: StyleProp<TextStyle>; duration?: number; pause?: number }>) {
  const [w, setW] = useState(0);
  const reduce = useReducedMotion();
  const x = useSharedValue(-1);

  function onLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - w) > 1) setW(width);
  }

  useEffect(() => {
    if (reduce || w === 0) return;
    x.value = -1;
    x.value = withDelay(pause, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, false));
    return () => cancelAnimation(x);
  }, [reduce, w, duration, pause, x]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * w }],
  }));

  return (
    <View style={{ alignSelf: 'flex-start', position: 'relative' }} onLayout={onLayout}>
      <RNText style={style}>{children}</RNText>
      {w > 0 && (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, width: Math.max(24, w * 0.4) }, shineStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

export default ShineText;
