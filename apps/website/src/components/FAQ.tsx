"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_KEYS = [
  "download",
  "free",
  "cities",
  "provider",
  "payment",
  "support",
] as const;

export default function FAQ() {
  const t = useTranslations("faq");

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Heading */}
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-[#db4b0d]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {t("eyebrow")}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl leading-none lg:text-6xl font-bold text-[#0f1729]"
              style={{ fontFamily: "Clash Grotesk, sans-serif" }}
            >
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
            </h2>
            <p className="mt-6 text-gray-600 text-sm sm:text-md max-w-md">
              {t("subtitle")}
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQ_KEYS.map((key) => (
                <AccordionItem
                  key={key}
                  value={key}
                  className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-sm font-semibold text-[#0f1729] py-5 hover:text-[#db4b0d] transition-colors text-start">
                    {t(`items.${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pb-5">
                    {t(`items.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
