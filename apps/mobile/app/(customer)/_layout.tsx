import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useTabBarVisibility } from '@/context/TabBarVisibilityContext';
import CustomTabBar from '@/components/CustomTabBar';

const customerTabs = [
  { name: 'index', icon: 'home' },
  { name: 'book', icon: 'search' },
  { name: 'history', icon: 'document-text' },
  { name: 'chat', icon: 'chatbubble-ellipses' },
  { name: 'profile', icon: 'person' },
];

export default function CustomerTabLayout() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();
  const { visible: tabBarVisible } = useTabBarVisibility();

  useEffect(() => {
    if (!loading && !isSignedIn) router.replace('/auth');
  }, [isSignedIn, loading, router]);

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => (
        <CustomTabBar
          tabs={customerTabs}
          activeTab={props.state.routes[props.state.index]?.name ?? 'index'}
          onTabPress={(name) => props.navigation.navigate(name)}
          visible={tabBarVisible}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="book" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="history" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="chat" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}
