"use client";

import * as Select from "@radix-ui/react-select";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckIcon, LanguageIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import setLangVal from "@/actions/set-languge-action";

const items = [
  { label: "English", value: "en" },
  { label: "اردو", value: "ur" },
  { label: "العربية", value: "ar" },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: string) => {
    startTransition(async () => {
      await setLangVal(nextLocale); // Server action to set the cookie
      router.refresh();             // Re-render page with new locale
    });
  };

  return (
    <div className="relative">
      <Select.Root defaultValue={locale} onValueChange={handleLocaleChange}>
        <Select.Trigger
          aria-label={t("lang")}
          className={clsx(
            "rounded-sm p-2 transition-colors hover:bg-slate-200",
            isPending && "pointer-events-none opacity-60"
          )}
        >
          <Select.Value />
          <Select.Icon>
            <LanguageIcon className="h-6 w-6 text-slate-600 transition-colors group-hover:text-slate-900" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
         <Select.Content
  align="end"
  className={clsx(
    className,
    "min-w-[8rem] overflow-hidden rounded-sm bg-white py-1 shadow-md"
  )}
  position="popper"
>
            <Select.Viewport>
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  className="flex cursor-default items-center px-3 py-2 text-base data-[highlighted]:bg-slate-100"
                  value={item.value}
                >
                  <div className="mr-2 w-[1rem]">
                    {item.value === locale && (
                      <CheckIcon className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <span className="text-slate-900">{item.label}</span>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.Arrow className="fill-white text-white" />
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
