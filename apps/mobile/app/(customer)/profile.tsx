import { Image, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { Card, FadeInUp, GlowBackdrop, PressableScale, Screen, Stagger, Text } from '@/components/mobile-ui';
import { color, font, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

type MenuItem = { icon: string; label: string; sub: string; onPress: () => void; danger?: boolean };

export default function CustomerProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || user?.phone || 'Customer';
  const userEmail = user?.user_metadata?.email || user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = userName.charAt(0).toUpperCase();

  async function switchRole() {
    try {
      await setStoredRole('provider');
      if (!isSignedIn || !user?.phone) { router.replace({ pathname: '/auth', params: { intent: 'provider' } }); return; }
      const { data } = await supabase.from('ustaz_registrations').select('userId').eq('userId', user.id).maybeSingle();
      router.replace(data ? '/(provider)' : '/provider-register');
    } catch {}
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/splash');
  }

  const menu: MenuItem[] = [
    { icon: 'heart', label: 'Favorite Providers', sub: 'Quick rebook your trusted ustaz', onPress: () => router.push('/(customer)/favorites') },
    { icon: 'location', label: 'Saved Addresses', sub: 'Manage your locations', onPress: () => router.push('/(customer)/saved-addresses') },
    { icon: 'construct-outline', label: 'Switch to Provider', sub: 'Accept jobs and earn money', onPress: switchRole },
    { icon: 'log-out-outline', label: 'Sign out', sub: 'End your current session', onPress: handleSignOut, danger: true },
  ];

  return (
    <Screen bg={color.cream} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120 }}>
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.lg }}>Profile</Text>
        </FadeInUp>

        {/* Avatar hero card */}
        <FadeInUp delay={60}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', marginBottom: space.lg, ...shadow.md }}>
            <LinearGradient colors={['#FFF7ED', '#FEF3C7']} style={{ padding: space.xl }}>
              <GlowBackdrop top={-40} right={-40} size={160} opacity={0.2} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: color.primary }} />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: font.display, fontSize: 26, color: color.white }}>{initials}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{isSignedIn ? userName : 'Not signed in'}</Text>
                  <Text variant="label" tone="muted" style={{ marginTop: 2 }}>{isSignedIn ? (userEmail || 'Customer account') : 'Sign in to book services'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Menu items */}
        <View style={{ gap: space.sm }}>
          <Stagger step={50} initialDelay={80}>
            {menu.map((item, i) => (
              <PressableScale key={item.label} onPress={item.onPress}>
                <Card variant="elevated" padded={false} style={{ flexDirection: 'row', alignItems: 'center', padding: space.lg, gap: space.md }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.danger ? '#FEF2F2' : i % 2 === 0 ? `${color.primary}12` : `${color.navy}0D`,
                  }}>
                    <Ionicons name={item.icon as any} size={20} color={item.danger ? color.error : i % 2 === 0 ? color.primary : color.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" style={{ fontWeight: '700', color: item.danger ? color.error : color.ink }}>{item.label}</Text>
                    <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={color.line} />
                </Card>
              </PressableScale>
            ))}
          </Stagger>
        </View>

        <Text variant="caption" tone="muted" center style={{ marginTop: space['2xl'] }}>Ustaz v0.1.0</Text>
      </ScrollView>
    </Screen>
  );
}
