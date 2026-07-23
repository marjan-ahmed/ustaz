/**
 * Ustaz mobile — core UI primitives. Token-driven, touch-safe (>=48dp targets),
 * haptic + press-scale by default. These replace the ad-hoc inline styles that
 * every screen currently re-types. Consume via `src/components/mobile-ui` barrel.
 */
import { PropsWithChildren, ReactNode, forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Text as RNText,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { color, font, gradient, radius, shadow, space, touch, type as typeScale } from '../../theme/tokens';
import { PressableScale } from '../motion';
import { haptic } from '../../lib/haptics';

/* ---------------------------------------------------------------- Text --- */
type Variant = keyof typeof typeScale;
type TextTone = 'ink' | 'soft' | 'muted' | 'primary' | 'inverse' | 'inverseSoft';

const TONE: Record<TextTone, string> = {
  ink: color.ink,
  soft: color.inkSoft,
  muted: color.inkMuted,
  primary: color.primary,
  inverse: color.white,
  inverseSoft: 'rgba(255,255,255,0.72)',
};

export function Text({
  variant = 'body',
  tone = 'ink',
  center,
  style,
  children,
  ...props
}: TextProps & { variant?: Variant; tone?: TextTone; center?: boolean }) {
  const t = typeScale[variant];
  return (
    <RNText
      style={[
        { fontFamily: t.family, fontSize: t.size, lineHeight: t.line, color: TONE[tone] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

/** Big Anton stat number. */
export function Numeric({
  children,
  size = 32,
  tone = 'ink',
  style,
}: PropsWithChildren<{ size?: number; tone?: TextTone; style?: StyleProp<TextStyle> }>) {
  return (
    <RNText style={[{ fontFamily: font.numeric, fontSize: size, color: TONE[tone] }, style]}>
      {children}
    </RNText>
  );
}

/* -------------------------------------------------------------- Button --- */
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'navy';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  full = true,
  hapticStyle = 'medium',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  full?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const body = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'soft' || variant === 'ghost' ? color.primary : color.white} />
      ) : (
        <View style={styles.row}>
          {icon}
          <RNText
            style={[
              styles.btnLabel,
              { color: variant === 'soft' || variant === 'ghost' ? color.primary : color.white },
            ]}
          >
            {label}
          </RNText>
        </View>
      )}
    </>
  );

  const handle = () => {
    if (isDisabled) return;
    haptic[hapticStyle]();
    onPress?.();
  };

  const shared: StyleProp<ViewStyle> = [
    styles.btn,
    full && { alignSelf: 'stretch' },
    isDisabled && { opacity: 0.5 },
    style,
  ];

  if (variant === 'primary') {
    return (
      <PressableScale onPress={handle} disabled={isDisabled} style={[shared, shadow.brand] as ViewStyle[]}>
        <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnFill}>
          {body}
        </LinearGradient>
      </PressableScale>
    );
  }
  if (variant === 'navy') {
    return (
      <PressableScale onPress={handle} disabled={isDisabled} style={[shared, styles.btnFill, { backgroundColor: color.navy }, shadow.md] as ViewStyle[]}>
        {body}
      </PressableScale>
    );
  }
  return (
    <PressableScale
      onPress={handle}
      disabled={isDisabled}
      style={[
        shared,
        styles.btnFill,
        variant === 'soft'
          ? { backgroundColor: color.surface, borderWidth: 1.5, borderColor: '#F6D9CB' }
          : { backgroundColor: 'transparent' },
      ] as ViewStyle[]}
    >
      {body}
    </PressableScale>
  );
}

/* ------------------------------------------------------------ TextField --- */
export const TextField = forwardRef<TextInput, TextInputProps & {
  label?: string;
  error?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  center?: boolean;
}>(function TextField({ label, error, left, right, center, style, onFocus, onBlur, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? (
        <RNText style={{ fontFamily: font.body, fontSize: 13, fontWeight: '700', color: color.inkSoft, marginBottom: space.sm }}>
          {label}
        </RNText>
      ) : null}
      <View
        style={[
          styles.fieldWrap,
          { borderColor: error ? color.error : focused ? color.primary : color.line },
          left ? { paddingLeft: 0 } : null,
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={color.inkMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.fieldInput,
            center && { textAlign: 'center' },
            style,
          ]}
          {...props}
        />
        {right}
      </View>
    </View>
  );
});

/* ---------------------------------------------------------------- Card --- */
type CardVariant = 'elevated' | 'flat' | 'glass' | 'gradient' | 'navy';

export function Card({
  children,
  variant = 'elevated',
  gradientColors,
  padded = true,
  style,
}: PropsWithChildren<{
  variant?: CardVariant;
  gradientColors?: readonly [string, string, ...string[]];
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const base: StyleProp<ViewStyle> = [styles.card, padded && { padding: space.lg }, style];

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradientColors ?? gradient.navy}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[base, shadow.md] as ViewStyle[]}
      >
        {children}
      </LinearGradient>
    );
  }
  if (variant === 'glass') {
    return (
      <BlurView intensity={30} tint="light" style={[base, { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }] as ViewStyle[]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View
      style={[
        base,
        variant === 'navy' && { backgroundColor: color.navy },
        variant === 'flat' && { backgroundColor: color.surfaceAlt },
        variant === 'elevated' && [{ backgroundColor: color.surface }, shadow.sm],
      ] as ViewStyle[]}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------- Chip / Badge --- */
export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      style={[styles.chip, active ? { backgroundColor: color.primary } : { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line }] as ViewStyle[]}
    >
      {icon}
      <RNText style={{ fontFamily: font.body, fontSize: 14, fontWeight: '700', color: active ? color.white : color.inkSoft }}>
        {label}
      </RNText>
    </PressableScale>
  );
}

export function Badge({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'error' }) {
  const bg = { primary: color.primary, success: color.success, warning: color.warning, error: color.error }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <RNText style={styles.badgeText}>{label}</RNText>
    </View>
  );
}

/* ----------------------------------------------------------- IconTile --- */
export function IconTile({ children, bg, size = 48 }: PropsWithChildren<{ bg?: string; size?: number }>) {
  return (
    <View style={[styles.iconTile, { width: size, height: size, backgroundColor: bg ?? `${color.primary}14` }]}>
      {children}
    </View>
  );
}

/* ---------------------------------------------------------- StatTile --- */
export function StatTile({ value, label, tone = 'ink', bg }: { value: string; label: string; tone?: TextTone; bg?: string }) {
  return (
    <View style={[styles.statTile, { backgroundColor: bg ?? color.surfaceAlt }]}>
      <Numeric size={26} tone={tone}>
        {value}
      </Numeric>
      <RNText style={{ fontFamily: font.body, fontSize: 12, lineHeight: 16, color: color.inkMuted, marginTop: 2 }}>
        {label}
      </RNText>
    </View>
  );
}

/* ------------------------------------------------------- SectionHeader --- */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="h3">{title}</Text>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={12}>
          <RNText style={{ fontFamily: font.body, fontSize: 14, fontWeight: '700', color: color.primary }}>{action}</RNText>
        </PressableScale>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------- GlowBackdrop --- */
/** Ambient blurred orange glow blob — the website's signature depth device. */
export function GlowBackdrop({
  color: glow = color.primary,
  size = 320,
  top,
  left,
  right,
  bottom,
  opacity = 0.18,
}: {
  color?: string;
  size?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  opacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: glow,
        opacity,
        top,
        left,
        right,
        bottom,
        // large blur via expo-blur is costly; a soft shadow ring reads similarly and is cheaper
        shadowColor: glow,
        shadowOpacity: 0.6,
        shadowRadius: 80,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

/* -------------------------------------------------------------- Screen --- */
export function Screen({
  children,
  dark = false,
  edges = ['top'],
  bg,
}: PropsWithChildren<{ dark?: boolean; edges?: ('top' | 'bottom' | 'left' | 'right')[]; bg?: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg ?? (dark ? color.navy : color.cream) }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  btn: { minHeight: touch.minTarget + 4, borderRadius: radius.full, overflow: 'hidden' },
  btnFill: { flex: 1, minHeight: touch.minTarget + 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  btnLabel: { fontFamily: font.body, fontSize: 16, fontWeight: '700' },
  card: { borderRadius: radius.xl },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.minTarget + 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: color.surfaceAlt,
    overflow: 'hidden',
  },
  fieldInput: {
    flex: 1,
    minHeight: touch.minTarget + 4,
    paddingHorizontal: space.lg,
    fontFamily: font.body,
    fontSize: 16,
    color: color.ink,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: touch.minTarget,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontFamily: font.body, fontSize: 11, fontWeight: '800', color: color.white, letterSpacing: 0.4 },
  iconTile: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statTile: { flex: 1, borderRadius: radius.lg, padding: space.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md },
});
