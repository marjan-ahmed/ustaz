import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { getProviderStats } from '@/lib/ustaz-api';
import {
  Badge, BorderBeam, Button, Card, Chip, CircularGauge, FadeInUp, GlowBackdrop, IconTile, Numeric, PressableScale, Screen, SectionHeader, ShineText, Stagger, Text, TextField,
} from '@/components/mobile-ui';
import { color, gradient, radius, space, type as typeScale } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import ProviderLanyard from '@/components/ProviderLanyard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '@/i18n';

const SERVICE_TYPES = ['Electrician', 'Plumbing', 'Carpentry', 'AC Maintenance', 'Solar Technician', 'CCTV Technician', 'Room Cooler', 'Refrigerator Technician', 'Home Appliances', 'Automatic Washing Machine Repair'];
type IconName = ComponentProps<typeof Ionicons>['name'];

interface ProviderProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  cnic: string | null;
  phoneNumber: string | null;
  service_type: string | null;
  service_types: string[] | null;
  registrationDate: string | null;
  phone_verified: boolean | null;
  avatarUrl: string | null;
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  verification_status: string | null;
  verification_expires_at: string | null;
  provider_display_id: string | null;
}

interface ProviderStanding {
  tier: string | null;
  overall_rating_avg: number | null;
  total_completed_jobs: number | null;
}

export default function ProviderProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [standing, setStanding] = useState<ProviderStanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [formServiceTypes, setFormServiceTypes] = useState<string[]>([]);
  const cardRef = useRef<View>(null);

  async function handleDownloadID() {
    if (!profile) return;
    const n = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Provider';
    const svc = (profile.service_types && profile.service_types.length > 0
      ? profile.service_types.join(', ')
      : profile.service_type) || 'Service provider';
    const displayId = profile.provider_display_id || (user?.id ? `UST-${user.id.slice(0, 8).toUpperCase()}` : 'UST-XXXXXXXX');
    const regDate = profile.registrationDate
      ? new Date(profile.registrationDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    const ratingStr = stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—';
    const reviewsStr = String(stats?.total_ratings ?? 0);
    const jobsStr = String(stats?.completed_jobs ?? 0);
    const tierStr = standing?.tier ? standing.tier.charAt(0).toUpperCase() + standing.tier.slice(1) : 'Standard';

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .card { width: 340px; background: #0F1729; border-radius: 16px; overflow: hidden; color: white; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .hole { width: 20px; height: 20px; border-radius: 50%; background: #111827; border: 2px solid #333; margin: -10px auto 0; position: relative; z-index: 2; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 10px; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .brand-icon { width: 28px; height: 28px; background: #DB4B0D; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
  .brand-name { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
  .brand-sub { font-size: 7px; color: rgba(255,255,255,0.35); letter-spacing: 1px; }
  .verified { font-size: 7px; color: #34D399; background: rgba(16,185,129,0.18); padding: 3px 7px; border-radius: 5px; font-weight: 700; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 20px; }
  .avatar-section { text-align: center; padding: 14px 20px 8px; }
  .avatar { width: 70px; height: 70px; border-radius: 50%; border: 3px solid #DB4B0D; background: rgba(219,75,13,0.2); display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #DB4B0D; }
  .avatar img { width: 70px; height: 70px; border-radius: 50%; border: 3px solid #DB4B0D; object-fit: cover; }
  .name { font-size: 20px; font-weight: 700; margin-top: 10px; }
  .service { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .stats { display: flex; gap: 10px; padding: 12px 20px; }
  .stat { flex: 1; text-align: center; padding: 10px 0; border-radius: 12px; background: rgba(255,255,255,0.06); }
  .stat-icon { width: 44px; height: 44px; border-radius: 50%; border: 2.5px solid; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 6px; }
  .stat-value { font-size: 16px; font-weight: 700; }
  .stat-label { font-size: 8px; color: rgba(255,255,255,0.4); margin-top: 1px; }
  .contact { margin: 0 20px 10px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.06); }
  .contact-title { font-size: 7px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .contact-row { font-size: 11px; color: rgba(255,255,255,0.85); margin-bottom: 4px; }
  .barcode { text-align: center; padding: 12px 20px 16px; font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 1px; }
</style>
</head>
<body>
<div class="card">
  <div class="hole"></div>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">U</div>
      <div><div class="brand-name">USTAZ</div><div class="brand-sub">SERVICE PROVIDER</div></div>
    </div>
    ${profile.phone_verified ? '<span class="verified">✓ VERIFIED</span>' : ''}
  </div>
  <div class="divider"></div>
  <div class="avatar-section">
    ${profile.avatarUrl
      ? `<img src="${profile.avatarUrl}" class="avatar" />`
      : `<div class="avatar">${initials}</div>`
    }
    <div class="name">${n}</div>
    <div class="service">${svc}</div>
  </div>
  <div class="stats">
    <div class="stat">
      <div class="stat-icon" style="border-color:#F59E0B;background:rgba(245,158,11,0.1);">⭐</div>
      <div class="stat-value">${ratingStr}</div>
      <div class="stat-label">RATING</div>
    </div>
    <div class="stat">
      <div class="stat-icon" style="border-color:#A78BFA;background:rgba(167,139,250,0.1);">💬</div>
      <div class="stat-value">${reviewsStr}</div>
      <div class="stat-label">REVIEWS</div>
    </div>
    <div class="stat">
      <div class="stat-icon" style="border-color:#34D399;background:rgba(52,211,153,0.1);">✓</div>
      <div class="stat-value">${jobsStr}</div>
      <div class="stat-label">JOBS</div>
    </div>
    <div class="stat">
      <div class="stat-icon" style="border-color:#A78BFA;background:rgba(167,139,250,0.1);">🛡</div>
      <div class="stat-value" style="font-size:13px;">${tierStr}</div>
      <div class="stat-label">TIER</div>
    </div>
  </div>
  <div class="contact">
    <div class="contact-title">Contact</div>
    <div class="contact-row">📱 ${profile.phoneNumber || '—'}</div>
    <div class="contact-row">📅 Since ${regDate}</div>
    <div class="contact-row">🪪 ${displayId}</div>
  </div>
  <div class="barcode">||||| ${displayId} |||||</div>
</div>
</body>
</html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download Provider ID Card' });
      }
    } catch (err: any) {
      Alert.alert('Export failed', err.message ?? 'Could not generate PDF.');
    }
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes, standingRes] = await Promise.all([
          supabase.from('ustaz_registrations').select('*').eq('userId', user.id).maybeSingle(),
          getProviderStats(user.id).catch(() => null),
          supabase.from('provider_standing').select('tier, overall_rating_avg, total_completed_jobs').eq('provider_id', user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        if (profileRes.data) {
          const p = profileRes.data as ProviderProfile;
          setProfile(p);
          setFirstName(p.firstName ?? '');
          setLastName(p.lastName ?? '');
          setEmail(p.email ?? '');
          setFormServiceTypes(p.service_types ?? (p.service_type ? [p.service_type] : []));
        }
        if (statsRes) setStats(statsRes);
        if (standingRes.data) setStanding(standingRes.data as ProviderStanding);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  function startEditing() {
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setEmail(profile.email ?? '');
    setFormServiceTypes(profile.service_types ?? (profile.service_type ? [profile.service_type] : []));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  function toggleEditService(service: string) {
    setFormServiceTypes(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  }

  async function saveProfile() {
    if (!user || !firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('ustaz_registrations')
        .update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          service_type: formServiceTypes[0] || null,
          service_types: formServiceTypes.length > 0 ? formServiceTypes : null,
        })
        .eq('userId', user.id);

      if (updateError) throw updateError;

      const { data } = await supabase.from('ustaz_registrations').select('*').eq('userId', user.id).maybeSingle();
      if (data) setProfile(data as ProviderProfile);
      setEditing(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save profile.');
    }
    setSaving(false);
  }

  async function switchRole() {
    await setStoredRole('customer');
    router.replace('/(customer)');
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/splash');
  }

  async function handleSubmitAppeal() {
    if (!appealReason.trim() || !user) return;
    setSubmittingAppeal(true);
    try {
      const { error } = await supabase.rpc('submit_appeal', {
        p_appeal_type: 'general',
        p_reason: appealReason,
      });
      if (error) throw error;
      setShowAppealModal(false);
      setAppealReason('');
    } catch {}
    setSubmittingAppeal(false);
  }

  async function handleSubmitVerification() {
    router.push('/(provider)/verify-identity');
  }

  const name = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : '';
  const initials = name ? name.charAt(0).toUpperCase() : 'U';
  const phone = profile ? `${profile.phoneNumber ?? ''}`.trim() : '';
  const serviceLabel = (profile?.service_types && profile.service_types.length > 0
    ? profile.service_types.join(', ')
    : profile?.service_type) || 'Service provider';
  const tierLabel = standing?.tier ? standing.tier.charAt(0).toUpperCase() + standing.tier.slice(1) : 'Standard';
  const tierTone: 'primary' | 'success' | 'error' =
    standing?.tier === 'elite' ? 'primary' : standing?.tier === 'trusted' ? 'success' : standing?.tier === 'probation' ? 'error' : 'primary';
  const verificationLabel =
    profile?.verification_status === 'verified' ? 'Verified' :
    profile?.verification_status === 'pending_review' ? 'Pending review' :
    profile?.verification_status === 'rejected' ? 'Rejected' :
    profile?.verification_status === 'expired' ? 'Expired' : 'Unverified';
  const verificationIcon: IconName =
    profile?.verification_status === 'verified' ? 'checkmark-circle' :
    profile?.verification_status === 'pending_review' ? 'time' :
    profile?.verification_status === 'rejected' ? 'close-circle' : 'help-circle';
  const verificationColor =
    profile?.verification_status === 'verified' ? color.success :
    profile?.verification_status === 'pending_review' ? '#D97706' :
    profile?.verification_status === 'rejected' ? color.error : color.inkMuted;

  return (
    <Screen bg={color.white} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <FadeInUp>
          <Text variant="h1" style={{ marginBottom: space.md }}>{t('profile.title')}</Text>
        </FadeInUp>

        {error && !editing && (
          <FadeInUp>
            <Card variant="flat" style={{ marginBottom: space.md, backgroundColor: color.errorBg }}>
              <Text variant="label" style={{ color: color.error }}>{error}</Text>
            </Card>
          </FadeInUp>
        )}

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: space['3xl'] }}><ActivityIndicator color={color.primary} /></View>
        ) : (
          <>
            {/* Identity hero — compact, not the full lanyard */}
            <FadeInUp delay={60}>
              <LinearGradient colors={gradient.navy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: radius['2xl'], padding: space.lg, marginBottom: space.md, overflow: 'hidden' }}>
                <GlowBackdrop top={-60} right={-40} size={200} opacity={0.22} />
                <GlowBackdrop color={color.primaryLight} bottom={-50} left={-30} size={160} opacity={0.1} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {standing?.tier === 'elite' ? (
                    <BorderBeam width={62} height={62} borderRadius={31} strokeWidth={3}>
                      <AvatarGlyph avatarUrl={profile?.avatarUrl} initials={initials} size={56} />
                    </BorderBeam>
                  ) : (
                    <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <AvatarGlyph avatarUrl={profile?.avatarUrl} initials={initials} size={56} />
                    </View>
                  )}
                  <View style={{ marginLeft: space.md, flex: 1 }}>
                    <ShineText style={{ fontFamily: typeScale.h3.family, fontSize: typeScale.h3.size, lineHeight: typeScale.h3.line, color: color.white }}>
                      {name || 'Provider'}
                    </ShineText>
                    <Text variant="caption" tone="inverseSoft" numberOfLines={1} style={{ marginTop: 2 }}>{serviceLabel}</Text>
                    <View style={{ flexDirection: 'row', gap: space.xs, marginTop: space.xs }}>
                      {profile?.phone_verified && <Badge label={t('profile.verified')} tone="success" />}
                      <Badge label={tierLabel.toUpperCase()} tone={tierTone} />
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: space.lg, paddingTop: space.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Numeric size={22} tone="inverse">{stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—'}</Numeric>
                    <Text variant="caption" tone="inverseSoft" style={{ marginTop: 2 }}>Rating</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Numeric size={22} tone="inverse">{String(stats?.total_ratings ?? 0)}</Numeric>
                    <Text variant="caption" tone="inverseSoft" style={{ marginTop: 2 }}>Reviews</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Numeric size={22} tone="inverse">{String(stats?.completed_jobs ?? 0)}</Numeric>
                    <Text variant="caption" tone="inverseSoft" style={{ marginTop: 2 }}>Jobs Done</Text>
                  </View>
                </View>

                <PressableScale onPress={() => setShowIdModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: space.md, paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <Ionicons name="card-outline" size={16} color={color.white} />
                  <View style={{ alignItems: 'center' }}>
                    <Text variant="label" style={{ fontWeight: '700', color: color.white }}>View ID Card</Text>
                    {profile?.provider_display_id && (
                      <Text style={{ fontFamily: font.body, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{profile.provider_display_id}</Text>
                    )}
                  </View>
                </PressableScale>
              </LinearGradient>
            </FadeInUp>

            {/* Profile group */}
            <FadeInUp delay={100}>
              <SectionHeader title={t('profile.personal')} action={t('profile.edit')} onAction={startEditing} />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                <Row label={t('profile.fullName')} value={name || t('profile.notProvided')} />
                <Row label="Provider ID" value={profile?.provider_display_id || '—'} />
                <Row label={t('profile.email')} value={profile?.email || t('profile.notProvided')} />
                <Row label={t('profile.cnic')} value={profile?.cnic || t('profile.notProvided')} />
                <Row label={t('profile.phone')} value={phone || user?.phone || t('profile.notProvided')} />
                <Row label={t('profile.registered')} value={profile?.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : 'Unknown'} last />
              </Card>
            </FadeInUp>

            {/* Work group */}
            <FadeInUp delay={140}>
              <SectionHeader title={t('profile.service')} />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                <View style={{ paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: color.line }}>
                  <Text variant="caption" tone="muted" style={{ marginBottom: space.sm }}>{t('profile.services')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                    {(profile?.service_types && profile.service_types.length > 0
                      ? profile.service_types
                      : profile?.service_type ? [profile.service_type] : []
                    ).map((svc) => (
                      <Badge key={svc} label={svc} tone="primary" />
                    ))}
                  </View>
                </View>

                <View style={{ paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: color.line }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="label">Tier</Text>
                    <Badge label={tierLabel.toUpperCase()} tone={tierTone} />
                  </View>
                  {standing?.overall_rating_avg != null && standing.overall_rating_avg > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md }}>
                      <CircularGauge size={40} strokeWidth={4} progress={standing.overall_rating_avg / 5} color={color.success} trackColor={color.line}>
                        <Text variant="caption" style={{ fontWeight: '700', fontSize: 11 }}>{standing.overall_rating_avg.toFixed(1)}</Text>
                      </CircularGauge>
                      <Text variant="caption" tone="muted">Overall rating out of 5</Text>
                    </View>
                  )}
                </View>

                <View style={{ paddingTop: space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="label">{t('profile.status')} · ID Verification</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={verificationIcon} size={16} color={verificationColor} />
                      <Text variant="label" style={{ fontWeight: '700', color: verificationColor }}>{verificationLabel}</Text>
                    </View>
                  </View>
                  {(!profile?.verification_status || profile?.verification_status === 'unverified') && (
                    <PressableScale onPress={handleSubmitVerification}
                      style={{ marginTop: space.sm, paddingVertical: space.sm, borderRadius: radius.sm, backgroundColor: `${color.primary}14`, alignItems: 'center' }}>
                      <Text variant="caption" style={{ fontWeight: '700', color: color.primary }}>Submit for verification</Text>
                    </PressableScale>
                  )}
                </View>
              </Card>

              {standing?.tier === 'probation' && (
                <PressableScale onPress={() => setShowAppealModal(true)}
                  style={{ marginBottom: space.md, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: color.warningBg, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center' }}>
                  <Text variant="label" style={{ fontWeight: '700', color: '#D97706' }}>Submit an Appeal</Text>
                </PressableScale>
              )}
            </FadeInUp>

            {/* Preferences group */}
            <FadeInUp delay={180}>
              <SectionHeader title={t('profile.language')} />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                <Row
                  icon="language"
                  label={locale === 'en' ? t('profile.english') : t('profile.urdu')}
                  value={locale === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
                  onPress={() => setLocale(locale === 'en' ? 'ur' : 'en')}
                  last
                />
              </Card>
            </FadeInUp>

            {/* Account group */}
            <FadeInUp delay={220}>
              <SectionHeader title="Account" />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                <Stagger step={40}>
                  <Row
                    icon="home-outline"
                    label={t('profile.switchToCustomer')}
                    value={t('profile.switchToCustomerDesc')}
                    onPress={switchRole}
                    chevron
                  />
                  <Row
                    icon="log-out-outline"
                    label={t('profile.signOut')}
                    value={t('profile.signOutDesc')}
                    onPress={handleSignOut}
                    tone="error"
                    last
                  />
                </Stagger>
              </Card>
            </FadeInUp>
          </>
        )}

        <View style={{ height: 20 }} />
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" tone="muted">{t('profile.version')}</Text>
        </View>
      </ScrollView>

      {/* Appeal Modal */}
      <Modal visible={showAppealModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'center', padding: space.xl }}>
          <Card variant="elevated" style={{ borderRadius: radius['2xl'] }}>
            <Text variant="h2" style={{ marginBottom: space.md }}>Submit an Appeal</Text>
            <View style={{ marginBottom: space.lg }}>
              <TextField
                label="Reason" value={appealReason} onChangeText={setAppealReason}
                multiline placeholder="Explain why you believe this should be reviewed..."
                style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: space.sm }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Cancel" variant="soft" full={false} style={{ flex: 1 }} onPress={() => { setShowAppealModal(false); setAppealReason(''); }} />
              <Button label={submittingAppeal ? 'Submitting...' : 'Submit'} variant="primary" full={false} style={{ flex: 1 }} disabled={!appealReason.trim() || submittingAppeal} loading={submittingAppeal} onPress={handleSubmitAppeal} />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Edit Profile Modal — replaces whole-page inline editing */}
      <Modal visible={editing} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'center', padding: space.xl }}>
          <Card variant="elevated" style={{ borderRadius: radius['2xl'], maxHeight: '85%' }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="h2" style={{ marginBottom: space.md }}>{t('profile.edit')} {t('profile.personal')}</Text>
              <View style={{ gap: space.md }}>
                <TextField label={t('profile.firstName')} value={firstName} onChangeText={setFirstName} placeholder={t('profile.firstName')} />
                <TextField label={t('profile.lastName')} value={lastName} onChangeText={setLastName} placeholder={t('profile.lastName')} />
                <TextField label={t('profile.email')} value={email} onChangeText={setEmail} placeholder={t('profile.emailPlaceholder')} keyboardType="email-address" />
                <View>
                  <Text variant="caption" tone="muted" style={{ marginBottom: space.sm }}>{t('profile.services')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                    {SERVICE_TYPES.map((st) => (
                      <Chip key={st} label={st} active={formServiceTypes.includes(st)} onPress={() => toggleEditService(st)} />
                    ))}
                  </View>
                </View>
                {error && <Text variant="label" style={{ color: color.error }}>{error}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
                <Button label={t('profile.cancel')} variant="soft" full={false} style={{ flex: 1 }} onPress={cancelEditing} />
                <Button label={saving ? t('profile.saving') : t('profile.save')} variant="primary" full={false} style={{ flex: 1 }} loading={saving} disabled={saving} onPress={saveProfile} />
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* ID Card Modal — full lanyard, on demand instead of eating the main scroll */}
      <Modal visible={showIdModal} transparent animationType="slide" onRequestClose={() => setShowIdModal(false)}>
        <View style={{ flex: 1, backgroundColor: color.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: color.white, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], paddingTop: space.lg, paddingBottom: space.xl, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: space.lg, marginBottom: space.md }}>
              <Text variant="h2">ID Card</Text>
              <PressableScale onPress={() => setShowIdModal(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={color.inkMuted} />
              </PressableScale>
            </View>
            <ProviderLanyard
              name={name || 'Provider'}
              initials={initials}
              avatarUrl={profile?.avatarUrl}
              serviceType={serviceLabel}
              rating={stats?.avg_rating}
              ratingCount={stats?.total_ratings}
              completedJobs={stats?.completed_jobs}
              tier={standing?.tier}
              isVerified={!!profile?.phone_verified}
              providerId={user?.id}
              providerDisplayId={profile?.provider_display_id}
              phone={profile?.phoneNumber || user?.phone}
              registrationDate={profile?.registrationDate}
              cnic={profile?.cnic}
              cardRef={cardRef}
            />
            <PressableScale onPress={handleDownloadID}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: space.lg, paddingVertical: 12, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: `${color.primary}12`, borderWidth: 1, borderColor: `${color.primary}30` }}>
              <Ionicons name="download-outline" size={16} color={color.primary} />
              <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>{t('profile.downloadId')}</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Row({
  icon, label, value, onPress, chevron, tone, last,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  tone?: 'error';
  last?: boolean;
}) {
  const labelColor = tone === 'error' ? color.error : color.ink;
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: color.line }}>
      {icon ? (
        <IconTile bg={tone === 'error' ? color.errorBg : `${color.primary}14`} size={36}>
          <Ionicons name={icon} size={17} color={tone === 'error' ? color.error : color.primary} />
        </IconTile>
      ) : null}
      <View style={{ marginLeft: icon ? space.md : 0, flex: 1 }}>
        <Text variant="label" style={{ color: labelColor, fontWeight: onPress ? '700' : '400' }} numberOfLines={1}>{label}</Text>
      </View>
      {value ? (
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ maxWidth: 170, textAlign: 'right', marginLeft: space.sm }}>{value}</Text>
      ) : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={color.line} style={{ marginLeft: space.sm }} /> : null}
    </View>
  );
  return onPress ? <PressableScale onPress={onPress}>{content}</PressableScale> : content;
}

function AvatarGlyph({ avatarUrl, initials, size }: { avatarUrl?: string | null; initials: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(219,75,13,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: color.white }}>{initials}</Text>
      )}
    </View>
  );
}
