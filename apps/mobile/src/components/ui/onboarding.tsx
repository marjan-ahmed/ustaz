/**
 * Onboarding carousel primitives — swipeable slide + dot indicator, used by
 * `app/onboarding.tsx`. Each slide owns its own illustration + copy; the
 * carousel just tracks the active page via scroll position.
 */
import { PropsWithChildren, ReactNode, RefObject } from 'react';
import {
  Dimensions,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { color, space } from '../../theme/tokens';
import { FadeInUp } from '../motion';
import { Text } from './primitives';

const { width: SCREEN_W } = Dimensions.get('window');

export function OnboardingSlide({
  illustration,
  title,
  subtitle,
  dark = false,
}: {
  illustration: ReactNode;
  title: ReactNode;
  subtitle: string;
  dark?: boolean;
}) {
  return (
    <View style={{ width: SCREEN_W, flex: 1, backgroundColor: dark ? color.navy : color.cream, paddingHorizontal: space.xl, alignItems: 'center' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}>{illustration}</View>
      <FadeInUp delay={60}>
        <Text variant="display" tone={dark ? 'inverse' : 'ink'} center style={{ marginBottom: space.sm }}>
          {title}
        </Text>
      </FadeInUp>
      <FadeInUp delay={140}>
        <Text variant="bodyLg" tone={dark ? 'inverseSoft' : 'muted'} center>
          {subtitle}
        </Text>
      </FadeInUp>
    </View>
  );
}

export function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? color.primary : color.line,
          }}
        />
      ))}
    </View>
  );
}

export function SlideCarousel({
  children,
  scrollRef,
  onIndexChange,
}: PropsWithChildren<{
  scrollRef: RefObject<ScrollView | null>;
  onIndexChange: (index: number) => void;
}>) {
  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    onIndexChange(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  }
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScroll}
      style={{ flex: 1 }}
    >
      {children}
    </ScrollView>
  );
}
