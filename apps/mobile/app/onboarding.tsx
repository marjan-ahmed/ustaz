import { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { markOnboarded } from '@/lib/role';
import {
  BeamConnector, Bob, Button, DotIndicator, IconTile, IsoServiceScene, LottieScene,
  OnboardingSlide, OrbitRing, PatternBackdrop, PulseRadar, Screen, SlideCarousel,
  TiltCard, color, lottieSources,
} from '@/components/mobile-ui';
import { space } from '@/theme/tokens';

const SLIDES = [
  {
    dark: true,
    title: 'Trusted home\nservices, on demand',
    subtitle: 'Verified electricians, plumbers, AC techs, and carpenters — all near you.',
  },
  {
    dark: false,
    title: 'Book in seconds',
    subtitle: 'Pick a service, drop a pin, and you\'re booked. No calls, no back-and-forth.',
  },
  {
    dark: true,
    title: 'We find your pro instantly',
    subtitle: 'We match you with a nearby verified professional in real time.',
  },
  {
    dark: false,
    title: 'Track them, live',
    subtitle: 'Watch your provider arrive on the map, every step of the way.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const isLast = index === SLIDES.length - 1;

  async function finish() {
    if (navigating) return;
    setNavigating(true);
    try { await markOnboarded(); } catch {}
    router.replace('/role-select');
  }

  function next() {
    const { width } = Dimensions.get('window');
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  }

  const bg = SLIDES[index].dark ? color.navy : color.cream;

  return (
    <Screen bg={bg} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', top: space.lg, right: space.lg, zIndex: 1 }}>
          <Button label="Skip" variant="ghost" full={false} onPress={finish} hapticStyle="light" />
        </View>

        <SlideCarousel scrollRef={scrollRef} onIndexChange={setIndex}>
          <OnboardingSlide
            dark={SLIDES[0].dark}
            illustration={
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <PatternBackdrop variant="dots" tone="orange" opacity={0.06} />
                <IsoServiceScene size={190} />
                <View style={{ position: 'absolute' }}>
                  <OrbitRing
                    size={240} radius={104} duration={16000} itemSize={32}
                    items={[
                      { icon: <IconTile size={32} bg="rgba(255,255,255,0.14)"><Ionicons name="flash" size={13} color={color.primaryLight} /></IconTile>, angleOffset: 0 },
                      { icon: <IconTile size={32} bg="rgba(255,255,255,0.14)"><Ionicons name="water" size={13} color={color.primaryLight} /></IconTile>, angleOffset: (Math.PI * 2) / 3 },
                      { icon: <IconTile size={32} bg="rgba(255,255,255,0.14)"><MaterialCommunityIcons name="hammer" size={13} color={color.primaryLight} /></IconTile>, angleOffset: (Math.PI * 4) / 3 },
                    ]}
                  />
                </View>
              </View>
            }
            title={SLIDES[0].title}
            subtitle={SLIDES[0].subtitle}
          />
          <OnboardingSlide
            dark={SLIDES[1].dark}
            illustration={
              <TiltCard style={{ borderRadius: 24 }}>
                <Bob amplitude={8}>
                  <Image source={require('../assets/images/electrician.png')} style={{ width: 230, height: 230 }} resizeMode="contain" />
                </Bob>
              </TiltCard>
            }
            title={SLIDES[1].title}
            subtitle={SLIDES[1].subtitle}
          />
          <OnboardingSlide
            dark={SLIDES[2].dark}
            illustration={
              <View style={{ width: 260, height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <PatternBackdrop variant="grid" tone="orange" opacity={0.05} />
                <BeamConnector from={{ x: 40, y: 100 }} to={{ x: 220, y: 100 }} width={260} height={200} color={color.primaryLight} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                  <IconTile size={52} bg="rgba(255,255,255,0.14)"><Ionicons name="person" size={22} color={color.white} /></IconTile>
                  <IconTile size={52} bg="rgba(255,255,255,0.14)"><MaterialCommunityIcons name="account-hard-hat" size={24} color={color.white} /></IconTile>
                </View>
                <View style={{ position: 'absolute' }}>
                  <LottieScene source={lottieSources.searching} size={120} />
                </View>
              </View>
            }
            title={SLIDES[2].title}
            subtitle={SLIDES[2].subtitle}
          />
          <OnboardingSlide
            dark={SLIDES[3].dark}
            illustration={
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute' }}>
                  <PulseRadar size={260} color={color.primary} />
                </View>
                <Bob amplitude={8}>
                  <Image source={require('../assets/images/plumber.png')} style={{ width: 220, height: 220 }} resizeMode="contain" />
                </Bob>
              </View>
            }
            title={SLIDES[3].title}
            subtitle={SLIDES[3].subtitle}
          />
        </SlideCarousel>

        <View style={{ paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.lg }}>
          <DotIndicator count={SLIDES.length} active={index} />
          <Button
            label={isLast ? 'Get Started' : 'Continue'}
            onPress={isLast ? finish : next}
            loading={isLast && navigating}
          />
        </View>
      </View>
    </Screen>
  );
}
