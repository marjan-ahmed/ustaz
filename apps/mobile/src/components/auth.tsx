import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@ustaz/shared/theme';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/ustaz-api';
import { Button, Card } from './mobile-ui';

const E164 = /^\+[1-9]\d{7,14}$/;

export function PhoneAuthCard({ title = 'Sign in to continue', subtitle = 'Use the same phone OTP flow as the web app.' }: { title?: string; subtitle?: string }) {
  const [phone, setPhone] = useState('+92');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setMessage(null);
    if (!E164.test(phone)) {
      setError('Enter phone in E.164 format, e.g. +923001234567.');
      return;
    }
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      setStep('code');
      setMessage('Code sent. Check your SMS.');
    } catch (err: any) {
      setError(err?.message ?? 'Could not send code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setMessage(null);
    if (!/^\d{4,8}$/.test(code)) {
      setError('Enter the code from the SMS.');
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(phone, code);
      setMessage('Phone verified.');
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="elevated">
      <Text className="font-atkinson text-sm font-bold uppercase tracking-widest text-ustaz-primary">Secure access</Text>
      <Text className="mt-sm font-atkinson text-2xl font-bold text-slate-950">{title}</Text>
      <Text className="mt-xs font-atkinson text-sm leading-5 text-slate-600">{subtitle}</Text>

      <View className="mt-lg">
        {step === 'phone' ? (
          <>
            <Text className="mb-xs font-atkinson text-sm font-bold text-slate-700">Phone number</Text>
            <TextInput
              accessibilityLabel="Phone number"
              value={phone}
              onChangeText={(value) => setPhone(value.trim())}
              keyboardType="phone-pad"
              placeholder="+923001234567"
              className="min-h-[52px] rounded-[18px] border border-slate-200 bg-white px-md font-atkinson text-base text-slate-950"
            />
            <Button label="Send code" onPress={sendCode} loading={busy} style={{ marginTop: 12 }} />
          </>
        ) : (
          <>
            <Text className="mb-xs font-atkinson text-sm font-bold text-slate-700">Code sent to {phone}</Text>
            <TextInput
              accessibilityLabel="OTP code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={8}
              placeholder="123456"
              className="min-h-[52px] rounded-[18px] border border-slate-200 bg-white px-md text-center font-atkinson text-xl tracking-[8px] text-slate-950"
            />
            <Button label="Verify and continue" onPress={verifyCode} loading={busy} style={{ marginTop: 12 }} />
            <Button
              label="Use a different number"
              variant="soft"
              onPress={() => {
                setStep('phone');
                setCode('');
              }}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </View>

      {error ? <Text className="mt-md font-atkinson text-sm leading-5 text-red-600">{error}</Text> : null}
      {message ? <Text className="mt-md font-atkinson text-sm leading-5 text-emerald-700">{message}</Text> : null}

      <Pressable accessibilityRole="button" className="mt-lg min-h-[44px] justify-center" onPress={() => setError(null)}>
        <Text className="font-atkinson text-xs leading-5 text-slate-500">This uses the existing Supabase send-otp and verify-otp Edge Functions, then stores the session in mobile AsyncStorage.</Text>
      </Pressable>
    </Card>
  );
}

export function LoadingBlock({ label = 'Loading Ustaz data...' }: { label?: string }) {
  return (
    <View className="items-center justify-center rounded-[24px] bg-white p-xl">
      <ActivityIndicator color={colors.primary} />
      <Text className="mt-md font-atkinson text-sm text-slate-600">{label}</Text>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card variant="elevated">
      <Text className="font-atkinson text-base font-bold text-red-700">Something went wrong</Text>
      <Text className="mt-xs font-atkinson text-sm leading-5 text-red-700">{message}</Text>
      {onRetry ? <Button label="Try again" variant="soft" onPress={onRetry} style={{ marginTop: 12 }} /> : null}
    </Card>
  );
}
