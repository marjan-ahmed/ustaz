import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { useTranslations } from "next-intl";

function FAQ() {
  const t = useTranslations("faqs");

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left Column - Heading */}
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#db4b0d]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">FAQs</span>
            </div>
            <h2 className="text-4xl md:text-5xl leading-none lg:text-6xl font-bold text-gray-900" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
              Frequently Asked<br />Questions
            </h2>
            <p className="mt-6 text-gray-600 text-sm sm:text-md max-w-md">
              Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="faq-1" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  {t("q1")}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  {t("ans1")}{" "}
                  <Link href="/become-ustaz" className="text-[#db4b0d] transition-all hover:text-[#ff6b4a]">
                    Become Ustaz
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  {t("q2")}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  {t("ans2")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  {t("q3")}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  {t("ans3")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  How secure is the payment system?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  We use industry-standard encryption and secure payment gateways to protect your financial information. All transactions are processed securely.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  What support is available if I need help?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  Our customer support team is available 24/7 to assist you. You can reach us through the app, email, or phone for any queries or issues.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6" className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-5 hover:text-[#db4b0d] transition-colors">
                  Can I cancel or reschedule a service?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base pb-5">
                  Yes, you can cancel or reschedule services through the app. Please check our cancellation policy for specific terms and any applicable fees.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
      </div>
    </section>
  );
}

export default FAQ;