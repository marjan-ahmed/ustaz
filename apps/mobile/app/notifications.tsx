import { FlatList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type AppNotification } from '@/hooks/useNotifications';
import { useNotificationsContext } from '@/context/NotificationsContext';
import {
  Card, Drift, EmptyState, FadeInUp, IsoServiceScene, NumberTicker, PressableScale, Screen, Stagger, Text,
} from '@/components/mobile-ui';
import { color, font, radius, shadow, space } from '@/theme/tokens';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifItem({ item, isRead, onPress }: { item: AppNotification; isRead: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress}>
      <Card variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg, opacity: isRead ? 0.6 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isRead ? color.surfaceAlt : `${color.primary}14`, alignItems: 'center', justifyContent: 'center', marginRight: space.md }}>
            <Ionicons
              name={item.status === 'accepted' ? 'checkmark-circle' : item.status === 'rejected' ? 'close-circle' : 'notifications'}
              size={20}
              color={isRead ? color.inkMuted : color.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text variant="body" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {item.service_type}
              </Text>
              <Text variant="caption" tone="muted" style={{ marginLeft: space.sm }}>{timeAgo(item.created_at)}</Text>
            </View>
            <Text variant="label" tone={isRead ? 'muted' : 'soft'} numberOfLines={2}>
              {item.message}
            </Text>
            {item.address && (
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: space.xs }}>
                <Ionicons name="location-outline" size={11} color={color.inkMuted} /> {item.address}
              </Text>
            )}
          </View>
          {!isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.primary, marginLeft: space.sm, marginTop: 6 }} />}
        </View>
      </Card>
    </PressableScale>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, readIds, markAsRead, markAllAsRead } = useNotificationsContext();
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  function safeBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/role-select');
  }

  return (
    <Screen bg={color.white} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        {/* Header */}
        <FadeInUp>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md, marginBottom: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PressableScale onPress={safeBack} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={24} color={color.navy} />
              </PressableScale>
              <Text variant="h1" style={{ marginLeft: space.md }}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={{ marginLeft: space.sm, minWidth: 26, height: 26, borderRadius: 13, backgroundColor: color.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <NumberTicker value={unreadCount} duration={500} style={{ fontFamily: font.body, fontSize: 12, fontWeight: '700', color: color.white, textAlign: 'center' }} />
                </View>
              )}
            </View>
            {unreadCount > 0 && (
              <PressableScale onPress={markAllAsRead}>
                <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>Read all</Text>
              </PressableScale>
            )}
          </View>
        </FadeInUp>

        {/* List */}
        {notifications.length === 0 ? (
          <EmptyState
            illustration={<Drift distance={6}><IsoServiceScene size={140} variant="general" /></Drift>}
            title="No notifications yet"
            subtitle="You'll see service requests and updates here"
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotifItem
                item={item}
                isRead={readIds.has(item.id)}
                onPress={() => {
                  markAsRead(item.id);
                  if (item.request_id) {
                    router.push('/(provider)');
                  }
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
