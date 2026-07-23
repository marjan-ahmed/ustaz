import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import {
  getProviderActiveRequests, getProviderPendingRequests, getProviderStats,
  getWallet, respondToServiceRequest, updateRequestStatus,
  setProviderOnlineStatus, setProviderAvailability, statusLabel,
  type ProviderNotification, type ServiceRequest,
} from '@/lib/ustaz-api';
import { useProviderLocationTracker } from '@/hooks/useProviderLocationTracker';
import { useProviderAlwaysOnLocation } from '@/hooks/useProviderAlwaysOnLocation';
import NotificationBell from '@/components/NotificationBell';
import ProviderCustomerMap from '@/components/ProviderCustomerMap';
import { useNotificationsContext } from '@/context/NotificationsContext';
import {
  Badge, Button, Card, FadeInUp, GlowBackdrop, IsoWalletScene, NumberTicker,
  PressableScale, Screen, SectionHeader, Skeleton, Stagger,
  StatTile, Text,
} from '@/components/mobile-ui';
import { color, font, gradient, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const nextAction: Partial<Record<string, { action: 'completed'; label: string; icon: string }>> = {
  arrived: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
  in_progress: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
  work_in_progress: { action: 'completed', label: 'Complete job', icon: 'checkmark-circle' },
};

const AUTO_ARRIVAL_PENDING_STATUSES = ['accepted', 'provider_enroute', 'arriving'];
const DASH_WELCOME_KEY_PREFIX = 'ustaz_dash_welcome_';

function formatPakistaniTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true,
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

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`provider-realtime-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `accepted_by_provider_id=eq.${user.id}` }, async (payload) => {
        const updated = payload.new as any;
        if (updated?.status === 'cancelled') {
          let customerName = 'A customer';
          try {
            const { data: userData } = await supabase.rpc('get_user_display_name', { p_user_id: updated.user_id });
            if (userData) customerName = userData;
          } catch {}
          setCancelledAlert({ serviceType: updated.service_type || 'Service', customerName });
          setTimeout(() => setCancelledAlert(null), 5000);
        }
        if (['cancelled', 'completed', 'no_ustaz_found'].includes(updated?.status)) load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(DASH_WELCOME_KEY_PREFIX + user.id)
      .then((v) => setShowWelcomeCard(v === '1'))
      .catch(() => setShowWelcomeCard(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setProviderOnlineStatus(user.id, true).catch(() => {});
    setProviderAvailability(user.id, 'available').catch(() => {});
    return () => { setProviderAvailability(user.id, 'offline').catch(() => {}); };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && isSignedIn) alwaysOnLocation.startTracking();
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
      if (action === 'accept' && user) setProviderAvailability(user.id, 'busy').catch(() => {});
      await load();
    } catch (err: any) { setError(err?.message ?? `Could not ${action}.`); }
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
      if (action.action === 'completed') setProviderAvailability(user.id, 'available').catch(() => {});
      await load();
    } catch (err: any) { setError(err?.message ?? 'Could not update status.'); }
    finally { setActing(null); }
  }

  if (authLoading || !isSignedIn) {
    return (
      <Screen dark>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="h1">Provider Hub</Text>
                {isSharing && <Badge label="LIVE" tone="success" />}
              </View>
            </View>
            <NotificationBell unreadCount={unreadCount} />
          </View>
        </FadeInUp>

        {/* Wallet hero card */}
        <FadeInUp delay={60}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', marginBottom: space.lg, ...shadow.brand }}>
            <LinearGradient colors={gradient.navy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: space.xl }}>
              <GlowBackdrop top={-60} right={-40} size={200} opacity={0.25} />
              <GlowBackdrop color={color.primaryLight} bottom={-40} left={-20} size={160} opacity={0.12} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" tone="inverseSoft" style={{ textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: space.xs }}>
                    Wallet balance
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontFamily: font.numeric, fontSize: 20, color: color.white, marginRight: 6 }}>Rs.</Text>
                    <NumberTicker
                      value={walletBalance}
                      formatter={(n) => Math.round(n).toLocaleString('en-PK')}
                      style={{ fontFamily: font.numeric, fontSize: 36, color: color.white }}
                    />
                  </View>
                </View>
                <IsoWalletScene size={90} />
              </View>
              {!hasWalletMinimum && (
                <View style={{ marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: 'rgba(239,68,68,0.18)', borderRadius: radius.md, padding: space.sm }}>
                  <Ionicons name="warning" size={14} color="#FCA5A5" />
                  <Text variant="caption" style={{ color: '#FCA5A5', flex: 1 }}>
                    Top up to Rs. {PROVIDER_MIN_WALLET_BALANCE} to accept jobs
                  </Text>
                </View>
              )}
              <View style={{ marginTop: space.lg }}>
                <Button label="Top Up Wallet" variant="soft" full={false} onPress={() => router.push('/(provider)/wallet')} />
              </View>
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Stats row */}
        <FadeInUp delay={100}>
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
            {loading ? (
              <>
                <View style={{ flex: 1 }}><Skeleton h={72} r={14} /></View>
                <View style={{ flex: 1 }}><Skeleton h={72} r={14} /></View>
                <View style={{ flex: 1 }}><Skeleton h={72} r={14} /></View>
              </>
            ) : (
              <>
                <StatTile value={String(stats?.completed_jobs ?? stats?.completed_count ?? 0)} label="Jobs done" />
                <StatTile value={String(pending.length)} label="Pending" tone="primary" bg={`${color.primary}10`} />
                <StatTile value={String(active.length)} label="Active" tone="ink" bg={color.successBg} />
              </>
            )}
          </View>
        </FadeInUp>

        {/* Errors */}
        {(error || trackerError) && (
          <FadeInUp>
            <Card variant="flat" style={{ marginBottom: space.md, backgroundColor: color.errorBg }}>
              <Text variant="label" style={{ color: color.error }}>{error || trackerError}</Text>
            </Card>
          </FadeInUp>
        )}

        {/* Cancellation alert */}
        {cancelledAlert && (
          <FadeInUp>
            <PressableScale onPress={() => setCancelledAlert(null)} style={{ marginBottom: space.md }}>
              <Card variant="flat" style={{ backgroundColor: color.errorBg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close-circle" size={22} color={color.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={{ fontWeight: '700', color: '#991B1B' }}>{cancelledAlert.customerName}</Text>
                  <Text variant="caption" style={{ color: '#B91C1C', marginTop: 2 }}>cancelled {cancelledAlert.serviceType} request</Text>
                </View>
                <Ionicons name="close" size={16} color={color.error} />
              </Card>
            </PressableScale>
          </FadeInUp>
        )}

        {/* Welcome bonus card */}
        {showWelcomeCard && (
          <FadeInUp delay={80}>
            <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', marginBottom: space.lg, ...shadow.brand }}>
              <LinearGradient colors={['#1A2440', '#0F1729']} style={{ padding: space.xl }}>
                <GlowBackdrop top={-40} right={-40} size={160} opacity={0.3} />
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: color.cream, alignItems: 'center', justifyContent: 'center', marginBottom: space.md }}>
                    <Ionicons name="sparkles" size={32} color={color.primary} />
                  </View>
                  <Badge label="WELCOME BONUS" tone="success" />
                  <Text variant="h2" tone="inverse" center style={{ marginTop: space.md }}>
                    You received <Text variant="h2" style={{ color: '#F59E0B' }}>Rs. 500</Text>!
                  </Text>
                  <Text variant="label" tone="inverseSoft" center style={{ marginTop: space.sm }}>
                    Keep at least Rs. {PROVIDER_MIN_WALLET_BALANCE} to accept jobs.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xl }}>
                  <Button label="Close" variant="ghost" onPress={() => dismissWelcome(false)} style={{ flex: 1 }} />
                  <Button label="Go to Wallet" variant="primary" onPress={() => dismissWelcome(true)} style={{ flex: 1 }} />
                </View>
              </LinearGradient>
            </View>
          </FadeInUp>
        )}

        {/* Pending requests */}
        {pending.length > 0 && (
          <>
            <SectionHeader title="New Requests" action={`${pending.length}`} />
            <View style={{ gap: space.sm, marginBottom: space.lg }}>
              <Stagger step={50}>
                {pending.map((req) => (
                  <Card key={req.requestId} variant="elevated">
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="h3">{req.serviceType ?? 'Service Request'}</Text>
                        {req.requestDetails?.address && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="location-outline" size={13} color={color.inkMuted} />
                            <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{req.requestDetails.address}</Text>
                          </View>
                        )}
                        {req.createdAt && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="time-outline" size={13} color={color.inkMuted} />
                            <Text variant="caption" tone="muted">
                              {new Date(req.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Badge label="NEW" tone="primary" />
                    </View>
                    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                      <Button
                        label="Reject"
                        variant="soft"
                        full={false}
                        style={{ flex: 1 }}
                        loading={acting === `${req.requestId}:reject`}
                        disabled={!!acting}
                        onPress={() => handleRequest(req.requestId, 'reject')}
                      />
                      <Button
                        label="Accept"
                        variant="primary"
                        full={false}
                        style={{ flex: 1 }}
                        loading={acting === `${req.requestId}:accept`}
                        disabled={!!acting}
                        onPress={() => handleRequest(req.requestId, 'accept')}
                      />
                    </View>
                  </Card>
                ))}
              </Stagger>
            </View>
          </>
        )}

        {/* Active jobs */}
        <SectionHeader title="Active Jobs" />
        {active.length === 0 ? (
          <FadeInUp delay={120}>
            <Card variant="flat" style={{ alignItems: 'center', paddingVertical: space['3xl'] }}>
              <Ionicons name="construct-outline" size={40} color={color.line} />
              <Text variant="label" tone="muted" center style={{ marginTop: space.md }}>No active jobs right now.</Text>
            </Card>
          </FadeInUp>
        ) : (
          <View style={{ gap: space.sm }}>
            <Stagger step={60}>
              {active.map((request) => {
                const action = nextAction[request.status];
                const isWaitingForAutoArrival = AUTO_ARRIVAL_PENDING_STATUSES.includes(request.status);
                return (
                  <Card key={request.id} variant="elevated">
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
                      <Text variant="h3" style={{ flex: 1 }}>{request.service_type}</Text>
                      <Badge label={statusLabel(request.status)} tone="primary" />
                    </View>
                    {request.request_details && (
                      <Text variant="label" tone="muted" numberOfLines={2} style={{ marginBottom: space.sm }}>{request.request_details}</Text>
                    )}
                    {request.address && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: space.sm }}>
                        <Ionicons name="location-outline" size={13} color={color.inkMuted} />
                        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{request.address}</Text>
                      </View>
                    )}
                    {request.request_latitude && request.request_longitude && (
                      <View style={{ marginBottom: space.sm, borderRadius: radius.md, overflow: 'hidden' }}>
                        <ProviderCustomerMap
                          customerLat={request.request_latitude}
                          customerLng={request.request_longitude}
                          providerLat={currentLocation?.latitude ?? null}
                          providerLng={currentLocation?.longitude ?? null}
                          height={180}
                        />
                      </View>
                    )}
                    {action ? (
                      <View style={{ gap: space.sm }}>
                        <View style={{ borderRadius: radius.md, backgroundColor: color.successBg, padding: space.sm, borderWidth: 1, borderColor: '#BBF7D0' }}>
                          <Text variant="caption" style={{ color: '#047857', fontWeight: '700' }}>Arrival confirmed automatically.</Text>
                          <Text variant="caption" style={{ color: '#059669', marginTop: 2 }}>Complete the job only when the work is finished.</Text>
                        </View>
                        <Button
                          label="Complete Job"
                          variant="primary"
                          loading={acting === `${request.id}:${action.action}`}
                          disabled={!!acting}
                          onPress={() => advance(request)}
                        />
                      </View>
                    ) : isWaitingForAutoArrival ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.md, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: space.sm }}>
                        <Ionicons name="navigate-circle-outline" size={22} color="#2563EB" />
                        <View style={{ flex: 1 }}>
                          <Text variant="caption" style={{ fontWeight: '700', color: '#1D4ED8' }}>GPS is tracking arrival automatically.</Text>
                          <Text variant="caption" style={{ color: '#2563EB', marginTop: 2 }}>Head to the customer. No manual arrival needed.</Text>
                        </View>
                      </View>
                    ) : null}
                    <Button
                      label="Chat with Customer"
                      variant="soft"
                      style={{ marginTop: space.sm }}
                      onPress={() => router.push(`/(provider)/chat?peer=${request.user_id}`)}
                    />
                  </Card>
                );
              })}
            </Stagger>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
