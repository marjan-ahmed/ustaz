import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { markOnboarded } from '@/lib/role';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ─── Floating tool icons for orbital animation ─── */
const floatingTools = [
  { icon: 'flash' as const, color: '#DB4B0D', size: 28, orbit: 1, startAngle: 0, speed: 1 },
  { icon: 'water' as const, color: '#2563EB', size: 24, orbit: 1.3, startAngle: 72, speed: -0.8 },
  { icon: 'hammer' as const, color: '#4D7C0F', size: 26, orbit: 1.6, startAngle: 144, speed: 0.6 },
  { icon: 'snowflake' as const, color: '#0891B2', size: 22, orbit: 1.1, startAngle: 216, speed: -1.2 },
  { icon: 'solar-power' as const, color: '#B45309', size: 24, orbit: 1.4, startAngle: 288, speed: 0.9 },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  /* ─── Orbital floating animation ─── */
  const orbits = floatingTools.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const anims = orbits.map((val, i) =>
      Animated.loop(
        Animated.timing(val, {
          toValue: 1,
          duration: 12000 / Math.abs(floatingTools[i].speed),
          useNativeDriver: true,
        }),
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  /* ─── Center pulse ─── */
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  async function handleGetStarted() {
    if (navigating) return;
    setNavigating(true);
    try { await markOnboarded(); } catch {}
    router.replace('/role-select');
  }

  const CX = SCREEN_W / 2;
  const CY = SCREEN_H * 0.32;
  const BASE_ORBIT = 110;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* ─── Top Illustration Area ─── */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* Soft gradient background */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFF7ED',
          }}
        />
        {/* Radial glow */}
        <View
          style={{
            position: 'absolute',
            top: CY - 160,
            left: CX - 160,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: 'rgba(219, 75, 13, 0.06)',
          }}
        />

        {/* Orbital rings (decorative) */}
        {[1, 1.3, 1.6].map((mult, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: CY - BASE_ORBIT * mult,
              left: CX - BASE_ORBIT * mult,
              width: BASE_ORBIT * mult * 2,
              height: BASE_ORBIT * mult * 2,
              borderRadius: BASE_ORBIT * mult,
              borderWidth: 1,
              borderColor: 'rgba(219, 75, 13, 0.08)',
            }}
          />
        ))}

        {/* Floating tool icons */}
        {floatingTools.map((tool, i) => {
          const angle = orbits[i].interpolate({
            inputRange: [0, 1],
            outputRange: [tool.startAngle, tool.startAngle + 360 * tool.speed],
          });
          const rad = angle.interpolate({
            inputRange: [0, 360],
            outputRange: [0, Math.PI * 2],
          });
          const x = rad.interpolate({
            inputRange: [0, Math.PI, Math.PI * 2, Math.PI * 3, Math.PI * 4],
            outputRange: [
              CX + BASE_ORBIT * tool.orbit,
              CX - BASE_ORBIT * tool.orbit * 0.3,
              CX - BASE_ORBIT * tool.orbit,
              CX + BASE_ORBIT * tool.orbit * 0.3,
              CX + BASE_ORBIT * tool.orbit,
            ],
          });
          const y = rad.interpolate({
            inputRange: [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2],
            outputRange: [
              CY - BASE_ORBIT * tool.orbit * 0.4,
              CY + BASE_ORBIT * tool.orbit * 0.5,
              CY + BASE_ORBIT * tool.orbit * 0.3,
              CY - BASE_ORBIT * tool.orbit * 0.6,
              CY - BASE_ORBIT * tool.orbit * 0.4,
            ],
          });

          const toolContainerSize = tool.size + 20;
          const toolOffset = -toolContainerSize / 2;

          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: toolOffset,
                top: toolOffset,
                width: toolContainerSize,
                height: toolContainerSize,
                borderRadius: toolContainerSize / 2,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: tool.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
                transform: [{ translateX: x }, { translateY: y }],
              }}
            >
              <MaterialCommunityIcons name={tool.icon} size={tool.size} color={tool.color} />
            </Animated.View>
          );
        })}

        {/* Center isometric illustration — icon-based */}
        <Animated.View
          style={{
            position: 'absolute',
            top: CY - 90,
            left: CX - 90,
            width: 180,
            height: 180,
            borderRadius: 48,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#DB4B0D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 8,
            transform: [{ scale: pulse }],
          }}
        >
          {/* Isometric-style layered icons */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="hammer-wrench" size={56} color={colors.primary} />
            <View style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#34D399" />
            </View>
          </View>
        </Animated.View>

        {/* Skip button */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 8 }}>
            <Pressable
              onPress={handleGetStarted}
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>
                Skip
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── Bottom Card ─── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          marginTop: -28,
          paddingHorizontal: 28,
          paddingTop: 32,
          paddingBottom: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {/* Sparkle icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <MaterialCommunityIcons name="star-four-points" size={24} color="#1B1B27" />
        </View>

        <Text
          style={{
            fontFamily: 'Anton',
            fontSize: 30,
            lineHeight: 36,
            color: '#1B1B27',
            marginBottom: 8,
          }}
        >
          Trusted home services{'\n'}
          <Text style={{ color: colors.primary }}>near you</Text>
        </Text>

        <Text
          style={{
            fontFamily: 'AtkinsonHyperlegible',
            fontSize: 15,
            lineHeight: 22,
            color: '#6B7280',
            marginBottom: 28,
          }}
        >
          Book verified electricians, plumbers, AC techs, carpenters, and more — all near you.
        </Text>

        <Pressable
          onPress={handleGetStarted}
          style={{
            minHeight: 56,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            backgroundColor: '#1B1B27',
            shadowColor: '#1B1B27',
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
