/**
 * IsoWalletScene — isometric coin-stack illustration for wallet/earnings
 * moments. Shares the platform/gradient language of IsoServiceScene but is a
 * distinct composition (coins + rising bill), not a variant of it.
 */
import Svg, { Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { color } from '../../theme/tokens';
import { Drift } from '../motion';

export function IsoWalletScene({ size = 260 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Drift distance={1.5} duration={2800}>
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
      </Drift>
    </View>
  );
}

export default IsoWalletScene;
