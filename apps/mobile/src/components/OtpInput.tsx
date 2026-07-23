import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { color, font, radius } from '@/theme/tokens';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  autoFocus?: boolean;
  error?: boolean;
}

export default function OtpInput({ length = 6, value, onChange, onComplete, autoFocus = true, error = false }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Cursor blink
  useEffect(() => {
    if (!focused || value.length >= length) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [focused, value.length, length]);

  // Shake on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) {
      onComplete(cleaned);
    }
  }

  function handleKeyPress(e: any) {
    if (e.nativeEvent.key === 'Backspace' && value.length === 0) {
      // Already empty, do nothing
    }
  }

  function handlePress() {
    inputRef.current?.focus();
  }

  // Render hidden input + visual boxes
  return (
    <View>
      <Animated.View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, transform: [{ translateX: shakeAnim }] }}>
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] ?? '';
          const isActive = i === value.length && focused && value.length < length;
          const isFilled = i < value.length;

          return (
            <View
              key={i}
              style={{
                width: 48,
                height: 56,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: error ? color.error : isFilled ? color.primary : isActive ? `${color.primary}88` : color.line,
                backgroundColor: isFilled ? `${color.primary}08` : color.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isFilled ? (
                <Text style={{ fontFamily: font.numeric, fontSize: 24, color: color.ink }}>{digit}</Text>
              ) : isActive ? (
                <Animated.View style={{ width: 2, height: 24, backgroundColor: color.primary, opacity: cursorOpacity, borderRadius: 1 }} />
              ) : null}
            </View>
          );
        })}
      </Animated.View>

      {/* Hidden TextInput */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        showSoftInputOnFocus={Platform.OS === 'android'}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
        }}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
      />

      {/* Tap to focus overlay */}
      <Pressable onPress={handlePress} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
