import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import CustomTabBar from '@/components/CustomTabBar';

const customerTabs = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'find', icon: 'search', label: 'Find' },
  { name: 'history', icon: 'document-text', label: 'Jobs' },
  { name: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
  { name: 'profile', icon: 'person', label: 'Profile' },
];

export default function CustomerTabLayout() {
  const { isSignedIn, loading } = useAuth();
  const router = useRouter();

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
        />
      )}
    >
      <Tabs.Screen name="index" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="find" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="history" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="chat" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}
