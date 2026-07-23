/**
 * PatternBackdrop — tiled SVG background (dots/grid/hex) + optional ambient
 * glow overlay. The richer replacement for a flat GlowBackdrop blob behind
 * hero sections; O(1) render cost regardless of density (single <Pattern>,
 * not per-tile React elements).
 */
import Svg, { Pattern, Circle, Path, Rect, RadialGradient, Stop } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import { color } from '../../theme/tokens';

type PatternVariant = 'dots' | 'grid' | 'hex';
type PatternTone = 'navy' | 'orange' | 'cream';

const TONE_COLOR: Record<PatternTone, string> = {
  navy: color.navy,
  orange: color.primary,
  cream: color.cream,
};

export function PatternBackdrop({
  variant = 'dots',
  tone = 'navy',
  opacity = 0.08,
  glow = true,
}: {
  variant?: PatternVariant;
  tone?: PatternTone;
  opacity?: number;
  glow?: boolean;
}) {
  const tint = TONE_COLOR[tone];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        {variant === 'dots' && (
          <Pattern id="pb-dots" width={24} height={24} patternUnits="userSpaceOnUse">
            <Circle cx={12} cy={12} r={1.4} fill={tint} />
          </Pattern>
        )}
        {variant === 'grid' && (
          <Pattern id="pb-grid" width={32} height={32} patternUnits="userSpaceOnUse">
            <Path d="M 32 0 L 0 0 0 32" stroke={tint} strokeWidth={1} fill="none" />
          </Pattern>
        )}
        {variant === 'hex' && (
          <Pattern id="pb-hex" width={34.6} height={30} patternUnits="userSpaceOnUse">
            <Path
              d="M17.3 0 L34.6 7.5 L34.6 22.5 L17.3 30 L0 22.5 L0 7.5 Z"
              fill="none"
              stroke={tint}
              strokeWidth={1}
            />
          </Pattern>
        )}
        {glow && (
          <RadialGradient id="pb-glow" cx="50%" cy="28%" r="65%">
            <Stop offset="0" stopColor={tint} stopOpacity={0.22} />
            <Stop offset="1" stopColor={tint} stopOpacity={0} />
          </RadialGradient>
        )}
        <Rect width="100%" height="100%" fill={`url(#pb-${variant})`} opacity={opacity} />
        {glow && <Rect width="100%" height="100%" fill="url(#pb-glow)" />}
      </Svg>
    </View>
  );
}

export default PatternBackdrop;
