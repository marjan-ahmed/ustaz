"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import setLangVal from '@/actions/set-languge-action';

export default function LanguageSwitcher() {
  const t = useTranslations("header")
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: string) => {
    startTransition(() => {
      // Set the NEXT_LOCALE cookie. next-intl will pick this up automatically.
      // For client-side, you can directly set a cookie or use a utility.
      // A simple way is to reload the page with the new locale in a query param
      // or rely on a server action that sets the cookie.
      // For a client-side only approach without route segments, you'd typically:
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh(); // This will trigger a server re-render with the new cookie
    });
  };

  return (
    <Select onValueChange={(value) => setLangVal(value)}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={t("lang")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ur">اردو</SelectItem>
    <SelectItem value="ar">العربية</SelectItem>
        {/* Add more languages as needed */}
      </SelectContent>
    </Select>
  );
}