import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { setStoredRole, type UserRole } from '@/lib/role';
import { Button, FadeInUp, GlowBackdrop, PatternBackdrop, Screen, Stagger, Text } from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';
import { PressableScale } from '@/components/motion';

const ROLES: { key: UserRole; title: string; sub: string; icon: React.ReactNode; cta: string }[] = [
  {
    key: 'customer',
    title: 'Need a service?',
    sub: 'Find and book trusted professionals for home repairs, installations, and more.',
    icon: <Ionicons name="home-outline" size={26} color={color.white} />,
    cta: 'Find a provider',
  },
  {
    key: 'provider',
    title: 'Want to earn?',
    sub: 'Accept jobs, grow your business, and earn with Pakistan\'s trusted marketplace.',
    icon: <MaterialCommunityIcons name="wrench-outline" size={26} color={color.white} />,
    cta: 'Start earning',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);

  async function handleContinue() {
    if (!selected) return;
    await setStoredRole(selected);
    router.replace(selected === 'provider' ? { pathname: '/auth', params: { intent: 'provider' } } : '/auth');
  }

  return (
    <Screen bg={color.cream} edges={['top']}>
      <PatternBackdrop variant="dots" tone="orange" opacity={0.05} glow={false} />
      <View style={{ flex: 1, paddingHorizontal: space.xl, paddingTop: space.xl }}>
        <FadeInUp>
          <Text variant="caption" tone="primary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Welcome to Ustaz
          </Text>
          <Text variant="display" style={{ marginTop: space.sm }}>How will you{'\n'}use Ustaz?</Text>
          <Text variant="bodyLg" tone="muted" style={{ marginTop: space.sm }}>
            Choose your role to get a personalized experience.
          </Text>
        </FadeInUp>

        <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
          <Stagger step={80} initialDelay={100}>
            {ROLES.map((role) => {
              const active = selected === role.key;
              return (
                <PressableScale key={role.key} onPress={() => setSelected(role.key)}>
                  <View style={[
                    {
                      borderRadius: radius['2xl'],
                      padding: space.xl,
                      minHeight: 160,
                      borderWidth: 2,
                      borderColor: active ? color.primary : color.line,
                      backgroundColor: active ? color.cream : color.surface,
                      overflow: 'hidden',
                    },
                    active ? shadow.brand : shadow.sm,
                  ]}>
                    {active && <GlowBackdrop top={-40} right={-40} size={160} opacity={0.18} />}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.lg }}>
                      <View style={{
                        width: 52, height: 52, borderRadius: radius.md,
                        backgroundColor: active ? color.primary : color.line,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {role.icon}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="h3" tone={active ? 'primary' : 'ink'}>{role.title}</Text>
                        <Text variant="label" tone="muted" style={{ marginTop: space.xs }}>{role.sub}</Text>
                      </View>
                    </View>
                    {active && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.primary }} />
                        <Text variant="caption" tone="primary" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Selected</Text>
                      </View>
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </Stagger>
        </View>

        <View style={{ paddingBottom: space['2xl'], gap: space.sm }}>
          <Button
            label={selected === 'provider' ? 'Start earning' : selected === 'customer' ? 'Find a provider' : 'Select a role'}
            onPress={handleContinue}
            disabled={!selected}
          />
          <Text variant="caption" tone="muted" center>You can switch roles anytime from your profile.</Text>
        </View>
      </View>
    </Screen>
  );
}
