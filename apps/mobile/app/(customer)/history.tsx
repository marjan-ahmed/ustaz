import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { fileWarrantyClaim, getCustomerHistory, statusLabel, type HistoryRow } from '@/lib/ustaz-api';
import { useAuth } from '@/lib/useAuth';
import { Badge, Button, Card, CircularGauge, Drift, EmptyState, FadeInUp, IsoServiceScene, Screen, SectionHeader, Skeleton, Stagger, Text, TextField } from '@/components/mobile-ui';
import { color, radius, space } from '@/theme/tokens';

const WARRANTY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function warrantyMsLeft(completedAt: string | null): number | null {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() + WARRANTY_WINDOW_MS - Date.now();
  return ms > 0 ? ms : null;
}

function warrantyLeft(completedAt: string | null) {
  const ms = warrantyMsLeft(completedAt);
  if (ms === null) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${Math.floor((ms % 3_600_000) / 60_000)}m left`;
}

function statusTone(status: string): 'success' | 'error' | 'primary' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'error';
  if (status === 'in_progress' || status === 'work_in_progress') return 'primary';
  return 'warning';
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

  if (authLoading || !isSignedIn) return (
    <Screen bg={color.cream} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.primary} />
      </View>
    </Screen>
  );

  return (
    <Screen bg={color.cream} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 120 }}>
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.lg }}>My Jobs</Text>
        </FadeInUp>

        {error && <FadeInUp><Card variant="flat" style={{ backgroundColor: color.errorBg, marginBottom: space.md }}><Text variant="label" style={{ color: color.error }}>{error}</Text></Card></FadeInUp>}
        {message && <FadeInUp><Card variant="flat" style={{ backgroundColor: color.successBg, marginBottom: space.md }}><Text variant="label" style={{ color: color.success }}>{message}</Text></Card></FadeInUp>}

        {loading ? (
          <View style={{ gap: space.md }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} h={120} r={radius.xl} />)}
          </View>
        ) : rows.length === 0 ? (
          <FadeInUp delay={60}>
            <EmptyState
              illustration={<Drift distance={6}><IsoServiceScene size={140} variant="tracking" /></Drift>}
              title="No jobs yet"
              subtitle="Create a service request from the Find tab and it will appear here."
            />
          </FadeInUp>
        ) : (
          <View style={{ gap: space.sm }}>
            <Stagger step={50}>
              {rows.map((row) => {
                const remaining = warrantyLeft(row.completed_at);
                const canClaim = row.status === 'completed' && !!remaining && !row.warranty_status;
                return (
                  <Card key={row.request_id} variant="elevated">
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="h3">{row.service_type}</Text>
                        {row.provider_name && <Text variant="label" tone="muted" style={{ marginTop: 2 }}>{row.provider_name}</Text>}
                        {row.address && <Text variant="caption" tone="muted" style={{ marginTop: 2 }} numberOfLines={1}>{row.address}</Text>}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Badge label={statusLabel(row.status)} tone={statusTone(row.status)} />
                        <Text variant="caption" tone="muted">{fmtDate(row.created_at)}</Text>
                      </View>
                    </View>

                    {row.completed_at && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: radius.md, backgroundColor: color.surfaceAlt, padding: space.sm, marginBottom: space.sm }}>
                        {!row.warranty_status && remaining && (
                          <CircularGauge
                            size={36} strokeWidth={4}
                            progress={(warrantyMsLeft(row.completed_at) ?? 0) / WARRANTY_WINDOW_MS}
                            color={color.primary}
                            trackColor={color.line}
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 2 }}>Warranty</Text>
                          <Text variant="label" tone={remaining ? 'primary' : 'muted'}>
                            {row.warranty_status ? `Status: ${row.warranty_status}` : remaining ? `Available: ${remaining}` : 'Window closed'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {claimFor === row.request_id ? (
                      <View style={{ gap: space.sm }}>
                        <TextField
                          value={claimDesc} onChangeText={setClaimDesc} multiline
                          placeholder="What went wrong?"
                          style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: space.sm }}
                        />
                        <View style={{ flexDirection: 'row', gap: space.sm }}>
                          <Button label="Cancel" variant="soft" full={false} style={{ flex: 1 }} onPress={() => { setClaimFor(null); setClaimDesc(''); }} />
                          <Button label="Submit" variant="primary" full={false} style={{ flex: 1 }} loading={claiming === row.request_id} disabled={!!claiming} onPress={() => submitClaim(row.request_id)} />
                        </View>
                      </View>
                    ) : canClaim ? (
                      <Button
                        label="🛡️ Claim Warranty"
                        variant="soft"
                        onPress={() => setClaimFor(row.request_id)}
                      />
                    ) : null}
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
