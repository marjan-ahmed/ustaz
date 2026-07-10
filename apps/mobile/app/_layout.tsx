import '../global.css';

import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { colors } from '@ustaz/shared/theme';
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotificationsProvider } from '@/context/NotificationsContext';

const isExpoGo = Constants.appOwnership === 'expo';

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AtkinsonHyperlegible: require('../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    Gulzar: Gulzar_400Regular,
    IBMPlexSansArabic: IBMPlexSansArabic_400Regular,
  });

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isExpoGo) return;

    let mounted = true;
    (async () => {
      const Notifications = await import('expo-notifications');
      if (!mounted) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const url = data?.url as string | undefined;
        const type = data?.type as string | undefined;
        const requestId = data?.requestId as string | undefined;

        if (type === 'chat') {
          const senderId = data?.senderId as string | undefined;
          if (senderId) router.push(`/(customer)/chat?peer=${senderId}`);
        } else if (requestId) {
          router.push({ pathname: '/process', params: { requestId } });
        } else if (url) {
          router.push(url as any);
        }
      });
    })();

    return () => {
      mounted = false;
      if (notificationListener.current) {
        import('expo-notifications').then((N) => N.removeNotificationSubscription(notificationListener.current));
      }
      if (responseListener.current) {
        import('expo-notifications').then((N) => N.removeNotificationSubscription(responseListener.current));
      }
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.primary }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NotificationsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="role-select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(customer)" options={{ animation: 'none' }} />
        <Stack.Screen name="(provider)" options={{ animation: 'none' }} />
        <Stack.Screen name="process" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="provider-register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="light" backgroundColor={colors.primary} />
    </NotificationsProvider>
  );
}
