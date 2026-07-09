import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@ustaz/shared/theme';
import { Gulzar_400Regular } from '@expo-google-fonts/gulzar';
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotificationsProvider } from '@/context/NotificationsContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    AtkinsonHyperlegible: require('../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    Gulzar: Gulzar_400Regular,
    IBMPlexSansArabic: IBMPlexSansArabic_400Regular,
  });

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
