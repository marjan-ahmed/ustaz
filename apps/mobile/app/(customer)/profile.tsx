import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';

export default function CustomerProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || user?.phone
    || 'Customer';
  const userEmail = user?.user_metadata?.email || user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  async function switchRole() {
    try {
      await setStoredRole('provider');
      if (!isSignedIn || !user?.phone) {
        router.replace({ pathname: '/auth', params: { intent: 'provider' } });
        return;
      }

      const { data } = await supabase
        .from('ustaz_registrations')
        .select('userId')
        .eq('userId', user.id)
        .maybeSingle();

      router.replace(data ? '/(provider)' : '/provider-register');
    } catch {}
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/splash');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginBottom: 20 }}>Profile</Text>

        <View style={{ marginBottom: 24, borderRadius: 20, backgroundColor: '#F9FAFB', padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.primary }} />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 22, color: colors.primary }}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#1B1B27' }}>{isSignedIn ? userName : 'Not signed in'}</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{isSignedIn ? (userEmail || 'Customer account') : 'Sign in to book services'}</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Pressable onPress={switchRole}
            style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <MaterialCommunityIcons name="wrench-outline" size={20} color="#1B1B27" />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>Switch to Provider</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Accept jobs and earn money</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <Pressable onPress={handleSignOut}
            style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Sign out</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>End your current session</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ paddingBottom: 32, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#D1D5DB' }}>Ustaz v0.1.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
