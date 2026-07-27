"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/actions/set-locale";

const OPTIONS = [
  { value: "en", label: "EN", aria: "Switch to English" },
  { value: "ur", label: "اردو", aria: "اردو میں تبدیل کریں" },
] as const;

/**
 * Compact segmented EN / اردو toggle. Two locales only, so a one-tap segmented
 * control beats a dropdown. Writes the NEXT_LOCALE cookie server-side then
 * refreshes so server components re-render with the new messages.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(next: string) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex shrink-0 items-center rounded-full border border-gray-200 bg-white p-0.5 ${
        isPending ? "opacity-60" : ""
      } ${className}`}
    >
      {OPTIONS.map((o) => {
        const active = o.value === locale;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            aria-label={o.aria}
            aria-pressed={active}
            lang={o.value}
            className={`min-w-[38px] rounded-full px-2.5 py-1 text-xs font-bold leading-5 transition-colors duration-200 ${
              active
                ? "bg-[#db4b0d] text-white"
                : "text-gray-500 hover:text-[#0f1729]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
