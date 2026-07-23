import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, withTiming, withDelay, withRepeat, withSequence, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { hasCompletedOnboarding, getStoredRole } from '@/lib/role';
import { IconTile, IsoServiceScene, Marquee, OrbitRing, PatternBackdrop, Text } from '@/components/mobile-ui';
import { color, font } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const TICKER = ['500+ verified pros', 'Live tracking', '3-day guarantee', 'Cash or wallet'];

export default function SplashScreen() {
  const router = useRouter();
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const tagOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    tagOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    pulse.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    ));

    const timer = setTimeout(async () => {
      try {
        const onboarded = await hasCompletedOnboarding();
        const role = await getStoredRole();
        if (!onboarded) router.replace('/onboarding');
        else if (!role) router.replace('/role-select');
        else router.replace(role === 'provider' ? '/(provider)' : '/(customer)');
      } catch {
        router.replace('/onboarding');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }, { scale: pulse.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  return (
    <LinearGradient colors={['#1A2440', color.navy]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <PatternBackdrop variant="dots" tone="orange" opacity={0.07} glow />

      <Animated.View style={[{ alignItems: 'center', gap: 8 }, logoStyle]}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <IsoServiceScene size={200} />
          <View style={{ position: 'absolute' }}>
            <OrbitRing
              size={260}
              radius={118}
              duration={18000}
              itemSize={34}
              items={[
                { icon: <IconTile size={34} bg="rgba(255,255,255,0.14)"><Ionicons name="flash" size={14} color={color.primaryLight} /></IconTile>, angleOffset: 0 },
                { icon: <IconTile size={34} bg="rgba(255,255,255,0.14)"><Ionicons name="water" size={14} color={color.primaryLight} /></IconTile>, angleOffset: (Math.PI * 2) / 3 },
                { icon: <IconTile size={34} bg="rgba(255,255,255,0.14)"><MaterialCommunityIcons name="hammer" size={14} color={color.primaryLight} /></IconTile>, angleOffset: (Math.PI * 4) / 3 },
              ]}
            />
          </View>
        </View>
        <Animated.Text style={[{ fontFamily: font.display, fontSize: 38, color: color.white, letterSpacing: 3, marginTop: 8 }]}>
          USTAZ
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', bottom: 46, alignItems: 'center', gap: 12, width: '100%' }, tagStyle]}>
        <Text variant="label" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 }}>
          Trusted home services
        </Text>
        <Marquee speed={26}>
          {TICKER.map((t) => (
            <Text key={t} variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginRight: 20 }}>
              {t} •
            </Text>
          ))}
        </Marquee>
      </Animated.View>
    </LinearGradient>
  );
}
