'use client'
import { SignIn, useSignIn } from '@clerk/nextjs';
import React from 'react';

function Login() {
      const { isLoaded } = useSignIn();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!isLoaded ? (
        <div className="text-lg font-medium">Loading...</div>
      ) : (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <SignIn path="/auth/login" routing="path" redirectUrl="/" />
        </div>
      )}
    </div>
  );
}

export default Login;
