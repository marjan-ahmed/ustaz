import '../global.css';

import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, AppState, View } from 'react-native';
import { colors } from '@ustaz/shared/theme';
import { Lalezar_400Regular } from '@expo-google-fonts/lalezar';
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { TabBarVisibilityProvider } from '@/context/TabBarVisibilityContext';
import { LanguageProvider } from '@/i18n';
import {
  ensureDefaultNotificationChannel,
  getNotificationsModule,
  routeForNotificationData,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AtkinsonHyperlegible: require('../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    ClashGrotesk: require('../assets/fonts/ClashGrotesk-Regular.ttf'),
    ClashGroteskMedium: require('../assets/fonts/ClashGrotesk-Medium.ttf'),
    ClashGroteskSemibold: require('../assets/fonts/ClashGrotesk-Semibold.ttf'),
    ClashGroteskBold: require('../assets/fonts/ClashGrotesk-Bold.ttf'),
    IBMPlexSansArabic: IBMPlexSansArabic_400Regular,
    Lalezar: Lalezar_400Regular,
  });

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Supabase's token-refresh timer doesn't run reliably in the background on
  // React Native; only auto-refresh while the app is foregrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    supabase.auth.startAutoRefresh();
    return () => sub.remove();
  }, []);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <TabBarVisibilityProvider>
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
        </TabBarVisibilityProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
