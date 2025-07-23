"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signUpSchema, SignUpFormData, phoneSchema, PhoneFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from './SocialAuthButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';

export const SignUpForm: React.FC = () => {
  const t = useTranslations('auth'); // ✅ 'signup' matches your JSON namespace
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    signUpWithEmail,
    signInWithPhone,
    verifyOtp,
    isLoading,
    error,
  } = useAuth();

  const emailForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
      code: '',
    },
  });

  const handleEmailSignUp = async (data: SignUpFormData) => {
    const result = await signUpWithEmail(data);
    if (result.success) {
      setSuccessMessage('Account created! Check your email to verify.');
    }
  };

  const handlePhoneSignUp = async (data: PhoneFormData) => {
    if (!showOtpInput) {
      const result = await signInWithPhone(data.phone);
      if (result.success) {
        setPhoneNumber(data.phone);
        setShowOtpInput(true);
        setSuccessMessage('OTP sent to your phone number.');
      }
    } else {
      const result = await verifyOtp(phoneNumber, data.code!);
      if (result.success) {
        setSuccessMessage('Phone verification successful. Your account is ready.');
      }
    }
  };

  return (
  <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('ctitle')}</h1>
        <p className="text-muted-foreground">{t('csubtitle')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <SocialAuthButtons isLoading={isLoading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('socialOr')}
          </span>
        </div>
      </div>

      <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">{t('email')}</TabsTrigger>
          <TabsTrigger value="phone">{t('phone')}</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailSignUp)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('creating') : t('create')}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="phone">
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSignUp)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone')}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        disabled={showOtpInput}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOtpInput && (
                <FormField
                  control={phoneForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('code')}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder={t('code')}
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t('processing')
                  : showOtpInput
                  ? t('verify')
                  : t('sendCode')}
              </Button>

              {showOtpInput && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowOtpInput(false);
                    phoneForm.setValue('code', '');
                    setSuccessMessage('');
                  }}
                >
                  {t('differentNumber')}
                </Button>
              )}
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>

  );
};
