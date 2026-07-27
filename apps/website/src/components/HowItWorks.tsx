"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

// Same pastel tones as the mobile app's customer home "Quick find" grid.
const steps = [
  { key: "download", bg: "#FFEDD5", image: "/images/live_map-removebg-preview.png" },
  { key: "choose", bg: "#DBEAFE", image: "/images/service-selection-removebg-preview.png" },
  { key: "matched", bg: "#D9F99D", image: "/images/completion-checklist-removebg-preview.png" },
  { key: "done", bg: "#FEF3C7", image: "/images/app-download-removebg-preview.png" },
] as const;

export default function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section
      id="how-it-works"
      className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-4"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            {t("title")}
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps Grid — mobile app "Quick find" card pattern, scaled up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden h-[260px] sm:h-[280px] p-6 flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5"
              style={{ backgroundColor: step.bg }}
            >
              <div className="w-9 h-9 rounded-full bg-[#0f1729] text-white flex items-center justify-center font-bold text-sm shadow-lg z-10">
                {index + 1}
              </div>

              <div className="mt-auto z-10">
                <h3
                  className="text-lg md:text-xl font-bold text-[#0f1729] mb-1.5"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed pe-4">
                  {t(`steps.${step.key}.description`)}
                </p>
              </div>

              {/* Illustration — large, bleeding off the bottom-right edge */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-x-1 group-hover:-translate-y-1 pointer-events-none opacity-60">
                <Image
                  src={step.image}
                  alt={t(`steps.${step.key}.title`)}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <a href="#waitlist">
            <button className="bg-[#db4b0d] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#c24309] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-2">
              {t("cta")}
              <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
