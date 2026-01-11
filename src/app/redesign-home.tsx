"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSupabaseUser } from "../hooks/useSupabaseUser";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChooseUs from "./components/WhyChooseUs";
import FAQ from "./components/Faq";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useTranslations } from "next-intl";
import { supabase } from "../../client/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Clock,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Wrench,
  Droplets,
  Hammer,
  Wind,
  Sun
} from "lucide-react";
import Link from "next/link";
import InstallPWAPopup from "./components/InstallPWAPopup";

// Service type icons
const serviceIcons = {
  "Electrician Service": <Wrench className="w-8 h-8" />,
  "Plumbing": <Droplets className="w-8 h-8" />,
  "Carpentry": <Hammer className="w-8 h-8" />,
  "AC Maintenance": <Wind className="w-8 h-8" />,
  "Solar Technician": <Sun className="w-8 h-8" />,
};

export default function RedesignHome() {
  const t = useTranslations('hero');
  const { isSignedIn } = useSupabaseUser();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Service types with detailed information
  const serviceTypes = [
    {
      title: "Electrician Service",
      description: "Professional electrical repairs, installations, and maintenance",
      icon: serviceIcons["Electrician Service"],
      providers: "50+ certified electricians",
      avgRating: 4.8
    },
    {
      title: "Plumbing",
      description: "Leak repairs, pipe installations, and drainage solutions",
      icon: serviceIcons["Plumbing"],
      providers: "45+ licensed plumbers",
      avgRating: 4.7
    },
    {
      title: "Carpentry",
      description: "Furniture assembly, repairs, and custom woodwork",
      icon: serviceIcons["Carpentry"],
      providers: "30+ skilled carpenters",
      avgRating: 4.9
    },
    {
      title: "AC Maintenance",
      description: "Installation, repair, and maintenance of air conditioning systems",
      icon: serviceIcons["AC Maintenance"],
      providers: "40+ AC specialists",
      avgRating: 4.6
    },
    {
      title: "Solar Technician",
      description: "Solar panel installation and maintenance services",
      icon: serviceIcons["Solar Technician"],
      providers: "20+ certified solar techs",
      avgRating: 4.9
    }
  ];

  // Stats data
  const stats = [
    { value: "10K+", label: "Happy Customers" },
    { value: "500+", label: "Verified Providers" },
    { value: "24/7", label: "Support Available" },
    { value: "99.9%", label: "Satisfaction Rate" }
  ];

  // Features data
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Verified Professionals",
      description: "All our service providers are background checked and certified"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Quick Response",
      description: "Get matched with a provider within minutes of requesting"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Quality Guaranteed",
      description: "Satisfaction guarantee or your money back"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Local Experts",
      description: "Connect with service providers in your neighborhood"
    }
  ];

  // Handle Supabase OAuth redirect
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error("OAuth login error:", error.message);
        }
        window.history.replaceState({}, document.title, "/");
      }
    };
    handleOAuthRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />
      <InstallPWAPopup />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-orange-900/20 z-0"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Trusted by 10,000+ customers
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Find Trusted <span className="text-amber-600">Service Professionals</span> in Minutes
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl">
                Connect with verified electricians, plumbers, carpenters, and other service providers in your area. Fast, reliable, and professional service at your fingertips.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-xl"
                >
                  <Link href="/process">
                    Find a Service Provider
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-4 text-lg rounded-xl"
                >
                  How It Works
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-amber-200 border-2 border-white"
                      />
                    ))}
                  </div>
                  <span className="ml-3 text-sm text-gray-600">Join 5000+ satisfied customers</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"
                  alt="Service professional at work"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Verified</p>
                    <p className="text-sm text-gray-600">Background checked</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-amber-600 text-white p-6 rounded-xl shadow-lg">
                <div className="text-2xl font-bold">4.8★</div>
                <p className="text-amber-100">Average rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Services You Can Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our verified network of skilled professionals for all your home service needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceTypes.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-3 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{service.providers}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="text-sm font-medium">{service.avgRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-amber-600 hover:bg-amber-700">
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Service Platform
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We've redefined how customers connect with service professionals, making it easier, safer, and more reliable than ever before.
              </p>

              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&auto=format&fit=crop"
                  alt="Service platform interface"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Our Service Platform Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting you with the right professional has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-amber-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Request Service</h3>
              <p className="text-gray-600">
                Describe your service needs and location. We'll match you with the best available professionals in your area.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-amber-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Matched</h3>
              <p className="text-gray-600">
                Receive bids from qualified professionals with verified credentials, ratings, and availability.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-amber-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get It Done</h3>
              <p className="text-gray-600">
                Meet your professional, get the job done, and rate your experience to help others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="p-6 border-0 bg-gray-50">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "The electrician arrived on time and fixed my issue quickly. The app made it so easy to find a reliable professional."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-amber-800">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">John Doe</div>
                    <div className="text-sm text-gray-600">Plumbing Service</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Your Service Done?
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have found reliable service professionals through our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl"
            >
              <Link href="/process">
                Find a Service Provider
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}