// layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Gulzar, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic, Rakkas } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import localFont from 'next/font/local';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import { ServiceProvider } from "./context/ServiceContext";
import { Toaster } from "@/components/ui/sonner";


const urduFont = Gulzar({
  subsets: ["arabic"],
  weight: ["400"], // Ensure this weight is available on Google Fonts
  variable: "--font-urdu",
  display: "swap",
});

 const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400"], // Ensure this weight is available on Google Fonts
  variable: "--font-arabic",
  display: "swap",
});

const atkinson = localFont({
  src: '../../public/fonts/AtkinsonHyperlegible-Regular.ttf',
  variable: '--font-atkinson',
});

const anton = localFont({
  src: '../../public/fonts/Anton-Regular.ttf',
  variable: '--font-anton',
});

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
      <html
        lang={locale}
        dir={direction}
        // Apply all font variables to the html tag for Tailwind to pick them up
        className={`${arabicFont.variable} ${urduFont.variable} ${anton.variable} ${atkinson.variable} ${geistSans.variable} ${geistMono.variable}`}
        // cz-shortcut-listen="true"
      >
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
        </head>

        <body
          className={
            `${locale === "ur" ? "font-urdu" : locale === "ar" ? "font-arabic" : "font-atkinson"} antialiased`
            
          }
        > 
          <NextIntlClientProvider messages={messages}>
            {/* Header and Footer might need specific font classes if they are in a different language than the main content */}
            {/* For example, if Header is always LTR with Atkinson font */}
            <ServiceProvider>
              {children}
            </ServiceProvider>
            <Toaster position="top-center" />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}