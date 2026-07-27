import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "ur"] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const defaultLocale: Locale = "en";

// Urdu reads right-to-left.
export const rtlLocales: Locale[] = ["ur"];

export function isRtl(locale: string) {
  return rtlLocales.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
