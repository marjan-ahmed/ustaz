import { useState } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { setStoredRole, type UserRole } from '@/lib/role';
import { Button, FadeInUp, PatternBackdrop, Screen, Stagger, Text } from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';
import { PressableScale } from '@/components/motion';

const needServiceImg = require('../assets/images/needservice-removebg-preview.png');
const wantServiceImg = require('../assets/images/wantservice-removebg-preview.png');

const ROLES: {
  key: UserRole;
  title: string;
  sub: string;
  image: any;
}[] = [
  {
    key: 'customer',
    title: 'Need a service?',
    sub: 'Find and book trusted professionals for home repairs, installations, and more.',
    image: needServiceImg,
  },
  {
    key: 'provider',
    title: 'Want to earn?',
    sub: 'Accept jobs, grow your business, and earn with Pakistan\'s trusted marketplace.',
    image: wantServiceImg,
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
      <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.xl }}>
        <FadeInUp>
          <Text variant="caption" tone="primary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Welcome to Ustaz
          </Text>
          <Text variant="display" style={{ marginTop: space.sm }}>How will you{'\n'}use Ustaz?</Text>
          <Text variant="bodyLg" tone="muted" style={{ marginTop: space.sm }}>
            Choose your role to get a personalized experience.
          </Text>
        </FadeInUp>

        <View style={{ flex: 1, justifyContent: 'center', gap: space.md }}>
          <Stagger step={100} initialDelay={120}>
            {ROLES.map((role) => {
              const active = selected === role.key;
              return (
                <PressableScale key={role.key} onPress={() => setSelected(role.key)}>
                  <View style={[
                    {
                      borderRadius: radius['2xl'],
                      borderWidth: 2,
                      borderColor: active ? color.primary : color.line,
                      backgroundColor: color.surface,
                      overflow: 'hidden',
                      minHeight: 260,
                    },
                    active ? shadow.brand : shadow.sm,
                  ]}>
                    <View style={{ alignItems: 'center', paddingTop: space.xl, paddingHorizontal: space.lg }}>
                      <Image
                        source={role.image}
                        style={{ width: 160, height: 160 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ paddingHorizontal: space.xl, paddingBottom: space.xl, alignItems: 'center' }}>
                      <Text variant="h2" tone={active ? 'primary' : 'ink'} center>{role.title}</Text>
                      <Text variant="body" tone="muted" center style={{ marginTop: space.xs }}>{role.sub}</Text>
                    </View>
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
