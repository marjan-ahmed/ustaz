import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { getActiveCustomerRequest, statusLabel, type ServiceRequest } from '@/lib/ustaz-api';
import { serviceCategories } from '@/content/home';
import NotificationBell from '@/components/NotificationBell';
import { useNotificationsContext } from '@/context/NotificationsContext';

const quickActions = [
  { icon: 'flash' as const, family: 'material' as const, label: 'Electrician', service: 'Electrician' },
  { icon: 'water' as const, family: 'material' as const, label: 'Plumber', service: 'Plumber' },
  { icon: 'snowflake' as const, family: 'material' as const, label: 'AC Repair', service: 'AC Repair' },
  { icon: 'hammer' as const, family: 'material' as const, label: 'Carpenter', service: 'Carpenter' },
];

const serviceIconMap: Record<string, string> = {
  Electrician: 'flash',
  Plumber: 'water',
  Carpenter: 'hammer',
  'AC Repair': 'snowflake',
  Solar: 'solar-power',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.primary }}>USTAZ</Text>
            <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginTop: 2 }}>Home Services</Text>
          </View>
          <NotificationBell unreadCount={unreadCount} />
        </View>

        {/* Active Request */}
        {activeRequest && (
          <Link href="/find" asChild>
            <Pressable style={{ marginBottom: 24, borderRadius: 20, backgroundColor: colors.primary, padding: 20, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' }} />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)' }}>Active request</Text>
              </View>
              <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#FFFFFF', marginTop: 8 }}>{activeRequest.service_type}</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{statusLabel(activeRequest.status)}</Text>
            </Pressable>
          </Link>
        )}

        {/* Quick Actions */}
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#1B1B27', marginBottom: 12 }}>Quick find</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {quickActions.map((action) => (
            <Link key={action.service} href={{ pathname: '/find', params: { service: action.service } }} asChild>
              <Pressable
                style={{
                  width: '47%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 16,
                  backgroundColor: '#F9FAFB',
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={action.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>{action.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        {/* All Services */}
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#1B1B27', marginBottom: 12 }}>All services</Text>
        <View style={{ gap: 10 }}>
          {serviceCategories.map((service) => (
            <Link key={service.name} href={{ pathname: '/find', params: { service: service.name } }} asChild>
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: service.tone, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={(serviceIconMap[service.name] || 'help-circle') as any} size={20} color={service.accent} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27' }}>{service.name}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{service.note}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </View>
    </SafeAreaView>
  );
}
