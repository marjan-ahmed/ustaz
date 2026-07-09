import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import CustomTabBar from '@/components/CustomTabBar';

const providerTabs = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'wallet', icon: 'wallet', label: 'Wallet' },
  { name: 'warranty', icon: 'shield-checkmark', label: 'Warranty' },
  { name: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
  { name: 'profile', icon: 'person', label: 'Profile' },
];

export default function ProviderTabLayout() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSignedIn) router.replace({ pathname: '/auth', params: { intent: 'provider' } });
  }, [isSignedIn, loading, router]);

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => (
        <CustomTabBar
          tabs={providerTabs}
          activeTab={props.state.routes[props.state.index]?.name ?? 'index'}
          onTabPress={(name) => props.navigation.navigate(name)}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="wallet" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="warranty" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="chat" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}
