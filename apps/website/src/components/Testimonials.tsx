"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";

const testimonials = [
  { key: "ahmed", rating: 5, avatar: "AK" },
  { key: "fatima", rating: 5, avatar: "FA" },
  { key: "hassan", rating: 5, avatar: "HM" },
] as const;

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60) goTo((index + 1) % testimonials.length);
    else if (info.offset.x > 60) goTo((index - 1 + testimonials.length) % testimonials.length);
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  const active = testimonials[index];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
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

        {/* Spotlight card — draggable, auto-rotating */}
        <div className="relative">
          <Quote className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 text-[#db4b0d]/10 pointer-events-none" />

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="relative bg-gray-50 rounded-3xl p-8 sm:p-10 md:p-12 text-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="flex justify-center gap-1 mb-5">
                  {[...Array(active.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 text-base sm:text-lg md:text-xl leading-relaxed mb-8 max-w-xl mx-auto">
                  &ldquo;{t(`items.${active.key}.text`)}&rdquo;
                </p>

                <div className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 bg-[#db4b0d] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {active.avatar}
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-[#0f1729] text-sm">
                      {t(`items.${active.key}.name`)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {t(`items.${active.key}.location`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Selector pills */}
          <div className="flex justify-center gap-2.5 mt-8">
            {testimonials.map((item, i) => (
              <button
                key={item.key}
                onClick={() => goTo(i)}
                className={`flex items-center gap-2 rounded-full ps-1.5 pe-4 py-1.5 border transition-all duration-300 ${
                  i === index
                    ? "bg-[#0f1729] border-[#0f1729]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors duration-300 ${
                    i === index ? "bg-[#db4b0d] text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.avatar}
                </span>
                <span className={`text-xs font-medium ${i === index ? "text-white" : "text-gray-500"}`}>
                  {t(`items.${item.key}.name`).split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
