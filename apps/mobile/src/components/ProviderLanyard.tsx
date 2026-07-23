/**
 * ProviderLanyard — interactive 3D ID card suspended from a lanyard strap.
 * Touch-driven rotation, tap-to-flip, gentle pendulum swing.
 * Full hero presentation with PDF export.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Text, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { color, font, radius, shadow, space } from '../theme/tokens';

/* ------------------------------------------------------------------ */
/*  Screen-driven sizing                                               */
/* ------------------------------------------------------------------ */

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.round(SCREEN_W * 0.82);
const CARD_H = Math.round(CARD_W * 1.5);
const AVATAR_SIZE = Math.round(CARD_W * 0.22);
const PAD = Math.round(CARD_W * 0.07);

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ProviderLanyardProps {
  name: string;
  initials: string;
  avatarUrl?: string | null;
  serviceType: string;
  rating?: number | null;
  ratingCount?: number | null;
  completedJobs?: number | null;
  tier?: string | null;
  isVerified?: boolean;
  providerId?: string;
  phone?: string | null;
  registrationDate?: string | null;
  cnic?: string | null;
  style?: ViewStyle;
  cardRef?: React.RefObject<View>;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <Ionicons name={icon as any} size={14} color="rgba(255,255,255,0.4)" />
      <Text style={{ fontFamily: font.body, fontSize: 10, color: 'rgba(255,255,255,0.45)', width: 60 }}>{label}</Text>
      <Text style={{ fontFamily: font.body, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600', flex: 1 }} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

function DecorativeBarcode({ id }: { id: string }) {
  const bars = useMemo(() => {
    const seed = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pattern: number[] = [];
    for (let i = 0; i < 44; i++) {
      const v = ((seed * (i + 1) * 7 + i * 13) % 100) / 100;
      pattern.push(v > 0.45 ? 1 : 0);
    }
    return pattern;
  }, [id]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: 30, opacity: 0.3 }}>
      {bars.map((w, i) => (
        <View key={i} style={{
          width: w ? 2.5 : 1,
          height: 12 + ((i * 3 + 7) % 18),
          backgroundColor: color.white,
          borderRadius: 0.5,
        }} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const LOGO_IMG = require('../../assets/icon.png');

export default function ProviderLanyard({
  name,
  initials,
  avatarUrl,
  serviceType,
  rating,
  ratingCount,
  completedJobs,
  tier,
  isVerified,
  providerId,
  phone,
  registrationDate,
  cnic,
  style,
  cardRef,
}: ProviderLanyardProps) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const flapRotateY = useSharedValue(0);

  const swingY = useSharedValue(0);
  const swingRotate = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    swingY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    swingRotate.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => { cancelAnimation(swingY); cancelAnimation(swingRotate); };
  }, [reduce, swingY, swingRotate]);

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
    flapRotateY.value = withSpring(flipped ? 0 : 180, { damping: 18, stiffness: 120, mass: 0.8 });
  }, [flipped, flapRotateY]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      cancelAnimation(swingY);
      cancelAnimation(swingRotate);
      scale.value = withSpring(1.04, { damping: 12, stiffness: 200 });
    })
    .onUpdate((e) => {
      rotateY.value = interpolate(e.translationX, [-180, 180], [-28, 28], 'clamp');
      rotateX.value = interpolate(e.translationY, [-180, 180], [20, -20], 'clamp');
      swingY.value = interpolate(e.translationY, [-180, 180], [-5, 5], 'clamp');
      swingRotate.value = interpolate(e.translationX, [-180, 180], [-4, 4], 'clamp');
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, { damping: 14, stiffness: 100 });
      rotateY.value = withSpring(0, { damping: 14, stiffness: 100 });
      swingY.value = withSpring(0, { damping: 10, stiffness: 80 });
      swingRotate.value = withSpring(0, { damping: 10, stiffness: 80 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      swingY.value = withDelay(600, withRepeat(
        withSequence(
          withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ));
      swingRotate.value = withDelay(600, withRepeat(
        withSequence(
          withTiming(2.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-2.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ));
    })
    .onTouchesUp(() => {
      runOnJS(handleFlip)();
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { translateY: swingY.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value + flapRotateY.value}deg` },
      { rotate: `${swingRotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotateX.value, [-20, 0, 20], [0.2, 0.05, 0.2]),
    transform: [
      { translateX: interpolate(rotateY.value, [-28, 0, 28], [-50, 0, 50]) },
      { translateY: interpolate(rotateX.value, [-20, 0, 20], [-40, 0, 40]) },
    ],
  }));

  const tierLabel = tier === 'elite' ? 'ELITE' : tier === 'trusted' ? 'TRUSTED' : tier === 'probation' ? 'PROBATION' : 'STANDARD';
  const tierColor = tier === 'elite' ? '#A78BFA' : tier === 'trusted' ? '#34D399' : tier === 'probation' ? '#FCA5A5' : 'rgba(255,255,255,0.5)';
  const displayId = providerId ? `UST-${providerId.slice(0, 8).toUpperCase()}` : 'UST-XXXXXXXX';
  const regDate = registrationDate ? new Date(registrationDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {/* ── Lanyard ribbon — wide flat strap with logo ── */}
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 52,
          height: 110,
          backgroundColor: '#111827',
          borderRadius: 4,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}>
          {/* Edge highlights */}
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2.5, backgroundColor: 'rgba(0,0,0,0.25)' }} />

          {/* Single logo */}
          <Image
            source={LOGO_IMG}
            style={{ width: 30, height: 30, resizeMode: 'contain' }}
          />
        </View>

        {/* ── Metal ring ── */}
        <View style={{
          width: 28, height: 20, borderRadius: 5,
          borderWidth: 3.5, borderColor: '#777',
          backgroundColor: 'transparent',
          marginTop: -2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 5,
        }} />

        {/* ── Clip jaw ── */}
        <View style={{ alignItems: 'center', marginTop: -4 }}>
          <LinearGradient
            colors={['#999', '#CCC', '#AAA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 20, height: 30, borderRadius: 3 }}
          />
          <View style={{
            position: 'absolute', bottom: -5, alignSelf: 'center',
            width: 12, height: 12, borderRadius: 6,
            borderWidth: 3, borderColor: '#888',
            backgroundColor: 'transparent',
          }} />
        </View>
      </View>

      {/* ── 3D Card ── */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{
          width: CARD_W,
          height: CARD_H,
          marginTop: -10,
          borderRadius: radius.xl,
          overflow: 'visible',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.4,
          shadowRadius: 32,
          elevation: 16,
        }, cardStyle]}>
          {/* Card body */}
          <View ref={cardRef} style={{
            width: CARD_W, height: CARD_H, borderRadius: radius.xl,
            backgroundColor: color.navy,
            overflow: 'hidden',
          }}>
            {/* Hole for ribbon threading */}
            <View style={{
              position: 'absolute', top: -8, alignSelf: 'center',
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: '#111827',
              borderWidth: 2, borderColor: '#333',
              zIndex: 10,
            }} />

            {/* Glow accents */}
            <View style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: color.primary, opacity: 0.1 }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: color.primaryLight, opacity: 0.06 }} />

            {/* Specular highlight */}
            <Animated.View style={[{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: radius.xl,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }, highlightStyle]} />

            {/* Brand header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingTop: PAD + 10, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={LOGO_IMG} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                <View>
                  <Text style={{ fontFamily: font.display, fontSize: 14, color: color.white, letterSpacing: 2, fontWeight: '700', lineHeight: 16 }}>USTAZ</Text>
                  <Text style={{ fontFamily: font.body, fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, lineHeight: 9 }}>SERVICE PROVIDER</Text>
                </View>
              </View>
              {isVerified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(16,185,129,0.18)' }}>
                  <Ionicons name="checkmark-circle" size={10} color="#34D399" />
                  <Text style={{ fontFamily: font.body, fontSize: 7, color: '#34D399', fontWeight: '700', lineHeight: 9 }}>VERIFIED</Text>
                </View>
              )}
            </View>

            <View style={{ height: 1, marginHorizontal: PAD, backgroundColor: 'rgba(255,255,255,0.08)' }} />

            {/* ── Centered Avatar ── */}
            <View style={{ alignItems: 'center', marginTop: 14 }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{
                  width: AVATAR_SIZE + 12, height: AVATAR_SIZE + 12, borderRadius: (AVATAR_SIZE + 12) / 2,
                  borderWidth: 3, borderColor: color.primary,
                }} />
              ) : (
                <View style={{
                  width: AVATAR_SIZE + 12, height: AVATAR_SIZE + 12, borderRadius: (AVATAR_SIZE + 12) / 2,
                  backgroundColor: `${color.primary}20`,
                  borderWidth: 3, borderColor: color.primary,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontFamily: font.numeric, fontSize: AVATAR_SIZE * 0.45, color: color.primary }}>{initials}</Text>
                </View>
              )}
            </View>

            {/* ── Name + Service ── */}
            <View style={{ alignItems: 'center', paddingHorizontal: PAD, marginTop: 10, marginBottom: 12 }}>
              <Text style={{ fontFamily: font.heading, fontSize: 20, color: color.white, fontWeight: '700', lineHeight: 24 }} numberOfLines={1}>{name || 'Provider'}</Text>
              <Text style={{ fontFamily: font.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 15 }} numberOfLines={1}>{serviceType}</Text>
            </View>

            {/* ── Stats Ring Grid (2×2) ── */}
            <View style={{ flexDirection: 'row', paddingHorizontal: PAD, gap: 10, marginBottom: 12 }}>
              {/* Rating */}
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  borderWidth: 2.5, borderColor: '#F59E0B',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(245,158,11,0.1)',
                }}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                </View>
                <Text style={{ fontFamily: font.numeric, fontSize: 16, color: color.white, fontWeight: '700', marginTop: 6 }}>
                  {rating != null && rating > 0 ? rating.toFixed(1) : '—'}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>RATING</Text>
              </View>

              {/* Reviews */}
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  borderWidth: 2.5, borderColor: '#A78BFA',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(167,139,250,0.1)',
                }}>
                  <Ionicons name="chatbubbles" size={16} color="#A78BFA" />
                </View>
                <Text style={{ fontFamily: font.numeric, fontSize: 16, color: color.white, fontWeight: '700', marginTop: 6 }}>
                  {ratingCount ?? '—'}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>REVIEWS</Text>
              </View>

              {/* Jobs Done */}
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  borderWidth: 2.5, borderColor: '#34D399',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(52,211,153,0.1)',
                }}>
                  <Ionicons name="checkmark-done" size={16} color="#34D399" />
                </View>
                <Text style={{ fontFamily: font.numeric, fontSize: 16, color: color.white, fontWeight: '700', marginTop: 6 }}>
                  {completedJobs ?? '—'}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>JOBS</Text>
              </View>

              {/* Tier */}
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  borderWidth: 2.5, borderColor: tierColor,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${tierColor}15`,
                }}>
                  <Ionicons name="shield-checkmark" size={16} color={tierColor} />
                </View>
                <Text style={{ fontFamily: font.numeric, fontSize: 13, color: tierColor, fontWeight: '800', marginTop: 6 }}>
                  {tierLabel}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>TIER</Text>
              </View>
            </View>

            {/* ── Contact Card ── */}
            <View style={{ marginHorizontal: PAD, marginBottom: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', padding: 12 }}>
              <Text style={{ fontFamily: font.body, fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Contact</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="call" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={{ fontFamily: font.body, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{phone || '—'}</Text>
              </View>
              {regDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={{ fontFamily: font.body, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>Since {regDate}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="finger-print" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={{ fontFamily: font.body, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500', letterSpacing: 0.5 }}>{displayId}</Text>
              </View>
            </View>

            {/* Barcode */}
            <View style={{ alignItems: 'center', marginTop: 'auto', paddingBottom: PAD - 4, opacity: 0.5 }}>
              <DecorativeBarcode id={providerId || 'default'} />
            </View>
          </View>

          {/* ── Back face ── */}
          <View style={{
            position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H,
            borderRadius: radius.xl,
            backgroundColor: '#0A0F1E',
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={{
                  position: 'absolute', top: i * (CARD_H / 14),
                  left: -20, right: -20, height: 1,
                  backgroundColor: color.white, transform: [{ rotate: `${(i % 2 === 0 ? 3 : -3)}deg` }],
                }} />
              ))}
            </View>

            <View style={{ position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -70, opacity: 0.04 }}>
              <Text style={{ fontFamily: font.display, fontSize: 140, color: color.white, fontWeight: '700' }}>U</Text>
            </View>

            <View style={{ flex: 1, paddingHorizontal: PAD + 4, paddingTop: PAD + 14, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <Image source={LOGO_IMG} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
                  <Text style={{ fontFamily: font.display, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5 }}>USTAZ</Text>
                </View>

                <Text style={{ fontFamily: font.body, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginBottom: 14, textTransform: 'uppercase' }}>Provider Details</Text>

                <BackRow label="Full Name" value={name || '—'} />
                <BackRow label="Phone" value={phone || '—'} />
                <BackRow label="Service" value={serviceType} />
                {cnic && <BackRow label="CNIC" value={cnic} />}
                {regDate && <BackRow label="Registered" value={regDate} />}
                <BackRow label="Provider ID" value={displayId} />
                {rating != null && rating > 0 && (
                  <BackRow label="Rating" value={`${rating.toFixed(1)} / 5.0 (${ratingCount} reviews)`} />
                )}
              </View>

              <View style={{ alignItems: 'center', paddingBottom: PAD }}>
                <DecorativeBarcode id={providerId || 'default'} />
                <Text style={{ fontFamily: font.body, fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 10, letterSpacing: 1.2 }}>{displayId}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Tap hint */}
      <Text style={{ fontFamily: font.body, fontSize: 11, color: color.inkMuted, marginTop: space.lg, opacity: 0.45 }}>
        Drag to rotate · Tap to flip
      </Text>
    </View>
  );
}

function BackRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ fontFamily: font.body, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{label}</Text>
      <Text style={{ fontFamily: font.body, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
