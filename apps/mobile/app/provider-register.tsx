import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, KeyboardAvoidingView, Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
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
import ResidencyInput from '@/components/ResidencyInput';
import { color, radius, space } from '@/theme/tokens';

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

const DASH_WELCOME_KEY_PREFIX = 'ustaz_dash_welcome_';
const TOTAL_STEPS = 7;

interface FormData {
  fullName: string;
  cnic: string;
  phoneNumber: string;
  residency: string;
  serviceTypes: string[];
  agreedToTerms: boolean;
}

interface PhotoUris {
  profile: string | null;
  cnicFront: string | null;
  cnicBack: string | null;
}

const initial: FormData = {
  fullName: '', cnic: '',
  phoneNumber: '',
  residency: '',
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
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [prelaunchDisplayId, setPrelaunchDisplayId] = useState<string | null>(null);

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

  // Prefill from a pre-launch registration submitted on the marketing website.
  // The row was linked to this user by the claim_prelaunch_provider_registration()
  // trigger at signup; RLS only exposes their own claimed row. A miss or failure
  // is a silent no-op — the wizard just stays empty as normal.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('provider_prelaunch_registrations')
        .select('full_name, cnic, residency, service_types, provider_display_id')
        .eq('claimed_user_id', user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setForm(p => ({
        ...p,
        fullName: data.full_name || p.fullName,
        cnic: data.cnic || p.cnic,
        residency: data.residency || p.residency,
        serviceTypes: data.service_types?.length ? data.service_types : p.serviceTypes,
      }));
      if (data.provider_display_id) {
        setPrelaunchDisplayId(data.provider_display_id);
      }
      setPrefilled(true);
    })();
    return () => { cancelled = true; };
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

  // Document scanner: auto-detects the CNIC edges, crops, and removes the
  // background — same result every time for both front and back. Lazy-imported
  // so the native module never lands in the web bundle.
  async function scanCnic(type: 'cnicFront' | 'cnicBack') {
    try {
      const { scanDocument } = await import('expo-document-scanner');
      const result = await scanDocument({
        quality: 0.92,
        maxNumDocuments: 1,
      });
      if (result.pages && result.pages.length > 0) {
        setVerifyError(null);
        setPhotos(p => ({ ...p, [type]: result.pages[0].uri }));
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (!msg.toLowerCase().includes('cancel')) {
        Alert.alert('Scan failed', 'Could not scan the card. Try again, or pick a photo from your gallery.');
      }
    }
  }

  function showImageOptions(type: 'profile' | 'cnicFront' | 'cnicBack') {
    if (type === 'cnicFront' || type === 'cnicBack') {
      Alert.alert(
        type === 'cnicFront' ? 'CNIC Front Photo' : 'CNIC Back Photo',
        'Scan auto-crops the card. Gallery uses an existing photo.',
        [
          { text: 'Scan CNIC', onPress: () => scanCnic(type) },
          { text: 'Gallery', onPress: () => pickImage(type) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    Alert.alert(
      'Add Profile Photo',
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
      case 1: // Name + Residency
        if (!form.fullName.trim()) e.fullName = 'Required';
        else if (form.fullName.trim().length < 3) e.fullName = 'Enter your complete name';
        if (!form.residency.trim()) e.residency = 'Please enter or select your area';
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

      // Split the full name into first/last for the DB columns (schema unchanged).
      const fullName = form.fullName.trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      // Cross-check the typed CNIC + name against the uploaded photo BEFORE creating
      // the account. A confident fraud signal (number/name mismatch, duplicate,
      // expired, under-18, front/back mismatch, not-a-CNIC) stops here and sends the
      // user back to re-upload — no registration row is written. The recorded verdict
      // is applied by the ustaz_registrations insert trigger.
      try {
        const { data: vres } = await supabase.functions.invoke('verify-cnic', {
          body: {
            fullName,
            cnicNumber: form.cnic.trim(),
            cnicFrontUrl,
            cnicBackUrl,
          },
        });
        if (vres?.decision === 'rejected') {
          setVerifyError(vres.reason || 'CNIC verification failed. Re-upload a clear photo.');
          setStep(4);
          return;
        }
      } catch (vErr) {
        // Non-fatal: without a recorded verdict the provider lands 'unverified'
        // and the go-online gate keeps them from receiving jobs.
        console.warn('CNIC verification failed (non-fatal):', vErr);
      }

      // Create the account (trigger applies the recorded verdict).
      const { error } = await supabase.from('ustaz_registrations').insert({
        userId: user.id,
        firstName,
        lastName,
        cnic: form.cnic.trim(),
        phoneCountryCode: '+92',
        phoneNumber: form.phoneNumber.trim(),
        residency: form.residency.trim() || null,
        service_type: form.serviceTypes[0] || null,
        service_types: form.serviceTypes,
        avatarUrl: profileUrl,
        cnic_front_url: cnicFrontUrl,
        cnic_back_url: cnicBackUrl,
        registrationDate: new Date().toISOString(),
        phone_verified: true,
        provider_display_id: prelaunchDisplayId,
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
                <Text variant="display" tone="inverse" center>Congratulations,{'\n'}{form.fullName.trim().split(/\s+/)[0]}!</Text>
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
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Exactly as printed on your CNIC</Text>
                  </View>
                  {prefilled && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'flex-start', gap: space.sm,
                      backgroundColor: `${color.primary}14`, borderRadius: radius.md, padding: space.md,
                    }}>
                      <Ionicons name="checkmark-circle" size={18} color={color.primary} style={{ marginTop: 1 }} />
                      <Text variant="caption" style={{ flex: 1, color: color.primary }}>
                        Welcome back! We've filled in the details from your pre-launch registration.
                        Please review them, then add your photos to finish.
                      </Text>
                    </View>
                  )}
                  <View>
                    <TextField label="Full Name *" value={form.fullName} onChangeText={v => set('fullName', v)} placeholder="e.g. Ahmed Ali Khan" error={!!errors.fullName} />
                    {errors.fullName
                      ? <Text variant="caption" style={{ color: color.error, marginTop: space.xs }}>{errors.fullName}</Text>
                      : <Text variant="caption" tone="muted" style={{ marginTop: space.xs }}>Must match the name on your CNIC exactly.</Text>}
                  </View>
                  <View>
                    <ResidencyInput
                      value={form.residency}
                      onChange={(v) => set('residency', v)}
                      error={!!errors.residency}
                    />
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
                  {verifyError && (
                    <Card style={{ width: '100%', backgroundColor: '#FFF7ED', borderWidth: 2, borderColor: 'rgba(219,75,13,0.35)', padding: space.lg }}>
                      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#DB4B0D', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="shield-half" size={22} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="label" style={{ fontWeight: '800', color: '#C24309' }}>CNIC verification failed</Text>
                          <Text variant="caption" style={{ marginTop: 4 }}>{verifyError}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.sm }}>
                            <Ionicons name="refresh" size={14} color="#DB4B0D" />
                            <Text variant="caption" style={{ fontWeight: '700', color: '#DB4B0D' }}>Retake a clear photo to continue</Text>
                          </View>
                        </View>
                      </View>
                    </Card>
                  )}
                  <View>
                    <Text variant="display" center>CNIC front photo</Text>
                    <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.xs }}>Take a clear photo of the front side</Text>
                  </View>
                  <PressableScale onPress={() => { setVerifyError(null); showImageOptions('cnicFront'); }} style={s.photoRect}>
                    {photos.cnicFront ? (
                      <Image source={{ uri: photos.cnicFront }} style={s.photoRectImage} />
                    ) : (
                      <View style={{ alignItems: 'center', gap: space.sm }}>
                        <Ionicons name="camera" size={40} color={color.line} />
                        <Text variant="label" tone="muted">Tap to scan CNIC</Text>
                      </View>
                    )}
                  </PressableScale>
                  {photos.cnicFront && (
                    <PressableScale onPress={() => { setVerifyError(null); showImageOptions('cnicFront'); }} style={s.retakeBtn}>
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
                        <Text variant="label" tone="muted">Tap to scan CNIC</Text>
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
                    <SummaryRow icon="person" label="Name" value={form.fullName} />
                    <SummaryRow icon="location" label="Area" value={form.residency || 'Not set'} />
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
                    <Text variant="label" style={{ flex: 1 }}>
                      I agree to the{' '}
                      <Text variant="label" style={{ fontWeight: '700', color: color.primary }} onPress={() => Linking.openURL('https://ustaz-bice.vercel.app/terms')}>
                        Terms of Service
                      </Text>
                      {' '}and{' '}
                      <Text variant="label" style={{ fontWeight: '700', color: color.primary }} onPress={() => Linking.openURL('https://ustaz-bice.vercel.app/privacy-policy')}>
                        Privacy Policy
                      </Text>
                    </Text>
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
