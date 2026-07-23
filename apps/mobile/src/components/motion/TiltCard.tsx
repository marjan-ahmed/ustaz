/**
 * TiltCard — lightweight extraction of the gesture-driven 3D tilt + specular
 * highlight technique proven in ProviderLanyard.tsx, without the flip/swing
 * behavior, for reuse on ordinary cards (service tiles, stat cards, booking
 * summary) that want a touch of the same premium tactile feel.
 */
import { PropsWithChildren } from 'react';
import { type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function TiltCard({
  children,
  maxTilt = 10,
  glare = true,
  style,
}: PropsWithChildren<{ maxTilt?: number; glare?: boolean; style?: ViewStyle }>) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.02, { damping: 14, stiffness: 200 });
    })
    .onUpdate((e) => {
      rotateY.value = interpolate(e.translationX, [-100, 100], [-maxTilt, maxTilt], 'clamp');
      rotateX.value = interpolate(e.translationY, [-100, 100], [maxTilt, -maxTilt], 'clamp');
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, { damping: 14, stiffness: 120 });
      rotateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glareStyle = useAnimatedStyle(() => ({
    opacity: glare ? interpolate(rotateX.value, [-maxTilt, 0, maxTilt], [0.16, 0.04, 0.16]) : 0,
    transform: [
      { translateX: interpolate(rotateY.value, [-maxTilt, 0, maxTilt], [-30, 0, 30]) },
      { translateY: interpolate(rotateX.value, [-maxTilt, 0, maxTilt], [-24, 0, 24]) },
    ],
  }));

  const radius = typeof style?.borderRadius === 'number' ? style.borderRadius : 20;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, cardStyle]}>
        {children}
        {glare && (
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.5)' },
              glareStyle,
            ]}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default TiltCard;
