import { Image, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { Card, FadeInUp, GlowBackdrop, PressableScale, Screen, Stagger, Text } from '@/components/mobile-ui';
import { color, font, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/i18n';

type MenuItem = { icon: string; labelKey: string; subKey: string; onPress: () => void; danger?: boolean };

export default function CustomerProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || user?.phone || t('profile.notSignedIn');
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
    { icon: 'heart', labelKey: 'profile.favoriteProviders', subKey: 'profile.favoriteProvidersDesc', onPress: () => router.push('/(customer)/favorites') },
    { icon: 'location', labelKey: 'profile.savedAddresses', subKey: 'profile.savedAddressesDesc', onPress: () => router.push('/(customer)/saved-addresses') },
    { icon: 'construct-outline', labelKey: 'profile.switchToProvider', subKey: 'profile.switchToProviderDesc', onPress: switchRole },
    { icon: 'log-out-outline', labelKey: 'profile.signOut', subKey: 'profile.signOutDesc', onPress: handleSignOut, danger: true },
  ];

  return (
    <Screen bg={color.cream} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120 }}>
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.lg }}>{t('tabs.profile')}</Text>
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
                  <Text variant="h3">{isSignedIn ? userName : t('profile.notSignedIn')}</Text>
                  <Text variant="label" tone="muted" style={{ marginTop: 2 }}>{isSignedIn ? (userEmail || t('profile.customerAccount')) : t('profile.signInToBook')}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Menu items */}
        <View style={{ gap: space.sm }}>
          <Stagger step={50} initialDelay={80}>
            {menu.map((item, i) => (
              <PressableScale key={item.labelKey} onPress={item.onPress}>
                <Card variant="elevated" padded={false} style={{ flexDirection: 'row', alignItems: 'center', padding: space.lg, gap: space.md }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.danger ? '#FEF2F2' : i % 2 === 0 ? `${color.primary}12` : `${color.navy}0D`,
                  }}>
                    <Ionicons name={item.icon as any} size={20} color={item.danger ? color.error : i % 2 === 0 ? color.primary : color.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" style={{ fontWeight: '700', color: item.danger ? color.error : color.ink }}>{t(item.labelKey)}</Text>
                    <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{t(item.subKey)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={color.line} />
                </Card>
              </PressableScale>
            ))}
          </Stagger>
        </View>

        <Text variant="caption" tone="muted" center style={{ marginTop: space['2xl'] }}>{t('profile.version')}</Text>
      </ScrollView>
    </Screen>
  );
}
