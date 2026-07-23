import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/ustaz-api';
import { getStoredRole, setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import OtpInput from '@/components/OtpInput';
import {
  Button, Card, GlowBackdrop, IconTile, PatternBackdrop, PressableScale, SegmentedControl, Text, TextField,
} from '@/components/mobile-ui';
import { color, radius, space, touch } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const redirectTo = makeRedirectUri({ scheme: 'ustaz', path: 'auth' });

type AuthTab = 'social' | 'email' | 'phone';
type EmailMode = 'signin' | 'signup';
type OAuthProvider = 'google' | 'facebook';

function getUrlParam(url: string, key: string) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(key) ?? new URLSearchParams(parsed.hash.replace(/^#/, '')).get(key);
  } catch {
    const query = url.split('?')[1]?.split('#')[0] ?? '';
    const hash = url.split('#')[1] ?? '';
    return new URLSearchParams(query).get(key) ?? new URLSearchParams(hash).get(key);
  }
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string; mode?: string }>();
  const providerIntent = params.intent === 'provider' || params.mode === 'provider';
  const handledUrlRef = useRef<string | null>(null);

  const [tab, setTab] = useState<AuthTab>(providerIntent ? 'phone' : 'social');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState('+92');
  const [code, setCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone');
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSendRef = useRef(0);
  const phoneInputRef = useRef<TextInput>(null);

  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setMessage(null);
    setOtpError(false);
  }

  function startCountdown() {
    setCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  useEffect(() => {
    if (phoneStep === 'phone') {
      const t = setTimeout(() => phoneInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [phoneStep]);

  function safeBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/role-select');
  }

  async function handleProviderSignup() {
    clearMessages();
    if (!E164.test(phone)) {
      setError('Enter phone in E.164 format, e.g. +923001234567');
      return;
    }
    setBusy(true);
    try {
      // Create a Supabase auth user directly (no OTP)
      // Use deterministic password so re-login works
      const email = phone.replace('+', '') + '@phone.ustaz.local';
      const password = 'Ustaz' + phone.replace('+', '').slice(-6) + '!A1';
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { phone } },
      });
      if (signUpError) {
        // If user already exists, sign in instead
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
        } else {
          throw signUpError;
        }
      }
      await setStoredRole('provider');
      router.replace('/provider-register');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create account. Try again.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!providerIntent) return;
    setTab('phone');
    setStoredRole('provider').catch(() => undefined);

    // Skip OTP: if user already has a session, go straight to registration
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('ustaz_registrations')
          .select('userId')
          .eq('userId', user.id)
          .maybeSingle();
        if (!data) {
          router.replace('/provider-register');
        } else {
          router.replace('/(provider)');
        }
      }
    })();
  }, [providerIntent]);

  async function navigateToApp() {
    const role = await getStoredRole();
    if (role === 'provider') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('ustaz_registrations')
          .select('userId')
          .eq('userId', user.id)
          .maybeSingle();
        if (!data) {
          router.replace('/provider-register');
          return;
        }
      }
    }
    router.replace(role === 'provider' ? '/(provider)' : '/(customer)');
  }

  async function handleAuthCallbackUrl(url: string) {
    if (handledUrlRef.current === url) return;
    handledUrlRef.current = url;

    const errorDescription = getUrlParam(url, 'error_description') ?? getUrlParam(url, 'error');
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
      return;
    }

    const codeParam = getUrlParam(url, 'code');
    const accessToken = getUrlParam(url, 'access_token');
    const refreshToken = getUrlParam(url, 'refresh_token');

    setBusy(true);
    try {
      if (codeParam) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
        if (exchangeError) throw exchangeError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        return;
      }

      setMessage('Signed in successfully.');
      await navigateToApp();
    } catch (err: any) {
      handledUrlRef.current = null;
      setError(err?.message ?? 'Could not complete sign in.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    ExpoLinking.getInitialURL().then((url) => {
      if (url) handleAuthCallbackUrl(url);
    });
    const sub = ExpoLinking.addEventListener('url', ({ url }) => handleAuthCallbackUrl(url));
    return () => sub.remove();
  }, []);

  async function signInWithProvider(provider: OAuthProvider) {
    clearMessages();
    setBusy(true);
    setBusyProvider(provider);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined,
        },
      });
      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error(`Could not start ${provider} sign in.`);

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        await handleAuthCallbackUrl(result.url);
      } else if (result.type === 'cancel') {
        setMessage('Sign in cancelled.');
      }
    } catch (err: any) {
      setError(`${provider === 'google' ? 'Google' : 'Facebook'} sign-in failed: ${err?.message ?? 'Try again.'}`);
    } finally {
      setBusy(false);
      setBusyProvider(null);
    }
  }

  async function handleEmailAuth() {
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (emailMode === 'signup') {
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError('Password must include at least one letter and one number.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (emailMode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          setMessage('Account created. Redirecting...');
          await navigateToApp();
        } else {
          setMessage(`Almost there. We sent a verification link to ${normalizedEmail}.`);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          if (/email not confirmed|not confirmed/i.test(signInError.message)) {
            setError('Your email is not verified yet. Check your inbox, or resend the link below.');
            return;
          }
          throw signInError;
        }
        setMessage('Login successful. Redirecting...');
        await navigateToApp();
      }
    } catch (err: any) {
      setError(`Authentication failed: ${err?.message ?? 'Try again.'}`);
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL.test(normalizedEmail)) {
      setError('Enter your email above first.');
      return;
    }

    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: redirectTo },
      });
      if (resendError) throw resendError;
      setMessage(`Verification link re-sent to ${normalizedEmail}.`);
    } catch (err: any) {
      setError(`Could not resend: ${err?.message ?? 'Try again.'}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    clearMessages();
    if (!E164.test(phone)) {
      setError('Enter phone in E.164 format, e.g. +923001234567');
      return;
    }
    const now = Date.now();
    if (now - lastSendRef.current < 30000) {
      setError('Please wait before requesting another code.');
      return;
    }
    lastSendRef.current = now;
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      setPhoneStep('code');
      setCode('');
      startCountdown();
    } catch (err: any) {
      setError(err?.message ?? 'Could not send code. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    clearMessages();
    if (!/^\d{4,8}$/.test(code)) {
      setError('Enter the code from the SMS.');
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(phone, code);
      setMessage('Verified. Redirecting...');
      await navigateToApp();
    } catch (err: any) {
      setOtpError(true);
      setError(err?.message ?? 'Invalid code. Try again.');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    clearMessages();
    const now = Date.now();
    if (now - lastSendRef.current < 30000) {
      setError('Please wait before requesting another code.');
      return;
    }
    lastSendRef.current = now;
    setCode('');
    setOtpError(false);
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      startCountdown();
    } catch (err: any) {
      setError(err?.message ?? 'Could not resend code.');
    } finally {
      setBusy(false);
    }
  }

  const title = providerIntent
    ? 'Start earning\nwith Ustaz'
    : tab === 'email'
      ? emailMode === 'signup' ? 'Create your\nUstaz account' : 'Welcome\nback'
      : tab === 'phone'
        ? phoneStep === 'phone' ? 'What\'s your\nphone number?' : ''
        : 'Sign in to\nUstaz';

  const phoneField = (
    <TextField
      ref={phoneInputRef}
      label="Phone number"
      value={phone.replace('+92', '')}
      onChangeText={(v: string) => setPhone('+92' + v.replace(/\D/g, ''))}
      placeholder="300 123 4567"
      keyboardType="phone-pad"
      maxLength={11}
      left={
        <View style={{
          paddingHorizontal: space.lg, height: touch.minTarget + 6,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: color.line, borderRightWidth: 1, borderRightColor: color.line,
        }}>
          <Text variant="body" style={{ fontWeight: '700' }}>+92</Text>
        </View>
      }
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }} edges={['top']}>
      <PatternBackdrop variant="dots" tone="navy" opacity={0.04} glow={false} />
      <GlowBackdrop top={-100} right={-60} size={280} opacity={0.12} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space['2xl'] }}>
          <PressableScale onPress={safeBack} style={{ marginBottom: space.xl, width: 40, height: 40, borderRadius: radius.full, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={20} color={color.ink} />
          </PressableScale>

          <View style={{ marginBottom: space.xl }}>
            {title ? (
              <>
                <Text variant="caption" tone="primary" style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>Secure access</Text>
                <Text variant="display" style={{ marginTop: space.sm }}>{title}</Text>
              </>
            ) : null}
            <Text variant="bodyLg" tone="muted" style={{ marginTop: title ? space.md : 0 }}>
              {providerIntent ? 'Enter your phone number and we\'ll set up your provider account. No OTP needed — you can verify your phone later.' : 'Continue with social login, email/password, or the existing phone OTP flow.'}
            </Text>
          </View>

          {providerIntent ? (
            <View style={{ gap: space.md }}>
              <Card variant="flat" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm }}>
                <IconTile>
                  <Ionicons name="hammer" size={18} color={color.primary} />
                </IconTile>
                <Text variant="label" tone="primary" style={{ flex: 1, fontWeight: '700' }}>
                  Enter your phone number to get started as a provider.
                </Text>
              </Card>

              {phoneField}
              <Button label="Continue to Registration" onPress={handleProviderSignup} loading={busy} style={{ marginTop: space.sm }} />
            </View>
          ) : (
            <View style={{ marginBottom: space.lg }}>
              <SegmentedControl
                segments={[
                  { key: 'social', label: 'Social' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                ]}
                value={tab}
                onChange={(key) => { setTab(key as AuthTab); clearMessages(); }}
              />
            </View>
          )}

          {error ? <Notice tone="error" text={error} action={/not verified|not confirmed/i.test(error) ? { label: 'Resend verification', onPress: resendVerification } : undefined} /> : null}
          {message ? <Notice tone="success" text={message} /> : null}

          {!providerIntent && tab === 'social' && (
            <View style={{ gap: space.md, marginTop: space.sm }}>
              <SocialButton
                label="Continue with Google"
                icon="logo-google"
                brandColor="#DB4437"
                busy={busyProvider === 'google'}
                disabled={busy}
                onPress={() => signInWithProvider('google')}
              />
              <SocialButton
                label="Continue with Facebook"
                icon="logo-facebook"
                brandColor="#1877F2"
                busy={busyProvider === 'facebook'}
                disabled={busy}
                onPress={() => signInWithProvider('facebook')}
              />
              <Text variant="caption" tone="muted" center style={{ marginTop: space.sm }}>
                Uses the same Supabase Google and Facebook providers as the web app.
              </Text>
            </View>
          )}

          {!providerIntent && tab === 'email' && (
            <View style={{ gap: space.md }}>
              <SegmentedControl
                segments={[
                  { key: 'signin', label: 'Sign in' },
                  { key: 'signup', label: 'Create account' },
                ]}
                value={emailMode}
                onChange={(key) => { setEmailMode(key as EmailMode); clearMessages(); }}
              />

              <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={color.inkMuted} />
                  </Pressable>
                }
              />
              {emailMode === 'signup' && (
                <TextField
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  right={
                    <Pressable onPress={() => setShowPassword((v) => !v)} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={color.inkMuted} />
                    </Pressable>
                  }
                />
              )}

              <Button label={emailMode === 'signup' ? 'Create account' : 'Sign in'} onPress={handleEmailAuth} loading={busy} />
            </View>
          )}

          {!providerIntent && tab === 'phone' && (
            <View style={{ gap: space.md }}>
              {phoneStep === 'phone' ? (
                <>
                  {phoneField}
                  <Button label="Send code" onPress={sendCode} loading={busy} />
                </>
              ) : (
                <>
                  <View style={{ alignItems: 'center', marginBottom: space.xs }}>
                    <Text variant="h1" center>Enter the code</Text>
                    <Text variant="label" tone="muted" center style={{ marginTop: space.sm }}>
                      We sent a 6-digit code to{'\n'}
                      <Text variant="label" style={{ fontWeight: '700' }}>{phone}</Text>
                    </Text>
                  </View>

                  {busy && !code ? (
                    <View style={{ alignItems: 'center', paddingVertical: space['3xl'] }}>
                      <Text variant="label" tone="muted" style={{ marginTop: space.md }}>Sending code...</Text>
                    </View>
                  ) : (
                    <OtpInput
                      length={6}
                      value={code}
                      onChange={(v) => { setCode(v); setOtpError(false); clearMessages(); }}
                      onComplete={(v) => { setCode(v); verifyCode(); }}
                      autoFocus
                      error={otpError}
                    />
                  )}

                  <View style={{ alignItems: 'center', marginTop: space.sm, minHeight: touch.minTarget, justifyContent: 'center' }}>
                    {countdown > 0 ? (
                      <Text variant="label" tone="muted">
                        Resend code in <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>{countdown}s</Text>
                      </Text>
                    ) : (
                      <PressableScale onPress={resendCode} disabled={busy} style={{ minHeight: touch.minTarget, justifyContent: 'center' }}>
                        <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>
                          {busy ? 'Sending...' : 'Resend code'}
                        </Text>
                      </PressableScale>
                    )}
                  </View>

                  <PressableScale onPress={() => { setPhoneStep('phone'); setCode(''); setOtpError(false); clearMessages(); Keyboard.dismiss(); }} style={{ minHeight: touch.minTarget, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="label" tone="muted" style={{ fontWeight: '700' }}>Use a different number</Text>
                  </PressableScale>
                </>
              )}
            </View>
          )}

          <View style={{ marginTop: 'auto', paddingTop: space.xl }}>
            <Text variant="caption" tone="muted" center>
              By continuing, you agree to Ustaz's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({ label, icon, brandColor, busy, disabled, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; brandColor: string; busy: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: touch.minTarget + 8, borderRadius: radius.md, borderWidth: 1, borderColor: color.line,
        backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
      }}
    >
      {busy ? null : <Ionicons name={icon} size={20} color={brandColor} />}
      <Text variant="bodyLg" style={{ fontWeight: '700', color: disabled ? color.inkMuted : color.ink }}>
        {busy ? 'Connecting...' : label}
      </Text>
    </PressableScale>
  );
}

function Notice({ tone, text, action }: { tone: 'error' | 'success'; text: string; action?: { label: string; onPress: () => void } }) {
  const isError = tone === 'error';
  return (
    <View style={{ marginBottom: space.md, borderRadius: radius.md, backgroundColor: isError ? color.errorBg : color.successBg, padding: space.md }}>
      <Text variant="label" style={{ color: isError ? color.error : color.success }}>{text}</Text>
      {action && (
        <PressableScale onPress={action.onPress} style={{ marginTop: space.sm, minHeight: 36, justifyContent: 'center' }}>
          <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>{action.label}</Text>
        </PressableScale>
      )}
    </View>
  );
}
