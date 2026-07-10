import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { colors } from '@ustaz/shared/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

const SERVICE_TYPES = [
  'Electrician Service',
  'Plumbing',
  'Carpentry',
  'AC Maintenance',
  'Solar Technician',
];

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot',
];

const DASH_WELCOME_KEY_PREFIX = 'ustaz_dash_welcome_';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  cnic: string;
  city: string;
  phoneNumber: string;
  service_type: string;
  hasActiveMobile: boolean | null;
  agreedToTerms: boolean;
}

const initial: FormData = {
  firstName: '', lastName: '', email: '', cnic: '',
  city: '', phoneNumber: '',
  service_type: '',
  hasActiveMobile: null, agreedToTerms: false,
};

export default function ProviderRegisterScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function safeBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/role-select');
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user?.phone) {
      router.replace({ pathname: '/auth', params: { intent: 'provider' } });
    }
  }, [authLoading, router, user?.phone]);

  const set = useCallback((key: keyof FormData, val: any) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  useEffect(() => {
    if (user?.phone) {
      const raw = user.phone.replace('+', '');
      if (raw.startsWith('92')) {
        set('phoneNumber', raw.slice(2));
      }
    }
  }, [user?.phone]);

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.cnic.trim()) e.cnic = 'Required';
    else if (!/^\d{13}$/.test(form.cnic.trim())) e.cnic = 'Must be exactly 13 digits';
    if (!form.city) e.city = 'Required';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Required';
    else if (!/^\d{7,}$/.test(form.phoneNumber.trim())) e.phoneNumber = 'Minimum 7 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!form.service_type) e.service_type = 'Required';
    if (form.hasActiveMobile === null) e.hasActiveMobile = 'Select yes or no';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: Record<string, string> = {};
    if (!form.agreedToTerms) e.agreedToTerms = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep3() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('ustaz_registrations').insert({
        userId: user.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        cnic: form.cnic.trim(),
        city: form.city,
        phoneCountryCode: '+92',
        phoneNumber: form.phoneNumber.trim(),
        service_type: form.service_type,
        hasActiveMobile: form.hasActiveMobile,
        registrationDate: new Date().toISOString(),
        phone_verified: true,
      });
      if (error) throw error;
      await AsyncStorage.setItem(DASH_WELCOME_KEY_PREFIX + user.id, '1');
      setSubmitted(true);
    } catch (err: any) {
      setErrors({ submit: err?.message ?? 'Registration failed. Try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user?.phone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 12, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF' }}>Phone verification is required to start earning.</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <View style={{ borderRadius: 28, backgroundColor: '#111828', padding: 24, overflow: 'hidden', shadowColor: colors.primary, shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
            <View style={{ position: 'absolute', right: -42, top: -42, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(245,158,11,0.18)' }} />
            <View style={{ position: 'absolute', left: -32, bottom: -36, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(219,75,13,0.18)' }} />

            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ionicons name="sparkles" size={36} color={colors.primary} />
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.18)', marginBottom: 14 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: '#34D399' }}>WELCOME TO USTAZ</Text>
              </View>
              <Text style={{ fontFamily: 'Anton', fontSize: 30, color: '#FFFFFF', textAlign: 'center' }}>Congratulations,{'\\n'}{form.firstName}!</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: 'rgba(255,255,255,0.68)', textAlign: 'center', marginTop: 12, lineHeight: 21 }}>
                Your provider profile is ready. Your first dashboard visit will show the welcome bonus card and wallet guidance.
              </Text>
            </View>

            <View style={{ marginTop: 22, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="gift" size={20} color="#F59E0B" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>Wallet guidance</Text>
              </View>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 18 }}>
                Top up from Wallet, upload your receipt, and admin approval will credit your balance.
              </Text>
            </View>

            <Pressable
              onPress={() => router.replace('/(provider)/wallet')}
              style={{ marginTop: 22, minHeight: 54, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: colors.primary }}
            >
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Go to Wallet</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(provider)')}
              style={{ marginTop: 10, minHeight: 50, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Open Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
          {/* Header */}
          <View style={s.header}>
            <Pressable onPress={() => (step > 1 ? setStep(step - 1) : safeBack())} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#1B1B27" />
            </Pressable>
            <View style={s.stepIndicator}>
              {[1, 2, 3].map((n) => (
                <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]} />
              ))}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Title */}
          <View style={{ marginBottom: 20 }}>
            <Text style={s.stepLabel}>STEP {step} OF 3</Text>
            <Text style={s.title}>
              {step === 1 ? 'Personal Info' : step === 2 ? 'Experience' : 'Finalize'}
            </Text>
            <Text style={s.subtitle}>
              {step === 1 ? 'Tell us about yourself' : step === 2 ? 'Your professional background' : 'Review and submit'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <Field label="First Name" required error={errors.firstName}>
                  <Input value={form.firstName} onChangeText={(v) => set('firstName', v)} placeholder="e.g. Ahmed" />
                </Field>
                <Field label="Last Name" required error={errors.lastName}>
                  <Input value={form.lastName} onChangeText={(v) => set('lastName', v)} placeholder="e.g. Khan" />
                </Field>
                <Field label="Email (Optional)" error={errors.email}>
                  <Input value={form.email} onChangeText={(v) => set('email', v)} placeholder="ahmed@email.com" keyboardType="email-address" />
                </Field>
                <Field label="CNIC Number" required error={errors.cnic}>
                  <Input value={form.cnic} onChangeText={(v) => set('cnic', v.replace(/\D/g, '').slice(0, 13))} placeholder="4220112345678" keyboardType="number-pad" maxLength={13} />
                </Field>
                <Field label="City" required error={errors.city}>
                  <View style={s.chipRow}>
                    {PAKISTAN_CITIES.map((c) => (
                      <Pressable key={c} onPress={() => set('city', c)} style={[s.chip, form.city === c && s.chipActive]}>
                        <Text style={[s.chipText, form.city === c && s.chipTextActive]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Field>
                <Field label="Phone Number" required error={errors.phoneNumber}>
                  <View style={s.phoneRow}>
                    <View style={s.phoneCode}>
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#1B1B27' }}>+92</Text>
                    </View>
                    <Input value={form.phoneNumber} onChangeText={(v) => set('phoneNumber', v.replace(/\D/g, ''))} placeholder="3001234567" keyboardType="phone-pad" style={{ flex: 1 }} />
                  </View>
                </Field>
              </View>
            )}

            {/* STEP 2: Experience */}
            {step === 2 && (
              <View style={{ gap: 16 }}>
                <Field label="Select a Service" required error={errors.service_type}>
                  <View style={s.chipRow}>
                    {SERVICE_TYPES.map((st) => (
                      <Pressable key={st} onPress={() => set('service_type', st)} style={[s.chip, form.service_type === st && s.chipActive]}>
                        <Text style={[s.chipText, form.service_type === st && s.chipTextActive]}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Field>
                <Field label="Do you have an active mobile?" required error={errors.hasActiveMobile}>
                  <View style={s.radioRow}>
                    <Radio label="Yes" selected={form.hasActiveMobile === true} onPress={() => set('hasActiveMobile', true)} />
                    <Radio label="No" selected={form.hasActiveMobile === false} onPress={() => set('hasActiveMobile', false)} />
                  </View>
                </Field>
              </View>
            )}

            {/* STEP 3: Finalize */}
            {step === 3 && (
              <View style={{ gap: 16 }}>
                <View style={s.summaryCard}>
                  <Text style={s.summaryTitle}>Registration Summary</Text>
                  <SummaryRow icon="person" label="Name" value={`${form.firstName} ${form.lastName}`} />
                  <SummaryRow icon="mail" label="Email" value={form.email || 'Not provided'} />
                  <SummaryRow icon="card" label="CNIC" value={form.cnic} />
                  <SummaryRow icon="location" label="City" value={form.city} />
                  <SummaryRow icon="call" label="Phone" value={`+92 ${form.phoneNumber}`} />
                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 }} />
                  <SummaryRow icon="hammer" label="Service" value={form.service_type} />
                  <SummaryRow icon="phone-portrait" label="Active Mobile" value={form.hasActiveMobile ? 'Yes' : 'No'} />
                </View>

                <Pressable onPress={() => set('agreedToTerms', !form.agreedToTerms)} style={s.checkboxRow}>
                  <View style={[s.checkbox, form.agreedToTerms && s.checkboxChecked]}>
                    {form.agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={s.checkboxLabel}>I agree to the Terms of Service and Privacy Policy</Text>
                </Pressable>
                {errors.agreedToTerms && <Text style={s.errorText}>{errors.agreedToTerms}</Text>}

                {errors.submit && (
                  <View style={s.errorBox}>
                    <Text style={s.errorBoxText}>{errors.submit}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Bottom CTA */}
        <View style={s.bottomBar}>
          {step < 3 ? (
            <Pressable
              onPress={() => {
                if (step === 1 ? validateStep1() : validateStep2()) setStep(step + 1);
              }}
              style={s.ctaBtn}
            >
              <Text style={s.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[s.ctaBtn, submitting && { backgroundColor: '#D1D5DB' }]}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={s.ctaText}>Submit Registration</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={s.fieldLabel}>{label}</Text>
        {required && <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>}
      </View>
      {children}
      {error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

function Input({ style, onChangeText, ...rest }: { value?: string; onChangeText?: (text: string) => void; [key: string]: any }) {
  return <TextInput {...rest} onChangeText={onChangeText} placeholderTextColor="#D1D5DB" style={[s.input, style]} />;
}

function Radio({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.radio, selected && s.radioActive]}>
      <View style={[s.radioDot, selected && s.radioDotActive]} />
      <Text style={[s.radioLabel, selected && s.radioLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <Ionicons name={icon as any} size={16} color="#9CA3AF" />
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.primary,
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 28,
    color: '#1B1B27',
    marginTop: 4,
  },
  subtitle: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  fieldLabel: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 16,
    color: '#1B1B27',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  chipText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: colors.primary,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCode: {
    width: 60,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flex: 1,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  radioLabelActive: {
    color: '#1B1B27',
  },
  expCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
    padding: 16,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  summaryTitle: {
    fontFamily: 'Anton',
    fontSize: 18,
    color: '#1B1B27',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  summaryLabel: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    color: '#9CA3AF',
    width: 90,
  },
  summaryValue: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B27',
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  errorText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  errorBox: {
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    padding: 14,
  },
  errorBoxText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    color: '#EF4444',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ctaBtn: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  ctaText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});







