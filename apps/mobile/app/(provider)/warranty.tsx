import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { getWarrantyClaims, respondToWarranty } from '@/lib/ustaz-api';

export default function WarrantyScreen() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
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

  if (authLoading || !isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27', marginBottom: 20 }}>Warranty Claims</Text>

        {error ? <View style={{ marginBottom: 16, borderRadius: 14, backgroundColor: '#FEF2F2', padding: 16 }}><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text></View> : null}

        {loading ? <View style={{ alignItems: 'center', paddingVertical: 32 }}><ActivityIndicator color={colors.primary} /></View>
        : claims.length === 0 ? (
          <View style={{ alignItems: 'center', borderRadius: 20, backgroundColor: '#F9FAFB', paddingVertical: 64, paddingHorizontal: 32, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <MaterialCommunityIcons name="shield-check" size={48} color="#D1D5DB" />
            <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginTop: 16 }}>All clear</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>No pending warranty claims. When a customer reports an issue within 3 days, it will appear here.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {claims.map((claim: any) => (
              <View key={claim.id} style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 18, borderWidth: 1, borderColor: '#FBBF24' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#F59E0B' }}>Warranty claim</Text>
                </View>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27', marginTop: 10 }}>{claim.service_requests?.service_type ?? 'Service'}</Text>
                {claim.address && <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#D1D5DB', marginTop: 2 }}>{claim.address}</Text>}
                {claim.description && <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, lineHeight: 20, color: '#6B7280', marginTop: 8 }}>{claim.description}</Text>}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Pressable onPress={() => handleResponse(claim.id, 'accepted')} disabled={!!acting}
                    style={{ minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: acting === `${claim.id}:accepted` ? '#D1D5DB' : colors.primary }}>
                    {acting === `${claim.id}:accepted` ? <ActivityIndicator color="#FFF" size="small" /> : (
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>I'll return & fix</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => handleResponse(claim.id, 'refused')} disabled={!!acting}
                    style={{ minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#FEF2F2' }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Refuse</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </View>
    </SafeAreaView>
  );
}
