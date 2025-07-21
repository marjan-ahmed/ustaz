import type { Metadata } from "next";
import { Anton, Atkinson_Hyperlegible, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import localFont from 'next/font/local';
import Footer from "./components/Footer";
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

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


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();
    const direction = ['ur', 'ar'].includes(locale) ? 'rtl' : 'ltr';
  return (
    <ClerkProvider>
    <html lang={locale} dir={direction}>
      <body
        className={`${anton.variable} ${atkinson.variable} antialiased`}
         cz-shortcut-listen="true"
      >
         <NextIntlClientProvider messages={messages}>
        {children}
        </NextIntlClientProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
