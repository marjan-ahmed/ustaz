"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X, Check, Sparkles } from "lucide-react";

// Same pastel tones as the mobile app's customer home "Quick find" grid.
const services = [
  { key: "electrical", image: "/images/electrician-removebg-preview.png", bg: "#FFEDD5" },
  { key: "plumbing", image: "/images/plumber-removebg-preview.png", bg: "#DBEAFE" },
  { key: "carpentry", image: "/images/carpenter-removebg-preview.png", bg: "#D9F99D" },
  { key: "acRepair", image: "/images/ac_repair-removebg-preview.png", bg: "#CFFAFE" },
  { key: "solar", image: "/images/solar-removebg-preview.png", bg: "#FEF3C7" },
  { key: "cctv", image: "/images/cctv-removebg-preview.png", bg: "#F3E8FF" },
  { key: "roomCooler", image: "/images/cooler-removebg-preview.png", bg: "#E0F2FE" },
  { key: "refrigerator", image: "/images/fridge-removebg-preview.png", bg: "#F0FDF4" },
  { key: "homeAppliances", image: "/images/appliance-removebg-preview.png", bg: "#FFF1F2" },
  { key: "washingMachine", image: "/images/appliance-removebg-preview.png", bg: "#EFF6FF" },
];

const FEATURE_KEYS = ["certified", "response", "warranty", "pricing"] as const;

export default function Services() {
  const t = useTranslations("services");
  const [selectedService, setSelectedService] = useState<number | null>(null);

  useEffect(() => {
    if (selectedService !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedService]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FFF7ED] border border-[#db4b0d]/15 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#db4b0d]" />
            <span className="text-[#db4b0d] text-xs font-semibold uppercase tracking-wider">
              {t("eyebrow")}
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-3"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            {t("title")}
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((service, index) => (
            <div
              key={index}
              onClick={() => setSelectedService(index)}
              className="group flex items-stretch h-32 sm:h-36 md:h-40 rounded-3xl bg-white border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1"
            >
              {/* Illustration box — flush against the card edge */}
              <div className="relative flex-shrink-0 w-[38%] sm:w-[36%]" style={{ backgroundColor: service.bg }}>
                <Image
                  src={service.image}
                  alt={t(`items.${service.key}.title`)}
                  fill
                  className="object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 flex flex-col justify-center px-4 sm:px-6">
                <h3
                  className="text-base sm:text-lg md:text-xl font-semibold text-[#0f1729] mb-1"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {t(`items.${service.key}.title`)}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {t(`items.${service.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-out rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div
              className="relative h-56 md:h-64 w-full rounded-t-3xl"
              style={{ backgroundColor: services[selectedService].bg }}
            >
              <Image
                src={services[selectedService].image}
                alt={t(`items.${services[selectedService].key}.title`)}
                fill
                className="object-contain p-6"
              />

              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2
                  className="text-3xl md:text-4xl font-semibold text-[#0f1729]"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {t(`items.${services[selectedService].key}.title`)}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t("aboutTitle")}
              </h3>
              <p className="text-gray-700 leading-relaxed text-base mb-6">
                {t(`items.${services[selectedService].key}.description`)}
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t("offerTitle")}
              </h3>
              <ul className="space-y-2 text-gray-700 mb-6">
                {FEATURE_KEYS.map((fk) => (
                  <li key={fk} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" />
                    <span>{t(`features.${fk}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href="https://play.google.com/store/apps/details?id=pk.ustaz.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#db4b0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#c24309] transition-colors duration-200 shadow-md hover:shadow-lg text-center"
                >
                  {t("playStoreCta")}
                </a>
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
