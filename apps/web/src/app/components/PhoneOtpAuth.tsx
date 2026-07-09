'use client';

import { useState } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title?: string;
  subtitle?: string;
  onSuccess: (userId: string) => void;
}

const E164 = /^\+[1-9]\d{7,14}$/;

export default function PhoneOtpAuth({
  title = 'Sign in to continue',
  subtitle = 'We will text you a 6-digit code.',
  onSuccess,
}: Props) {
  const [phone, setPhone] = useState('+92');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (!E164.test(phone)) {
      toast.error('Enter phone in E.164 format, e.g. +923001234567');
      return;
    }
    setBusy(true);
    const { error } = await supabase.functions.invoke('send-otp', { body: { phone } });
    setBusy(false);
    if (error) {
      const status = (error as any).context?.status ?? 500;
      if (status === 429) toast.error('Too many requests. Try again in 15 minutes.');
      else if (status === 400) toast.error('Invalid phone number.');
      else toast.error('Could not send code. Please try again.');
      return;
    }
    setStep('code');
    toast.success('Code sent. Check your SMS.');
  }

  async function verifyCode() {
    if (!/^\d{4,8}$/.test(code)) {
      toast.error('Enter the code from the SMS');
      return;
    }
    setBusy(true);

    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { phone, code },
    });
    if (error || !data?.ok) {
      setBusy(false);
      const status = (error as any)?.context?.status ?? 400;
      if (status === 400) toast.error('Incorrect or expired code.');
      else toast.error('Verification failed. Try again.');
      return;
    }

    // Materialize the Supabase session in cookies via verifyOtp(token_hash).
    const { data: sessionData, error: sessionErr } = await supabase.auth.verifyOtp({
      token_hash: data.hashed_token,
      type: 'magiclink',
    });
    setBusy(false);

    if (sessionErr || !sessionData.user) {
      toast.error(sessionErr?.message ?? 'Could not start session');
      return;
    }

    toast.success('Phone verified');
    onSuccess(sessionData.user.id);
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
      <div className="text-center space-y-1">
        <ShieldCheck className="w-10 h-10 mx-auto text-[#db4b0d]" />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              <Phone className="inline w-4 h-4 mr-2 text-[#db4b0d]" />
              Phone number
            </Label>
            <Input
              type="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              placeholder="+923001234567"
              disabled={busy}
              className="px-4 py-3"
            />
          </div>
          <Button
            onClick={sendCode}
            disabled={busy}
            className="w-full bg-[#db4b0d] hover:bg-[#a93a0b] text-white py-3 rounded-xl font-semibold"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Code sent to {phone}
            </Label>
            <Input
              inputMode="numeric"
              autoFocus
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              disabled={busy}
              className="px-4 py-3 tracking-[0.6em] text-center text-lg"
            />
          </div>
          <Button
            onClick={verifyCode}
            disabled={busy}
            className="w-full bg-[#db4b0d] hover:bg-[#a93a0b] text-white py-3 rounded-xl font-semibold"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & continue'}
          </Button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); }}
            className="text-sm text-gray-600 hover:text-[#db4b0d] underline w-full"
          >
            Use a different number
          </button>
        </div>
      )}
    </div>
  );
}
