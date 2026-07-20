import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { getProviderStats } from '@/lib/ustaz-api';

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

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [formServiceTypes, setFormServiceTypes] = useState<string[]>([]);

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

      // Refresh profile
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
  const phone = profile ? `${profile.phoneNumber ?? ''}`.trim() : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27' }}>Profile</Text>
          {!loading && profile && (
            editing ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={cancelEditing} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveProfile} disabled={saving}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: saving ? '#D1D5DB' : colors.primary }}>
                  {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={startEditing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary }}>
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Edit</Text>
              </Pressable>
            )
          )}
        </View>

        {error && (
          <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: '#FEF2F2', padding: 12 }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <>
            {/* Avatar + Name Card */}
            <View style={{ marginBottom: 16, borderRadius: 20, backgroundColor: '#F9FAFB', padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.primary }} />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                    <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.primary }}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 18, fontWeight: '700', color: '#1B1B27' }}>{name || 'Provider'}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                    {(profile?.service_types && profile.service_types.length > 0
                      ? profile.service_types.join(', ')
                      : profile?.service_type) || 'Service provider'}
                  </Text>
                  {profile?.phone_verified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#10B981', fontWeight: '700' }}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Stats Tiles */}
            {stats && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#FFFBEB', padding: 14, borderWidth: 1, borderColor: '#FEF3C7' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#B45309' }}>Rating</Text>
                  </View>
                  <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27' }}>{stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : '-'}</Text>
                </View>
                <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#EFF6FF', padding: 14, borderWidth: 1, borderColor: '#DBEAFE' }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#3B82F6' }}>Reviews</Text>
                  <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginTop: 4 }}>{stats.total_ratings ?? 0}</Text>
                </View>
                <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#F0FDF4', padding: 14, borderWidth: 1, borderColor: '#DCFCE7' }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#10B981' }}>Jobs Done</Text>
                  <Text style={{ fontFamily: 'Anton', fontSize: 22, color: colors.primary, marginTop: 4 }}>{stats.completed_jobs ?? 0}</Text>
                </View>
              </View>
            )}

            {/* Tier & Verification */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {/* Tier Card */}
              <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tier</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27', textTransform: 'capitalize' }}>{standing?.tier || 'Standard'}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor:
                    standing?.tier === 'elite' ? '#F3E8FF' :
                    standing?.tier === 'trusted' ? '#ECFDF5' :
                    standing?.tier === 'probation' ? '#FEF2F2' : '#F3F4F6'
                  }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, fontWeight: '700', color:
                      standing?.tier === 'elite' ? '#7C3AED' :
                      standing?.tier === 'trusted' ? '#10B981' :
                      standing?.tier === 'probation' ? '#EF4444' : '#6B7280'
                    }}>
                      {standing?.tier === 'elite' ? 'ELITE' :
                       standing?.tier === 'trusted' ? 'TRUSTED' :
                       standing?.tier === 'probation' ? 'PROBATION' : 'STANDARD'}
                    </Text>
                  </View>
                </View>
                {standing?.overall_rating_avg != null && standing.overall_rating_avg > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF' }}>Avg Rating</Text>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF' }}>{Number(standing.overall_rating_avg).toFixed(1)}/5</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor:
                        standing.overall_rating_avg >= 4.0 ? '#10B981' :
                        standing.overall_rating_avg >= 3.0 ? '#F59E0B' : '#EF4444',
                        width: `${(standing.overall_rating_avg / 5) * 100}%`
                      }} />
                    </View>
                  </View>
                )}
              </View>

              {/* Verification Card */}
              <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>ID Verification</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 14, color: '#1B1B27', textTransform: 'capitalize' }}>
                    {profile?.verification_status === 'verified' ? 'Verified' :
                     profile?.verification_status === 'pending_review' ? 'Pending' :
                     profile?.verification_status === 'rejected' ? 'Rejected' :
                     profile?.verification_status === 'expired' ? 'Expired' : 'Unverified'}
                  </Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor:
                    profile?.verification_status === 'verified' ? '#ECFDF5' :
                    profile?.verification_status === 'pending_review' ? '#FEF3C7' :
                    profile?.verification_status === 'rejected' ? '#FEF2F2' : '#F3F4F6'
                  }}>
                    <Ionicons name={
                      profile?.verification_status === 'verified' ? 'checkmark-circle' :
                      profile?.verification_status === 'pending_review' ? 'time' :
                      profile?.verification_status === 'rejected' ? 'close-circle' : 'help-circle'
                    } size={14} color={
                      profile?.verification_status === 'verified' ? '#10B981' :
                      profile?.verification_status === 'pending_review' ? '#D97706' :
                      profile?.verification_status === 'rejected' ? '#EF4444' : '#9CA3AF'
                    } />
                  </View>
                </View>
                {(!profile?.verification_status || profile?.verification_status === 'unverified') && (
                  <View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>Submit CNIC for admin review</Text>
                    <Pressable onPress={handleSubmitVerification}
                      style={{ paddingVertical: 6, borderRadius: 8, backgroundColor: `${colors.primary}10`, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: colors.primary }}>Submit for verification</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Appeal button (probation only) */}
            {standing?.tier === 'probation' && (
              <Pressable onPress={() => setShowAppealModal(true)}
                style={{ marginBottom: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#D97706' }}>Submit an Appeal</Text>
              </Pressable>
            )}

            {/* Appeal Modal */}
            <Modal visible={showAppealModal} transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27', marginBottom: 12 }}>Submit an Appeal</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Reason</Text>
                  <TextInput value={appealReason} onChangeText={setAppealReason}
                    multiline placeholder="Explain why you believe this should be reviewed..."
                    placeholderTextColor="#D1D5DB"
                    style={{ borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27', textAlignVertical: 'top', marginBottom: 16, minHeight: 100 }} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={() => { setShowAppealModal(false); setAppealReason(''); }}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleSubmitAppeal} disabled={submittingAppeal || !appealReason.trim()}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: (!appealReason.trim() || submittingAppeal) ? '#D1D5DB' : colors.primary, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{submittingAppeal ? 'Submitting...' : 'Submit'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Personal Information */}
            <SectionHeader icon="person" label="Personal" />
            <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', padding: 16, gap: 12 }}>
              {editing ? (
                <>
                  <EditField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
                  <EditField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
                  <EditField label="Email" value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
                </>
              ) : (
                <>
                  <ProfileRow label="Full Name" value={name || 'Not provided'} />
                  <ProfileRow label="Email" value={profile?.email || 'Not provided'} />
                  <ProfileRow label="CNIC" value={profile?.cnic || 'Not provided'} />
                  <ProfileRow label="Registered" value={profile?.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : 'Unknown'} />
                </>
              )}
            </View>

            {/* Contact Information */}
            <SectionHeader icon="call" label="Contact" />
            <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', padding: 16, gap: 12 }}>
              <ProfileRow label="Phone" value={phone || user?.phone || 'Not provided'} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF' }}>Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: profile?.phone_verified ? '#ECFDF5' : '#FEF3C7' }}>
                  <Ionicons name={profile?.phone_verified ? 'checkmark-circle' : 'warning'} size={12} color={profile?.phone_verified ? '#10B981' : '#D97706'} />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: profile?.phone_verified ? '#10B981' : '#D97706' }}>
                    {profile?.phone_verified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Service Information */}
            <SectionHeader icon="briefcase" label="Service" />
            <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', padding: 16, gap: 12 }}>
              {editing ? (
                <>
                  <View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Service Types</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {SERVICE_TYPES.map((st) => {
                        const isActive = (formServiceTypes || []).includes(st);
                        return (
                          <Pressable key={st} onPress={() => toggleEditService(st)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: isActive ? colors.primary : '#F3F4F6', borderWidth: 1, borderColor: isActive ? colors.primary : '#E5E7EB' }}>
                            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: isActive ? '#FFFFFF' : '#374151' }}>{st}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <>
                  <View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Services</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(profile?.service_types && profile.service_types.length > 0
                        ? profile.service_types
                        : profile?.service_type ? [profile.service_type] : []
                      ).map((svc) => (
                        <View key={svc} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }}>
                          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: colors.primary }}>{svc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={{ gap: 10 }}>
              <Pressable onPress={switchRole}
                style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <Ionicons name="home-outline" size={20} color="#1B1B27" />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>Switch to Customer</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Find and book services</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>

              <Pressable onPress={handleSignOut}
                style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Sign out</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>End your current session</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#D1D5DB' }}>Ustaz v0.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

function ProfileRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF' }}>{label}</Text>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: accent ? colors.primary : '#1B1B27', textAlign: 'right', flex: 1, marginLeft: 12 }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function EditField({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' }) {
  return (
    <View>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#D1D5DB" keyboardType={keyboardType ?? 'default'}
        style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27' }} />
    </View>
  );
}
