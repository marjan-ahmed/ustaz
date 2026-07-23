import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Dimensions, Image, ScrollView, View } from 'react-native';
import { useAuth } from '@/lib/useAuth';
import { getActiveCustomerRequest, statusLabel, type ServiceRequest } from '@/lib/ustaz-api';
import { serviceCategories } from '@/content/home';
import NotificationBell from '@/components/NotificationBell';
import { useNotificationsContext } from '@/context/NotificationsContext';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge, BorderBeam, Card, FadeInUp, gradient, IconTile, IsoServiceScene,
  Marquee, OrbitRing, PatternBackdrop, PressableScale, Screen, SectionHeader,
  Stagger, Text,
} from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = SCREEN_W - space.lg * 2;

const TRUST = [
  { icon: 'shield-checkmark' as const, label: 'Verified pros' },
  { icon: 'navigate' as const, label: 'Live tracking' },
  { icon: 'time' as const, label: '3-day guarantee' },
];

const SERVICE_ILLUSTRATIONS: Record<string, any> = {
  Electrician: require('../../assets/images/electrician.png'),
  Plumbing: require('../../assets/images/plumber.png'),
  Carpentry: require('../../assets/images/carpenter.png'),
  'AC Maintenance': require('../../assets/images/ac_repair.png'),
  'Solar Technician': require('../../assets/images/solar.png'),
};

const SERVICE_BG: Record<string, string> = {
  Electrician: '#FFF7ED',
  Plumbing: '#EFF6FF',
  Carpentry: '#F7FEE7',
  'AC Maintenance': '#ECFEFF',
  'Solar Technician': '#FFFBEB',
};

const QUICK = serviceCategories.slice(0, 4);

export default function CustomerHome() {
  const { user } = useAuth();
  const { unreadCount } = useNotificationsContext();
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);

  const loadActive = useCallback(async () => {
    if (!user) return;
    try { setActiveRequest(await getActiveCustomerRequest(user.id)); } catch {}
  }, [user]);

  useEffect(() => { if (user) loadActive(); }, [user, loadActive]);

  return (
    <Screen bg={color.cream} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120 }}
      >
        {/* Header */}
        <FadeInUp>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
            <View>
              <Text variant="caption" tone="primary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>USTAZ</Text>
              <Text variant="h1">Home Services</Text>
            </View>
            <NotificationBell unreadCount={unreadCount} />
          </View>
        </FadeInUp>

        {/* Hero bento card — duotone navy/orange, orbiting service badges */}
        <FadeInUp delay={60}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', marginBottom: space.md, ...shadow.brand }}>
            <LinearGradient colors={gradient.navyOrange} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.lg }}>
              <PatternBackdrop variant="dots" tone="cream" opacity={0.05} glow={false} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" tone="inverseSoft" style={{ textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: space.xs }}>
                    Pakistan's trusted
                  </Text>
                  <Text variant="h2" tone="inverse">Find a pro{'\n'}near you</Text>
                  <Text variant="label" tone="inverseSoft" style={{ marginTop: space.xs }}>
                    Live tracking · 3-day guarantee
                  </Text>
                </View>
                <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
                  <IsoServiceScene size={100} />
                  <View style={{ position: 'absolute' }}>
                    <OrbitRing
                      size={130} radius={58} duration={15000} itemSize={26}
                      items={[
                        { icon: <IconTile size={26} bg="rgba(255,255,255,0.16)"><Ionicons name="flash" size={11} color={color.white} /></IconTile>, angleOffset: 0 },
                        { icon: <IconTile size={26} bg="rgba(255,255,255,0.16)"><Ionicons name="water" size={11} color={color.white} /></IconTile>, angleOffset: Math.PI },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Trust strip — navy surface + trust ticker */}
        <FadeInUp delay={70}>
          <Card variant="navy" style={{ marginBottom: space.lg, paddingVertical: space.md }}>
            <Marquee speed={30}>
              {TRUST.map((t) => (
                <View key={t.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 28 }}>
                  <Ionicons name={t.icon} size={14} color={color.primaryLight} />
                  <Text variant="label" tone="inverseSoft" style={{ fontWeight: '700' }}>{t.label}</Text>
                </View>
              ))}
            </Marquee>
          </Card>
        </FadeInUp>

        {/* Active request banner — BorderBeam signals "live" */}
        {activeRequest && (
          <FadeInUp delay={80}>
            <Link href="/book" asChild>
              <PressableScale style={{ marginBottom: space.lg }}>
                <BorderBeam width={CONTENT_W} height={92} borderRadius={radius.xl} duration={2600}>
                  <Card variant="gradient" gradientColors={[color.primary, color.primaryDark] as const} padded style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' }} />
                      <Text variant="caption" tone="inverseSoft" style={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>Active request</Text>
                    </View>
                    <Text variant="h3" tone="inverse">{activeRequest.service_type}</Text>
                    <Text variant="label" tone="inverseSoft" style={{ marginTop: 2 }}>{statusLabel(activeRequest.status)}</Text>
                  </Card>
                </BorderBeam>
              </PressableScale>
            </Link>
          </FadeInUp>
        )}

        {/* Quick find - Premium 2x2 Grid */}
        <FadeInUp delay={100}>
          <SectionHeader title="Quick find" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.lg }}>
            {QUICK.map((s, i) => (
              <FadeInUp key={s.name} delay={120 + i * 60} style={{ width: '47%' }}>
                <Link href={{ pathname: '/book', params: { service: s.name } }} asChild>
                  <PressableScale>
                    <View style={{
                      backgroundColor: SERVICE_BG[s.name] || '#F8F8F8',
                      borderRadius: radius.xl,
                      padding: space.lg,
                      height: 160,
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      ...shadow.sm,
                    }}>
                      {/* Service name */}
                      <Text variant="bodyLg" style={{ fontWeight: '700', color: '#0F1729', zIndex: 1 }}>
                        {s.name}
                      </Text>

                      {/* Illustration - large, bottom-right */}
                      <View style={{ position: 'absolute', bottom: -8, right: -8, width: 110, height: 110 }}>
                        <Image
                          source={SERVICE_ILLUSTRATIONS[s.name]}
                          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                        />
                      </View>
                    </View>
                  </PressableScale>
                </Link>
              </FadeInUp>
            ))}
          </View>
        </FadeInUp>

        {/* All services */}
        <FadeInUp delay={180}>
          <SectionHeader title="All services" />
          <View style={{ gap: space.sm }}>
            <Stagger step={40} initialDelay={180}>
              {serviceCategories.map((s) => (
                <Link key={s.name} href={{ pathname: '/book', params: { service: s.name } }} asChild>
                  <PressableScale>
                    <Card variant="elevated" padded={false} style={{ flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.md, borderRadius: radius.lg }}>
                      <View style={{
                        width: 52,
                        height: 52,
                        borderRadius: radius.lg,
                        backgroundColor: SERVICE_BG[s.name] || '#F8F8F8',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <Image
                          source={SERVICE_ILLUSTRATIONS[s.name]}
                          style={{ width: 38, height: 38, resizeMode: 'contain' }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyLg" style={{ fontWeight: '700', color: '#0F1729' }}>{s.name}</Text>
                        <Text variant="caption" tone="muted">{s.note}</Text>
                      </View>
                      <Badge label={s.short} tone="primary" />
                    </Card>
                  </PressableScale>
                </Link>
              ))}
            </Stagger>
          </View>
        </FadeInUp>
      </ScrollView>
    </Screen>
  );
}
