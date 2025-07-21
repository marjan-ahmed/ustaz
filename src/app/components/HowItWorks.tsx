import React from "react";
import { ClipboardList, PhoneCall, Wrench, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      icon: <ClipboardList className="h-6 w-6 text-white" />,
      title: t("chooseTitle"),
      description: t("chooseDesc"),
    },
    {
      icon: <PhoneCall className="h-6 w-6 text-white" />,
      title: t("bookTitle"),
      description: t("bookDesc"),
    },
    {
      icon: <Wrench className="h-6 w-6 text-white" />,
      title: t("getTitle"),
      description: t("getDesc"),
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      title: t("completeTitle"),
      description: t("completeDesc"),
    },
  ];

  return (
    <section className="py-16 bg-[#fcf8f5]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12">
          {t('howItWorks')}
        </h2>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center flex-wrap md:flex-nowrap gap-8 md:gap-12">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center max-w-[200px]">
                  <div className="bg-orange-600 rounded-full p-4 shadow-md">
                    {step.icon}
                  </div>
                  <h3 className="mt-3 font-bold text-orange-600">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>

                {index !== steps.length - 1 && (
                  <div className="hidden md:block w-24 h-1 bg-orange-300 rounded"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
