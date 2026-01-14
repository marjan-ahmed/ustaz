"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSupabaseUser } from "../hooks/useSupabaseUser";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChooseUs from "./components/WhyChooseUs";
import FAQ from "./components/Faq";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useTranslations } from "next-intl";
import { supabase } from "../../client/supabaseClient";
import ServiceSearchBar from "./components/ServicesSearchBar";
import FindServiceBtn from "./components/FindServiceBtn";
import InstallPWAPopup from "./components/InstallPWAPopup";

export default function Home() {
  const t = useTranslations('hero')
 const banners = [
    {
      src: "https://plus.unsplash.com/premium_photo-1661908782924-de673a5c6988?q=80&w=1170&auto=format&fit=crop",
      title: t("elecTitle"),
      description: t("electDesc"),
      button: t("elecBtn"),
    },
    {
      src: "https://plus.unsplash.com/premium_photo-1663013675008-bd5a7898ac4f?w=600&auto=format&fit=crop",
      title: t("plumbTitle"),
      description: t("plumbDesc"),
      button: t("plumbBtn"),
    },
    {
      src: "https://plus.unsplash.com/premium_photo-1664300497978-49eaa30a815e?w=600&auto=format&fit=crop",
      title: t("carpTitle"),
      description: t("CarpDesc"),
      button: t("carpBtn"),
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<'find' | 'become' | null>(null);
   const { isSignedIn } = useSupabaseUser();

  // ✅ Handle Supabase OAuth redirect
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        // If using PKCE flow, exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error("OAuth login error:", error.message);
        }
        window.history.replaceState({}, document.title, "/"); // ✅ Clean up URL
      }
    };

    handleOAuthRedirect();
  }, []);

  return (
    <>
    <Header />
  <InstallPWAPopup />
    
    {/* Bento Hero Section */}
    <section className="relative w-full min-h-screen flex items-center justify-center pb-4 px-4 md:pb-8 md:px-8 bg-gray-50">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        
        {/* Main Left Card - Find Ustaz */}
        <div 
  className="md:col-span-2 bg-[#fff5e6] rounded-3xl p-8 md:p-12 hover:shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden min-h-[450px] md:min-h-[600px] flex flex-col justify-between"
>
  {/* Badge */}
  <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 font-medium w-fit mb-6">
    <span className="w-1 h-1 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></span>
    Need a quick service? 24/7
  </div>
n
  {/* Main Content */}
  <div className="flex-1 flex flex-col justify-start md:justify-center z-10">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-none md:-mt-20 lg:-mt-42" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
      Find trusted professionals
      <br />
      <span className="text-[#db4b0d]">near you</span>
    </h1>

    <p className="text-sm sm:text-md md:text-lg leading-relaxed text-gray-600 mb-8 max-w-xl">
      Connect with verified service providers for all your needs. From repairs to installations, get instant quotes and book appointments.
    </p>

    <button className="bg-gray-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-100 w-fit group z-10">
      Get started
      <svg className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </button>
  </div>

  {/* Illustration */}
          <div className="absolute bottom-[-50px] right-0 w-[280px] h-[280px] md:w-[350px] md:h-[350px] lg:w-[420px] lg:h-[420px] opacity-20 sm:opacity-100 transition-all duration-300 pointer-events-none">
            <Image 
              src="/images/hero-illustration.png" 
              alt="Service marketplace illustration" 
              width={420} 
              height={420} 
              className="w-full h-full object-cover object-bottom"
            />
          </div>
        </div>

        {/* Right Column - Two Stacked Cards */}
        <div className="md:col-span-1 grid grid-cols-1 gap-2 md:gap-4">
          
          {/* Top Right Card - Book Services */}
          <div className="bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] rounded-3xl p-6 md:p-8 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden min-h-[220px] md:min-h-[320px] flex flex-col justify-between">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 right-5 w-24 h-24 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-5 left-5 w-16 h-16 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                Book your<br />service slot
              </h3>
              
              <p className="text-white/80 text-sm mb-4">
                Schedule instantly
              </p>
            </div>

            {/* Chart/Graph visual */}
            <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-2xl p-4 mt-4">
              <div className="flex items-end justify-between h-20 gap-2">
                <div className="flex-1 bg-white/40 rounded-t-lg" style={{height: '40%'}}></div>
                <div className="flex-1 bg-white/60 rounded-t-lg" style={{height: '60%'}}></div>
                <div className="flex-1 bg-white/50 rounded-t-lg" style={{height: '45%'}}></div>
                <div className="flex-1 bg-white/80 rounded-t-lg" style={{height: '85%'}}></div>
                <div className="flex-1 bg-yellow-300 rounded-t-lg relative" style={{height: '100%'}}>
                  <span className="absolute -top-6 -right-2 text-yellow-300 font-bold text-sm">+85%</span>
                </div>
              </div>
              {/* Upward trend line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
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

          {/* Bottom Right Card - Join Platform */}
          <div className="bg-gray-900 rounded-3xl p-6 md:p-8 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden min-h-[180px] md:min-h-[240px] flex flex-col justify-between">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-22 bg-[#db4b0d] rounded-full blur-3xl opacity-20"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                Become a<br />service provider
              </h3>
              
              <p className="text-white/70 text-sm mb-4">
                Join our network
              </p>
            </div>

            {/* Avatar group and mentors */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-gray-900"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-gray-900"></div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="text-white text-sm font-medium">+500 professionals</span>
              </div>
            </div>

            {/* Arrow icon */}
            <div className="absolute bottom-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
              <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </section>

    {/* Original Carousel Section (hidden) */}
    <section dir="ltr" className="w-full h-[300px] md:h-screen relative hidden">
      <Carousel
        autoPlay
        infiniteLoop
        interval={3500}
        showThumbs={false}
        showStatus={false}
        showArrows={false}
        showIndicators={true}
        stopOnHover={true}
        swipeable
        emulateTouch
        transitionTime={700}
        className="h-full"
        selectedItem={currentIndex}
        onChange={(index) => setCurrentIndex(index)}
      >
        {banners.map((item, index) => (
          <div key={index}  className="relative w-full h-[300px] md:h-screen">
            <Image
              src={item.src}
              alt={item.title}
              fill
              priority
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "rgba(150, 60, 13, 0.4)",
              }}
            ></div>
          </div>
        ))}
      </Carousel>

      {/* Dynamic Overlay Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center md:items-start md:justify-start pt-0 md:pt-40">
        <div className="w-full px-4 md:px-8 max-w-7xl mx-auto text-center md:text-left">
          <div className="text-white  text space-y-4 transition-all duration-700">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {banners[currentIndex].title}
            </h1>
            <p className="max-w-lg text-sm sm:text-base md:text-lg mx-auto md:mx-0">
              {banners[currentIndex].description}
            </p>

            {/* <Link
              href={"/process"}
              className="inline-block bg-white text-black px-4 py-2 sm:px-5 sm:py-3 rounded-md hover:bg-gray-200 transition"
            >
              {banners[currentIndex].button}
            </Link> */}

             {/* Show on mobile only */}
      <div className="flex justify-center md:hidden">
        <FindServiceBtn />
      </div>

      {/* Show on desktop only */}
      <div className="hidden md:block">
        <ServiceSearchBar />
      </div>
          </div>
        </div>
      </div>

          </section>
          <Services />
          <HowItWorks />
          <WhyChooseUs />
          <FAQ />
          <Footer />
    </>
  );
}