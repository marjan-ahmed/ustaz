import type { Metadata } from "next";
import localFont from "next/font/local";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={atkinson.variable}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,700,400,600,300,1,500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Gulzar&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-atkinson antialiased">{children}</body>
    </html>
  );
}
