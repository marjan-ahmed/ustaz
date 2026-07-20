"use client";

import Image from "next/image";
import { BsLightningChargeFill } from "react-icons/bs";
import { ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pb-4 px-4 pt-15 md:pt-0 md:pb-16 md:px-8 bg-gray-50">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Left Card - Find Ustaz */}
        <div className="md:col-span-2 bg-[#FFF7ED] rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 hover:shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col justify-between">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 font-medium w-fit mb-8 sm:mb-10 md:mb-12">
            <span className="w-1 h-1 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></span>
            <div className="flex items-center gap-1">
              Need an instant service <BsLightningChargeFill />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-start md:justify-center z-10">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#0f1729] mb-6 leading-[0.95] md:-mt-20 lg:-mt-42"
              style={{ fontFamily: "Clash Grotesk, sans-serif" }}
            >
              Find{" "}
              <span className="bg-[#0f1729] text-white px-3 py-1 rounded-lg inline-block">
                trusted
              </span>{" "}
              professionals
              <br />
              <span className="text-[#db4b0d]">near you</span>
            </h1>

            <p className="text-sm sm:text-md md:text-lg leading-relaxed text-gray-700 mb-8 max-w-xl">
              Connect with verified service providers for all your needs. From
              repairs to installations, get instant quotes and book appointments.
            </p>

            <a
              href="https://play.google.com/store/apps/details?id=pk.ustaz.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="bg-[#0f1729] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#1a2440] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-100 w-fit group z-10">
                Coming Soon
                <ArrowUpRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </a>
          </div>

          {/* Illustration */}
          <div className="absolute bottom-[-50px] right-0 w-[280px] h-[280px] md:w-[350px] md:h-[350px] lg:w-[420px] lg:h-[420px] transition-all duration-300 pointer-events-none">
            <Image
              src="/images/image-final-illustration.png"
              alt="Service marketplace illustration"
              width={420}
              height={420}
              className="w-full h-full object-contain object-bottom"
            />
          </div>
        </div>

        {/* Right Column - Two Stacked Cards */}
        <div className="md:col-span-1 grid grid-cols-1 gap-3">
          {/* Top Right Card - Get Help On Demand */}
          <div className="bg-gradient-to-br from-[#db4b0d] to-[#a03d0a] rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-7 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden h-[280px] sm:h-[320px] md:h-[360px] flex flex-col justify-between">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 right-5 w-24 h-24 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-5 left-5 w-16 h-16 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <h3
                className="text-2xl md:text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                Get help
                <br />
                <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                  on demand
                </span>
              </h3>

              <p className="text-white/80 text-sm mb-4">
                Connect instantly with nearby pros
              </p>
            </div>

            {/* Chart/Graph visual */}
            <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
              <div className="flex items-end justify-between h-20 gap-2">
                <div
                  className="flex-1 bg-white/40 rounded-t-lg"
                  style={{ height: "40%" }}
                ></div>
                <div
                  className="flex-1 bg-white/60 rounded-t-lg"
                  style={{ height: "60%" }}
                ></div>
                <div
                  className="flex-1 bg-white/50 rounded-t-lg"
                  style={{ height: "45%" }}
                ></div>
                <div
                  className="flex-1 bg-white/80 rounded-t-lg"
                  style={{ height: "85%" }}
                ></div>
                <div
                  className="flex-1 bg-yellow-300 rounded-t-lg relative"
                  style={{ height: "100%" }}
                >
                  <span className="absolute -top-6 -right-2 text-yellow-300 font-bold text-sm">
                    +85%
                  </span>
                </div>
              </div>
              {/* Upward trend line */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 80"
                preserveAspectRatio="none"
              >
                <polyline
                  points="10,60 50,45 90,50 130,25 170,10"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>

          {/* Bottom Right Card - Download App */}
          <div className="bg-[#0f1729] rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-7 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden h-[200px] sm:h-[220px] md:h-[240px] flex flex-col justify-between">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-22 bg-[#db4b0d] rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10">
              <h3
                className="text-2xl md:text-3xl font-bold text-white mb-3"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                Coming Soon
              </h3>

              <p className="text-white/70 text-sm mb-2">
                Launching on{" "}
                <span className="bg-white/20 px-2 py-0.5 rounded">
                  Google Play
                </span>
              </p>
            </div>

            {/* Google Play Badge */}
            <div className="relative z-10 flex items-center gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=pk.ustaz.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302L15.395 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
                  </svg>
                  <div>
                    <div className="text-[8px] text-white/70 leading-none">
                      COMING SOON ON
                    </div>
                    <div className="text-sm font-semibold text-white leading-tight">
                      Google Play
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Arrow icon */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-9 h-9 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
