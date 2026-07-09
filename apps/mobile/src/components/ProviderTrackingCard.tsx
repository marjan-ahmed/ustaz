import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useServiceTimer } from '../hooks/useServiceTimer';

interface ProviderInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  rating_avg?: number;
  rating_count?: number;
  service_type?: string;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ProviderTrackingCardProps {
  status: string;
  provider: ProviderInfo;
  liveLocation?: LiveLocation | null;
  userLat: number | null;
  userLng: number | null;
  serviceStartedAt?: string | null;
  onChat: () => void;
}

const STATUS_META: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
  accepted: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Provider accepted your request', icon: 'checkmark-circle' },
  provider_enroute: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Provider is heading to you', icon: 'car' },
  arriving: { color: '#6366F1', bgColor: '#E0E7FF', label: 'Almost there', icon: 'location' },
  arrived: { color: '#10B981', bgColor: '#D1FAE5', label: 'Provider has arrived', icon: 'location' },
  in_progress: { color: colors.primary, bgColor: '#FEE2E2', label: 'Working on your service', icon: 'hammer' },
  completed: { color: '#10B981', bgColor: '#D1FAE5', label: 'Service complete', icon: 'checkmark-done-circle' },
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatETA(distanceKm: number): string {
  const minutes = Math.max(1, Math.round((distanceKm / 30) * 60));
  return `${minutes} min`;
}

export default function ProviderTrackingCard({ status, provider, liveLocation, userLat, userLng, serviceStartedAt, onChat }: ProviderTrackingCardProps) {
  const { elapsedFormatted } = useServiceTimer(serviceStartedAt);
  const meta = STATUS_META[status] ?? STATUS_META.accepted;
  const providerName = `${provider.firstName ?? ''} ${provider.lastName ?? ''}`.trim() || 'Provider';

  const hasCustomerLocation = Number.isFinite(userLat) && Number.isFinite(userLng);
  const distance = liveLocation && hasCustomerLocation ? haversine(userLat as number, userLng as number, liveLocation.latitude, liveLocation.longitude) : null;
  const hasLive = !!liveLocation && (Date.now() - new Date(liveLocation.updated_at).getTime()) < 30000;

  return (
    <View style={{ borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
      {/* Status header */}
      <View style={{ backgroundColor: meta.bgColor, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
        </View>
        {hasLive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: '#10B981' }}>Live</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 18 }}>
        {/* Provider identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: colors.primary }}>{providerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#1B1B27' }}>{providerName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#3B82F6' }}>Verified Ustaz</Text>
              {provider.rating_avg != null && provider.rating_avg > 0 && (
                <>
                  <Text style={{ color: '#D1D5DB' }}>|</Text>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#1B1B27' }}>{provider.rating_avg.toFixed(1)}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF' }}>({provider.rating_count ?? 0})</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ETA / Distance / Timer tiles */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {distance != null && (
            <>
              <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#EFF6FF', padding: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#3B82F6' }}>ETA</Text>
                <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27', marginTop: 2 }}>{formatETA(distance)}</Text>
              </View>
              <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#F0FDF4', padding: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#10B981' }}>Distance</Text>
                <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27', marginTop: 2 }}>{formatDistance(distance)}</Text>
              </View>
            </>
          )}
          {status === 'in_progress' && (
            <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#FFF7ED', padding: 12 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: colors.primary }}>Elapsed</Text>
              <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27', marginTop: 2 }}>{elapsedFormatted}</Text>
            </View>
          )}
          {distance == null && status !== 'in_progress' && (
            <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#F9FAFB', padding: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF' }}>Waiting for location...</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        {provider.phone && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => Linking.openURL(`tel:${provider.phone}`)}
              style={{ minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: '#F3F4F6' }}>
              <Ionicons name="call" size={16} color="#374151" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#374151' }}>Call</Text>
            </Pressable>
            <Pressable onPress={onChat}
              style={{ minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: colors.primary }}>
              <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Chat</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
