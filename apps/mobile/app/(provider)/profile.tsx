import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { getProviderStats } from '@/lib/ustaz-api';
import {
  Badge, Button, Card, Chip, FadeInUp, GlowBackdrop, Numeric, PatternBackdrop, PressableScale, Screen, SectionHeader, Stagger, StatTile, Text, TextField,
} from '@/components/mobile-ui';
import { color, gradient, radius, shadow, space } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import ProviderLanyard from '@/components/ProviderLanyard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const SERVICE_TYPES = ['Electrician', 'Plumbing', 'Carpentry', 'AC Maintenance', 'Solar Technician'];

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
}

interface ProviderStanding {
  tier: string | null;
  overall_rating_avg: number | null;
  total_completed_jobs: number | null;
}

export default function ProviderProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [standing, setStanding] = useState<ProviderStanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    const displayId = user?.id ? `UST-${user.id.slice(0, 8).toUpperCase()}` : 'UST-XXXXXXXX';
    const regDate = profile.registrationDate
      ? new Date(profile.registrationDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    const ratingStr = stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—';
    const reviewsStr = String(stats?.total_ratings ?? 0);
    const jobsStr = String(stats?.completed_jobs ?? 0);
    const tierStr = standing?.tier ? standing.tier.charAt(0).toUpperCase() + standing.tier.slice(1) : 'Standard';
    const verifiedStr = profile.phone_verified ? '✅ Verified' : 'Unverified';

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

  return (
    <Screen bg={color.white} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Header — overlaid on lanyard */}
        <FadeInUp>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.sm, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            <Text variant="h1">Profile</Text>
            {!loading && profile && (
              editing ? (
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button label="Cancel" variant="soft" full={false} onPress={cancelEditing} />
                  <Button label="Save" variant="primary" full={false} loading={saving} disabled={saving} onPress={saveProfile} />
                </View>
              ) : (
                <Button label="Edit" variant="primary" full={false} icon={<Ionicons name="pencil" size={14} color={color.white} />} onPress={startEditing} />
              )
            )}
          </View>
        </FadeInUp>

        {error && (
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
            {/* Lanyard ID Card — full hero */}
            <View style={{ marginBottom: space.md }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' }}>
                <PatternBackdrop variant="dots" tone="navy" opacity={0.05} glow={false} />
              </View>
              <View style={{ height: 52 }} />
              <ProviderLanyard
                name={name || 'Provider'}
                initials={name ? name.charAt(0).toUpperCase() : 'U'}
                avatarUrl={profile?.avatarUrl}
                serviceType={
                  (profile?.service_types && profile.service_types.length > 0
                    ? profile.service_types.join(', ')
                    : profile?.service_type) || 'Service provider'
                }
                rating={stats?.avg_rating}
                ratingCount={stats?.total_ratings}
                completedJobs={stats?.completed_jobs}
                tier={standing?.tier}
                isVerified={!!profile?.phone_verified}
                providerId={user?.id}
                phone={profile?.phoneNumber || user?.phone}
                registrationDate={profile?.registrationDate}
                cnic={profile?.cnic}
                cardRef={cardRef}
              />
              {/* Download ID Card button */}
              <PressableScale onPress={handleDownloadID}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: space.md, paddingVertical: 12, borderRadius: radius.md, backgroundColor: `${color.primary}12`, borderWidth: 1, borderColor: `${color.primary}30` }}>
                <Ionicons name="download-outline" size={16} color={color.primary} />
                <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>Download ID Card</Text>
              </PressableScale>
            </View>

            {/* Stats Tiles */}
            {stats && (
              <FadeInUp delay={100}>
                <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
                  <StatTile value={String(stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : '-')} label="Rating" tone="primary" bg={`${color.primary}10`} />
                  <StatTile value={String(stats.total_ratings ?? 0)} label="Reviews" tone="ink" bg={color.surfaceAlt} />
                  <StatTile value={String(stats.completed_jobs ?? 0)} label="Jobs Done" tone="ink" bg={color.successBg} />
                </View>
              </FadeInUp>
            )}

            {/* Tier & Verification */}
            <FadeInUp delay={140}>
              <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
                <Card variant="elevated" padded={false} style={{ flex: 1, padding: space.lg }}>
                  <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: space.sm }}>Tier</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Numeric size={18}>{standing?.tier || 'Standard'}</Numeric>
                    <Badge
                      label={standing?.tier === 'elite' ? 'ELITE' : standing?.tier === 'trusted' ? 'TRUSTED' : standing?.tier === 'probation' ? 'PROBATION' : 'STANDARD'}
                      tone={standing?.tier === 'elite' ? 'primary' : standing?.tier === 'trusted' ? 'success' : standing?.tier === 'probation' ? 'error' : 'primary'}
                    />
                  </View>
                  {standing?.overall_rating_avg != null && standing.overall_rating_avg > 0 && (
                    <View style={{ marginTop: space.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs }}>
                        <Text variant="caption" tone="muted">Avg Rating</Text>
                        <Text variant="caption" tone="muted">{Number(standing.overall_rating_avg).toFixed(1)}/5</Text>
                      </View>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: color.line, overflow: 'hidden' }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: color.success, width: `${(standing.overall_rating_avg / 5) * 100}%` }} />
                      </View>
                    </View>
                  )}
                </Card>

                <Card variant="elevated" padded={false} style={{ flex: 1, padding: space.lg }}>
                  <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: space.sm }}>ID Verification</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="body" style={{ fontWeight: '700', textTransform: 'capitalize' }}>
                      {profile?.verification_status === 'verified' ? 'Verified' :
                       profile?.verification_status === 'pending_review' ? 'Pending' :
                       profile?.verification_status === 'rejected' ? 'Rejected' :
                       profile?.verification_status === 'expired' ? 'Expired' : 'Unverified'}
                    </Text>
                    <Ionicons name={
                      profile?.verification_status === 'verified' ? 'checkmark-circle' :
                      profile?.verification_status === 'pending_review' ? 'time' :
                      profile?.verification_status === 'rejected' ? 'close-circle' : 'help-circle'
                    } size={18} color={
                      profile?.verification_status === 'verified' ? color.success :
                      profile?.verification_status === 'pending_review' ? '#D97706' :
                      profile?.verification_status === 'rejected' ? color.error : color.inkMuted
                    } />
                  </View>
                  {(!profile?.verification_status || profile?.verification_status === 'unverified') && (
                    <View style={{ marginTop: space.sm }}>
                      <Text variant="caption" tone="muted" style={{ marginBottom: space.xs }}>Submit CNIC for admin review</Text>
                      <PressableScale onPress={handleSubmitVerification}
                        style={{ paddingVertical: space.sm, borderRadius: radius.sm, backgroundColor: `${color.primary}14`, alignItems: 'center' }}>
                        <Text variant="caption" style={{ fontWeight: '700', color: color.primary }}>Submit for verification</Text>
                      </PressableScale>
                    </View>
                  )}
                </Card>
              </View>
            </FadeInUp>

            {/* Appeal button (probation only) */}
            {standing?.tier === 'probation' && (
              <FadeInUp delay={160}>
                <PressableScale onPress={() => setShowAppealModal(true)}
                  style={{ marginBottom: space.md, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: color.warningBg, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center' }}>
                  <Text variant="label" style={{ fontWeight: '700', color: '#D97706' }}>Submit an Appeal</Text>
                </PressableScale>
              </FadeInUp>
            )}

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

            {/* Personal Information */}
            <FadeInUp delay={180}>
              <SectionHeader title="Personal" />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                {editing ? (
                  <View style={{ gap: space.md }}>
                    <TextField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
                    <TextField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
                    <TextField label="Email" value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
                  </View>
                ) : (
                  <View style={{ gap: space.md }}>
                    <ProfileRow label="Full Name" value={name || 'Not provided'} />
                    <ProfileRow label="Email" value={profile?.email || 'Not provided'} />
                    <ProfileRow label="CNIC" value={profile?.cnic || 'Not provided'} />
                    <ProfileRow label="Registered" value={profile?.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : 'Unknown'} />
                  </View>
                )}
              </Card>
            </FadeInUp>

            {/* Contact Information */}
            <FadeInUp delay={220}>
              <SectionHeader title="Contact" />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                <ProfileRow label="Phone" value={phone || user?.phone || 'Not provided'} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm }}>
                  <Text variant="caption" tone="muted">Status</Text>
                  <Badge label={profile?.phone_verified ? 'Verified' : 'Pending'} tone={profile?.phone_verified ? 'success' : 'warning'} />
                </View>
              </Card>
            </FadeInUp>

            {/* Service Information */}
            <FadeInUp delay={260}>
              <SectionHeader title="Service" />
              <Card variant="elevated" style={{ marginBottom: space.md }}>
                {editing ? (
                  <View>
                    <Text variant="caption" tone="muted" style={{ marginBottom: space.sm }}>Service Types</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                      {SERVICE_TYPES.map((st) => {
                        const isActive = (formServiceTypes || []).includes(st);
                        return (
                          <Chip key={st} label={st} active={isActive} onPress={() => toggleEditService(st)} />
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <View>
                    <Text variant="caption" tone="muted" style={{ marginBottom: space.sm }}>Services</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                      {(profile?.service_types && profile.service_types.length > 0
                        ? profile.service_types
                        : profile?.service_type ? [profile.service_type] : []
                      ).map((svc) => (
                        <Badge key={svc} label={svc} tone="primary" />
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </FadeInUp>

            {/* Actions */}
            <FadeInUp delay={300}>
              <Stagger step={40}>
                <PressableScale onPress={switchRole}>
                  <Card variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="home-outline" size={20} color={color.navy} />
                      </View>
                      <View style={{ marginLeft: space.md, flex: 1 }}>
                        <Text variant="bodyLg" style={{ fontWeight: '700' }}>Switch to Customer</Text>
                        <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>Find and book services</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={color.line} />
                    </View>
                  </Card>
                </PressableScale>

                <PressableScale onPress={handleSignOut}>
                  <Card variant="elevated" padded={false} style={{ marginBottom: space.sm, padding: space.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color.errorBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="log-out-outline" size={20} color={color.error} />
                      </View>
                      <View style={{ marginLeft: space.md, flex: 1 }}>
                        <Text variant="bodyLg" style={{ fontWeight: '700', color: color.error }}>Sign out</Text>
                        <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>End your current session</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={color.line} />
                    </View>
                  </Card>
                </PressableScale>
              </Stagger>
            </FadeInUp>
          </>
        )}

        <View style={{ height: 20 }} />
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" tone="muted">Ustaz v0.1.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProfileRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="caption" tone="muted">{label}</Text>
      <Text variant="label" style={{ fontWeight: '700', color: accent ? color.primary : color.ink, textAlign: 'right', flex: 1, marginLeft: space.md }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
