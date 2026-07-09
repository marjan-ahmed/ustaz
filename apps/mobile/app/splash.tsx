import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { hasCompletedOnboarding, getStoredRole } from '@/lib/role';

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }),
    ]).start();

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
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="hammer-wrench" size={56} color={colors.primary} />
        <Text style={{ fontFamily: 'Anton', fontSize: 48, color: '#1B1B27', letterSpacing: 2, marginTop: 12 }}>
          USTAZ
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity, marginTop: 16 }}>
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, color: '#6B7280' }}>
          Trusted home services
        </Text>
      </Animated.View>
    </View>
  );
}
