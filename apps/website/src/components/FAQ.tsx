"use client";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "How do I download the Ustaz app?",
      answer:
        "You can download the Ustaz app from the Google Play Store. Simply search for 'Ustaz' and click Install. The app is free to download and use.",
    },
    {
      question: "Is the Ustaz app free to use?",
      answer:
        "Yes, the Ustaz app is completely free to download and use. You only pay for the services you book through the app. There are no hidden fees or subscriptions.",
    },
    {
      question: "Which cities does Ustaz operate in?",
      answer:
        "Currently, Ustaz operates in Karachi with plans to expand to other cities across Pakistan including Lahore, Islamabad, and Peshawar soon.",
    },
    {
      question: "How do I become a service provider?",
      answer:
        "Download the Ustaz app and tap on 'Become a Provider'. Fill out the registration form with your details and service category. Our team will verify your information and get you onboarded.",
    },
    {
      question: "What payment options are available?",
      answer:
        "We accept payments via digital wallets like JazzCash and EasyPaisa, direct bank transfer, and hand-to-hand cash payment after service completion.",
    },
    {
      question: "How can I contact customer support?",
      answer:
        "You can reach our customer support team 24/7 through the app, WhatsApp at +92 305 1126649, or email at support@ustaz.pk. We're always here to help!",
    },
  ];

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
                FAQs
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl leading-none lg:text-6xl font-bold text-[#0f1729]"
              style={{ fontFamily: "Clash Grotesk, sans-serif" }}
            >
              Frequently Asked
              <br />
              Questions
            </h2>
            <p className="mt-6 text-gray-600 text-sm sm:text-md max-w-md">
              Have questions? We&apos;ve got answers. If you can&apos;t find
              what you&apos;re looking for, feel free to contact us.
            </p>

            {/* Illustration */}
            <div className="mt-8 relative w-full h-48">
              <Image
                src="/images/404-toolbox-removebg-preview.png"
                alt="Ustaz toolbox"
                fill
                className="object-contain object-left"
              />
            </div>
          </div>

          {/* Right Column - Accordion */}
          <div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index + 1}`}
                  className="border border-gray-200 rounded-xl px-6 bg-white hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-sm font-semibold text-[#0f1729] py-5 hover:text-[#db4b0d] transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pb-5">
                    {faq.answer}
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
