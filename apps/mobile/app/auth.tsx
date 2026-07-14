import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { colors } from '@ustaz/shared/theme';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/ustaz-api';
import { getStoredRole, setStoredRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';
import OtpInput from '@/components/OtpInput';

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

  useEffect(() => {
    if (!providerIntent) return;
    setTab('phone');
    setStoredRole('provider').catch(() => undefined);
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

  async function devBypassLogin() {
    clearMessages();
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: '923062806717@phone.ustaz.local',
        password: 'DevTest1234!',
      });
      if (signInError) throw signInError;

      await setStoredRole('provider');
      router.replace('/(provider)');
    } catch (err: any) {
      setError('Dev login failed: ' + (err?.message ?? 'Try again.'));
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
    ? phoneStep === 'phone' ? 'Verify phone\nto earn' : 'Enter the\nOTP code'
    : tab === 'email'
      ? emailMode === 'signup' ? 'Create your\nUstaz account' : 'Welcome\nback'
      : tab === 'phone'
        ? phoneStep === 'phone' ? 'What\'s your\nphone number?' : ''
        : 'Sign in to\nUstaz';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <Pressable
            onPress={safeBack}
            style={{ marginBottom: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={20} color="#1B1B27" />
          </Pressable>

          <View style={{ marginBottom: 24 }}>
            {title ? (
              <>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: colors.primary }}>Secure access</Text>
                <Text style={{ fontFamily: 'Anton', fontSize: 36, lineHeight: 44, color: '#1B1B27', marginTop: 8 }}>{title}</Text>
              </>
            ) : null}
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, lineHeight: 22, color: '#9CA3AF', marginTop: title ? 12 : 0 }}>
              {providerIntent ? 'Verify your phone number with OTP before provider registration. This protects customers and keeps earnings tied to a real mobile number.' : 'Continue with social login, email/password, or the existing phone OTP flow.'}
            </Text>
          </View>

          {providerIntent ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: `${colors.primary}33`, marginBottom: 18 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </View>
              <Text style={{ flex: 1, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, lineHeight: 19, fontWeight: '700', color: colors.primary }}>
                Phone OTP is required before you can accept jobs and earn money.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: '#F3F4F6', marginBottom: 18 }}>
              <TabButton label="Social" active={tab === 'social'} onPress={() => { setTab('social'); clearMessages(); }} />
              <TabButton label="Email" active={tab === 'email'} onPress={() => { setTab('email'); clearMessages(); }} />
              <TabButton label="Phone" active={tab === 'phone'} onPress={() => { setTab('phone'); clearMessages(); }} />
            </View>
          )}

          {error ? <Notice tone="error" text={error} action={/not verified|not confirmed/i.test(error) ? { label: 'Resend verification', onPress: resendVerification } : undefined} /> : null}
          {message ? <Notice tone="success" text={message} /> : null}

          {tab === 'social' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <SocialButton
                label="Continue with Google"
                icon="logo-google"
                color="#DB4437"
                busy={busyProvider === 'google'}
                disabled={busy}
                onPress={() => signInWithProvider('google')}
              />
              <SocialButton
                label="Continue with Facebook"
                icon="logo-facebook"
                color="#1877F2"
                busy={busyProvider === 'facebook'}
                disabled={busy}
                onPress={() => signInWithProvider('facebook')}
              />
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, lineHeight: 18, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
                Uses the same Supabase Google and Facebook providers as the web app.
              </Text>
            </View>
          )}

          {tab === 'email' && (
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ModeButton label="Sign in" active={emailMode === 'signin'} onPress={() => { setEmailMode('signin'); clearMessages(); }} />
                <ModeButton label="Create account" active={emailMode === 'signup'} onPress={() => { setEmailMode('signup'); clearMessages(); }} />
              </View>

              <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <PasswordField label="Password" value={password} onChangeText={setPassword} visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              {emailMode === 'signup' && (
                <PasswordField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              )}

              <PrimaryButton busy={busy} label={emailMode === 'signup' ? 'Create account' : 'Sign in'} onPress={handleEmailAuth} />
            </View>
          )}

          {tab === 'phone' && (
            <View style={{ gap: 14 }}>
              {phoneStep === 'phone' ? (
                <>
                  <View>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Phone number</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 54, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
                      <View style={{ paddingHorizontal: 16, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#1B1B27' }}>+92</Text>
                      </View>
                      <TextInput
                        ref={phoneInputRef}
                        value={phone.replace('+92', '')}
                        onChangeText={(v: string) => setPhone('+92' + v.replace(/\D/g, ''))}
                        placeholder="300 123 4567"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="phone-pad"
                        maxLength={11}
                        style={{ flex: 1, minHeight: 52, paddingHorizontal: 16, fontFamily: 'AtkinsonHyperlegible', fontSize: 16, color: '#1B1B27' }}
                      />
                    </View>
                  </View>
                  <PrimaryButton busy={busy} label="Send code" onPress={sendCode} />
                </>
              ) : (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontFamily: 'Anton', fontSize: 28, color: '#1B1B27', textAlign: 'center' }}>Enter the code</Text>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
                      We sent a 6-digit code to{'\n'}
                      <Text style={{ fontWeight: '700', color: '#1B1B27' }}>{phone}</Text>
                    </Text>
                  </View>

                  {busy && !code ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <ActivityIndicator color={colors.primary} size="large" />
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>Sending code...</Text>
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

                  <View style={{ alignItems: 'center', marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
                    {countdown > 0 ? (
                      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF' }}>
                        Resend code in <Text style={{ fontWeight: '700', color: colors.primary }}>{countdown}s</Text>
                      </Text>
                    ) : (
                      <Pressable onPress={resendCode} disabled={busy} style={{ minHeight: 44, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: colors.primary }}>
                          {busy ? 'Sending...' : 'Resend code'}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <Pressable onPress={() => { setPhoneStep('phone'); setCode(''); setOtpError(false); clearMessages(); Keyboard.dismiss(); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#9CA3AF' }}>Use a different number</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          <View style={{ marginTop: 'auto', paddingTop: 28 }}>
            {providerIntent ? (
              <Pressable
                onPress={devBypassLogin}
                disabled={busy}
                style={{ marginBottom: 16, minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}
              >
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280' }}>
                  {busy ? 'Creating dev account...' : '⚡ Dev Quick Login (skip OTP)'}
                </Text>
              </Pressable>
            ) : null}
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, lineHeight: 18, color: '#D1D5DB', textAlign: 'center' }}>
              By continuing, you agree to Ustaz's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#FFFFFF' : 'transparent' }}>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: active ? '#1B1B27' : '#9CA3AF' }}>{label}</Text>
    </Pressable>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#FFF7ED' : '#F9FAFB', borderWidth: 1, borderColor: active ? `${colors.primary}55` : '#F3F4F6' }}>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: active ? colors.primary : '#6B7280' }}>{label}</Text>
    </Pressable>
  );
}

function AuthField({ label, textAlign, ...props }: any) {
  return (
    <View>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#D1D5DB"
        style={{ minHeight: 54, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 16, fontFamily: 'AtkinsonHyperlegible', fontSize: 16, color: '#1B1B27', textAlign: textAlign ?? 'left' }}
      />
    </View>
  );
}

function PasswordField({ label, value, onChangeText, visible, onToggle }: { label: string; value: string; onChangeText: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <View>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>{label}</Text>
      <View style={{ minHeight: 54, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="Password"
          placeholderTextColor="#D1D5DB"
          autoCapitalize="none"
          style={{ flex: 1, minHeight: 52, fontFamily: 'AtkinsonHyperlegible', fontSize: 16, color: '#1B1B27' }}
        />
        <Pressable onPress={onToggle} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={visible ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
        </Pressable>
      </View>
    </View>
  );
}

function PrimaryButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: busy ? '#D1D5DB' : colors.primary, shadowColor: busy ? 'transparent' : colors.primary, shadowOpacity: busy ? 0 : 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: busy ? 0 : 6 }}>
      {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{label}</Text>}
    </Pressable>
  );
}

function SocialButton({ label, icon, color, busy, disabled, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; busy: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      {busy ? <ActivityIndicator color={color} /> : <Ionicons name={icon} size={20} color={color} />}
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: disabled ? '#9CA3AF' : '#1B1B27' }}>{label}</Text>
    </Pressable>
  );
}

function Notice({ tone, text, action }: { tone: 'error' | 'success'; text: string; action?: { label: string; onPress: () => void } }) {
  const isError = tone === 'error';
  return (
    <View style={{ marginBottom: 14, borderRadius: 14, backgroundColor: isError ? '#FEF2F2' : '#ECFDF5', padding: 12 }}>
      <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, lineHeight: 18, color: isError ? '#EF4444' : '#10B981' }}>{text}</Text>
      {action && (
        <Pressable onPress={action.onPress} style={{ marginTop: 8, minHeight: 36, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: colors.primary }}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}