import { supabase } from '../../client/supabaseClient';

export async function sendOtp(phoneE164: string) {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { phone: phoneE164 },
  });
  if (error) {
    const status = (error as any).context?.status ?? 500;
    if (status === 429) throw new Error('Too many requests. Try again in 15 minutes.');
    if (status === 400) throw new Error('Invalid phone number. Use E.164 format, e.g. +923001234567.');
    throw new Error('Could not send code. Please try again.');
  }
  return data as { ok: true };
}
