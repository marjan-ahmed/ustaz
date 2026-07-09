"use client";

import React, { useState } from "react";
import { supabase } from "../../../client/supabaseClient"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Phone } from "lucide-react"; // Icons for different auth methods
import { FaGoogle } from "react-icons/fa";

const LoginRegisterForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "google">("email");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = () => {
    setMessage(null);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: '/', // Or your desired callback URL
        },
      });

      if (error) throw error;
      setMessage("Redirecting to Google for authentication...");
    } catch (err: any) {
      setError(`Google sign-in failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (isSignUp) {
      // Basic password policy (Supabase hashes with bcrypt server-side).
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError('Password must include at least one letter and one number.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Confirmation link returns here and exchanges for a session.
            emailRedirectTo: `${siteOrigin}/auth/callback?next=/`,
          },
        });
        if (error) throw error;
        // If "Confirm email" is enabled, identities is empty until verified.
        const needsVerify = !data.session;
        setMessage(
          needsVerify
            ? `Almost there! We've sent a verification link to ${email}. Click it to activate your account.`
            : 'Registration successful! Redirecting…',
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Surface the unverified-email case clearly + allow a resend.
          if (/email not confirmed|not confirmed/i.test(error.message)) {
            setError('Your email is not verified yet. Check your inbox, or resend the link below.');
            return;
          }
          throw error;
        }
        setMessage('Login successful! Redirecting…');
      }
    } catch (err: any) {
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    clearMessages();
    if (!email) {
      setError('Enter your email above first.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${siteOrigin}/auth/callback?next=/` },
      });
      if (error) throw error;
      setMessage(`Verification link re-sent to ${email}.`);
    } catch (err: any) {
      setError(`Could not resend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });
      if (error) throw error;
      setOtpSent(true);
      setMessage("OTP sent to your phone. Please enter it below.");
    } catch (err: any) {
      setError(`Failed to send OTP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms', // Or 'whatsapp' if configured
      });
      if (error) throw error;
      setMessage("Phone verified and logged in successfully! Redirecting...");
      // Handle successful login, e.g., redirect to dashboard
      // window.location.href = '/dashboard'; // Example redirection
    } catch (err: any) {
      setError(`OTP verification failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? "Create an Account" : "Welcome Back!"}
        </CardTitle>
        <CardDescription>
          {isSignUp ? "Sign up to get started." : "Log in to your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

        {/* Auth Method Selection */}
        <div className="flex justify-center space-x-4 mb-4">
          <Button
            variant={authMethod === "email" ? "default" : "outline"}
            onClick={() => { setAuthMethod("email"); clearMessages(); setOtpSent(false); }}
            className="flex-1"
          >
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
          <Button
            variant={authMethod === "phone" ? "default" : "outline"}
            onClick={() => { setAuthMethod("phone"); clearMessages(); setOtpSent(false); }}
            className="flex-1"
          >
            <Phone className="mr-2 h-4 w-4" /> Phone
          </Button>
          <Button
            variant={authMethod === "google" ? "default" : "outline"}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex-1"
          >
            {loading && authMethod === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
        </div>

        {authMethod === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSignUp ? "Sign Up" : "Log In"}
            </Button>
            {isSignUp && (
              <p className="text-xs text-gray-500 text-center">
                Min 8 characters, with at least one letter and one number.
              </p>
            )}
            {!isSignUp && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full text-center text-xs text-[#db4b0d] hover:underline"
              >
                Didn&apos;t get the verification email? Resend it
              </button>
            )}
          </form>
        )}

        {authMethod === "phone" && (
          <form onSubmit={otpSent ? handleVerifyPhoneOtp : handlePhoneSignIn} className="space-y-4">
            {!otpSent ? (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : "Verify OTP & Log In"}
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="text-center text-sm text-gray-600">
          {authMethod === "email" && (
            isSignUp ? (
              <>
                Already have an account?{" "}
                <Button variant="link" onClick={() => { setIsSignUp(false); clearMessages(); }} className="p-0 h-auto text-[#db4b0d] hover:underline">
                  Log In
                </Button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Button variant="link" onClick={() => { setIsSignUp(true); clearMessages(); }} className="p-0 h-auto text-[#db4b0d] hover:underline">
                  Sign Up
                </Button>
              </>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginRegisterForm;
