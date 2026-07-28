import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isRtl } from "@/i18n/request";
import "./globals.css";

const atkinson = localFont({
  src: "../../public/fonts/AtkinsonHyperlegible-Regular.ttf",
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ustaz - Trusted Home Services in Pakistan | Download the App",
  description:
    "Book trusted electricians, plumbers, carpenters, AC repair, and solar technicians in Pakistan. Download the Ustaz app on Google Play.",
  keywords: [
    "home services Pakistan",
    "electrician Karachi",
    "plumber near me",
    "carpenter Pakistan",
    "AC repair Karachi",
    "solar installation Pakistan",
    "Ustaz app",
    "trusted professionals",
  ],
  openGraph: {
    title: "Ustaz - Trusted Home Services in Pakistan",
    description:
      "Book trusted electricians, plumbers, carpenters, AC repair, and solar technicians in Pakistan.",
    url: "https://ustaz.pk",
    siteName: "Ustaz",
    locale: "en_PK",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={atkinson.variable}>
      <head>
        <meta name="google-site-verification" content="TsiePAP5LOUi2bOZo6Cnnm8Bjq5YLZe9vXU5SbZxmMQ" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,700,400,600,300,1,500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Gulzar&family=Lalezar&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-atkinson antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
