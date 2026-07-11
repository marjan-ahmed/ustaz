import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';
export const NOTIFICATION_COLOR = '#DB4B0D';
export const isAndroidExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';

let notificationsModulePromise: Promise<any> | null = null;
let channelPromise: Promise<void> | null = null;

export async function getNotificationsModule() {
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

export async function ensureDefaultNotificationChannel(Notifications?: any | null) {
  if (Platform.OS !== 'android' || !Notifications) return;

  channelPromise ??= Notifications
    .setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: 'Ustaz requests',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: NOTIFICATION_COLOR,
      sound: 'default',
    })
    .then(() => undefined);

  await channelPromise;
}

export function getExpoProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export function routeForNotificationData(data: Record<string, unknown>) {
  const url = typeof data?.url === 'string' ? data.url : undefined;
  const requestId = typeof data?.requestId === 'string' ? data.requestId : undefined;

  if (url === '/dashboard' || url === '/(provider)') return '/(provider)';
  if (url === '/process' || url === '/(customer)') return '/(customer)';
  if (url?.startsWith('/(')) return url;
  if (requestId) return '/(provider)';
  return url;
}