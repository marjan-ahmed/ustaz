import { FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@ustaz/shared/theme';
import { type AppNotification } from '@/hooks/useNotifications';
import { useNotificationsContext } from '@/context/NotificationsContext';

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
    <Pressable
      onPress={onPress}
      style={[styles.item, isRead && styles.itemRead]}
    >
      <View style={[styles.iconWrap, isRead && styles.iconWrapRead]}>
        <Ionicons
          name={item.status === 'accepted' ? 'checkmark-circle' : item.status === 'rejected' ? 'close-circle' : 'notifications'}
          size={20}
          color={isRead ? '#9CA3AF' : colors.primary}
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemService, isRead && styles.itemServiceRead]} numberOfLines={1}>
            {item.service_type}
          </Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={[styles.itemMessage, isRead && styles.itemMessageRead]} numberOfLines={2}>
          {item.message}
        </Text>
        {item.address && (
          <Text style={styles.itemAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={11} color="#9CA3AF" /> {item.address}
          </Text>
        )}
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, readIds, markAsRead, markAllAsRead } = useNotificationsContext();

  function safeBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/role-select');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={safeBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1B1B27" />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          {notifications.some((n) => !readIds.has(n.id)) && (
            <Pressable onPress={markAllAsRead}>
              <Text style={styles.markAll}>Read all</Text>
            </Pressable>
          )}
        </View>

        {/* List */}
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>You'll see service requests and updates here</Text>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 22,
    color: '#1B1B27',
  },
  markAll: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemRead: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapRead: {
    backgroundColor: '#F9FAFB',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemService: {
    fontFamily: 'Anton',
    fontSize: 15,
    color: '#1B1B27',
    flex: 1,
  },
  itemServiceRead: {
    color: '#6B7280',
  },
  itemTime: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  itemMessage: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  itemMessageRead: {
    color: '#9CA3AF',
  },
  itemAddress: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontFamily: 'Anton',
    fontSize: 18,
    color: '#6B7280',
    marginTop: 12,
  },
  emptySub: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
