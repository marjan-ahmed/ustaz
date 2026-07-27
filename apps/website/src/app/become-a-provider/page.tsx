import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderPrelaunchForm from "@/components/ProviderPrelaunchForm";

export const metadata: Metadata = {
  title: "Become an Ustaz — Register as a Service Provider in Pakistan",
  description:
    "Are you an electrician, plumber, carpenter, AC technician, or solar expert? Register on Ustaz before launch and start receiving job requests from verified customers near you.",
  keywords: [
    "become a service provider Pakistan",
    "electrician jobs Karachi",
    "plumber jobs Pakistan",
    "carpenter work Karachi",
    "AC technician jobs",
    "solar technician jobs Pakistan",
    "Ustaz provider registration",
  ],
  openGraph: {
    title: "Become an Ustaz — Register as a Service Provider",
    description:
      "Register before launch and be among the first professionals to receive job requests on Ustaz.",
    url: "https://ustaz.pk/become-a-provider",
    siteName: "Ustaz",
    locale: "en_PK",
    type: "website",
  },
};

export default function BecomeAProviderPage() {
  return (
    <>
      <Header />
      <main>
        <ProviderPrelaunchForm />
      </main>
      <Footer />
    </>
  );
}
