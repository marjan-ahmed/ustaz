import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, shadow } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { getPillTranslateX } from './CustomTabBar.layout';

interface TabItem {
  name: string;
  icon: string;
}

interface CustomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (name: string) => void;
  visible?: boolean;
}

const BAR_HEIGHT = 56;
const PILL_SIZE = 48;
const ICON_SIZE = 26;
const BAR_MARGIN_H = 12;
const BAR_PADDING_H = 8;
const BAR_RADIUS = 22;
const PILL_RADIUS = PILL_SIZE / 2;
const BOTTOM_SAFE_IOS = 24;
const BOTTOM_SAFE_ANDROID = 12;

function AnimatedTab({ tab, isActive, onPress }: { tab: TabItem; isActive: boolean; onPress: () => void }) {
  const iconScale = useRef(new Animated.Value(isActive ? 1 : 0.82)).current;
  const iconOpacity = useRef(new Animated.Value(isActive ? 1 : 0.38)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: isActive ? 1 : 0.82, useNativeDriver: true, tension: 200, friction: 16 }),
      Animated.timing(iconOpacity, { toValue: isActive ? 1 : 0.38, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  return (
    <Pressable onPress={() => { haptic.select(); onPress(); }} style={styles.tab}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
        <Ionicons
          name={tab.icon as any}
          size={ICON_SIZE}
          color={isActive ? color.white : color.inkMuted}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ tabs, activeTab, onTabPress, visible = true }: CustomTabBarProps) {
  const slideX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

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
      paddingHorizontal: BAR_PADDING_H,
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
    <Animated.View
      style={[
        styles.outer,
        {
          opacity: fadeAnim,
          pointerEvents: visible ? 'auto' : 'none',
          transform: [{ translateY: visible ? 0 : 80 }],
        },
      ]}
    >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? BOTTOM_SAFE_IOS : BOTTOM_SAFE_ANDROID,
  },
  bar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
    borderRadius: BAR_RADIUS,
    marginHorizontal: BAR_MARGIN_H,
    height: BAR_HEIGHT,
    paddingHorizontal: BAR_PADDING_H,
    shadowColor: color.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: (BAR_HEIGHT - PILL_SIZE) / 2,
    left: 0,
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: PILL_RADIUS,
    backgroundColor: color.navy,
    ...shadow.brand,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    zIndex: 1,
  },
  iconWrap: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
