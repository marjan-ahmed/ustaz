/**
 * IsoWalletScene — isometric coin-stack illustration for wallet/earnings
 * moments. Shares the platform/gradient language of IsoServiceScene but is a
 * distinct composition (coins + rising bill), not a variant of it.
 */
import Svg, { Circle, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { color } from '../../theme/tokens';
import { Bob } from '../motion';

export function IsoWalletScene({ size = 260 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 260 260">
        <LinearGradient id="wplat" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A2440" />
          <Stop offset="1" stopColor="#0F1729" />
        </LinearGradient>
        <LinearGradient id="wplatSide" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1120" />
          <Stop offset="1" stopColor="#070D1A" />
        </LinearGradient>
        <LinearGradient id="coin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF6B4A" />
          <Stop offset="1" stopColor="#DB4B0D" />
        </LinearGradient>

        <Ellipse cx="130" cy="212" rx="96" ry="26" fill={color.navy} opacity={0.08} />

        <Path d="M130 120 L214 162 L130 204 L46 162 Z" fill="url(#wplat)" />
        <Path d="M46 162 L130 204 L130 232 L46 190 Z" fill="url(#wplatSide)" />
        <Path d="M214 162 L130 204 L130 232 L214 190 Z" fill="#0B1120" />

        {/* Coin stack, centered on platform */}
        <Ellipse cx="130" cy="150" rx="34" ry="13" fill="url(#coin)" />
        <Path d="M96 150 L96 140 A34 13 0 0 0 164 140 L164 150 A34 13 0 0 1 96 150 Z" fill="#C24309" />
        <Ellipse cx="130" cy="137" rx="34" ry="13" fill="url(#coin)" />
        <Path d="M96 137 L96 127 A34 13 0 0 0 164 127 L164 137 A34 13 0 0 1 96 137 Z" fill="#C24309" />
        <Ellipse cx="130" cy="124" rx="34" ry="13" fill="url(#coin)" />
        <Path d="M118 124 L142 124" stroke="#FFF7ED" strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
      </Svg>

      {/* Rising bill accent, floats above the stack */}
      <Bob amplitude={8} style={{ position: 'absolute', top: size * 0.22, left: size * 0.56 }}>
        <Svg width={54} height={38} viewBox="0 0 54 38">
          <Path d="M2 4 h50 a2 2 0 0 1 2 2 v26 a2 2 0 0 1 -2 2 h-50 a2 2 0 0 1 -2 -2 v-26 a2 2 0 0 1 2 -2 Z" fill={color.white} stroke={color.line} strokeWidth={1.5} />
          <Circle cx="27" cy="19" r="8" fill="none" stroke={color.primary} strokeWidth={2} />
          <Path d="M27 15 L27 23 M24 17.5 a3 2.6 0 0 1 5 0 M24 20.5 a3 2.6 0 0 0 5 0" stroke={color.primary} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        </Svg>
      </Bob>
    </View>
  );
}

export default IsoWalletScene;
