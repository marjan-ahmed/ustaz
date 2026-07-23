/**
 * IsoCelebrationScene — isometric "job well done" illustration: a seal/badge
 * on the brand platform with orbiting confetti dots. Used for completion /
 * success moments (distinct composition from IsoServiceScene, not a variant).
 */
import Svg, { Circle, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { color } from '../../theme/tokens';
import { Bob } from '../motion';

const CONFETTI = [
  { x: 0.14, y: 0.18, color: color.primary, delay: 0 },
  { x: 0.82, y: 0.14, color: color.primaryLight, delay: 200 },
  { x: 0.86, y: 0.42, color: '#F59E0B', delay: 400 },
  { x: 0.1, y: 0.5, color: color.success, delay: 600 },
];

export function IsoCelebrationScene({ size = 260 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 260 260">
        <LinearGradient id="cplat" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A2440" />
          <Stop offset="1" stopColor="#0F1729" />
        </LinearGradient>
        <LinearGradient id="cplatSide" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1120" />
          <Stop offset="1" stopColor="#070D1A" />
        </LinearGradient>
        <LinearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF6B4A" />
          <Stop offset="1" stopColor="#DB4B0D" />
        </LinearGradient>

        <Ellipse cx="130" cy="212" rx="96" ry="26" fill={color.navy} opacity={0.08} />

        <Path d="M130 120 L214 162 L130 204 L46 162 Z" fill="url(#cplat)" />
        <Path d="M46 162 L130 204 L130 232 L46 190 Z" fill="url(#cplatSide)" />
        <Path d="M214 162 L130 204 L130 232 L214 190 Z" fill="#0B1120" />

        {/* Seal / medal, standing on the platform */}
        <Path d="M120 150 L108 182 L124 176 L130 190 L136 176 L152 182 L140 150 Z" fill="#C24309" />
        <Circle cx="130" cy="140" r="30" fill="url(#seal)" />
        <Circle cx="130" cy="140" r="22" fill="none" stroke="#FFF7ED" strokeWidth={2.5} opacity={0.7} />
        <Path d="M119 140 L127 148 L143 128" stroke={color.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>

      {/* Confetti dots, each bobbing independently for a "settling" feel */}
      {CONFETTI.map((c, i) => (
        <Bob key={i} amplitude={6 + i} style={{ position: 'absolute', top: size * c.y, left: size * c.x }}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Circle cx="7" cy="7" r="6" fill={c.color} />
          </Svg>
        </Bob>
      ))}
    </View>
  );
}

export default IsoCelebrationScene;
