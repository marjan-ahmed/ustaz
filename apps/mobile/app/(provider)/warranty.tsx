import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { getWarrantyClaims, respondToWarranty } from '@/lib/ustaz-api';
import {
  Badge, Button, Card, EmptyState, FadeInUp, PressableScale, Screen, Stagger, Text,
} from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';
import { useLanguage } from '@/i18n';

export default function WarrantyScreen() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const { t } = useLanguage();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try { setClaims(await getWarrantyClaims(user.id)); }
    catch (err: any) { setError(err?.message ?? 'Could not load claims.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function handleResponse(claimId: string, response: 'accepted' | 'refused') {
    setActing(`${claimId}:${response}`); setError(null);
    try { await respondToWarranty(claimId, response); await load(); }
    catch (err: any) { setError(err?.message ?? 'Could not respond.'); }
    finally { setActing(null); }
  }

  if (authLoading || !isSignedIn) {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={color.white} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.xl }}>{t('warranty.title')}</Text>
        </FadeInUp>

        {error && (
          <FadeInUp>
            <Card variant="flat" style={{ marginBottom: space.md, backgroundColor: color.errorBg }}>
              <Text variant="label" style={{ color: color.error }}>{error}</Text>
            </Card>
          </FadeInUp>
        )}

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: space['3xl'] }}>
            <ActivityIndicator color={color.primary} />
          </View>
        ) : claims.length === 0 ? (
          <EmptyState
            illustration={<MaterialCommunityIcons name="shield-check" size={64} color={color.line} />}
            title={t('warranty.allClear')}
            subtitle={t('warranty.noPendingClaims')}
          />
        ) : (
          <Stagger step={50}>
            {claims.map((claim: any) => (
              <Card key={claim.id} variant="elevated" style={{ marginBottom: space.md, borderWidth: 1.5, borderColor: color.warning }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
                  <Badge label={t('warranty.warrantyClaim')} tone="warning" />
                </View>
                <Text variant="bodyLg" style={{ fontWeight: '700' }}>{claim.service_requests?.service_type ?? 'Service'}</Text>
                {claim.address && <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>{claim.address}</Text>}
                {claim.description && <Text variant="label" tone="soft" style={{ marginTop: space.sm, lineHeight: 20 }}>{claim.description}</Text>}
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
                  <Button
                    label={t('warranty.returnAndFix')}
                    variant="primary"
                    full={false}
                    style={{ flex: 1 }}
                    loading={acting === `${claim.id}:accepted`}
                    disabled={!!acting}
                    onPress={() => handleResponse(claim.id, 'accepted')}
                  />
                  <Button
                    label={t('warranty.refuse')}
                    variant="soft"
                    full={false}
                    style={{ flex: 1 }}
                    loading={acting === `${claim.id}:refused`}
                    disabled={!!acting}
                    onPress={() => handleResponse(claim.id, 'refused')}
                  />
                </View>
              </Card>
            ))}
          </Stagger>
        )}
        <View style={{ height: 100 }} />
      </View>
    </Screen>
  );
}
