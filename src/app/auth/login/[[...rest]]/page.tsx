"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { SignIn,useSignIn } from "@clerk/nextjs";

export default function Register() {
  const { isLoaded } = useSignIn();

  return (
    <>
    <Header/>
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!isLoaded ? (
        <div className="text-lg font-medium">Loading...</div>
      ) : (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <SignIn path="/auth/login" redirectUrl="/" afterSignUpUrl={'/'} />
        </div>
      )}
    </div>
    <Footer/>
    </>
  );
}