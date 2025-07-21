import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { useTranslations } from "next-intl";

function FAQ() {
  const t = useTranslations("faqs");

  return (
    <section className="py-16 bg-[#fcf8f5]">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">
          {t("heading")}
        </h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger className="text-sm sm:text-lg font-semibold text-orange-600">
              {t("q1")}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-sm sm:text-lg">
              {t("ans1")}{" "}
              <Link href="/become-ustaz" className="text-orange-600 underline">
                Become Ustaz
              </Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger className="text-sm sm:text-lg font-semibold text-orange-600">
              {t("q2")}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-sm sm:text-lg">
              {t("ans2")}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger className="text-sm sm:text-lg font-semibold text-orange-600">
              {t("q3")}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-sm sm:text-lg">
              {t("ans3")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

export default FAQ;
