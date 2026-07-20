import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import AppScreenshots from "@/components/AppScreenshots";
import Testimonials from "@/components/Testimonials";
import WaitlistSection from "@/components/WaitlistSection";
import DownloadCTA from "@/components/DownloadCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <HowItWorks />
        <AppScreenshots />
        <Testimonials />
        <WaitlistSection />
        <DownloadCTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
