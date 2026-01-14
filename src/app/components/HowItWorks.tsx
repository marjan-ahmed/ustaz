"use client";

import React from "react";
import { ClipboardList, PhoneCall, Wrench, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      icon: <ClipboardList className="h-12 w-12 text-orange-600" />,
      title: t("chooseTitle"),
      description: t("chooseDesc"),
      bgColor: "bg-orange-50",
    },
    {
      icon: <PhoneCall className="h-12 w-12 text-blue-600" />,
      title: t("bookTitle"),
      description: t("bookDesc"),
      bgColor: "bg-blue-50",
    },
    {
      icon: <Wrench className="h-12 w-12 text-green-600" />,
      title: t("getTitle"),
      description: t("getDesc"),
      bgColor: "bg-green-50",
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-purple-600" />,
      title: t("completeTitle"),
      description: t("completeDesc"),
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
            {t('howItWorks')}
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Get started in just 4 simple steps
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Dotted Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5">
            <svg className="w-full h-8" viewBox="0 0 1200 40" preserveAspectRatio="none">
              <path
                d="M 50 20 Q 300 10, 400 20 T 800 20 T 1150 20"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="8,8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center group"
              >
                {/* Illustration/Icon Box */}
                <div className={`relative ${step.bgColor} rounded-2xl p-8 w-full aspect-square max-w-[200px] flex items-center justify-center mb-6 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-2`}>
                  {/* Decorative elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 border-2 border-current opacity-20 rounded-full"></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-2 border-current opacity-20 rounded-full"></div>
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    {step.icon}
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 max-w-[200px]">
                  {step.description}
                </p>

                {/* Mobile Arrow */}
                {index !== steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <button className="bg-[#db4b0d] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#c24309] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
            Get Started Now
            <svg className="inline-block ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;