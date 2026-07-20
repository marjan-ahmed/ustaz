"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Ahmed Khan",
    location: "DHA Karachi",
    rating: 5,
    text: "Ustaz made finding a reliable electrician so easy. The provider arrived on time and fixed our wiring issue quickly. Highly recommended!",
    avatar: "AK",
  },
  {
    name: "Fatima Ali",
    location: "Gulshan-e-Iqbal",
    rating: 5,
    text: "I've used Ustaz multiple times for plumbing services. Every provider has been professional and the work quality is excellent.",
    avatar: "FA",
  },
  {
    name: "Hassan Malik",
    location: "Clifton",
    rating: 5,
    text: "The AC repair service was fantastic. The technician diagnosed the problem quickly and had our AC running perfectly within an hour.",
    avatar: "HM",
  },
  {
    name: "Ayesha Siddiqui",
    location: "North Nazimabad",
    rating: 5,
    text: "Finally, a trustworthy platform for home services. The solar installation team was knowledgeable and completed the work ahead of schedule.",
    avatar: "AS",
  },
  {
    name: "Muhammad Raza",
    location: "Korangi",
    rating: 5,
    text: "Used the carpentry service for custom furniture. The craftsmanship was outstanding and the price was very reasonable.",
    avatar: "MR",
  },
  {
    name: "Sara Ahmed",
    location: "PECHS",
    rating: 5,
    text: "The app is so easy to use! I booked a plumber in minutes and he arrived within 30 minutes. Will definitely use again.",
    avatar: "SA",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-3"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Join thousands of satisfied customers across Karachi
          </p>
        </div>

        {/* Testimonials Grid - Desktop */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm md:text-base mb-6 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#db4b0d] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#0f1729] text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel - Mobile */}
        <div className="md:hidden">
          <div className="relative">
            <div className="bg-gray-50 rounded-2xl p-6">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                &ldquo;{testimonials[currentIndex].text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#db4b0d] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#0f1729] text-sm">
                    {testimonials[currentIndex].name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {testimonials[currentIndex].location}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* More Reviews - Desktop */}
        <div className="hidden md:grid grid-cols-3 gap-6 mt-6">
          {testimonials.slice(3, 6).map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm md:text-base mb-6 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#db4b0d] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#0f1729] text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
