import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page Not Found — Ustaz",
  description: "The page you're looking for doesn't exist.",
};

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <>
      <Header />
      <main className="bg-white min-h-[70vh] flex items-center">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="relative w-full h-56 sm:h-64 mx-auto mb-6">
            <Image
              src="/images/404-toolbox-removebg-preview.png"
              alt="Lost toolbox"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-[#db4b0d] text-base sm:text-sm font-semibold tracking-widest uppercase mb-2">
            {t("eyebrow")}
          </p>
          <h1
            className="text-4xl sm:text-4xl font-bold text-[#0f1729] mb-3"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            {t("title")}
          </h1>
          <p className="text-gray-600 text-base sm:text-base mb-8 max-w-md mx-auto">
            {t("body")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#db4b0d] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#c24309] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            {t("cta")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
