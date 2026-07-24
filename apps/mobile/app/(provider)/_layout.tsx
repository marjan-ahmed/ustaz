import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useTabBarVisibility } from '@/context/TabBarVisibilityContext';
import CustomTabBar from '@/components/CustomTabBar';

export default function ProviderTabLayout() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();
  const { visible: tabBarVisible } = useTabBarVisibility();

  useEffect(() => {
    if (!loading && !isSignedIn) router.replace({ pathname: '/auth', params: { intent: 'provider' } });
  }, [isSignedIn, loading, router]);

  const providerTabs = [
    { name: 'index', icon: 'home' },
    { name: 'wallet', icon: 'wallet' },
    { name: 'warranty', icon: 'shield-checkmark' },
    { name: 'chat', icon: 'chatbubble-ellipses' },
    { name: 'profile', icon: 'person' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => (
        <CustomTabBar
          tabs={providerTabs}
          activeTab={props.state.routes[props.state.index]?.name ?? 'index'}
          onTabPress={(name) => props.navigation.navigate(name)}
          visible={tabBarVisible}
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
