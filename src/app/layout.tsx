import type { Metadata } from "next";
import { Anton, Atkinson_Hyperlegible, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import localFont from 'next/font/local';
import Footer from "./components/Footer";

// const atkinson = Atkinson_Hyperlegible({
//   subsets: ["latin"],
//   weight: ["400", "700"],
//   variable: "--font-atkinson",
// });

// const anton = Anton({
//   subsets: ["latin"],
//   weight: "400",
//   variable: "--font-anton",
// });

const atkinson = localFont({
  src: '../../public/fonts/AtkinsonHyperlegible-Regular.ttf',
  variable: '--font-atkinson',
});

const anton = localFont({
  src: '../../public/fonts/Anton-Regular.ttf',
  variable: '--font-anton',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ustaz - Trusted Home Service Providers in Pakistan",
  description: "Book trusted electricians, plumbers, and carpenters in Pakistan with Ustaz. Fast, affordable home services for repairs and installations near you.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
  signInUrl="/auth/login"
  signUpUrl="/auth/register"
  afterSignInUrl="/"
  afterSignUpUrl="/"
  >
    <html lang="en">
      <body
        className={`${anton.variable} ${atkinson.variable} antialiased`}
         cz-shortcut-listen="true"
      >
        <Header/>
        {children}
        <Footer />
      </body>
    </html>
    </ClerkProvider>
  );
}
