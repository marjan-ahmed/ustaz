'use client';

import React from "react";
import { Bolt, Wrench, ThumbsUp, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import Image from "next/image";

function WhyChooseUs() {
  const t = useTranslations("WhyChooseUs");

  const content = [
    {
      title: t("instantAccessTitle"),
      description: t("instantAccessDesc"),
      content: (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg p-8">
          <div className="text-center">
            <Bolt className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Instant Access</h3>
          </div>
        </div>
      ),
    },
    {
      title: t("verifiedProfessionalsTitle"),
      description: t("verifiedProfessionalsDesc"),
      content: (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
          <div className="relative h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Wrench className="h-32 w-32 text-white/20 absolute" />
            <div className="text-center text-white z-10">
              <ThumbsUp className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">Verified Experts</h3>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("easyBookingTitle"),
      description: t("easyBookingDesc"),
      content: (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg p-8">
          <div className="text-center">
            <ThumbsUp className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Easy Booking</h3>
          </div>
        </div>
      ),
    },
    {
      title: t("timeSavingTitle"),
      description: t("timeSavingDesc"),
      content: (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg p-8">
          <div className="text-center">
            <Clock className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Time Saving</h3>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-1">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
            {t("heading")}
          </h2>

          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto mb-12">
            {t("intro")}
          </p>
        </div>

        <div className="w-full">
          <StickyScroll content={content} />
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
