"use client";

import { useRef } from "react";
import {
  Download,
  ClipboardList,
  Wrench,
  CheckCircle,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.5", "end 0.8"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steps = [
    {
      icon: <Download className="h-12 w-12 text-orange-600" />,
      title: "Download App",
      description:
        "Get the Ustaz app from Google Play Store. Quick and easy installation.",
      bgColor: "bg-orange-50",
    },
    {
      icon: <ClipboardList className="h-12 w-12 text-blue-600" />,
      title: "Choose Service",
      description:
        "Select from electrician, plumber, carpenter, AC repair, or solar services.",
      bgColor: "bg-blue-50",
    },
    {
      icon: <Wrench className="h-12 w-12 text-green-600" />,
      title: "Get Matched",
      description:
        "We connect you with verified professionals near your location instantly.",
      bgColor: "bg-green-50",
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-purple-600" />,
      title: "Job Done",
      description:
        "Service completed, rate your experience, and enjoy hassle-free home services.",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-4"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            How It Works
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Get started in just 4 simple steps
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Animated Ribbon Path - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-full pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 300"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="ribbonGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#db4b0d" stopOpacity="0.6" />
                  <stop offset="25%" stopColor="#ff6b4a" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ff8c6a" stopOpacity="0.9" />
                  <stop offset="75%" stopColor="#ff6b4a" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#db4b0d" stopOpacity="0.6" />
                </linearGradient>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background shadow path */}
              <path
                d="M 100 20 Q 300 -20, 400 20 T 700 20 T 1000 20 L 1100 20"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Animated ribbon path */}
              <motion.path
                d="M 100 20 Q 300 -20, 400 20 T 700 20 T 1000 20 L 1100 20"
                fill="none"
                stroke="url(#ribbonGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                filter="url(#glow)"
                style={{
                  pathLength,
                }}
                initial={{ pathLength: 0 }}
              />

              {/* Shimmer overlay */}
              <motion.path
                d="M 100 20 Q 300 -20, 400 20 T 700 20 T 1000 20 L 1100 20"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                opacity="0.5"
                strokeLinecap="round"
                style={{
                  pathLength,
                }}
                initial={{ pathLength: 0 }}
              />

              {/* Moving dot */}
              <motion.circle
                cx={useTransform(scrollYProgress, [0, 1], [100, 1100])}
                cy={20}
                r="12"
                fill="#fff"
                stroke="#db4b0d"
                strokeWidth="3"
                filter="url(#glow)"
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
                {/* Icon Box */}
                <div
                  className={`relative ${step.bgColor} rounded-2xl p-8 w-full aspect-square max-w-[200px] flex items-center justify-center mb-6 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-2`}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 border-2 border-current opacity-20 rounded-full"></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-2 border-current opacity-20 rounded-full"></div>

                  {/* Icon */}
                  <div className="relative z-10">{step.icon}</div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#0f1729] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Step Content */}
                <h3
                  className="text-lg md:text-xl font-bold text-[#0f1729] mb-2"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 max-w-[200px]">
                  {step.description}
                </p>

                {/* Mobile Arrow */}
                {index !== steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <ArrowDown className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <a
            href="https://play.google.com/store/apps/details?id=pk.ustaz.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="bg-[#db4b0d] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#c24309] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-2">
              Coming Soon
              <ArrowRight className="w-5 h-5" />
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
