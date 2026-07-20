import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@ustaz/shared/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

const SERVICE_TYPES = [
  'Electrician',
  'Plumbing',
  'Carpentry',
  'AC Maintenance',
  'Solar Technician',
];

const DASH_WELCOME_KEY_PREFIX = 'ustaz_dash_welcome_';
const TOTAL_STEPS = 7;

interface FormData {
  firstName: string;
  lastName: string;
  cnic: string;
  phoneNumber: string;
  serviceTypes: string[];
  agreedToTerms: boolean;
}

interface PhotoUris {
  profile: string | null;
  cnicFront: string | null;
  cnicBack: string | null;
}

const initial: FormData = {
  firstName: '', lastName: '', cnic: '',
  phoneNumber: '',
  serviceTypes: [], agreedToTerms: false,
};

export default function ProviderRegisterScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [photos, setPhotos] = useState<PhotoUris>({ profile: null, cnicFront: null, cnicBack: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  function safeBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/role-select');
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace({ pathname: '/auth', params: { intent: 'provider' } });
    }
  }, [authLoading, router, user]);

  const set = useCallback((key: keyof FormData, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  useEffect(() => {
    if (user) {
      // Try to get phone from user metadata (set during auth screen)
      const phoneFromMeta = (user as any).user_metadata?.phone || user.phone;
      if (phoneFromMeta) {
        const raw = phoneFromMeta.replace('+', '');
        if (raw.startsWith('92')) {
          set('phoneNumber', raw.slice(2));
        }
      }
    }
  }, [user]);

  // --- Image picking ---
  async function pickImage(type: 'profile' | 'cnicFront' | 'cnicBack') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [3, 2],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(p => ({ ...p, [type]: result.assets[0].uri }));
    }
  }

  async function takePhoto(type: 'profile' | 'cnicFront' | 'cnicBack') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [3, 2],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(p => ({ ...p, [type]: result.assets[0].uri }));
    }
  }

  function showImageOptions(type: 'profile' | 'cnicFront' | 'cnicBack') {
    Alert.alert(
      type === 'profile' ? 'Add Profile Photo' : type === 'cnicFront' ? 'CNIC Front Photo' : 'CNIC Back Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => takePhoto(type) },
        { text: 'Gallery', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  // --- Upload to Supabase Storage ---
  async function uploadImage(uri: string, path: string): Promise<string> {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('provider-docs')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('provider-docs').getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  // --- Validation per step ---
  function validateCurrentStep(): boolean {
    const e: Record<string, string> = {};
    switch (step) {
      case 1: // Name
        if (!form.firstName.trim()) e.firstName = 'Required';
        if (!form.lastName.trim()) e.lastName = 'Required';
        break;
      case 2: // Profile photo
        if (!photos.profile) e.profile = 'Please add a profile photo';
        break;
      case 3: // CNIC number
        if (!form.cnic.trim()) e.cnic = 'Required';
        else if (!/^\d{13}$/.test(form.cnic.trim())) e.cnic = 'Must be exactly 13 digits';
        break;
      case 4: // CNIC front
        if (!photos.cnicFront) e.cnicFront = 'Please add CNIC front photo';
        break;
      case 5: // CNIC back
        if (!photos.cnicBack) e.cnicBack = 'Please add CNIC back photo';
        break;
      case 6: // Services
        if (form.serviceTypes.length === 0) e.serviceTypes = 'Select at least one service';
        break;
      case 7: // Review
        if (!form.agreedToTerms) e.agreedToTerms = 'You must agree to the terms';
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else safeBack();
  }

  function toggleService(service: string) {
    setForm(p => ({
      ...p,
      serviceTypes: p.serviceTypes.includes(service)
        ? p.serviceTypes.filter(s => s !== service)
        : [...p.serviceTypes, service],
    }));
    setErrors(p => { const n = { ...p }; delete n.serviceTypes; return n; });
  }

  // --- Submit ---
  async function handleSubmit() {
    if (!validateCurrentStep() || !user) return;
    setSubmitting(true);
    setUploading(true);
    try {
      // Upload all images in parallel
      const timestamp = Date.now();
      const [profileUrl, cnicFrontUrl, cnicBackUrl] = await Promise.all([
        photos.profile ? uploadImage(photos.profile, `${user.id}/profile-${timestamp}.jpg`) : Promise.resolve(null),
        photos.cnicFront ? uploadImage(photos.cnicFront, `${user.id}/cnic-front-${timestamp}.jpg`) : Promise.resolve(null),
        photos.cnicBack ? uploadImage(photos.cnicBack, `${user.id}/cnic-back-${timestamp}.jpg`) : Promise.resolve(null),
      ]);

      // Insert registration
      const { error } = await supabase.from('ustaz_registrations').insert({
        userId: user.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        cnic: form.cnic.trim(),
        phoneCountryCode: '+92',
        phoneNumber: form.phoneNumber.trim(),
        service_type: form.serviceTypes[0] || null,
        service_types: form.serviceTypes,
        avatarUrl: profileUrl,
        cnic_front_url: cnicFrontUrl,
        cnic_back_url: cnicBackUrl,
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
      setUploading(false);
    }
  }

  // --- Loading / auth guard ---
  if (authLoading || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 12, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF' }}>Phone verification is required to start earning.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Success screen ---
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
              <Text style={{ fontFamily: 'Anton', fontSize: 30, color: '#FFFFFF', textAlign: 'center' }}>Congratulations,{'\n'}{form.firstName}!</Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: 'rgba(255,255,255,0.68)', textAlign: 'center', marginTop: 12, lineHeight: 21 }}>
                Your provider profile is ready. Your first dashboard visit will show the welcome bonus card and wallet guidance.
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
          {/* Header with back + progress */}
          <View style={s.header}>
            <Pressable onPress={handleBack} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#1B1B27" />
            </Pressable>
            <View style={s.stepIndicator}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <View key={i} style={[s.stepDot, step >= i + 1 && s.stepDotActive]} />
              ))}
            </View>
            <Text style={s.stepCounter}>{step}/{TOTAL_STEPS}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            {/* STEP 1: Name */}
            {step === 1 && (
              <View style={{ gap: 20 }}>
                <View style={s.illustrationCircle}>
                  <Ionicons name="person" size={48} color={colors.primary} />
                </View>
                <Text style={s.bigQuestion}>What's your name?</Text>
                <Text style={s.questionSubtext}>Let's start with the basics</Text>
                <Field label="First Name" required error={errors.firstName}>
                  <Input value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="e.g. Ahmed" />
                </Field>
                <Field label="Last Name" required error={errors.lastName}>
                  <Input value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="e.g. Khan" />
                </Field>
              </View>
            )}

            {/* STEP 2: Profile Photo */}
            {step === 2 && (
              <View style={{ gap: 20, alignItems: 'center' }}>
                <Text style={s.bigQuestion}>Add your profile photo</Text>
                <Text style={s.questionSubtext}>A good photo builds trust with customers</Text>
                <Pressable onPress={() => showImageOptions('profile')} style={s.photoCircle}>
                  {photos.profile ? (
                    <Image source={{ uri: photos.profile }} style={s.photoCircleImage} />
                  ) : (
                    <View style={s.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#D1D5DB" />
                      <Text style={s.photoPlaceholderText}>Tap to add photo</Text>
                    </View>
                  )}
                </Pressable>
                {photos.profile && (
                  <Pressable onPress={() => showImageOptions('profile')} style={s.retakeBtn}>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={s.retakeBtnText}>Change photo</Text>
                  </Pressable>
                )}
                {errors.profile && <Text style={s.errorText}>{errors.profile}</Text>}
              </View>
            )}

            {/* STEP 3: CNIC Number */}
            {step === 3 && (
              <View style={{ gap: 20 }}>
                <View style={s.illustrationCircle}>
                  <Ionicons name="card" size={48} color={colors.primary} />
                </View>
                <Text style={s.bigQuestion}>What's your CNIC number?</Text>
                <Text style={s.questionSubtext}>13-digit national identity card number</Text>
                <Field label="CNIC Number" required error={errors.cnic}>
                  <Input
                    value={form.cnic}
                    onChangeText={v => set('cnic', v.replace(/\D/g, '').slice(0, 13))}
                    placeholder="4220112345678"
                    keyboardType="number-pad"
                    maxLength={13}
                  />
                </Field>
              </View>
            )}

            {/* STEP 4: CNIC Front Photo */}
            {step === 4 && (
              <View style={{ gap: 20, alignItems: 'center' }}>
                <Text style={s.bigQuestion}>CNIC front photo</Text>
                <Text style={s.questionSubtext}>Take a clear photo of the front side</Text>
                <Pressable onPress={() => showImageOptions('cnicFront')} style={s.photoRect}>
                  {photos.cnicFront ? (
                    <Image source={{ uri: photos.cnicFront }} style={s.photoRectImage} />
                  ) : (
                    <View style={s.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#D1D5DB" />
                      <Text style={s.photoPlaceholderText}>Tap to capture</Text>
                    </View>
                  )}
                </Pressable>
                {photos.cnicFront && (
                  <Pressable onPress={() => showImageOptions('cnicFront')} style={s.retakeBtn}>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={s.retakeBtnText}>Retake</Text>
                  </Pressable>
                )}
                {errors.cnicFront && <Text style={s.errorText}>{errors.cnicFront}</Text>}
              </View>
            )}

            {/* STEP 5: CNIC Back Photo */}
            {step === 5 && (
              <View style={{ gap: 20, alignItems: 'center' }}>
                <Text style={s.bigQuestion}>CNIC back photo</Text>
                <Text style={s.questionSubtext}>Now the back side of your CNIC</Text>
                <Pressable onPress={() => showImageOptions('cnicBack')} style={s.photoRect}>
                  {photos.cnicBack ? (
                    <Image source={{ uri: photos.cnicBack }} style={s.photoRectImage} />
                  ) : (
                    <View style={s.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#D1D5DB" />
                      <Text style={s.photoPlaceholderText}>Tap to capture</Text>
                    </View>
                  )}
                </Pressable>
                {photos.cnicBack && (
                  <Pressable onPress={() => showImageOptions('cnicBack')} style={s.retakeBtn}>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={s.retakeBtnText}>Retake</Text>
                  </Pressable>
                )}
                {errors.cnicBack && <Text style={s.errorText}>{errors.cnicBack}</Text>}
              </View>
            )}

            {/* STEP 6: Services (multi-select) */}
            {step === 6 && (
              <View style={{ gap: 20 }}>
                <View style={s.illustrationCircle}>
                  <Ionicons name="hammer" size={48} color={colors.primary} />
                </View>
                <Text style={s.bigQuestion}>What services can you do?</Text>
                <Text style={s.questionSubtext}>Select all that apply</Text>
                <View style={s.chipRow}>
                  {SERVICE_TYPES.map(svc => {
                    const active = form.serviceTypes.includes(svc);
                    return (
                      <Pressable key={svc} onPress={() => toggleService(svc)} style={[s.chip, active && s.chipActive]}>
                        <Ionicons name={active ? 'checkmark-circle' : 'add-circle'} size={18} color={active ? colors.primary : '#9CA3AF'} />
                        <Text style={[s.chipText, active && s.chipTextActive]}>{svc}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.serviceTypes && <Text style={s.errorText}>{errors.serviceTypes}</Text>}
              </View>
            )}

            {/* STEP 7: Review & Submit */}
            {step === 7 && (
              <View style={{ gap: 16 }}>
                <Text style={[s.bigQuestion, { textAlign: 'center' }]}>Review & Complete</Text>
                <Text style={[s.questionSubtext, { textAlign: 'center' }]}>Make sure everything looks good</Text>

                {/* Profile photo preview */}
                {photos.profile && (
                  <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <Image source={{ uri: photos.profile }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary }} />
                  </View>
                )}

                <View style={s.summaryCard}>
                  <SummaryRow icon="person" label="Name" value={`${form.firstName} ${form.lastName}`} />
                  <SummaryRow icon="card" label="CNIC" value={form.cnic} />
                  <SummaryRow icon="call" label="Phone" value={`+92 ${form.phoneNumber}`} />
                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />
                  <SummaryRow icon="hammer" label="Services" value={form.serviceTypes.join(', ')} />
                  <SummaryRow icon="image" label="CNIC Front" value={photos.cnicFront ? 'Uploaded' : 'Not uploaded'} />
                  <SummaryRow icon="image" label="CNIC Back" value={photos.cnicBack ? 'Uploaded' : 'Not uploaded'} />
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
          {step < TOTAL_STEPS ? (
            <Pressable onPress={handleNext} style={s.ctaBtn}>
              <Text style={s.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[s.ctaBtn, submitting && { backgroundColor: '#D1D5DB' }]}
            >
              {submitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={s.ctaText}>{uploading ? 'Uploading...' : 'Creating profile...'}</Text>
                </View>
              ) : (
                <>
                  <Text style={s.ctaText}>Complete Registration</Text>
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

// --- Sub-components ---

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

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <Ionicons name={icon as any} size={16} color="#9CA3AF" />
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// --- Styles ---

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
    gap: 4,
  },
  stepDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepCounter: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 40,
    textAlign: 'right',
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  bigQuestion: {
    fontFamily: 'Anton',
    fontSize: 28,
    color: '#1B1B27',
    textAlign: 'center',
  },
  questionSubtext: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: -8,
  },
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCircleImage: {
    width: '100%',
    height: '100%',
  },
  photoRect: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRectImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 14,
    color: '#9CA3AF',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  retakeBtnText: {
    fontFamily: 'AtkinsonHyperlegible',
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: colors.primary,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    padding: 20,
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
