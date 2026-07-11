import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  ensureDefaultNotificationChannel,
  getExpoProjectId,
  getNotificationsModule,
  isAndroidExpoGo,
} from '@/lib/notifications';

const READ_KEY = 'ustaz_read_notifications';

export interface AppNotification {
  id: string;
  recipient_user_id: string;
  sender_user_id: string;
  request_id: string;
  service_type: string;
  message: string;
  status: string;
  address: string | null;
  username: string | null;
  provider_distance: number | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const readIdsRef = useRef<Set<string>>(new Set());

  const loadReadIds = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      if (raw) {
        const ids = new Set<string>(JSON.parse(raw));
        readIdsRef.current = ids;
        setReadIds(ids);
      }
    } catch {}
  }, []);

  const saveReadIds = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify([...ids]));
    } catch {}
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    readIdsRef.current.add(id);
    setReadIds(new Set(readIdsRef.current));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await saveReadIds(readIdsRef.current);
  }, [saveReadIds]);

  const markAllAsRead = useCallback(async () => {
    const allIds = new Set(notifications.map((n) => n.id));
    readIdsRef.current = allIds;
    setReadIds(new Set(allIds));
    setUnreadCount(0);
    await saveReadIds(allIds);
  }, [notifications, saveReadIds]);

  const registerPushToken = useCallback(async (_userId: string) => {
    try {
      console.info('[notifications] runtime', {
        platform: Platform.OS,
        appOwnership: isAndroidExpoGo ? 'expo-go-android' : 'native-or-non-android',
      });

      const Notifications = await getNotificationsModule();
      if (!Notifications) {
        if (isAndroidExpoGo) {
          console.info('[notifications] remote push skipped: Android Expo Go cannot register remote push tokens. Install/open a development build.');
        }
        return;
      }

      await ensureDefaultNotificationChannel(Notifications);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.info('[notifications] permission status:', finalStatus);
      if (finalStatus !== 'granted') return;

      const projectId = getExpoProjectId();
      if (!projectId) {
        console.warn('[notifications] EAS projectId not found; cannot register an Expo push token.');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      console.info('[notifications] got Expo push token:', token.slice(0, 30) + '...');

      const { error } = await supabase.rpc('upsert_fcm_token', {
        p_token: token,
        p_user_agent: `expo-${Platform.OS}-${Platform.Version}`,
      });

      if (error) {
        console.warn('[notifications] failed to save push token:', error.message);
        return;
      }

      console.info('[notifications] push token saved to Supabase');
    } catch (err) {
      console.warn('[notifications] failed to register push token:', err);
    }
  }, []);

  const loadNotifications = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const items = (data ?? []) as AppNotification[];
      setNotifications(items);

      const unread = items.filter((n) => !readIdsRef.current.has(n.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    loadReadIds();
    registerPushToken(user.id);
    loadNotifications(user.id);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload) => {
          const notif = payload.new as AppNotification;
          if (notif.recipient_user_id !== user.id) return;

          setNotifications((prev) => [notif, ...prev]);
          if (!readIdsRef.current.has(notif.id)) {
            setUnreadCount((prev) => prev + 1);
          }

          const Notifications = await getNotificationsModule();
          if (!Notifications) return;

          await ensureDefaultNotificationChannel(Notifications);

          Notifications.scheduleNotificationAsync({
            content: {
              title: notif.service_type || 'New Notification',
              body: notif.message,
              data: { notificationId: notif.id, requestId: notif.request_id },
              sound: 'default',
            },
            trigger: Platform.OS === 'android'
              ? { channelId: DEFAULT_NOTIFICATION_CHANNEL_ID, seconds: 1 }
              : null,
          }).catch((err: unknown) => console.warn('Failed to show local notification:', err));
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, loadNotifications, loadReadIds, registerPushToken]);

  return {
    notifications,
    unreadCount,
    readIds,
    markAsRead,
    markAllAsRead,
  };
}