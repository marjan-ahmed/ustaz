import { useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { markOnboarded } from '@/lib/role';

const { width: SCREEN_W } = Dimensions.get('window');

const slides = [
  {
    icon: 'magnify' as const,
    title: 'Find trusted professionals',
    body: 'Browse verified electricians, plumbers, AC techs, carpenters, and more — all near you.',
  },
  {
    icon: 'radar' as const,
    title: 'Track every step live',
    body: 'Watch your provider travel to you in real time. Know exactly when they arrive.',
  },
  {
    icon: 'shield-check' as const,
    title: '3-day work guarantee',
    body: 'Every job is backed by a warranty. If it breaks again, we send someone back for free.',
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  async function handleNext() {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await markOnboarded();
      router.replace('/role-select');
    }
  }

  async function handleSkip() {
    await markOnboarded();
    router.replace('/role-select');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 }}>
        {currentIndex > 0 ? (
          <Pressable
            onPress={() => setCurrentIndex(currentIndex - 1)}
            style={{ minHeight: 44, minWidth: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '600', color: '#6B7280' }}>
              Back
            </Text>
          </Pressable>
        ) : <View style={{ width: 44 }} />}
        <Pressable
          onPress={handleSkip}
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            backgroundColor: `${colors.primary}10`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={slides[currentIndex].icon} size={44} color={colors.primary} />
        </View>

        <Text
          style={{
            marginTop: 32,
            fontFamily: 'Anton',
            fontSize: 32,
            lineHeight: 40,
            textAlign: 'center',
            color: '#1B1B27',
          }}
        >
          {slides[currentIndex].title}
        </Text>

        <Text
          style={{
            marginTop: 16,
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            color: '#6B7280',
          }}
        >
          {slides[currentIndex].body}
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? colors.primary : '#E5E7EB',
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={{
            minHeight: 56,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
            {currentIndex < slides.length - 1 ? 'Next' : 'Get started'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
