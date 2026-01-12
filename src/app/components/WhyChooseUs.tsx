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
    <section className="py-16 bg-gradient-to-b from-white to-amber-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-orange-800 uppercase tracking-wider">
              Why Choose Us
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-900 via-amber-800 to-yellow-700 bg-clip-text text-transparent mb-6">
            {t("heading")}
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-12">
            {t("intro")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex items-start space-x-4 p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-3 rounded-full group-hover:from-orange-200 group-hover:to-amber-200 transition-colors">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-xl text-orange-800 mb-2 group-hover:text-orange-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
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
