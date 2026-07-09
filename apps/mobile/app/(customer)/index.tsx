import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { getActiveCustomerRequest, statusLabel, type ServiceRequest } from '@/lib/ustaz-api';
import { serviceCategories } from '@/content/home';
import NotificationBell from '@/components/NotificationBell';
import { useNotificationsContext } from '@/context/NotificationsContext';

const quickActions = [
  { icon: 'flash' as const, label: 'Electrician', service: 'Electrician Service' },
  { icon: 'water' as const, label: 'Plumber', service: 'Plumbing' },
  { icon: 'snowflake' as const, label: 'AC Repair', service: 'AC Maintenance' },
  { icon: 'hammer' as const, label: 'Carpenter', service: 'Carpentry' },
];

const quickActionTones = [
  { bg: '#DB4B0D', fg: '#FFFFFF' },
  { bg: '#111828', fg: '#FF6B4A' },
  { bg: '#FF6B4A', fg: '#FFFFFF' },
  { bg: '#FEF3C7', fg: '#DB4B0D' },
];

const serviceIconMap: Record<string, string> = {
  'Electrician Service': 'flash',
  Plumbing: 'water',
  Carpentry: 'hammer',
  'AC Maintenance': 'snowflake',
  'Solar Technician': 'solar-power',
  Cleaning: 'broom',
};

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
      {/* Brand Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 16, color: colors.primary, fontWeight: '900' }}>U</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#FFFFFF', letterSpacing: 1 }}>USTAZ</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Home Services</Text>
            </View>
          </View>
          <NotificationBell unreadCount={unreadCount} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Active Request */}
        {activeRequest && (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Link href="/book" asChild>
              <Pressable>
                <View style={{ borderRadius: 20, backgroundColor: colors.navy, padding: 20, overflow: 'hidden' }}>
                  {/* Decorative circles */}
                  <View style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(219,75,13,0.2)' }} />
                  <View style={{ position: 'absolute', right: 30, bottom: -30, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(219,75,13,0.1)' }} />

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' }} />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)' }}>Active request</Text>
                  </View>
                  <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#FFFFFF', marginBottom: 4 }}>{activeRequest.service_type}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{statusLabel(activeRequest.status)}</Text>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                  </View>
                </View>
              </Pressable>
            </Link>
          </View>
        )}

        {/* Quick Find */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Quick find</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quickActions.map((action, i) => {
              const tone = quickActionTones[i];
              return (
                <Link key={action.service} href={{ pathname: '/book', params: { service: action.service } }} asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      width: '47%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 16,
                      backgroundColor: tone.bg,
                      padding: 16,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${tone.fg}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={action.icon as any} size={18} color={tone.fg} />
                    </View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: tone.fg, flex: 1 }}>{action.label}</Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>

        {/* All Services */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>All services</Text>
          <View style={{ gap: 10 }}>
            {serviceCategories.map((service, i) => {
              const isDark = service.tone === '#111828';
              const iconName = (serviceIconMap[service.name] || 'help-circle') as any;
              return (
                <Link key={service.name} href={{ pathname: '/book', params: { service: service.name } }} asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 16,
                      backgroundColor: isDark ? colors.navy : '#FFFFFF',
                      padding: 16,
                      borderWidth: isDark ? 0 : 1,
                      borderColor: '#F3F4F6',
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: service.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <MaterialCommunityIcons name={iconName} size={22} color={service.iconFg} />
                    </View>
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={{
                        fontFamily: 'AtkinsonHyperlegible',
                        fontSize: 15,
                        fontWeight: '700',
                        color: isDark ? '#FFFFFF' : '#1B1B27',
                      }}>{service.name}</Text>
                      <Text style={{
                        fontFamily: 'AtkinsonHyperlegible',
                        fontSize: 12,
                        color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                        marginTop: 2,
                      }}>{service.note}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.3)' : '#D1D5DB'} />
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>

        {/* Promo Banner */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{
            borderRadius: 20,
            backgroundColor: '#FFF7ED',
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            borderWidth: 1,
            borderColor: '#FED7AA',
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>3-Day Work Guarantee</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Free re-fix if anything breaks within 3 days</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
