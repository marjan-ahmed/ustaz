import { useState, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';

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

  // Camera state
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
      if (mode === 'cnic-front') {
        setCnicFront(uri);
        setStep('cnic-back');
      } else if (mode === 'cnic-back') {
        setCnicBack(uri);
        setStep('selfie');
      } else if (mode === 'selfie') {
        setSelfie(uri);
        setStep('submitting');
        submitVerification(uri);
      }
    }
  }

  async function uploadFile(uri: string, path: string): Promise<string> {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const fileName = `${path.split('/').pop()}`;

    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async function submitVerification(finalSelfieUri: string) {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      // Upload all 3 images
      const timestamp = Date.now();
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadFile(cnicFront!, `${user.id}/cnic-front-${timestamp}.jpg`),
        uploadFile(cnicBack!, `${user.id}/cnic-back-${timestamp}.jpg`),
        uploadFile(finalSelfieUri, `${user.id}/selfie-${timestamp}.jpg`),
      ]);

      // Create submission record
      const { error: insertError } = await supabase
        .from('verification_submissions')
        .insert({
          provider_id: user.id,
          cnic_number: cnicNumber,
          cnic_front_url: frontUrl,
          cnic_back_url: backUrl,
          selfie_url: selfieUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Update verification_status on ustaz_registrations
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

  // Camera permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Camera permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 20 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="camera-outline" size={64} color="#D1D5DB" />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#1B1B27', marginTop: 16, textAlign: 'center' }}>
            Camera permission required
          </Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            We need camera access to take photos of your CNIC and selfie
          </Text>
          <Pressable onPress={requestPermission}
            style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  if (showCamera || previewUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        {previewUri ? (
          // Preview
          <View style={{ flex: 1 }}>
            <Image source={{ uri: previewUri }} style={{ flex: 1 }} resizeMode="contain" />
            <View style={{ flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#000' }}>
              <Pressable onPress={retakePicture}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Retake</Text>
              </Pressable>
              <Pressable onPress={confirmPicture}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Use Photo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // Camera
          <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} style={{ flex: 1 }}
              facing={cameraMode === 'selfie' ? 'front' : 'back'} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 20, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
                {cameraMode === 'cnic-front' ? 'Photograph CNIC Front' :
                 cameraMode === 'cnic-back' ? 'Photograph CNIC Back' : 'Take a Selfie'}
              </Text>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#D1D5DB', textAlign: 'center', marginTop: 4 }}>
                {cameraMode === 'selfie' ? 'Make sure your face is clearly visible' : 'Ensure all text is readable'}
              </Text>
            </View>
            <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
              <Pressable onPress={takePicture}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' }} />
              </Pressable>
              <Pressable onPress={() => { setShowCamera(false); setPreviewUri(null); }}
                style={{ position: 'absolute', top: -300, left: 20 }}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Done screen
  if (step === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          <Text style={{ fontFamily: 'Anton', fontSize: 24, color: '#1B1B27', marginBottom: 8 }}>Verification Submitted</Text>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 }}>
            Your documents have been submitted for review. An admin will verify them shortly. This usually takes 1-2 business days.
          </Text>
          <Pressable onPress={() => router.replace('/(provider)/profile')}
            style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Back to Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Submitting screen
  if (step === 'submitting') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#6B7280', marginTop: 16 }}>Uploading documents...</Text>
          {error && (
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444', marginTop: 12 }}>{error}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Step indicators
  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'cnic', label: 'CNIC #', num: 1 },
    { key: 'cnic-front', label: 'Front', num: 2 },
    { key: 'cnic-back', label: 'Back', num: 3 },
    { key: 'selfie', label: 'Selfie', num: 4 },
  ];
  const currentStep = steps.findIndex(s => s.key === step);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <Pressable onPress={() => {
          if (step === 'cnic-front') setStep('cnic');
          else if (step === 'cnic-back') setStep('cnic-front');
          else if (step === 'selfie') setStep('cnic-back');
          else router.back();
        }} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#1B1B27" />
        </Pressable>
        <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', marginLeft: 12 }}>Verify Identity</Text>
      </View>

      {/* Step indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20 }}>
        {steps.map((s, i) => (
          <View key={s.key} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
              backgroundColor: i < currentStep ? '#10B981' : i === currentStep ? colors.primary : '#E5E7EB'
            }}>
              {i < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: i === currentStep ? '#FFFFFF' : '#9CA3AF' }}>{s.num}</Text>
              )}
            </View>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {error && (
          <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2' }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#EF4444' }}>{error}</Text>
          </View>
        )}

        {/* Step 1: CNIC Number */}
        {step === 'cnic' && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27', marginBottom: 8 }}>Enter your CNIC number</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Your national identity card number (13 digits)
            </Text>
            <TextInput
              value={cnicNumber}
              onChangeText={(t) => setCnicNumber(formatCnic(t))}
              placeholder="35202-1234567-1"
              placeholderTextColor="#D1D5DB"
              keyboardType="numeric"
              maxLength={15}
              style={{
                minHeight: 56, borderRadius: 12, borderWidth: 2,
                borderColor: cnicNumber && !CNIC_REGEX.test(cnicNumber) ? '#EF4444' : '#E5E7EB',
                backgroundColor: '#F9FAFB', paddingHorizontal: 16,
                fontFamily: 'Anton', fontSize: 20, color: '#1B1B27',
                letterSpacing: 2,
              }}
            />
            {cnicNumber && !CNIC_REGEX.test(cnicNumber) && (
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#EF4444', marginTop: 8 }}>
                Format: XXXXX-XXXXXXX-X (13 digits)
              </Text>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => setStep('cnic-front')}
              disabled={!CNIC_REGEX.test(cnicNumber)}
              style={{
                paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                backgroundColor: CNIC_REGEX.test(cnicNumber) ? colors.primary : '#D1D5DB',
              }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Next</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: CNIC Front */}
        {step === 'cnic-front' && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27', marginBottom: 8 }}>CNIC Front Side</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Take a photo of the front of your CNIC. Make sure all text is clearly readable.
            </Text>
            <View style={{ flex: 1, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <Ionicons name="card-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>CNIC Front</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable onPress={() => { setCameraMode('cnic-front'); setShowCamera(true); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Take Photo</Text>
              </Pressable>
              <Pressable onPress={() => pickFromGallery('cnic-front')}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="images" size={18} color="#6B7280" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 3: CNIC Back */}
        {step === 'cnic-back' && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27', marginBottom: 8 }}>CNIC Back Side</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Take a photo of the back of your CNIC.
            </Text>
            <View style={{ flex: 1, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <Ionicons name="card-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>CNIC Back</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable onPress={() => { setCameraMode('cnic-back'); setShowCamera(true); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Take Photo</Text>
              </Pressable>
              <Pressable onPress={() => pickFromGallery('cnic-back')}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="images" size={18} color="#6B7280" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 4: Selfie */}
        {step === 'selfie' && (
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 20, color: '#1B1B27', marginBottom: 8 }}>Take a Selfie</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Take a clear photo of your face. This will be compared with your CNIC photo for verification.
            </Text>
            <View style={{ flex: 1, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
              <Ionicons name="person-outline" size={64} color="#D1D5DB" />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>Your Selfie</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable onPress={() => { setCameraMode('selfie'); setShowCamera(true); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Take Selfie</Text>
              </Pressable>
              <Pressable onPress={() => pickFromGallery('selfie')}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Ionicons name="images" size={18} color="#6B7280" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
