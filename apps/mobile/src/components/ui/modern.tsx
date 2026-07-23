/**
 * Modern mobile components — the pieces a top-tier app has that this one lacked:
 * shimmer skeletons (not bare spinners), segmented control, toast/snackbar,
 * progress stepper. Token-driven, reduce-motion aware.
 */
import { PropsWithChildren, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp, Text as RNText, Dimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font, radius, shadow, space, touch, motion } from '../../theme/tokens';
import { PressableScale } from '../motion';
import { haptic } from '../../lib/haptics';

/* ------------------------------------------------------------ Skeleton --- */
/** Shimmering placeholder. Use while loading instead of a bare ActivityIndicator. */
export function Skeleton({ w = '100%', h = 16, r = radius.sm, style }: { w?: number | `${number}%`; h?: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const x = useSharedValue(-1);

  useEffect(() => {
    if (reduce) return;
    x.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => cancelAnimation(x);
  }, [reduce, x]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 220 }] }));

  return (
    <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#ECE7E1', overflow: 'hidden' }, style]}>
      {!reduce && (
        <Animated.View style={[StyleSheet.absoluteFill, a]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.65)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/* ---------------------------------------------------- SegmentedControl --- */
export function SegmentedControl({
  segments,
  value,
  onChange,
}: {
  segments: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const [w, setW] = useState(0);
  const count = segments.length;
  const idx = Math.max(0, segments.findIndex((s) => s.key === value));
  const seg = w / count;
  const tx = useSharedValue(0);

  useEffect(() => {
    tx.value = withSpring(idx * seg, motion.easing.spring);
  }, [idx, seg, tx]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <View style={styles.segTrack} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && <Animated.View style={[styles.segThumb, { width: seg - 4 }, thumb]} />}
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <PressableScale
            key={s.key}
            style={styles.segItem}
            onPress={() => {
              haptic.select();
              onChange(s.key);
            }}
          >
            <RNText style={{ fontFamily: font.body, fontSize: 14, fontWeight: '700', color: active ? color.navy : color.inkMuted }}>
              {s.label}
            </RNText>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ----------------------------------------------------- ProgressStepper --- */
export function ProgressStepper({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.stepperRow}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return <View key={i} style={[styles.stepBar, { backgroundColor: done || active ? color.primary : color.line, flex: active ? 1.6 : 1 }]} />;
      })}
    </View>
  );
}

/* -------------------------------------------------------------- Snackbar --- */
type Snack = { id: number; message: string; tone: 'default' | 'success' | 'error' };
const SnackCtx = createContext<(message: string, tone?: Snack['tone']) => void>(() => {});
export const useSnackbar = () => useContext(SnackCtx);

export function SnackbarProvider({ children }: PropsWithChildren) {
  const [snack, setSnack] = useState<Snack | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const y = useSharedValue(120);
  const reduce = useReducedMotion();

  const hide = useCallback(() => {
    y.value = reduce ? 120 : withTiming(120, { duration: motion.duration.base }, (f) => f && runOnJS(setSnack)(null));
    if (reduce) setSnack(null);
  }, [reduce, y]);

  const show = useCallback(
    (message: string, tone: Snack['tone'] = 'default') => {
      if (timer.current) clearTimeout(timer.current);
      setSnack({ id: Date.now(), message, tone });
      y.value = reduce ? 0 : withSpring(0, motion.easing.spring);
      if (tone === 'error') haptic.error();
      else if (tone === 'success') haptic.success();
      timer.current = setTimeout(hide, 3200);
    },
    [hide, reduce, y],
  );

  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const bg = snack?.tone === 'success' ? color.success : snack?.tone === 'error' ? color.error : color.navy;

  return (
    <SnackCtx.Provider value={show}>
      {children}
      {snack && (
        <Animated.View pointerEvents="box-none" style={[styles.snackWrap, a]}>
          <View style={[styles.snack, { backgroundColor: bg }]}>
            <RNText style={{ fontFamily: font.body, fontSize: 14, fontWeight: '600', color: color.white, flex: 1 }}>{snack.message}</RNText>
          </View>
        </Animated.View>
      )}
    </SnackCtx.Provider>
  );
}

/* -------------------------------------------------------------- Empty --- */
/** Branded empty state — replaces the "single grey icon" pattern. */
export function EmptyState({ illustration, title, subtitle, action }: { illustration?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      {illustration}
      <RNText style={{ fontFamily: font.heading, fontSize: 20, color: color.ink, marginTop: space.lg, textAlign: 'center' }}>{title}</RNText>
      {subtitle ? (
        <RNText style={{ fontFamily: font.body, fontSize: 14, lineHeight: 20, color: color.inkMuted, marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
          {subtitle}
        </RNText>
      ) : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

const styles = StyleSheet.create({
  segTrack: { flexDirection: 'row', backgroundColor: '#EFEAE4', borderRadius: radius.full, padding: 4, position: 'relative' },
  segThumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: radius.full, backgroundColor: color.white, ...shadow.sm },
  segItem: { flex: 1, minHeight: touch.minTarget - 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepperRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepBar: { height: 5, borderRadius: 3 },
  snackWrap: { position: 'absolute', left: space.lg, right: space.lg, bottom: space['2xl'] },
  snack: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.lg, ...shadow.md, maxWidth: SCREEN_W - space.lg * 2 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space['4xl'] },
});
