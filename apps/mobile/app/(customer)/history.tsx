import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { fileWarrantyClaim, getCustomerHistory, statusLabel, type HistoryRow } from '@/lib/ustaz-api';
import { useAuth } from '@/lib/useAuth';

const WARRANTY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function warrantyLeft(completedAt: string | null) {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() + WARRANTY_WINDOW_MS - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m left`;
}

function statusColor(status: string) {
  switch (status) {
    case 'completed': return '#10B981';
    case 'cancelled': return '#EF4444';
    case 'in_progress': case 'work_in_progress': return '#3B82F6';
    default: return colors.primary;
  }
}

export default function HistoryScreen() {
  const { loading: authLoading, isSignedIn } = useAuth();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimFor, setClaimFor] = useState<string | null>(null);
  const [claimDesc, setClaimDesc] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true); setError(null);
    try { setRows(await getCustomerHistory()); }
    catch (err: any) { setError(err?.message ?? 'Could not load history.'); }
    finally { setLoading(false); }
  }, [isSignedIn]);

  useEffect(() => { load(); }, [load]);

  async function submitClaim(requestId: string) {
    setClaiming(requestId); setError(null); setMessage(null);
    try {
      await fileWarrantyClaim(requestId, claimDesc);
      setMessage('Warranty claim filed successfully.');
      setClaimFor(null); setClaimDesc('');
      await load();
    } catch (err: any) { setError(err?.message ?? 'Could not file claim.'); }
    finally { setClaiming(null); }
  }

  if (authLoading || !isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginBottom: 20 }}>My Jobs</Text>

        {error ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text></View> : null}
        {message ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#ECFDF5', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#10B981' }}>{message}</Text></View> : null}

        {loading ? <View style={{ alignItems: 'center', paddingVertical: 32 }}><ActivityIndicator color={colors.primary} /></View>
        : rows.length === 0 ? (
          <View style={{ alignItems: 'center', borderRadius: 20, backgroundColor: '#F9FAFB', paddingVertical: 64, paddingHorizontal: 32, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginTop: 16 }}>No jobs yet</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>Create a service request from the Find tab and it will appear here.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {rows.map((row) => {
              const remaining = warrantyLeft(row.completed_at);
              const canClaim = row.status === 'completed' && !!remaining && !row.warranty_status;
              return (
                <View key={row.request_id} style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 18, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27' }}>{row.service_type}</Text>
                      {row.provider_name ? <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginTop: 4 }}>{row.provider_name}</Text> : null}
                      {row.address ? <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{row.address}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: `${statusColor(row.status)}15` }}>
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: statusColor(row.status) }}>{statusLabel(row.status)}</Text>
                      </View>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>{fmtDate(row.created_at)}</Text>
                    </View>
                  </View>

                  {row.completed_at && (
                    <View style={{ marginTop: 14, borderRadius: 12, backgroundColor: '#F9FAFB', padding: 12 }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF' }}>WARRANTY</Text>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        {row.warranty_status ? `Status: ${row.warranty_status}` : remaining ? `Available: ${remaining}` : 'Window closed'}
                      </Text>
                    </View>
                  )}

                  {claimFor === row.request_id ? (
                    <View style={{ marginTop: 14 }}>
                      <TextInput value={claimDesc} onChangeText={setClaimDesc} multiline placeholder="What went wrong?" placeholderTextColor="#D1D5DB"
                        style={{ minHeight: 72, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27', textAlignVertical: 'top' }} />
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <Pressable onPress={() => { setClaimFor(null); setClaimDesc(''); }} style={{ minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#F3F4F6' }}>
                          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => submitClaim(row.request_id)} disabled={!!claiming}
                          style={{ minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary }}>
                          {claiming === row.request_id ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Submit</Text>}
                        </Pressable>
                      </View>
                    </View>
                  ) : canClaim ? (
                    <Pressable onPress={() => setClaimFor(row.request_id)}
                      style={{ marginTop: 14, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, backgroundColor: `${colors.primary}10` }}>
                      <MaterialCommunityIcons name="shield-check" size={16} color={colors.primary} />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: colors.primary }}>Claim warranty</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </View>
    </SafeAreaView>
  );
}
