/**
 * Design-system preview — a dev-only showcase of the redesign foundation.
 * Route: /_design-preview. Use it to eyeball tokens, primitives, illustrations
 * and motion on-device after a dev/EAS rebuild (native libs don't run in Expo Go).
 * Not linked from anywhere; safe to delete once the flagship screens are done.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import {
  Badge,
  BeamConnector,
  BorderBeam,
  Button,
  Card,
  Chip,
  CircularGauge,
  Drift,
  EmptyState,
  GlowBackdrop,
  IconTile,
  IsoCelebrationScene,
  IsoServiceScene,
  IsoWalletScene,
  LottieScene,
  Marquee,
  NumberTicker,
  Numeric,
  OrbitRing,
  PatternBackdrop,
  ProgressStepper,
  PulseRadar,
  Screen,
  SectionHeader,
  SegmentedControl,
  ShineText,
  Skeleton,
  StatTile,
  Sway,
  Text,
  TiltCard,
  color,
  font,
  lottieSources,
  radius,
  space,
} from '@/components/mobile-ui';
import { useState } from 'react';

export default function DesignPreview() {
  const [seg, setSeg] = useState('a');
  const gap = { gap: space.md } as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space['4xl'], gap: space.xl }}>
        {/* Hero with signature illustration + glow depth */}
        <Card variant="gradient" gradientColors={['#FFF7ED', '#FEF3C7'] as const}>
          <View style={{ alignItems: 'center' }}>
            <IsoServiceScene size={220} />
            <Text variant="display" center style={{ marginTop: space.md }}>
              Design system
            </Text>
            <Text variant="body" tone="muted" center>
              Foundation preview
            </Text>
          </View>
        </Card>

        <View>
          <SectionHeader title="Typography" />
          <Text variant="display">Display</Text>
          <Text variant="h1">Heading 1</Text>
          <Text variant="h2">Heading 2</Text>
          <Text variant="h3">Heading 3</Text>
          <Text variant="bodyLg">Body large — Atkinson Hyperlegible.</Text>
          <Text variant="body">Body — the quick brown fox jumps.</Text>
          <Text variant="label" tone="muted">
            LABEL / CAPTION
          </Text>
          <Numeric size={40} tone="primary">
            1,248
          </Numeric>
        </View>

        <View style={gap}>
          <SectionHeader title="Buttons" />
          <Button label="Primary (gradient)" onPress={() => {}} />
          <Button label="Navy" variant="navy" onPress={() => {}} />
          <Button label="Soft" variant="soft" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
        </View>

        <View style={gap}>
          <SectionHeader title="Cards & depth" />
          <View style={{ overflow: 'hidden', borderRadius: 28 }}>
            <Card variant="navy">
              <GlowBackdrop top={-40} right={-40} />
              <Text variant="h3" tone="inverse">
                Navy card
              </Text>
              <Text variant="body" tone="inverseSoft">
                with ambient glow blob
              </Text>
            </Card>
          </View>
          <Card variant="elevated">
            <Text variant="body">Elevated card</Text>
          </Card>
          <Card variant="flat">
            <Text variant="body">Flat card</Text>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', ...gap }}>
          <StatTile value="42" label="Jobs done" />
          <StatTile value="4.9" label="Rating" tone="primary" />
          <StatTile value="Rs 8k" label="Earned" />
        </View>

        <View style={{ flexDirection: 'row', ...gap }}>
          <Chip label="All" active onPress={() => {}} />
          <Chip label="Electrician" onPress={() => {}} />
          <Chip label="Plumber" onPress={() => {}} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', ...gap }}>
          <Badge label="LIVE" />
          <Badge label="DONE" tone="success" />
          <Badge label="WARRANTY" tone="warning" />
          <IconTile />
        </View>

        <View style={gap}>
          <SectionHeader title="Segmented + stepper" />
          <SegmentedControl
            segments={[
              { key: 'a', label: 'Social' },
              { key: 'b', label: 'Email' },
              { key: 'c', label: 'Phone' },
            ]}
            value={seg}
            onChange={setSeg}
          />
          <ProgressStepper total={5} current={2} />
        </View>

        <View style={gap}>
          <SectionHeader title="Skeleton loaders" />
          <Skeleton w="60%" h={22} />
          <Skeleton w="100%" h={14} />
          <Skeleton w="80%" h={14} />
        </View>

        <View style={gap}>
          <SectionHeader title="Lottie scenes" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <LottieScene source={lottieSources.searching} size={120} />
            <LottieScene source={lottieSources.success} size={120} loop={false} />
          </View>
        </View>

        <EmptyState
          illustration={<IsoServiceScene size={160} />}
          title="Nothing here yet"
          subtitle="Branded empty states replace the single-grey-icon pattern."
          action={<Button label="Take action" full={false} onPress={() => {}} />}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Signature motion & branding overhaul — Phase 0 new primitives     */}
        {/* ---------------------------------------------------------------- */}

        <View style={gap}>
          <SectionHeader title="Illustration variants" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <IsoServiceScene size={110} variant="electrician" />
            <IsoServiceScene size={110} variant="plumber" />
            <IsoServiceScene size={110} variant="carpenter" />
            <IsoServiceScene size={110} variant="ac" />
            <IsoServiceScene size={110} variant="solar" />
            <IsoServiceScene size={110} variant="wallet" />
            <IsoServiceScene size={110} variant="celebration" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <IsoWalletScene size={140} />
            <IsoCelebrationScene size={140} />
          </View>
        </View>

        <View style={{ borderRadius: radius.xl, overflow: 'hidden', height: 180 }}>
          <PatternBackdrop variant="dots" tone="navy" />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="h3">PatternBackdrop — dots / navy</Text>
          </View>
        </View>
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', height: 180, backgroundColor: color.navy }}>
          <PatternBackdrop variant="hex" tone="orange" opacity={0.14} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="h3" tone="inverse">PatternBackdrop — hex / orange on navy</Text>
          </View>
        </View>

        <View style={gap}>
          <SectionHeader title="OrbitRing" />
          <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
            <IsoServiceScene size={140} />
            <View style={{ position: 'absolute' }}>
              <OrbitRing
                size={200}
                radius={90}
                items={[
                  { icon: <IconTile size={36}><Ionicons name="flash" size={16} color={color.primary} /></IconTile>, angleOffset: 0 },
                  { icon: <IconTile size={36}><Ionicons name="water" size={16} color={color.primary} /></IconTile>, angleOffset: (Math.PI * 2) / 3 },
                  { icon: <IconTile size={36}><Ionicons name="hammer" size={16} color={color.primary} /></IconTile>, angleOffset: (Math.PI * 4) / 3 },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={gap}>
          <SectionHeader title="Marquee" />
          <Card variant="navy" padded={false} style={{ paddingVertical: space.md }}>
            <Marquee speed={36}>
              {['500+ verified pros', 'Live tracking', '3-day guarantee', 'Cash or wallet'].map((t) => (
                <Text key={t} variant="label" tone="inverse" style={{ marginRight: 24 }}>{t} •</Text>
              ))}
            </Marquee>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', ...gap, alignItems: 'center' }}>
          <PulseRadar size={70} />
          <PulseRadar size={70} color={color.navy} />
          <NumberTicker value={1248} style={{ fontFamily: font.numeric, fontSize: 32, color: color.ink }} />
        </View>

        <View style={{ flexDirection: 'row', ...gap }}>
          <TiltCard style={{ flex: 1, borderRadius: radius.lg }}>
            <Card variant="elevated">
              <Text variant="body" style={{ fontWeight: '700' }}>Drag me</Text>
              <Text variant="caption" tone="muted">TiltCard</Text>
            </Card>
          </TiltCard>
          <Sway style={{ flex: 1, alignItems: 'center' }}>
            <MaterialCommunityIcons name="badge-account" size={48} color={color.primary} />
          </Sway>
          <Drift style={{ flex: 1, alignItems: 'center' }}>
            <MaterialCommunityIcons name="tools" size={40} color={color.navy} />
          </Drift>
        </View>

        <BorderBeam width={340} height={100} borderRadius={radius.xl}>
          <Card variant="elevated" style={{ flex: 1, justifyContent: 'center' }}>
            <Text variant="body" style={{ fontWeight: '700' }}>Active request — BorderBeam</Text>
            <Text variant="caption" tone="muted">Light travels the border while live</Text>
          </Card>
        </BorderBeam>

        <View style={{ flexDirection: 'row', ...gap, alignItems: 'center' }}>
          <CircularGauge size={72} strokeWidth={7} progress={0.65} color={color.primary}>
            <Text variant="label" style={{ fontWeight: '700' }}>65%</Text>
          </CircularGauge>
          <CircularGauge size={72} strokeWidth={7} progress={0.3} color={color.navy}>
            <Text variant="label" style={{ fontWeight: '700' }}>30%</Text>
          </CircularGauge>
        </View>

        <ShineText style={{ fontFamily: font.display, fontSize: 28, color: color.ink }}>
          Rs. 12,480 earned
        </ShineText>

        <View style={{ height: 140 }}>
          <BeamConnector from={{ x: 20, y: 100 }} to={{ x: 300, y: 30 }} width={340} height={140} />
        </View>
      </ScrollView>
    </Screen>
  );
}
