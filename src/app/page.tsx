"use client";

import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChooseUs from "./components/WhyChooseUs";
import FAQ from "./components/Faq";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useTranslations } from "next-intl";
import { supabase } from "../../client/supabaseClient";

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
   const { isSignedIn } = useUser();

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
    <section dir="ltr" className="w-full h-[300px] md:h-screen relative">
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
          
            <Link
              href={isSignedIn ? "/process" : "/auth/login"}
              className="inline-block bg-white text-black px-4 py-2 sm:px-5 sm:py-3 rounded-md hover:bg-gray-200 transition"
            >
              {banners[currentIndex].button}
            </Link>
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
