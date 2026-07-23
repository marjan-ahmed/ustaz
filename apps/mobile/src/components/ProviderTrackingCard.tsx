import { Linking, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useServiceTimer } from '../hooks/useServiceTimer';
import { Badge, Button, Card, LottieScene, Numeric, PressableScale, PulseRadar, Text, lottieSources } from './mobile-ui';
import { color, radius, space } from '../theme/tokens';

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

const STATUS_META: Record<string, { tone: 'primary' | 'success' | 'warning' | 'error'; label: string; icon: string }> = {
  accepted: { tone: 'warning', label: 'Provider accepted your request', icon: 'checkmark-circle' },
  provider_enroute: { tone: 'primary', label: 'Provider is heading to you', icon: 'car' },
  arriving: { tone: 'primary', label: 'Almost there', icon: 'location' },
  arrived: { tone: 'success', label: 'Provider has arrived', icon: 'location' },
  in_progress: { tone: 'primary', label: 'Working on your service', icon: 'hammer' },
  completed: { tone: 'success', label: 'Service complete', icon: 'checkmark-done-circle' },
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
  const isEnroute = status === 'provider_enroute' || status === 'arriving';

  return (
    <Card variant="elevated" padded={false} style={{ overflow: 'hidden' }}>
      {/* Status header */}
      <View style={{ backgroundColor: color.surfaceAlt, paddingHorizontal: space.xl, paddingVertical: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {isEnroute && <LottieScene source={lottieSources.providerEnroute} size={36} />}
        <Badge label={meta.label} tone={meta.tone} />
        {hasLive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginLeft: 'auto' }}>
            <PulseRadar size={18} color={color.success} ringCount={2} />
            <Text variant="caption" style={{ fontWeight: '700', color: color.success }}>Live</Text>
          </View>
        )}
      </View>

      <View style={{ padding: space.xl }}>
        {/* Provider identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginBottom: space.xl }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${color.primary}14`, alignItems: 'center', justifyContent: 'center' }}>
            <Numeric size={22} tone="primary">{providerName.charAt(0).toUpperCase()}</Numeric>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{providerName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
              <Badge label="Verified" tone="primary" />
              {provider.rating_avg != null && provider.rating_avg > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text variant="label" style={{ fontWeight: '700' }}>{provider.rating_avg.toFixed(1)}</Text>
                  <Text variant="caption" tone="muted">({provider.rating_count ?? 0})</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ETA / Distance / Timer tiles */}
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
          {distance != null && (
            <>
              <Card variant="flat" padded={false} style={{ flex: 1, padding: space.md }}>
                <Text variant="caption" tone="primary">ETA</Text>
                <Numeric size={20}>{formatETA(distance)}</Numeric>
              </Card>
              <Card variant="flat" padded={false} style={{ flex: 1, padding: space.md }}>
                <Text variant="caption" tone="muted">Distance</Text>
                <Numeric size={20}>{formatDistance(distance)}</Numeric>
              </Card>
            </>
          )}
          {status === 'in_progress' && (
            <Card variant="flat" padded={false} style={{ flex: 1, padding: space.md }}>
              <Text variant="caption" tone="primary">Elapsed</Text>
              <Numeric size={20}>{elapsedFormatted}</Numeric>
            </Card>
          )}
          {distance == null && status !== 'in_progress' && (
            <Card variant="flat" padded={false} style={{ flex: 1, padding: space.md, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="caption" tone="muted">Waiting for location...</Text>
            </Card>
          )}
        </View>

        {/* Action buttons */}
        {provider.phone && (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button
              label="Call"
              variant="soft"
              full={false}
              icon={<Ionicons name="call" size={16} color={color.primary} />}
              style={{ flex: 1 }}
              onPress={() => Linking.openURL(`tel:${provider.phone}`)}
            />
            <Button
              label="Chat"
              variant="primary"
              full={false}
              icon={<Ionicons name="chatbubble" size={16} color={color.white} />}
              style={{ flex: 1 }}
              onPress={onChat}
            />
          </View>
        )}
      </View>
    </Card>
  );
}
