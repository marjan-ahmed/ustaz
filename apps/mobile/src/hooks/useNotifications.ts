import { useCallback, useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

const READ_KEY = 'ustaz_read_notifications';
const isAndroidExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';

let notificationsModulePromise: Promise<any> | null = null;

async function getNotificationsModule() {
  if (isAndroidExpoGo) return null;

  notificationsModulePromise ??= import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  });

  return notificationsModulePromise;
}

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

  const registerPushToken = useCallback(async (userId: string) => {
    if (isAndroidExpoGo) {
      console.info('Remote push token registration is skipped in Android Expo Go. Use a development build to test FCM.');
      return;
    }

    try {
      const Notifications = await getNotificationsModule();
      if (!Notifications) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;

      await supabase.rpc('upsert_fcm_token', {
        p_token: token,
        p_user_agent: `expo-${Platform.OS}-${Platform.Version}`,
      });
    } catch (err) {
      console.warn('Failed to register push token:', err);
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

          Notifications.scheduleNotificationAsync({
            content: {
              title: notif.service_type || 'New Notification',
              body: notif.message,
              data: { notificationId: notif.id, requestId: notif.request_id },
            },
            trigger: null,
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
