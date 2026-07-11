import '../global.css';

import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@ustaz/shared/theme';
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotificationsProvider } from '@/context/NotificationsContext';
import {
  ensureDefaultNotificationChannel,
  getNotificationsModule,
  routeForNotificationData,
} from '@/lib/notifications';

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
    let mounted = true;

    (async () => {
      try {
        const Notifications = await getNotificationsModule();
        if (!Notifications) return;
        await ensureDefaultNotificationChannel(Notifications);
        if (!mounted) return;

        notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response.notification.request.content.data ?? {};
          const type = data?.type as string | undefined;
          const senderId = data?.senderId as string | undefined;

          if (type === 'chat' && senderId) {
            router.push(`/(customer)/chat?peer=${senderId}`);
            return;
          }

          const route = routeForNotificationData(data as Record<string, unknown>);
          if (route) router.push(route as any);
        });
      } catch (err) {
        console.warn('Failed to set up notification listeners:', err);
      }
    })();

    return () => {
      mounted = false;
      notificationListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, [router]);

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
        <Stack.Screen name="provider-register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="light" backgroundColor={colors.primary} />
    </NotificationsProvider>
  );
}
