'use client';

import React from "react";
import { Bolt, Wrench, ThumbsUp, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

function WhyChooseUs() {
  const t = useTranslations("WhyChooseUs");

  const features = [
    {
      icon: <Bolt className="h-8 w-8 text-orange-600" />,
      title: t("instantAccessTitle"),
      description: t("instantAccessDesc"),
    },
    {
      icon: <Wrench className="h-8 w-8 text-orange-600" />,
      title: t("verifiedProfessionalsTitle"),
      description: t("verifiedProfessionalsDesc"),
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-orange-600" />,
      title: t("easyBookingTitle"),
      description: t("easyBookingDesc"),
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: t("timeSavingTitle"),
      description: t("timeSavingDesc"),
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {t("heading")}
        </h2>

        <p className="text-center text-sm sm:text-[15px] max-w-2xl mx-auto mb-10 text-gray-600">
          {t("intro")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="bg-orange-100 p-2 sm:p-3 rounded-full">{feature.icon}</div>
              <div>
                <h3 className="font-bold text-md sm:text-lg text-orange-600">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-md">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
