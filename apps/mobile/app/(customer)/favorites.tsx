import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Button, Card, Drift, EmptyState, FadeInUp, IsoServiceScene, PressableScale, Screen, Stagger, Text,
} from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';

interface FavoriteProvider {
  provider_id: string;
  first_name: string;
  last_name: string;
  service_type: string;
  phone_number: string;
  avatar_url: string | null;
  rating_avg: number;
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_favorite_providers', {
        p_customer_id: user.id,
      });
      if (!error && data) setFavorites(data);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  async function removeFavorite(providerId: string) {
    if (!user) return;
    setRemoving(providerId);
    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('provider_id', providerId);
      setFavorites(prev => prev.filter(f => f.provider_id !== providerId));
    } catch {}
    setRemoving(null);
  }

  function rebookProvider(provider: FavoriteProvider) {
    router.push({
      pathname: '/(customer)/book',
      params: {
        service: provider.service_type,
        favoritedProviderId: provider.provider_id,
        favoritedProviderName: `${provider.first_name} ${provider.last_name}`,
      },
    });
  }

  return (
    <Screen bg={color.white} edges={['top']}>
      <FadeInUp>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: space.lg, paddingBottom: space.sm }}>
          <PressableScale onPress={() => router.back()} style={{ padding: space.xs }}>
            <Ionicons name="arrow-back" size={24} color={color.navy} />
          </PressableScale>
          <Text variant="h1" style={{ marginLeft: space.md }}>Favorites</Text>
        </View>
      </FadeInUp>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" tone="muted">Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <EmptyState
          illustration={<Drift distance={6}><IsoServiceScene size={140} variant="general" /></Drift>}
          title="No favorites yet"
          subtitle="After a service, tap the heart icon to save your favorite providers for quick rebooking"
        />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.lg }}>
          <Stagger step={40}>
            {favorites.map((fav) => (
              <Card key={fav.provider_id} variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Avatar */}
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${color.primary}14`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.primary }}>
                    <Text variant="h3" tone="primary">{fav.first_name?.charAt(0)}{fav.last_name?.charAt(0)}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <Text variant="bodyLg" style={{ fontWeight: '700' }}>{fav.first_name} {fav.last_name}</Text>
                    <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{fav.service_type}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text variant="caption" tone="soft">
                        {fav.rating_avg ? Number(fav.rating_avg).toFixed(1) : 'New'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ gap: 6 }}>
                    <PressableScale onPress={() => rebookProvider(fav)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: color.primary, alignItems: 'center' }}>
                      <Ionicons name="refresh" size={14} color={color.white} />
                      <Text variant="caption" style={{ color: color.white, marginTop: 2, fontWeight: '700' }}>Rebook</Text>
                    </PressableScale>
                    <PressableScale onPress={() => removeFavorite(fav.provider_id)} disabled={removing === fav.provider_id}
                      style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: color.errorBg, alignItems: 'center' }}>
                      {removing === fav.provider_id ? (
                        <Text variant="caption" style={{ color: color.error }}>...</Text>
                      ) : (
                        <Ionicons name="heart" size={14} color={color.error} />
                      )}
                    </PressableScale>
                  </View>
                </View>
              </Card>
            ))}
          </Stagger>
        </View>
      )}
    </Screen>
  );
}
