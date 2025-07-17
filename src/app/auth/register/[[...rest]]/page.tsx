"use client";

import { SignUp,useSignUp } from "@clerk/nextjs";

export default function Register() {
  const { isLoaded } = useSignUp();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!isLoaded ? (
        <div className="text-lg font-medium">Loading...</div>
      ) : (
        <div className="mt-12 space-y-4 text-center">
          <h1 className="text-2xl font-bold">Register</h1>
          <SignUp path="/auth/register" redirectUrl="/" afterSignUpUrl={'/'} />
        </div>
      )}
    </div>
  );
}
