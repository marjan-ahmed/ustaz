import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { setStoredRole, type UserRole } from '@/lib/role';

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);

  async function handleContinue() {
    if (!selected) return;
    await setStoredRole(selected);
    router.replace(selected === 'provider' ? { pathname: '/auth', params: { intent: 'provider' } } : '/auth');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.primary }}>
            Welcome to Ustaz
          </Text>
          <Text style={{ fontFamily: 'Anton', fontSize: 36, lineHeight: 44, color: '#1B1B27', marginTop: 12 }}>
            How will you{'\n'}use Ustaz?
          </Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, lineHeight: 24, color: '#9CA3AF', marginTop: 12 }}>
            Choose your role to get a personalized experience.
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {/* Customer Card */}
          <Pressable
            onPress={() => setSelected('customer')}
            style={{
              backgroundColor: selected === 'customer' ? '#FFF7ED' : '#F9FAFB',
              borderWidth: 2,
              borderColor: selected === 'customer' ? colors.primary : '#E5E7EB',
              borderRadius: 24,
              padding: 24,
              minHeight: 160,
              shadowColor: selected === 'customer' ? colors.primary : '#000',
              shadowOpacity: selected === 'customer' ? 0.1 : 0.03,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: selected === 'customer' ? 6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: selected === 'customer' ? colors.primary : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="home-outline" size={26} color={selected === 'customer' ? '#FFFFFF' : '#9CA3AF'} />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 22, color: selected === 'customer' ? colors.primary : '#1B1B27' }}>
                  Need a service?
                </Text>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, lineHeight: 20, color: '#9CA3AF', marginTop: 8 }}>
                  Find and book trusted professionals for home repairs, installations, and more.
                </Text>
              </View>
            </View>
            {selected === 'customer' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: colors.primary }}>SELECTED</Text>
              </View>
            )}
          </Pressable>

          {/* Provider Card */}
          <Pressable
            onPress={() => setSelected('provider')}
            style={{
              backgroundColor: selected === 'provider' ? '#FFF7ED' : '#F9FAFB',
              borderWidth: 2,
              borderColor: selected === 'provider' ? colors.primary : '#E5E7EB',
              borderRadius: 24,
              padding: 24,
              minHeight: 160,
              shadowColor: selected === 'provider' ? colors.primary : '#000',
              shadowOpacity: selected === 'provider' ? 0.1 : 0.03,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: selected === 'provider' ? 6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: selected === 'provider' ? colors.primary : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="wrench-outline" size={26} color={selected === 'provider' ? '#FFFFFF' : '#9CA3AF'} />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 22, color: selected === 'provider' ? colors.primary : '#1B1B27' }}>
                  Want to earn?
                </Text>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, lineHeight: 20, color: '#9CA3AF', marginTop: 8 }}>
                  Accept jobs, grow your business, and earn with Pakistan's trusted marketplace.
                </Text>
              </View>
            </View>
            {selected === 'provider' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: colors.primary }}>SELECTED</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={{ paddingBottom: 32 }}>
          <Pressable
            onPress={handleContinue}
            disabled={!selected}
            style={{
              minHeight: 56,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: selected ? colors.primary : '#D1D5DB',
              shadowColor: selected ? colors.primary : 'transparent',
              shadowOpacity: selected ? 0.25 : 0,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: selected ? 6 : 0,
            }}
          >
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
              {selected === 'customer' ? 'Find a provider' : 'Start earning'}
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#D1D5DB', textAlign: 'center', marginTop: 12 }}>
            You can switch roles anytime from your profile.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
