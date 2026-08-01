import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import {
  Button,
  Card,
  FadeInUp,
  PressableScale,
  Screen,
  Text,
  TextField,
  TiltCard,
} from '@/components/mobile-ui';
import ResidencyInput from '@/components/ResidencyInput';
import { color, radius, space } from '@/theme/tokens';

const WHATSAPP_URL = process.env.EXPO_PUBLIC_PROVIDER_WHATSAPP_GROUP_URL;

const SERVICE_TYPES = [
  'Electrician',
  'Plumbing',
  'Carpentry',
  'AC Maintenance',
  'Solar Technician',
  'CCTV Technician',
  'Room Cooler',
  'Refrigerator Technician',
  'Home Appliances',
  'Automatic Washing Machine Repair',
];

const digitsOnly = (v: string) => v.replace(/\D/g, '');

export default function ProviderPrelaunchScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [residency, setResidency] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleService(name: string) {
    setServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
    setErrors((e) => ({ ...e, services: '' }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = 'Please enter your full name';
    if (!/^\d{7,}$/.test(digitsOnly(phone).replace(/^0+/, '')))
      next.phone = 'Enter a valid mobile number';
    if (!/^\d{13}$/.test(digitsOnly(cnic))) next.cnic = 'CNIC must be 13 digits';
    if (!residency.trim()) next.residency = 'Please enter or select your area';
    if (services.length === 0) next.services = 'Pick at least one service';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (status === 'loading') return;
    if (!validate()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('https://ustaz-bice.vercel.app/api/provider-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phone,
          cnic,
          residency: residency.trim(),
          serviceTypes: services,
          source: 'mobile-provider-prelaunch',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // --- Success screen ---
  if (status === 'success') {
    return (
      <Screen bg={color.white} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: space.lg, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden', width: '100%' }}>
            <View style={{ padding: space.xl, backgroundColor: color.navy }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${color.success}18`, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg }}>
                  <Ionicons name="checkmark-circle" size={36} color={color.success} />
                </View>
                <Text variant="h2" tone="inverse" center>You're on the list</Text>
                <Text variant="body" tone="inverseSoft" center style={{ marginTop: space.md, lineHeight: 22 }}>
                  Join our WhatsApp group to stay updated and connect with other providers.
                </Text>
              </View>

              {WHATSAPP_URL ? (
                <PressableScale
                  onPress={() => Linking.openURL(WHATSAPP_URL)}
                  style={s.whatsappBtn}
                >
                  <Ionicons name="logo-whatsapp" size={20} color={color.white} />
                  <Text variant="bodyLg" style={{ fontWeight: '700', color: color.white }}>Join WhatsApp Group</Text>
                </PressableScale>
              ) : (
                <Text variant="label" tone="inverseSoft" center style={{ marginTop: space.lg }}>
                  We'll be in touch on +92{digitsOnly(phone).replace(/^0+/, '')}
                </Text>
              )}

              <PressableScale
                onPress={() => router.back()}
                style={{ marginTop: space.md, minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <Text variant="body" tone="inverse" style={{ fontWeight: '700' }}>Go Back</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  // --- Form screen ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.sm }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg }}>
            <PressableScale onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={20} color={color.ink} />
            </PressableScale>
            <Text variant="h3">Become an Ustaz</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <FadeInUp>
              <View style={{ gap: space.xl }}>
                {/* Title */}
                <View>
                  <Text variant="display" style={{ fontSize: 28, lineHeight: 32 }}>Get customers{'\n'}the day we launch</Text>
                  <Text variant="body" tone="muted" style={{ marginTop: space.md }}>
                    We're building Pakistan's most trusted home-services platform — register today and be among the first to receive job requests.
                  </Text>
                </View>

                {/* Benefits */}
                <View style={{ gap: space.md }}>
                  <BenefitRow icon="time" title="Work on your own schedule" body="Go online when you want. Accept the jobs that suit you." />
                  <BenefitRow icon="shield-checkmark" title="Real customers, verified jobs" body="Every request comes from a verified customer near you." />
                  <BenefitRow icon="cash" title="Get paid per job, in cash" body="The customer pays you directly. We only take a small fee." />
                </View>

                {/* Form */}
                <Card variant="flat" style={{ padding: space.lg }}>
                  <Text variant="h3" style={{ marginBottom: space.xs }}>Register as an Ustaz</Text>
                  <Text variant="caption" tone="muted" style={{ marginBottom: space.lg }}>Takes under a minute. No fees, no documents needed yet.</Text>

                  <View style={{ gap: space.md }}>
                    {/* Full Name */}
                    <View>
                      <TextField
                        label="Full Name *"
                        value={fullName}
                        onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: '' })); }}
                        placeholder="As printed on your CNIC"
                        error={!!errors.fullName}
                      />
                      {errors.fullName ? (
                        <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.fullName}</Text>
                      ) : null}
                    </View>

                    {/* Phone */}
                    <View>
                      <Text variant="caption" tone="muted" style={{ marginBottom: space.xs, fontWeight: '600' }}>Mobile Number *</Text>
                      <View style={s.phoneRow}>
                        <View style={s.phonePrefix}>
                          <Text variant="body" style={{ fontWeight: '600', color: color.inkMuted }}>+92</Text>
                        </View>
                        <TextField
                          value={phone}
                          onChangeText={(v) => setPhone(digitsOnly(v).slice(0, 11))}
                          placeholder="3001234567"
                          keyboardType="number-pad"
                          style={{ flex: 1 }}
                          error={!!errors.phone}
                        />
                      </View>
                      {errors.phone ? (
                        <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.phone}</Text>
                      ) : (
                        <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>You'll use this number to log in when the app launches.</Text>
                      )}
                    </View>

                    {/* CNIC */}
                    <View>
                      <TextField
                        label="CNIC Number *"
                        value={cnic}
                        onChangeText={(v) => { setCnic(digitsOnly(v).slice(0, 13)); setErrors((e) => ({ ...e, cnic: '' })); }}
                        placeholder="13 digits, no dashes"
                        keyboardType="number-pad"
                        maxLength={13}
                        error={!!errors.cnic}
                      />
                      {errors.cnic ? (
                        <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.cnic}</Text>
                      ) : (
                        <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>Photos of your CNIC are only needed after launch.</Text>
                      )}
                    </View>

                    {/* Residency */}
                    <View>
                      <ResidencyInput
                        value={residency}
                        onChange={(v) => { setResidency(v); setErrors((e) => ({ ...e, residency: '' })); }}
                        error={!!errors.residency}
                      />
                    </View>

                    {/* Services */}
                    <View>
                      <Text variant="caption" tone="muted" style={{ marginBottom: space.xs, fontWeight: '600' }}>What work do you do? *</Text>
                      <Text variant="caption" tone="muted" style={{ marginBottom: space.sm }}>Select all that apply.</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                        {SERVICE_TYPES.map((svc) => {
                          const active = services.includes(svc);
                          return (
                            <PressableScale
                              key={svc}
                              onPress={() => toggleService(svc)}
                              style={[s.serviceChip, active && s.serviceChipActive]}
                            >
                              {active && <Ionicons name="checkmark-circle" size={16} color={color.white} style={{ marginRight: 4 }} />}
                              <Text variant="label" style={{ color: active ? color.white : color.ink, fontWeight: '600' }}>{svc}</Text>
                            </PressableScale>
                          );
                        })}
                      </View>
                      {errors.services && <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.services}</Text>}
                    </View>

                    {/* Error */}
                    {status === 'error' && errorMsg ? (
                      <View style={{ backgroundColor: color.errorBg, borderRadius: radius.md, padding: space.md }}>
                        <Text variant="label" style={{ color: color.error }}>{errorMsg}</Text>
                      </View>
                    ) : null}

                    {/* Submit */}
                    <Button
                      label="Register"
                      onPress={handleSubmit}
                      disabled={status === 'loading'}
                      loading={status === 'loading'}
                      icon={<Ionicons name="arrow-forward" size={18} color={color.white} />}
                    />

                    <Text variant="caption" tone="muted" center style={{ lineHeight: 18 }}>
                      By registering you agree to our Terms and Privacy Policy.
                    </Text>
                  </View>
                </Card>
              </View>
            </FadeInUp>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BenefitRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: `${color.primary}14`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={20} color={color.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label" style={{ fontWeight: '700' }}>{title}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  phonePrefix: {
    height: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    borderRightWidth: 0,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  serviceChipActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.xl,
    minHeight: 52,
    borderRadius: radius.full,
    backgroundColor: color.success,
  },
});
