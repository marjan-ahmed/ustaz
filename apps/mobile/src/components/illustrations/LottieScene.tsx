/**
 * LottieScene — wrapper around lottie-react-native for branded animated moments
 * (searching for a provider, success). Honours reduce-motion by freezing on the
 * last frame. Keep Lottie for *functional* moments only, not decoration.
 */
import { useEffect, useRef } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import LottieView, { type LottieViewProps } from 'lottie-react-native';

type Source = LottieViewProps['source'];
// LottieView is a forwardRef whose imperative handle exposes play/pause/reset/resume.
type LottieRef = { play: (s?: number, e?: number) => void; pause: () => void; reset: () => void; resume: () => void };

export function LottieScene({
  source,
  size = 160,
  loop = true,
  autoplay = true,
  style,
}: {
  source: Source;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<LottieRef>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      ref.current?.pause?.();
      return;
    }
    if (autoplay) ref.current?.play?.();
  }, [autoplay, reduce]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        ref={ref}
        source={source}
        autoPlay={autoplay && !reduce}
        loop={loop && !reduce}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

// Prebuilt scenes (brand-recoloured JSON assets)
export const lottieSources = {
  searching: require('../../../assets/lottie/searching.json'),
  success: require('../../../assets/lottie/success.json'),
  bookingConfirmed: require('../../../assets/lottie/booking-confirmed-burst.json'),
  providerEnroute: require('../../../assets/lottie/provider-enroute-radar.json'),
  jobComplete: require('../../../assets/lottie/job-complete-confetti.json'),
  walletTopupSuccess: require('../../../assets/lottie/wallet-topup-success.json'),
};

export default LottieScene;
