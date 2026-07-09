import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import { getProviderStats } from '@/lib/ustaz-api';

const SERVICE_TYPES = ['Electrician Service', 'Plumbing', 'Carpentry', 'AC Maintenance', 'Solar Technician'];

interface ProviderProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  cnic: string | null;
  city: string | null;
  phoneNumber: string | null;
  service_type: string | null;
  registrationDate: string | null;
  phone_verified: boolean | null;
  avatarUrl: string | null;
}

export default function ProviderProfile() {
  const { user, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [serviceType, setServiceType] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        supabase.from('ustaz_registrations').select('*').eq('userId', user.id).maybeSingle(),
        getProviderStats(user.id).catch(() => null),
      ]);
      if (profileRes.data) {
        const p = profileRes.data as ProviderProfile;
        setProfile(p);
        setFirstName(p.firstName ?? '');
        setLastName(p.lastName ?? '');
        setEmail(p.email ?? '');
        setCity(p.city ?? '');
        setServiceType(p.service_type ?? '');
      }
      if (statsRes) setStats(statsRes);
      setLoading(false);
    })();
  }, [user]);

  function startEditing() {
    if (!profile) return;
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setEmail(profile.email ?? '');
    setCity(profile.city ?? '');
    setServiceType(profile.service_type ?? '');
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
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
          city: city.trim() || null,
          service_type: serviceType || null,
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
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.primary }}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 18, fontWeight: '700', color: '#1B1B27' }}>{name || 'Provider'}</Text>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{profile?.service_type || 'Service provider'}</Text>
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
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Service Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {SERVICE_TYPES.map((st) => (
                        <Pressable key={st} onPress={() => setServiceType(st)}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: serviceType === st ? colors.primary : '#F3F4F6', borderWidth: 1, borderColor: serviceType === st ? colors.primary : '#E5E7EB' }}>
                          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: serviceType === st ? '#FFFFFF' : '#374151' }}>{st}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <EditField label="City" value={city} onChangeText={setCity} placeholder="e.g. Karachi" />
                </>
              ) : (
                <>
                  <ProfileRow label="Type" value={profile?.service_type || 'Not set'} accent />
                  <ProfileRow label="City" value={profile?.city || 'Not set'} />
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
