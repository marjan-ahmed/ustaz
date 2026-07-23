import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, font, radius, shadow } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { getPillTranslateX } from './CustomTabBar.layout';

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

const PILL_SIZE = 46;
const BAR_HORIZONTAL_PADDING = 4;

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
    <Pressable onPress={() => { haptic.select(); onPress(); }} style={styles.tab}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
        <Ionicons
          name={tab.icon as any}
          size={22}
          color={isActive ? color.white : color.inkMuted}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, { transform: [{ translateY: labelY }], opacity: labelOpacity, color: isActive ? color.ink : color.inkMuted }]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function CustomTabBar({ tabs, activeTab, onTabPress }: CustomTabBarProps) {
  const slideX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const [barWidth, setBarWidth] = useState(0);

  function onBarLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - barWidth) > 0.5) setBarWidth(w);
  }

  useEffect(() => {
    if (barWidth === 0) return;
    const idx = tabs.findIndex((t) => t.name === activeTab);
    if (idx < 0) return;

    const targetX = getPillTranslateX({
      barWidth,
      tabCount: tabs.length,
      activeIndex: idx,
      pillSize: PILL_SIZE,
      paddingHorizontal: BAR_HORIZONTAL_PADDING,
    });

    Animated.sequence([
      Animated.timing(pillScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(slideX, { toValue: targetX, useNativeDriver: true, tension: 180, friction: 12 }),
        Animated.spring(pillScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
      ]),
    ]).start();
  }, [activeTab, barWidth, tabs.length]);

  return (
    <View style={styles.outer}>
      <View style={styles.bar} onLayout={onBarLayout}>
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.pill,
              {
                transform: [{ translateX: slideX }, { scale: pillScale }],
              },
            ]}
          />
        )}
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
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    backgroundColor: color.surface,
    borderRadius: radius['2xl'],
    marginHorizontal: 7,
    height: 76,
    paddingHorizontal: BAR_HORIZONTAL_PADDING,
    shadowColor: color.navy,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 7,
    left: 0,
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: PILL_SIZE / 2,
    backgroundColor: color.navy,
    ...shadow.brand,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 13,
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
    fontFamily: font.body,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    zIndex: 1,
  },
});

