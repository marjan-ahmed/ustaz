import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';

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
    // Navigate to book screen with pre-selected provider
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#1B1B27" />
        </Pressable>
        <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginLeft: 12 }}>My Favorite Providers</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#9CA3AF', marginTop: 16 }}>No favorites yet</Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#D1D5DB', marginTop: 8, textAlign: 'center' }}>
            After a service, tap the heart icon to save your favorite providers for quick rebooking
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {favorites.map((fav) => (
            <View key={fav.provider_id}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 10 }}>
              {/* Avatar */}
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 18, color: colors.primary }}>
                  {fav.first_name?.charAt(0)}{fav.last_name?.charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>
                  {fav.first_name} {fav.last_name}
                </Text>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {fav.service_type}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#6B7280' }}>
                    {fav.rating_avg ? Number(fav.rating_avg).toFixed(1) : 'New'}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 6 }}>
                <Pressable onPress={() => rebookProvider(fav)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' }}>
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, fontWeight: '700', color: '#FFFFFF', marginTop: 2 }}>Rebook</Text>
                </Pressable>
                <Pressable onPress={() => removeFavorite(fav.provider_id)} disabled={removing === fav.provider_id}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center' }}>
                  {removing === fav.provider_id ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <Ionicons name="heart" size={14} color="#EF4444" />
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
