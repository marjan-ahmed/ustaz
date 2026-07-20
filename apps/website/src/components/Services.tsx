"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Zap, Droplets, Hammer, Wind, Sun, X, Check, ArrowRight } from "lucide-react";

const services = [
  {
    title: "Electrical Work",
    description:
      "Expert electricians for wiring, installations, repairs, and maintenance. Licensed and insured professionals.",
    image: "/images/services/electrician.png",
    icon: <Zap className="w-6 h-6" />,
    color: "#F59E0B",
  },
  {
    title: "Plumbing",
    description:
      "Professional plumbing services — leak repairs, pipe installation, drain cleaning, and emergency fixes.",
    image: "/images/services/plumber.png",
    icon: <Droplets className="w-6 h-6" />,
    color: "#3B82F6",
  },
  {
    title: "Carpentry",
    description:
      "Custom woodwork, furniture repair, door/window installation, and home carpentry solutions.",
    image: "/images/services/carpenter.png",
    icon: <Hammer className="w-6 h-6" />,
    color: "#8B5CF6",
  },
  {
    title: "AC Repair",
    description:
      "Complete AC installation, servicing, gas refilling, and repair by certified technicians.",
    image:
      "https://images.unsplash.com/photo-1631545806609-9ba21b177bdb?w=600&auto=format&fit=crop&q=60",
    icon: <Wind className="w-6 h-6" />,
    color: "#06B6D4",
  },
  {
    title: "Solar Installation",
    description:
      "Professional solar panel installation, maintenance, and energy solutions for your home.",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=60",
    icon: <Sun className="w-6 h-6" />,
    color: "#F97316",
  },
];

const features = [
  "Professional and certified service providers",
  "Quick response time and flexible scheduling",
  "Quality workmanship with warranty coverage",
  "Transparent pricing and instant quotes",
];

export default function Services() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  useEffect(() => {
    if (selectedService !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedService]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-3"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            Our Services
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Professional services delivered by verified experts
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 justify-items-center">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white overflow-hidden transition-all duration-300 w-full h-[320px] sm:h-[380px] md:h-[420px] max-w-full sm:max-w-sm cursor-pointer"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedService(index)}
              style={{
                boxShadow:
                  hoveredCard === index
                    ? "0 10px 30px rgba(0, 0, 0, 0.08)"
                    : "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Full Bleed Image Background */}
              <div className="absolute inset-0">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
                  }}
                />
              </div>

              {/* Brand Overlay on Hover */}
              <div
                className="absolute inset-0 bg-[#db4b0d] transition-opacity duration-500"
                style={{ opacity: hoveredCard === index ? 0.2 : 0 }}
              />

              {/* Blur Background for Text */}
              <div
                className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 md:h-56 bg-gradient-to-t from-black/40 via-black/10 to-transparent backdrop-blur-lg"
                style={{
                  maskImage:
                    "linear-gradient(to top, black 30%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 30%, transparent 100%)",
                }}
              />

              {/* Content Overlay at Bottom */}
              <div
                className="absolute bottom-[-30px] sm:bottom-[-20px] md:bottom-[-10px] left-0 right-0 px-4 sm:px-5 md:px-6 pb-2 sm:pb-3 transition-all duration-500 ease-out"
                style={{
                  transform:
                    hoveredCard === index
                      ? "translateY(-30px)"
                      : "translateY(0)",
                }}
              >
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${service.color}20` }}
                  >
                    <div style={{ color: service.color }}>{service.icon}</div>
                  </div>
                </div>
                <h3
                  className="text-xl md:text-2xl font-semibold text-white mb-1 sm:mb-2 leading-tight drop-shadow-lg"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed drop-shadow-md line-clamp-1 text-white">
                  {service.description}
                </p>

                {/* Learn More Link */}
                <div
                  className="mt-3 transition-all duration-300"
                  style={{
                    opacity: hoveredCard === index ? 1 : 0,
                    transform:
                      hoveredCard === index
                        ? "translateY(0)"
                        : "translateY(10px)",
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-white text-sm font-medium">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-64 w-full">
              <Image
                src={services[selectedService].image}
                alt={services[selectedService].title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2
                  className="text-3xl md:text-4xl font-semibold text-white drop-shadow-lg"
                  style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                >
                  {services[selectedService].title}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                About This Service
              </h3>
              <p className="text-gray-700 leading-relaxed text-base mb-6">
                {services[selectedService].description}
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What We Offer
              </h3>
              <ul className="space-y-2 text-gray-700 mb-6">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href="https://play.google.com/store/apps/details?id=pk.ustaz.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#db4b0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#c24309] transition-colors duration-200 shadow-md hover:shadow-lg text-center"
                >
                  Coming Soon on Play Store
                </a>
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
