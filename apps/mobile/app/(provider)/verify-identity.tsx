import { useState, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Button, Card, CircularGauge, FadeInUp, LottieScene, PressableScale, Screen, ProgressStepper, Text, TextField, lottieSources,
} from '@/components/mobile-ui';
import { color, radius, shadow, space } from '@/theme/tokens';

type Step = 'cnic' | 'cnic-front' | 'cnic-back' | 'selfie' | 'submitting' | 'done';

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;

export default function VerifyIdentity() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('cnic');
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'cnic-front' | 'cnic-back' | 'selfie'>('cnic-front');
  const cameraRef = useRef<any>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  function formatCnic(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setPreviewUri(photo.uri);
      setShowCamera(false);
    }
  }

  function confirmPicture() {
    if (!previewUri) return;
    if (cameraMode === 'cnic-front') {
      setCnicFront(previewUri);
      setStep('cnic-back');
    } else if (cameraMode === 'cnic-back') {
      setCnicBack(previewUri);
      setStep('selfie');
    } else if (cameraMode === 'selfie') {
      setSelfie(previewUri);
      setStep('submitting');
      submitVerification(previewUri);
    }
    setPreviewUri(null);
  }

  function retakePicture() {
    setPreviewUri(null);
    setShowCamera(true);
  }

  async function pickFromGallery(mode: 'cnic-front' | 'cnic-back' | 'selfie') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (mode === 'cnic-front') { setCnicFront(uri); setStep('cnic-back'); }
      else if (mode === 'cnic-back') { setCnicBack(uri); setStep('selfie'); }
      else if (mode === 'selfie') { setSelfie(uri); setStep('submitting'); submitVerification(uri); }
    }
  }

  async function uploadFile(uri: string, path: string): Promise<string> {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('verification-docs').getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function submitVerification(finalSelfieUri: string) {
    if (!user) return;
    setUploading(true); setError(null);
    try {
      const timestamp = Date.now();
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadFile(cnicFront!, `${user.id}/cnic-front-${timestamp}.jpg`),
        uploadFile(cnicBack!, `${user.id}/cnic-back-${timestamp}.jpg`),
        uploadFile(finalSelfieUri, `${user.id}/selfie-${timestamp}.jpg`),
      ]);

      const { error: insertError } = await supabase.from('verification_submissions').insert({
        provider_id: user.id, cnic_number: cnicNumber,
        cnic_front_url: frontUrl, cnic_back_url: backUrl, selfie_url: selfieUrl, status: 'pending',
      });
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('ustaz_registrations')
        .update({ verification_status: 'pending_review' })
        .eq('userId', user.id);
      if (updateError) throw updateError;

      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification');
      setStep('cnic');
    }
    setUploading(false);
  }

  // Camera permission loading
  if (!permission) {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={color.primary} size="large" />
        </View>
      </Screen>
    );
  }

  // Camera permission denied
  if (!permission.granted) {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl }}>
          <Ionicons name="camera-outline" size={64} color={color.line} />
          <Text variant="h3" center style={{ marginTop: space.lg }}>Camera permission required</Text>
          <Text variant="label" tone="muted" center style={{ marginTop: space.sm, maxWidth: 280 }}>
            We need camera access to take photos of your CNIC and selfie
          </Text>
          <Button label="Grant Permission" variant="primary" onPress={requestPermission} style={{ marginTop: space.xl }} />
        </View>
      </Screen>
    );
  }

  // Camera view (full screen - no design system overlay)
  if (showCamera || previewUri) {
    return (
      <Screen bg={color.black} edges={['top', 'bottom']}>
        {previewUri ? (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: previewUri }} style={{ flex: 1 }} resizeMode="contain" />
            <View style={{ flexDirection: 'row', gap: space.md, padding: space.xl, backgroundColor: color.black }}>
              <Button label="Retake" variant="soft" full={false} style={{ flex: 1 }} onPress={retakePicture} />
              <Button label="Use Photo" variant="primary" full={false} style={{ flex: 1 }} onPress={confirmPicture} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing={cameraMode === 'selfie' ? 'front' : 'back'} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: space.xl, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Text variant="body" tone="inverse" center style={{ fontWeight: '700' }}>
                {cameraMode === 'cnic-front' ? 'Photograph CNIC Front' :
                 cameraMode === 'cnic-back' ? 'Photograph CNIC Back' : 'Take a Selfie'}
              </Text>
              <Text variant="caption" tone="inverseSoft" center style={{ marginTop: space.xs }}>
                {cameraMode === 'selfie' ? 'Make sure your face is clearly visible' : 'Ensure all text is readable'}
              </Text>
            </View>
            <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
              <Pressable onPress={takePicture}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: color.white, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: color.white }} />
              </Pressable>
              <Pressable onPress={() => { setShowCamera(false); setPreviewUri(null); }}
                style={{ position: 'absolute', top: -300, left: 20 }}>
                <Ionicons name="close" size={28} color={color.white} />
              </Pressable>
            </View>
          </View>
        )}
      </Screen>
    );
  }

  // Done screen
  if (step === 'done') {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl }}>
          <LottieScene source={lottieSources.success} size={140} loop={false} />
          <Text variant="h2" center style={{ marginBottom: space.sm }}>Verification Submitted</Text>
          <Text variant="label" tone="muted" center style={{ marginBottom: space['2xl'], maxWidth: 300 }}>
            Your documents have been submitted for review. An admin will verify them shortly. This usually takes 1-2 business days.
          </Text>
          <Button label="Back to Profile" variant="primary" onPress={() => router.replace('/(provider)/profile')} />
        </View>
      </Screen>
    );
  }

  // Submitting screen
  if (step === 'submitting') {
    return (
      <Screen bg={color.white}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={color.primary} size="large" />
          <Text variant="body" tone="muted" style={{ marginTop: space.lg }}>Uploading documents...</Text>
          {error && (
            <Text variant="label" style={{ color: color.error, marginTop: space.md }}>{error}</Text>
          )}
        </View>
      </Screen>
    );
  }

  const stepIndex = ['cnic', 'cnic-front', 'cnic-back', 'selfie'].indexOf(step);

  return (
    <Screen bg={color.white} edges={['top']}>
      {/* Header */}
      <FadeInUp>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: space.lg, paddingBottom: space.sm }}>
          <PressableScale onPress={() => {
            if (step === 'cnic-front') setStep('cnic');
            else if (step === 'cnic-back') setStep('cnic-front');
            else if (step === 'selfie') setStep('cnic-back');
            else router.back();
          }} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={color.navy} />
          </PressableScale>
          <Text variant="h1" style={{ marginLeft: space.md, flex: 1 }}>Verify Identity</Text>
          <CircularGauge size={40} strokeWidth={4} progress={(stepIndex + 1) / 4} color={color.primary} trackColor={color.line}>
            <Text variant="caption" style={{ fontWeight: '700' }}>{stepIndex + 1}/4</Text>
          </CircularGauge>
        </View>
      </FadeInUp>

      {/* Progress */}
      <FadeInUp delay={60}>
        <View style={{ paddingHorizontal: space.xl, paddingBottom: space.lg }}>
          <ProgressStepper total={4} current={stepIndex} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
            {['CNIC #', 'Front', 'Back', 'Selfie'].map((label, i) => (
              <Text key={label} variant="caption" tone={i <= stepIndex ? 'primary' : 'muted'} style={{ fontWeight: i === stepIndex ? '700' : '400' }}>{label}</Text>
            ))}
          </View>
        </View>
      </FadeInUp>

      <View style={{ flex: 1, padding: space.xl }}>
        {error && (
          <Card variant="flat" style={{ marginBottom: space.md, backgroundColor: color.errorBg }}>
            <Text variant="label" style={{ color: color.error }}>{error}</Text>
          </Card>
        )}

        {/* Step 1: CNIC Number */}
        {step === 'cnic' && (
          <FadeInUp>
            <Text variant="h2" style={{ marginBottom: space.sm }}>Enter your CNIC number</Text>
            <Text variant="label" tone="muted" style={{ marginBottom: space.xl }}>
              Your national identity card number (13 digits)
            </Text>
            <TextField
              value={cnicNumber}
              onChangeText={(t) => setCnicNumber(formatCnic(t))}
              placeholder="35202-1234567-1"
              keyboardType="numeric"
              maxLength={15}
              error={!!cnicNumber && !CNIC_REGEX.test(cnicNumber)}
              style={{ fontFamily: 'Anton', fontSize: 20, letterSpacing: 2 }}
            />
            {cnicNumber && !CNIC_REGEX.test(cnicNumber) && (
              <Text variant="caption" style={{ color: color.error, marginTop: space.sm }}>
                Format: XXXXX-XXXXXXX-X (13 digits)
              </Text>
            )}
            <View style={{ flex: 1 }} />
            <Button
              label="Next"
              variant="primary"
              disabled={!CNIC_REGEX.test(cnicNumber)}
              onPress={() => setStep('cnic-front')}
            />
          </FadeInUp>
        )}

        {/* Step 2: CNIC Front */}
        {step === 'cnic-front' && (
          <FadeInUp>
            <Text variant="h2" style={{ marginBottom: space.sm }}>CNIC Front Side</Text>
            <Text variant="label" tone="muted" style={{ marginBottom: space.xl }}>
              Take a photo of the front of your CNIC. Make sure all text is clearly readable.
            </Text>
            <Card variant="flat" style={{ flex: 1, borderWidth: 2, borderStyle: 'dashed', borderColor: color.line, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Ionicons name="card-outline" size={64} color={color.line} />
              <Text variant="caption" tone="muted" style={{ marginTop: space.md }}>CNIC Front</Text>
            </Card>
            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
              <Button label="Take Photo" variant="primary" icon={<Ionicons name="camera" size={18} color={color.white} />} full={false} style={{ flex: 1 }} onPress={() => { setCameraMode('cnic-front'); setShowCamera(true); }} />
              <Button label="Gallery" variant="soft" icon={<Ionicons name="images" size={18} color={color.primary} />} full={false} style={{ flex: 1 }} onPress={() => pickFromGallery('cnic-front')} />
            </View>
          </FadeInUp>
        )}

        {/* Step 3: CNIC Back */}
        {step === 'cnic-back' && (
          <FadeInUp>
            <Text variant="h2" style={{ marginBottom: space.sm }}>CNIC Back Side</Text>
            <Text variant="label" tone="muted" style={{ marginBottom: space.xl }}>
              Take a photo of the back of your CNIC.
            </Text>
            <Card variant="flat" style={{ flex: 1, borderWidth: 2, borderStyle: 'dashed', borderColor: color.line, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Ionicons name="card-outline" size={64} color={color.line} />
              <Text variant="caption" tone="muted" style={{ marginTop: space.md }}>CNIC Back</Text>
            </Card>
            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
              <Button label="Take Photo" variant="primary" icon={<Ionicons name="camera" size={18} color={color.white} />} full={false} style={{ flex: 1 }} onPress={() => { setCameraMode('cnic-back'); setShowCamera(true); }} />
              <Button label="Gallery" variant="soft" icon={<Ionicons name="images" size={18} color={color.primary} />} full={false} style={{ flex: 1 }} onPress={() => pickFromGallery('cnic-back')} />
            </View>
          </FadeInUp>
        )}

        {/* Step 4: Selfie */}
        {step === 'selfie' && (
          <FadeInUp>
            <Text variant="h2" style={{ marginBottom: space.sm }}>Take a Selfie</Text>
            <Text variant="label" tone="muted" style={{ marginBottom: space.xl }}>
              Take a clear photo of your face. This will be compared with your CNIC photo for verification.
            </Text>
            <Card variant="flat" style={{ flex: 1, borderWidth: 2, borderStyle: 'dashed', borderColor: color.line, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Ionicons name="person-outline" size={64} color={color.line} />
              <Text variant="caption" tone="muted" style={{ marginTop: space.md }}>Your Selfie</Text>
            </Card>
            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
              <Button label="Take Selfie" variant="primary" icon={<Ionicons name="camera" size={18} color={color.white} />} full={false} style={{ flex: 1 }} onPress={() => { setCameraMode('selfie'); setShowCamera(true); }} />
              <Button label="Gallery" variant="soft" icon={<Ionicons name="images" size={18} color={color.primary} />} full={false} style={{ flex: 1 }} onPress={() => pickFromGallery('selfie')} />
            </View>
          </FadeInUp>
        )}
      </View>
    </Screen>
  );
}
