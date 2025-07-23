// app/auth/signup/page.tsx (Mobile - Separate Sign Up Page)
"use client";

import React from 'react';
import Link from 'next/link';
import { SignUpForm } from '@/app/components/SignUpForm';
import { useTranslations } from 'use-intl';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function SignUpPage() {
  const t = useTranslations("auth")
  return (
    <>
    <Header/>
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <SignUpForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('ltitle')}
            </Link>
          </p>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
}
