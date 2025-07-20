import React from "react";
import { Bolt, Wrench, ThumbsUp, Clock } from "lucide-react";

function WhyChooseUs() {
  const features = [
    {
      icon: <Bolt className="h-8 w-8 text-orange-600" />,
      title: "Instant Access",
      description:
        "No need to visit shops. Find electricians, plumbers, and technicians directly through our app.",
    },
    {
      icon: <Wrench className="h-8 w-8 text-orange-600" />,
      title: "Verified Professionals",
      description:
        "We connect you only with trusted service providers so you get quality work at your doorstep.",
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-orange-600" />,
      title: "Easy Booking",
      description:
        "Choose service, select time, and confirm—all from your mobile or desktop within minutes.",
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "Time-Saving Solution",
      description:
        "Save your valuable time and effort. Let service providers come to you instead of going to them.",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose Us</h2>

        <p className="text-center text-sm sm:text-[15px] max-w-2xl mx-auto mb-10 text-gray-600">
          In the past, you had to search for electricians or plumbers by visiting shops and explaining your issue.
          Now, we’ve made it all digital. Find professionals, book instantly, and get things fixed—without leaving your home.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="bg-orange-100 p-2 sm:p-3 rounded-full">{feature.icon}</div>
              <div>
                <h3 className="font-bold text-md sm:text-lg text-orange-600">{feature.title}</h3>
                <p className="text-gray-600 text-sm sm:text-lg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
