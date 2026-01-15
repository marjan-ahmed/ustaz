"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Image from "next/image";
import Link from "next/link";
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
import { BsLightningChargeFill } from "react-icons/bs";

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
  className="md:col-span-2 bg-[#FFF7ED] rounded-3xl p-8 md:p-12 hover:shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden min-h-[450px] md:min-h-[600px] flex flex-col justify-between"
>
  {/* Badge */}
  <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 font-medium w-fit mb-6">
    <span className="w-1 h-1 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></span>
    <div className="flex items-center gap-1">Need an instant service <BsLightningChargeFill /></div>
  </div>

  {/* Main Content */}
  <div className="flex-1 flex flex-col justify-start md:justify-center z-10">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-none md:-mt-20 lg:-mt-42" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
      Find <span className="bg-gray-900 text-white px-3 py-1 rounded-lg inline-block">trusted</span> professionals
      <br />
      <span className="text-[#db4b0d]">near you</span>
    </h1>

    <p className="text-sm sm:text-md md:text-lg leading-relaxed text-gray-600 mb-8 max-w-xl">
      Connect with verified service providers for all your needs. From repairs to installations, getinstant quotes and book appointments.
    </p>

    <Link href="/process">
      <button className="bg-gray-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-100 w-fit group z-10">
        Get started
        <svg className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </Link>
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
          <Link href="/process">
            <div className="bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] rounded-3xl p-6 md:p-8 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden min-h-[220px] md:min-h-[320px] flex flex-col justify-between">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-5 right-5 w-24 h-24 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-5 left-5 w-16 h-16 border-2 border-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                  Book your<br /><span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">service</span> slot
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
          </Link>

          {/* Bottom Right Card - Join Platform */}
          <Link href="/become-ustaz">
            <div className="bg-gray-900 rounded-3xl p-6 md:p-8 hover:shadow-sm transition-all duration-300 cursor-pointer group relative overflow-hidden min-h-[200px] md:min-h-[240px] flex flex-col justify-between">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-22 bg-[#db4b0d] rounded-full blur-3xl opacity-20"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                  Become a service provider
                </h3>
                
                <p className="text-white/70 text-sm mb-2">
                  Join our <span className="bg-white/20 px-2 py-0.5 rounded">network</span>
                </p>
              </div>

              {/* Avatar group and mentors */}
              <div className="relative z-10 flex items-center gap-2 flex-wrap">
                <div className="flex -space-x-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-900"></div>
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-gray-900"></div>
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-gray-900"></div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <span className="text-white text-xs md:text-sm font-medium">+500 professionals</span>
                </div>
              </div>

              {/* Arrow icon */}
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-9 h-9 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
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

          {/* Divider 1 - Flowing Liquid Morphism */}
          <div className="relative h-32 md:h-40 w-full overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            <div className="absolute inset-0">
              <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 320">
                <defs>
                  <linearGradient id="liquidGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#db4b0d" stopOpacity="0.2">
                      <animate attributeName="stopColor" values="#db4b0d; #ff6b4a; #db4b0d" dur="8s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#ff6b4a" stopOpacity="0.3">
                      <animate attributeName="stopColor" values="#ff6b4a; #db4b0d; #ff6b4a" dur="8s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                  <filter id="gooey1">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="gooey" />
                  </filter>
                </defs>
                <path d="M0,160 Q240,100 480,160 T960,160 Q1200,100 1440,160 L1440,320 L0,320 Z" fill="url(#liquidGrad1)" opacity="0.4">
                  <animate attributeName="d" dur="12s" repeatCount="indefinite" 
                    values="M0,160 Q240,100 480,160 T960,160 Q1200,100 1440,160 L1440,320 L0,320 Z;
                            M0,140 Q240,200 480,140 T960,140 Q1200,180 1440,140 L1440,320 L0,320 Z;
                            M0,160 Q240,100 480,160 T960,160 Q1200,100 1440,160 L1440,320 L0,320 Z" />
                </path>
                <path d="M0,200 Q360,140 720,200 T1440,200 L1440,320 L0,320 Z" fill="url(#liquidGrad1)" opacity="0.3">
                  <animate attributeName="d" dur="15s" repeatCount="indefinite" 
                    values="M0,200 Q360,140 720,200 T1440,200 L1440,320 L0,320 Z;
                            M0,180 Q360,240 720,180 T1440,180 L1440,320 L0,320 Z;
                            M0,200 Q360,140 720,200 T1440,200 L1440,320 L0,320 Z" />
                </path>
              </svg>
              {/* Floating particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#db4b0d] opacity-20"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: '50%',
                      animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Services />

          {/* Divider 2 - Clean Modern Separator */}
          <div className="relative py-16 md:py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
              {/* Main separator line */}
              <div className="relative flex items-center justify-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-gray-200"></div>
                
                {/* Center element */}
                <div className="px-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#db4b0d]"></div>
                    <div className="w-12 h-[2px] bg-gradient-to-r from-[#db4b0d] to-[#ff6b4a]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#ff6b4a]"></div>
                  </div>
                </div>
                
                <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-gray-200 to-gray-200"></div>
              </div>
            </div>
          </div>

          <HowItWorks />

          {/* Divider 3 - 3D Ribbon Twist */}
          <div className="relative h-32 md:h-40 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#db4b0d" />
                  <stop offset="50%" stopColor="#ff6b4a" />
                  <stop offset="100%" stopColor="#db4b0d" />
                </linearGradient>
                <linearGradient id="ribbon2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b4a" />
                  <stop offset="50%" stopColor="#ffa07a" />
                  <stop offset="100%" stopColor="#ff6b4a" />
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              {/* 3D Ribbon Effect */}
              <path d="M0,100 Q360,60 720,100 T1440,100" fill="none" stroke="url(#ribbon1)" strokeWidth="40" opacity="0.6" filter="url(#shadow)">
                <animate attributeName="d" 
                  values="M0,100 Q360,60 720,100 T1440,100;
                          M0,100 Q360,140 720,100 T1440,100;
                          M0,100 Q360,60 720,100 T1440,100" 
                  dur="6s" repeatCount="indefinite" />
              </path>
              
              <path d="M0,100 Q360,140 720,100 T1440,100" fill="none" stroke="url(#ribbon2)" strokeWidth="25" opacity="0.4">
                <animate attributeName="d" 
                  values="M0,100 Q360,140 720,100 T1440,100;
                          M0,100 Q360,60 720,100 T1440,100;
                          M0,100 Q360,140 720,100 T1440,100" 
                  dur="6s" repeatCount="indefinite" />
              </path>
            </svg>
            
            {/* Sparkle particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${i * 8 + 5}%`,
                    top: '50%',
                    boxShadow: '0 0 10px #fff, 0 0 20px #db4b0d',
                    animation: `sparkle ${2 + (i % 3)}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>

          <WhyChooseUs />

          {/* Divider 4 - Orbital System */}
          <div className="relative py-24 md:py-32 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#db4b0d 1px, transparent 1px), linear-gradient(90deg, #db4b0d 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            {/* Central orbit system */}
            <div className="relative max-w-7xl mx-auto px-4">
              <div className="relative h-48 flex items-center justify-center">
                {/* Central core */}
                <div className="absolute">
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#db4b0d] to-[#ff6b4a] shadow-2xl">
                    <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"></div>
                    <div className="absolute inset-4 rounded-full bg-white/40"></div>
                    <div className="absolute inset-0 rounded-full bg-[#db4b0d] animate-ping opacity-20"></div>
                  </div>
                </div>
                
                {/* Orbital rings */}
                {[...Array(3)].map((_, ring) => (
                  <div key={ring} className="absolute" style={{animation: `rotate ${20 + ring * 5}s linear infinite`}}>
                    <svg width={120 + ring * 80} height={120 + ring * 80} className="opacity-30">
                      <circle cx={60 + ring * 40} cy={60 + ring * 40} r={50 + ring * 40} 
                        fill="none" stroke="#db4b0d" strokeWidth="1" strokeDasharray="5,5" />
                    </svg>
                    {/* Orbiting elements */}
                    {[...Array(3 + ring)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#db4b0d] shadow-lg"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${(360 / (3 + ring)) * i}deg) translateX(${50 + ring * 40}px)`,
                          animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`
                        }}
                      />
                    ))}
                  </div>
                ))}
                
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{animation: 'rotate 30s linear infinite reverse'}}>
                  {[...Array(8)].map((_, i) => (
                    <line
                      key={i}
                      x1="50%" y1="50%"
                      x2={`${50 + Math.cos((i * Math.PI) / 4) * 30}%`}
                      y2={`${50 + Math.sin((i * Math.PI) / 4) * 30}%`}
                      stroke="#db4b0d"
                      strokeWidth="1"
                      opacity="0.1"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          <FAQ />

          {/* Divider 5 - Mountains to Footer */}
          <div className="relative w-full h-40 md:h-48 overflow-hidden bg-gradient-to-b from-white to-[#0f1729]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 320">
              <defs>
                <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a2332" />
                  <stop offset="100%" stopColor="#0f1729" />
                </linearGradient>
                <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#db4b0d" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0f1729" />
                </linearGradient>
                <linearGradient id="mountain3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b4a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f1729" />
                </linearGradient>
              </defs>
              
              {/* Back mountain */}
              <path d="M0,224 L240,160 L480,200 L720,140 L960,180 L1200,160 L1440,200 L1440,320 L0,320 Z" 
                fill="url(#mountain1)" opacity="0.5">
                <animate attributeName="d" 
                  values="M0,224 L240,160 L480,200 L720,140 L960,180 L1200,160 L1440,200 L1440,320 L0,320 Z;
                          M0,220 L240,170 L480,190 L720,150 L960,190 L1200,170 L1440,210 L1440,320 L0,320 Z;
                          M0,224 L240,160 L480,200 L720,140 L960,180 L1200,160 L1440,200 L1440,320 L0,320 Z" 
                  dur="20s" repeatCount="indefinite" />
              </path>
              
              {/* Middle mountain with accent */}
              <path d="M0,240 L360,180 L720,220 L1080,160 L1440,220 L1440,320 L0,320 Z" 
                fill="url(#mountain2)">
                <animate attributeName="d" 
                  values="M0,240 L360,180 L720,220 L1080,160 L1440,220 L1440,320 L0,320 Z;
                          M0,235 L360,190 L720,210 L1080,170 L1440,230 L1440,320 L0,320 Z;
                          M0,240 L360,180 L720,220 L1080,160 L1440,220 L1440,320 L0,320 Z" 
                  dur="15s" repeatCount="indefinite" />
              </path>
              
              {/* Front mountain */}
              <path d="M0,260 L240,220 L480,240 L720,200 L960,240 L1200,220 L1440,250 L1440,320 L0,320 Z" 
                fill="url(#mountain3)">
                <animate attributeName="d" 
                  values="M0,260 L240,220 L480,240 L720,200 L960,240 L1200,220 L1440,250 L1440,320 L0,320 Z;
                          M0,255 L240,230 L480,235 L720,210 L960,245 L1200,230 L1440,260 L1440,320 L0,320 Z;
                          M0,260 L240,220 L480,240 L720,200 L960,240 L1200,220 L1440,250 L1440,320 L0,320 Z" 
                  dur="12s" repeatCount="indefinite" />
              </path>
            </svg>
            
            {/* Stars overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 60}%`,
                    opacity: Math.random() * 0.5 + 0.3,
                    animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </div>

          <Footer />
    </>
  );
}