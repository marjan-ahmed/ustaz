import { useEffect, useRef } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@ustaz/shared/theme';

interface NotificationBellProps {
  unreadCount: number;
}

export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const router = useRouter();
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.spring(badgeScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }).start();

      if (unreadCount > prevCount.current) {
        Animated.sequence([
          Animated.timing(badgePulse, { toValue: 1.4, duration: 150, useNativeDriver: true }),
          Animated.spring(badgePulse, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
        ]).start();
      }
    } else {
      Animated.spring(badgeScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
        friction: 15,
      }).start();
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      style={styles.container}
    >
      <Ionicons name="notifications-outline" size={22} color="#1B1B27" />
      {unreadCount > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: Animated.multiply(badgeScale, badgePulse) }],
            },
          ]}
        >
          <View style={styles.badgeInner}>
            <Animated.Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Animated.Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badgeInner: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'AtkinsonHyperlegible',
  },
});
