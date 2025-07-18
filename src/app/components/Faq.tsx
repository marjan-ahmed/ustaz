import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

function FAQ() {
  return (
    <section className="py-16 bg-[#fcf8f5]">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-4xl font-bold text-center mb-10">Frequently Asked Questions</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger className="text-lg font-semibold text-orange-600">
              Can we register as a service provider?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, you can register as a service provider by filling up the form for becoming a provider. Just click on <Link href="/become-ustaz" className="text-orange-600 underline">Become Ustaz</Link> and complete your registration.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger className="text-lg font-semibold text-orange-600">
              What are the payment options?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              We accept payments via digital wallets like JazzCash and EasyPaisa, direct bank transfer, and hand-to-hand cash payment after service completion.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger className="text-lg font-semibold text-orange-600">
              How to book a service?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Simply select the service, choose your preferred time slot, fill in your contact details, and confirm the booking through our website or app.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

export default FAQ;
