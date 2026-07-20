import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { getProviderActiveRequests, getProviderPendingRequests, getProviderStats, getWallet, respondToServiceRequest, updateRequestStatus, setProviderOnlineStatus, setProviderAvailability, statusLabel, type ProviderNotification, type ServiceRequest } from '@/lib/ustaz-api';
import { useProviderLocationTracker } from '@/hooks/useProviderLocationTracker';
import { useProviderAlwaysOnLocation } from '@/hooks/useProviderAlwaysOnLocation';
import NotificationBell from '@/components/NotificationBell';
import ProviderCustomerMap from '@/components/ProviderCustomerMap';
import { useNotificationsContext } from '@/context/NotificationsContext';

const nextAction: Partial<Record<string, { action: 'completed'; label: string; icon: string }>> = {
  arrived: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
  in_progress: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
  work_in_progress: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
};

const WORKFLOW_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { key: 'arrived', label: 'Arrived', icon: 'location' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-circle' },
];

const AUTO_ARRIVAL_PENDING_STATUSES = ['accepted', 'provider_enroute', 'arriving'];
const DASH_WELCOME_KEY_PREFIX = 'ustaz_dash_welcome_';

function formatPakistaniTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function ProviderHome() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotificationsContext();
  const [pending, setPending] = useState<ProviderNotification[]>([]);
  const [active, setActive] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [cancelledAlert, setCancelledAlert] = useState<{ serviceType: string; customerName: string } | null>(null);

  const alwaysOnLocation = useProviderAlwaysOnLocation(user?.id ?? null);

  const walletBalance = Number(wallet?.balance ?? 0);
  const hasWalletMinimum = walletBalance >= PROVIDER_MIN_WALLET_BALANCE;
  const primaryRequest = active[0] ?? null;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const [p, a, s, w] = await Promise.all([
        getProviderPendingRequests(user.id), getProviderActiveRequests(user.id),
        getProviderStats(user.id).catch(() => null), getWallet(user.id).catch(() => null),
      ]);
      setPending(p); setActive(a); setStats(s); setWallet(w);
    } catch (err: any) { setError(err?.message ?? 'Could not load dashboard.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  // Realtime: refresh when notifications arrive or active request status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`provider-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${user.id}` },
        () => { load(); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `accepted_by_provider_id=eq.${user.id}` },
        async (payload) => {
          const updated = payload.new as any;
          if (updated?.status === 'cancelled') {
            // Look up customer name before clearing
            let customerName = 'A customer';
            try {
              const { data: userData } = await supabase.rpc('get_user_display_name', { p_user_id: updated.user_id });
              if (userData) customerName = userData;
            } catch {}
            setCancelledAlert({ serviceType: updated.service_type || 'Service', customerName });
            setTimeout(() => setCancelledAlert(null), 5000);
          }
          if (['cancelled', 'completed', 'no_ustaz_found'].includes(updated?.status)) {
            load();
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(DASH_WELCOME_KEY_PREFIX + user.id)
      .then((value) => setShowWelcomeCard(value === '1'))
      .catch(() => setShowWelcomeCard(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setProviderOnlineStatus(user.id, true).catch(() => {});
    setProviderAvailability(user.id, 'available').catch(() => {});
    return () => {
      setProviderAvailability(user.id, 'offline').catch(() => {});
    };
  }, [user?.id]);

  // Always-on location tracking for receiving nearby requests
  useEffect(() => {
    if (user?.id && isSignedIn) {
      alwaysOnLocation.startTracking();
    }
    return () => alwaysOnLocation.stopTracking();
  }, [user?.id, isSignedIn]);

  const { isSharing, currentLocation, lastUpdateTime, error: trackerError } = useProviderLocationTracker({
    providerId: user?.id ?? '',
    requestId: primaryRequest?.id ?? null,
    isActive: !!primaryRequest && ['accepted', 'provider_enroute', 'arriving', 'arrived', 'in_progress', 'work_in_progress'].includes(primaryRequest.status),
    onAutoArrived: load,
  });

  async function handleRequest(requestId: string, action: 'accept' | 'reject') {
    setActing(`${requestId}:${action}`); setError(null);
    try {
      if (action === 'accept' && !hasWalletMinimum) {
        router.push('/(provider)/wallet');
        throw new Error('Keep at least Rs. ' + PROVIDER_MIN_WALLET_BALANCE + ' in your wallet before accepting service requests.');
      }
      await respondToServiceRequest(requestId, action);
      if (action === 'accept' && user) {
        setProviderAvailability(user.id, 'busy').catch(() => {});
      }
      await load();
    }
    catch (err: any) { setError(err?.message ?? `Could not ${action}.`); }
    finally { setActing(null); }
  }

  async function dismissWelcome(goToWallet = false) {
    try { if (user) await AsyncStorage.removeItem(DASH_WELCOME_KEY_PREFIX + user.id); } catch {}
    setShowWelcomeCard(false);
    if (goToWallet) router.push('/(provider)/wallet');
  }

  async function advance(request: ServiceRequest) {
    if (!user) return;
    const action = nextAction[request.status];
    if (!action) return;
    setActing(`${request.id}:${action.action}`); setError(null);
    try {
      await updateRequestStatus(request.id, user.id, action.action);
      if (action.action === 'completed') {
        setProviderAvailability(user.id, 'available').catch(() => {});
      }
      await load();
    }
    catch (err: any) { setError(err?.message ?? 'Could not update status.'); }
    finally { setActing(null); }
  }

  if (authLoading || !isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;

  const normalizedWorkflowStatus = primaryRequest?.status === 'completed'
    ? 'completed'
    : primaryRequest && ['arrived', 'in_progress', 'work_in_progress'].includes(primaryRequest.status)
      ? 'arrived'
      : primaryRequest
        ? 'accepted'
        : null;
  const workflowIdx = normalizedWorkflowStatus ? WORKFLOW_STEPS.findIndex((s) => s.key === normalizedWorkflowStatus) : -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.primary }}>USTAZ</Text>
            <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginTop: 2 }}>Provider Hub</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isSharing && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#ECFDF5' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: '#10B981' }}>Live</Text>
              </View>
            )}
            <NotificationBell unreadCount={unreadCount} />
          </View>
        </View>

        {showWelcomeCard && (
          <View style={{ marginBottom: 20, borderRadius: 24, backgroundColor: '#111828', padding: 20, overflow: 'hidden', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
            <View style={{ position: 'absolute', right: -38, top: -42, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,158,11,0.18)' }} />
            <View style={{ position: 'absolute', left: -32, bottom: -36, width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(219,75,13,0.18)' }} />
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="sparkles" size={34} color={colors.primary} />
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.18)', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: '#34D399' }}>WELCOME BONUS</Text>
              </View>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#FFFFFF', textAlign: 'center', lineHeight: 30 }}>Congrats! You received</Text>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#FFFFFF', textAlign: 'center', lineHeight: 30 }}>
                <Text style={{ color: '#F59E0B' }}>Rs. 500</Text> in your wallet!
              </Text>
            </View>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 20, marginTop: 14, textAlign: 'center' }}>
              Start earning immediately. Keep at least Rs. {PROVIDER_MIN_WALLET_BALANCE} in your wallet to receive and accept service requests.
            </Text>
            <View style={{ marginTop: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 14 }}>
              <Ionicons name="wallet" size={18} color="#F59E0B" />
              <Text style={{ fontFamily: 'Anton', fontSize: 24, color: '#FFFFFF' }}>Rs. 500</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>available now</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => dismissWelcome(false)} style={{ minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Close</Text>
              </Pressable>
              <Pressable onPress={() => dismissWelcome(true)} style={{ minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Go to Wallet</Text>
              </Pressable>
            </View>
          </View>
        )}

        {error ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text></View> : null}
        {trackerError ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{trackerError}</Text></View> : null}

        {/* Cancellation alert */}
        {cancelledAlert && (
          <Pressable onPress={() => setCancelledAlert(null)} style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#991B1B' }}>
                {cancelledAlert.customerName}
              </Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                cancelled {cancelledAlert.serviceType} request
              </Text>
            </View>
            <Ionicons name="close" size={16} color="#EF4444" />
          </Pressable>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F9FAFB', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 24, color: '#1B1B27' }}>{stats?.completed_jobs ?? stats?.completed_count ?? 0}</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Jobs done</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F9FAFB', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.primary }}>{pending.length}</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Pending</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F9FAFB', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 24, color: '#10B981' }}>{active.length}</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Active</Text>
          </View>
        </View>

        {/* Wallet */}
        <View style={{ marginBottom: 20, borderRadius: 20, backgroundColor: '#1B1B27', padding: 20 }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)' }}>Wallet balance</Text>
          <Text style={{ fontFamily: 'Anton', fontSize: 28, color: '#FFFFFF', marginTop: 6 }}>Rs. {walletBalance.toLocaleString('en-PK')}</Text>
        </View>

        {/* Location tracker status */}
        {primaryRequest && (
          <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: isSharing ? '#ECFDF5' : '#F3F4F6', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={isSharing ? 'radio' : 'radio-outline'} size={18} color={isSharing ? '#10B981' : '#9CA3AF'} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: isSharing ? '#10B981' : '#6B7280' }}>
                {isSharing ? 'Sharing live location' : 'Location tracking off'}
              </Text>
              {lastUpdateTime && <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Last update: {lastUpdateTime}</Text>}
            </View>
            {currentLocation && (
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF' }}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        )}

        {/* Workflow steps for primary request */}
        {primaryRequest && workflowIdx >= 0 && (
          <View style={{ marginBottom: 20, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12 }}>Job progress</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const isDone = i < workflowIdx;
                const isCurrent = i === workflowIdx;
                return (
                  <View key={step.key} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDone ? '#10B981' : isCurrent ? colors.primary : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                      {isDone ? <Ionicons name="checkmark" size={12} color="#FFF" /> : <Ionicons name={step.icon as any} size={12} color={isCurrent ? '#FFF' : '#D1D5DB'} />}
                    </View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 9, color: isDone ? '#10B981' : isCurrent ? '#1B1B27' : '#D1D5DB', marginTop: 4, textAlign: 'center' }}>{step.label}</Text>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <View style={{ position: 'absolute', top: 14, left: '55%', width: '90%', height: 2, backgroundColor: isDone ? '#10B981' : '#F3F4F6' }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Pending */}
        {hasWalletMinimum && pending.length > 0 && (
          <>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#1B1B27', marginBottom: 12 }}>New requests</Text>
            <View style={{ marginBottom: 20, gap: 10 }}>
              {pending.map((item) => (
                <View key={item.notificationId} style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 18, borderWidth: 1, borderColor: `${colors.primary}20` }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#10B981' }}>New request</Text>
                    </View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF' }}>{formatPakistaniTime(item.createdAt)}</Text>
                  </View>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27', marginTop: 10 }}>{item.serviceType ?? item.requestDetails?.service_type ?? 'Service'}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginTop: 4 }} numberOfLines={2}>{item.requestDetails?.request_details ?? item.message ?? 'Customer needs help nearby.'}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <Pressable onPress={() => handleRequest(item.requestId, 'accept')} disabled={!!acting || !hasWalletMinimum}
                      style={{ minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: acting === `${item.requestId}:accept` ? '#D1D5DB' : colors.primary }}>
                      {acting === `${item.requestId}:accept` ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Accept</Text>}
                    </Pressable>
                    <Pressable onPress={() => handleRequest(item.requestId, 'reject')} disabled={!!acting}
                      style={{ minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#F3F4F6' }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Active Jobs */}
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 17, fontWeight: '700', color: '#1B1B27', marginBottom: 12 }}>Active jobs</Text>
        {active.length === 0 ? (
          <View style={{ alignItems: 'center', borderRadius: 20, backgroundColor: '#F9FAFB', paddingVertical: 48, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <MaterialCommunityIcons name="tools" size={40} color="#D1D5DB" />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', marginTop: 12 }}>No active jobs right now.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {active.map((request) => {
              const action = nextAction[request.status];
              const isWaitingForAutoArrival = AUTO_ARRIVAL_PENDING_STATUSES.includes(request.status);
              return (
                <View key={request.id} style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 18, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27' }}>{request.service_type}</Text>
                    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: `${colors.primary}10` }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: colors.primary }}>{statusLabel(request.status)}</Text>
                    </View>
                  </View>
                  {request.request_details ? <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginTop: 8 }} numberOfLines={2}>{request.request_details}</Text> : null}
                  {request.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', flex: 1 }} numberOfLines={1}>{request.address}</Text>
                    </View>
                  )}
                  {request.request_latitude && request.request_longitude && (
                    <View style={{ marginTop: 10 }}>
                      <ProviderCustomerMap
                        customerLat={request.request_latitude}
                        customerLng={request.request_longitude}
                        providerLat={currentLocation?.latitude ?? null}
                        providerLng={currentLocation?.longitude ?? null}
                        height={180}
                      />
                    </View>
                  )}
                  {(action || isWaitingForAutoArrival) && (
                    <View style={{ marginTop: 14, gap: 10 }}>
                      {action ? (
                        <View style={{ gap: 10 }}>
                          <View style={{ borderRadius: 14, backgroundColor: '#ECFDF5', padding: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#047857' }}>Arrival confirmed automatically.</Text>
                            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#059669', marginTop: 2 }}>Complete the job only when the work is finished.</Text>
                          </View>
                          <Pressable onPress={() => advance(request)} disabled={!!acting}
                            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: acting === `${request.id}:${action.action}` ? '#D1D5DB' : colors.primary }}>
                            {acting === `${request.id}:${action.action}` ? <ActivityIndicator color="#FFF" size="small" /> : (
                              <>
                                <Ionicons name={action.icon as any} size={16} color="#FFFFFF" />
                                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Complete Job</Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      ) : (
                        <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 12, paddingVertical: 10 }}>
                          <Ionicons name="navigate-circle-outline" size={22} color="#2563EB" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>GPS is tracking arrival automatically.</Text>
                            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#2563EB', marginTop: 2 }}>Go to the customer location. No manual arrival button is needed.</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  <Pressable onPress={() => router.push(`/(provider)/chat?peer=${request.user_id}`)}
                    style={{ minHeight: 44, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, backgroundColor: '#F3F4F6' }}>
                    <Ionicons name="chatbubble" size={16} color="#374151" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#374151' }}>Chat with Customer</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}













