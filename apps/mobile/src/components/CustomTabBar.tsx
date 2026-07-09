import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  name: string;
  icon: string;
  label: string;
}

interface CustomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (name: string) => void;
}

function AnimatedTab({ tab, isActive, onPress }: { tab: TabItem; isActive: boolean; onPress: () => void }) {
  const iconScale = useRef(new Animated.Value(isActive ? 1 : 0.85)).current;
  const iconOpacity = useRef(new Animated.Value(isActive ? 1 : 0.55)).current;
  const labelY = useRef(new Animated.Value(isActive ? 0 : 2)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: isActive ? 1 : 0.85, useNativeDriver: true, tension: 200, friction: 16 }),
      Animated.timing(iconOpacity, { toValue: isActive ? 1 : 0.55, duration: 200, useNativeDriver: true }),
      Animated.spring(labelY, { toValue: isActive ? 0 : 2, useNativeDriver: true, tension: 200, friction: 18 }),
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0.5, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
        <Ionicons
          name={tab.icon as any}
          size={22}
          color={isActive ? '#FFFFFF' : '#9CA3AF'}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, { transform: [{ translateY: labelY }], opacity: labelOpacity, color: isActive ? '#1B1B27' : '#9CA3AF' }]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function CustomTabBar({ tabs, activeTab, onTabPress }: CustomTabBarProps) {
  const slideX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  const BAR_PADDING = 4;
  const barContentWidth = SCREEN_WIDTH - 32 - BAR_PADDING * 2;
  const tabWidth = barContentWidth / tabs.length;
  const PILL_SIZE = 46;

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.name === activeTab);
    if (idx < 0) return;

    const tabCenter = idx * tabWidth + tabWidth / 2;
    const targetX = BAR_PADDING + tabCenter - PILL_SIZE / 2;

    Animated.sequence([
      Animated.timing(pillScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(slideX, { toValue: targetX, useNativeDriver: true, tension: 180, friction: 12 }),
        Animated.spring(pillScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
      ]),
    ]).start();
  }, [activeTab]);

  return (
    <View style={styles.outer}>
      <View style={styles.bar}>
        <Animated.View
          style={[
            styles.pill,
            {
              transform: [{ translateX: slideX }, { scale: pillScale }],
            },
          ]}
        />
        {tabs.map((tab) => (
          <AnimatedTab
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => onTabPress(tab.name)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    height: 76,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 10,
    left: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    zIndex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    zIndex: 1,
  },
});
