import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, KeyboardAvoidingView, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import {
  Button, Card, Chip, FadeInUp, GlowBackdrop, PressableScale, ProgressStepper, Screen, Text, TextField, TiltCard,
} from '@/components/mobile-ui';
import { color, radius, space } from '@/theme/tokens';

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
      <Screen bg={color.white} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
          <Text variant="label" tone="muted" style={{ marginTop: space.md }}>Phone verification is required to start earning.</Text>
        </View>
      </Screen>
    );
  }

  // --- Success screen ---
  if (submitted) {
    return (
      <Screen bg={color.white} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: space.lg, justifyContent: 'center' }}>
          <View style={{ borderRadius: radius['2xl'], overflow: 'hidden' }}>
            <View style={{ padding: space.xl, backgroundColor: color.navy, overflow: 'hidden' }}>
              <GlowBackdrop color="#F59E0B" top={-42} right={-42} size={150} opacity={0.18} />
              <GlowBackdrop top={undefined} bottom={-36} left={-32} size={120} opacity={0.18} />
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: color.cream, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg }}>
                  <Ionicons name="sparkles" size={36} color={color.primary} />
                </View>
                <View style={{ paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.full, backgroundColor: 'rgba(16,185,129,0.18)', marginBottom: space.md }}>
                  <Text variant="caption" style={{ fontWeight: '700', color: '#34D399' }}>WELCOME TO USTAZ</Text>
                </View>
                <Text variant="display" tone="inverse" center>Congratulations,{'\n'}{form.firstName}!</Text>
                <Text variant="label" tone="inverseSoft" center style={{ marginTop: space.md, lineHeight: 21 }}>
                  Your provider profile is ready. Your first dashboard visit will show the welcome bonus card and wallet guidance.
                </Text>
              </View>
              <Button label="Go to Wallet" onPress={() => router.replace('/(provider)/wallet')} style={{ marginTop: space.xl }} />
              <PressableScale
                onPress={() => router.replace('/(provider)')}
                style={{ marginTop: space.sm, minHeight: 50, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <Text variant="bodyLg" tone="inverse" style={{ fontWeight: '700' }}>Open Dashboard</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.sm }}>
          {/* Header with back + progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
            <PressableScale onPress={handleBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={20} color={color.ink} />
            </PressableScale>
            <View style={{ flex: 1 }}>
              <ProgressStepper total={TOTAL_STEPS} current={step - 1} />
            </View>
            <Text variant="label" tone="muted" style={{ fontWeight: '700', width: 32, textAlign: 'right' }}>{step}/{TOTAL_STEPS}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            {/* STEP 1: Name */}
            {step === 1 && (
              <FadeInUp>
                <View style={{ gap: space.xl }}>
                  <TiltCard maxTilt={8} style={s.illustrationCircle}>
                    <Ionicons name="person" size={48} color={color.primary} />
                  </TiltCard>
                  <View>
                    <Text variant="display" center>What's your name?</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Let's start with the basics</Text>
                  </View>
                  <View>
                    <TextField label="First Name *" value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="e.g. Ahmed" error={!!errors.firstName} />
                    {errors.firstName && <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.firstName}</Text>}
                  </View>
                  <View>
                    <TextField label="Last Name *" value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="e.g. Khan" error={!!errors.lastName} />
                    {errors.lastName && <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.lastName}</Text>}
                  </View>
                </View>
              </FadeInUp>
            )}

            {/* STEP 2: Profile Photo */}
            {step === 2 && (
              <FadeInUp>
                <View style={{ gap: space.xl, alignItems: 'center' }}>
                  <View>
                    <Text variant="display" center>Add your profile photo</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>A good photo builds trust with customers</Text>
                  </View>
                  <PressableScale onPress={() => showImageOptions('profile')} style={s.photoCircle}>
                    {photos.profile ? (
                      <Image source={{ uri: photos.profile }} style={s.photoCircleImage} />
                    ) : (
                      <View style={{ alignItems: 'center', gap: space.sm }}>
                        <Ionicons name="camera" size={40} color={color.line} />
                        <Text variant="label" tone="muted">Tap to add photo</Text>
                      </View>
                    )}
                  </PressableScale>
                  {photos.profile && (
                    <PressableScale onPress={() => showImageOptions('profile')} style={s.retakeBtn}>
                      <Ionicons name="refresh" size={16} color={color.primary} />
                      <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>Change photo</Text>
                    </PressableScale>
                  )}
                  {errors.profile && <Text variant="caption" style={{ color: color.error }}>{errors.profile}</Text>}
                </View>
              </FadeInUp>
            )}

            {/* STEP 3: CNIC Number */}
            {step === 3 && (
              <FadeInUp>
                <View style={{ gap: space.xl }}>
                  <TiltCard maxTilt={8} style={s.illustrationCircle}>
                    <Ionicons name="card" size={48} color={color.primary} />
                  </TiltCard>
                  <View>
                    <Text variant="display" center>What's your CNIC number?</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>13-digit national identity card number</Text>
                  </View>
                  <View>
                    <TextField
                      label="CNIC Number *"
                      value={form.cnic}
                      onChangeText={v => set('cnic', v.replace(/\D/g, '').slice(0, 13))}
                      placeholder="4220112345678"
                      keyboardType="number-pad"
                      maxLength={13}
                      error={!!errors.cnic}
                    />
                    {errors.cnic && <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.cnic}</Text>}
                  </View>
                </View>
              </FadeInUp>
            )}

            {/* STEP 4: CNIC Front Photo */}
            {step === 4 && (
              <FadeInUp>
                <View style={{ gap: space.xl, alignItems: 'center' }}>
                  <View>
                    <Text variant="display" center>CNIC front photo</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Take a clear photo of the front side</Text>
                  </View>
                  <PressableScale onPress={() => showImageOptions('cnicFront')} style={s.photoRect}>
                    {photos.cnicFront ? (
                      <Image source={{ uri: photos.cnicFront }} style={s.photoRectImage} />
                    ) : (
                      <View style={{ alignItems: 'center', gap: space.sm }}>
                        <Ionicons name="camera" size={40} color={color.line} />
                        <Text variant="label" tone="muted">Tap to capture</Text>
                      </View>
                    )}
                  </PressableScale>
                  {photos.cnicFront && (
                    <PressableScale onPress={() => showImageOptions('cnicFront')} style={s.retakeBtn}>
                      <Ionicons name="refresh" size={16} color={color.primary} />
                      <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>Retake</Text>
                    </PressableScale>
                  )}
                  {errors.cnicFront && <Text variant="caption" style={{ color: color.error }}>{errors.cnicFront}</Text>}
                </View>
              </FadeInUp>
            )}

            {/* STEP 5: CNIC Back Photo */}
            {step === 5 && (
              <FadeInUp>
                <View style={{ gap: space.xl, alignItems: 'center' }}>
                  <View>
                    <Text variant="display" center>CNIC back photo</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Now the back side of your CNIC</Text>
                  </View>
                  <PressableScale onPress={() => showImageOptions('cnicBack')} style={s.photoRect}>
                    {photos.cnicBack ? (
                      <Image source={{ uri: photos.cnicBack }} style={s.photoRectImage} />
                    ) : (
                      <View style={{ alignItems: 'center', gap: space.sm }}>
                        <Ionicons name="camera" size={40} color={color.line} />
                        <Text variant="label" tone="muted">Tap to capture</Text>
                      </View>
                    )}
                  </PressableScale>
                  {photos.cnicBack && (
                    <PressableScale onPress={() => showImageOptions('cnicBack')} style={s.retakeBtn}>
                      <Ionicons name="refresh" size={16} color={color.primary} />
                      <Text variant="label" style={{ fontWeight: '700', color: color.primary }}>Retake</Text>
                    </PressableScale>
                  )}
                  {errors.cnicBack && <Text variant="caption" style={{ color: color.error }}>{errors.cnicBack}</Text>}
                </View>
              </FadeInUp>
            )}

            {/* STEP 6: Services (multi-select) */}
            {step === 6 && (
              <FadeInUp>
                <View style={{ gap: space.xl }}>
                  <TiltCard maxTilt={8} style={s.illustrationCircle}>
                    <Ionicons name="hammer" size={48} color={color.primary} />
                  </TiltCard>
                  <View>
                    <Text variant="display" center>What services can you do?</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Select all that apply</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
                    {SERVICE_TYPES.map(svc => {
                      const active = form.serviceTypes.includes(svc);
                      return (
                        <Chip
                          key={svc}
                          label={svc}
                          active={active}
                          onPress={() => toggleService(svc)}
                          icon={<Ionicons name={active ? 'checkmark-circle' : 'add-circle'} size={18} color={active ? color.white : color.inkMuted} />}
                        />
                      );
                    })}
                  </View>
                  {errors.serviceTypes && <Text variant="caption" center style={{ color: color.error }}>{errors.serviceTypes}</Text>}
                </View>
              </FadeInUp>
            )}

            {/* STEP 7: Review & Submit */}
            {step === 7 && (
              <FadeInUp>
                <View style={{ gap: space.lg }}>
                  <View>
                    <Text variant="display" center>Review & Complete</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Make sure everything looks good</Text>
                  </View>

                  {/* Profile photo preview */}
                  {photos.profile && (
                    <View style={{ alignItems: 'center' }}>
                      <Image source={{ uri: photos.profile }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: color.primary }} />
                    </View>
                  )}

                  <Card variant="flat">
                    <SummaryRow icon="person" label="Name" value={`${form.firstName} ${form.lastName}`} />
                    <SummaryRow icon="card" label="CNIC" value={form.cnic} />
                    <SummaryRow icon="call" label="Phone" value={`+92 ${form.phoneNumber}`} />
                    <View style={{ height: 1, backgroundColor: color.line, marginVertical: space.xs }} />
                    <SummaryRow icon="hammer" label="Services" value={form.serviceTypes.join(', ')} />
                    <SummaryRow icon="image" label="CNIC Front" value={photos.cnicFront ? 'Uploaded' : 'Not uploaded'} />
                    <SummaryRow icon="image" label="CNIC Back" value={photos.cnicBack ? 'Uploaded' : 'Not uploaded'} />
                  </Card>

                  <PressableScale onPress={() => set('agreedToTerms', !form.agreedToTerms)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <View style={[s.checkbox, form.agreedToTerms && s.checkboxChecked]}>
                      {form.agreedToTerms && <Ionicons name="checkmark" size={14} color={color.white} />}
                    </View>
                    <Text variant="label" style={{ flex: 1 }}>I agree to the Terms of Service and Privacy Policy</Text>
                  </PressableScale>
                  {errors.agreedToTerms && <Text variant="caption" style={{ color: color.error }}>{errors.agreedToTerms}</Text>}

                  {errors.submit && (
                    <Card variant="flat" style={{ backgroundColor: color.errorBg }}>
                      <Text variant="label" style={{ color: color.error }}>{errors.submit}</Text>
                    </Card>
                  )}
                </View>
              </FadeInUp>
            )}
          </ScrollView>
        </View>

        {/* Bottom CTA */}
        <View style={{ paddingHorizontal: space.lg, paddingBottom: Platform.OS === 'ios' ? 30 : space.lg, paddingTop: space.sm, backgroundColor: color.white, borderTopWidth: 1, borderTopColor: color.line }}>
          {step < TOTAL_STEPS ? (
            <Button
              label="Continue"
              onPress={handleNext}
              icon={<Ionicons name="arrow-forward" size={18} color={color.white} />}
            />
          ) : (
            <Button
              label={submitting ? (uploading ? 'Uploading...' : 'Creating profile...') : 'Complete Registration'}
              onPress={handleSubmit}
              disabled={submitting}
              loading={submitting}
              icon={!submitting ? <Ionicons name="checkmark-circle" size={18} color={color.white} /> : undefined}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Sub-components ---

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, gap: space.sm }}>
      <Ionicons name={icon as any} size={16} color={color.inkMuted} />
      <Text variant="label" tone="muted" style={{ width: 90 }}>{label}</Text>
      <Text variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// --- Styles (for the few things that don't map to a shared primitive) ---

const s = StyleSheet.create({
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: color.cream,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: `${color.primary}30`,
  },
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: color.line,
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
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: color.line,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRectImage: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: color.cream,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
});
