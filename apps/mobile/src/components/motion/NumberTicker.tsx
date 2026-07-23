/**
 * NumberTicker - count-up number animation for stats, wallet balance, etc.
 * Keep caller-provided formatters on the JS runtime; Reanimated worklets cannot
 * safely call arbitrary JS functions captured from component props.
 */
import { useCallback, useEffect, useState } from 'react';
import { TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function NumberTicker({
  value,
  duration = 900,
  formatter = (n: number) => Math.round(n).toString(),
  style,
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}) {
  const sv = useSharedValue(0);
  const [text, setText] = useState(() => formatter(0));
  const updateText = useCallback((nextValue: number) => {
    setText(formatter(nextValue));
  }, [formatter]);

  useEffect(() => {
    updateText(0);
    sv.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, sv, updateText]);

  useAnimatedReaction(
    () => sv.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        runOnJS(updateText)(currentValue);
      }
    },
    [updateText],
  );

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      pointerEvents="none"
      value={text}
      style={style}
    />
  );
}

export default NumberTicker;