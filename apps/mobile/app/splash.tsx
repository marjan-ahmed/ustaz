import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hasCompletedOnboarding, getStoredRole } from '@/lib/role';

export default function SplashScreen() {
  const router = useRouter();
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(async () => {
      Animated.timing(fadeOut, { toValue: 0, duration: 300, useNativeDriver: true }).start(async () => {
        try {
          const onboarded = await hasCompletedOnboarding();
          const role = await getStoredRole();
          if (!onboarded) router.replace('/onboarding');
          else if (!role) router.replace('/role-select');
          else router.replace(role === 'provider' ? '/(provider)' : '/(customer)');
        } catch {
          router.replace('/onboarding');
        }
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#db4b0d', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          opacity: fadeOut,
          alignItems: 'center',
          gap: 16,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="hammer-wrench" size={44} color="#FFFFFF" />
        </View>

        <Text
          style={{
            fontFamily: 'Anton',
            fontSize: 36,
            color: '#FFFFFF',
            letterSpacing: 4,
          }}
        >
          USTAZ
        </Text>

        <Text
          style={{
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 1,
          }}
        >
          Trusted home services
        </Text>
      </Animated.View>
    </View>
  );
}
