import React from 'react';
import Head from 'next/head';
import { FaTools, FaBolt, FaWater, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';

function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us | Ustaz</title>
      </Head>

      <div className="min-h-screen bg-orange-50 text-gray-800">

        {/* Hero/Header */}
        <div className="bg-[#db4b0d] py-12 px-6 text-white text-center shadow-md">
          <h1 className="text-4xl font-bold">About Ustaz</h1>
          <p className="mt-2 text-lg">Your trusted home service provider</p>
        </div>

        {/* Who We Are */}
        <section className="max-w-6xl mx-auto py-12 px-6 grid md:grid-cols-2 gap-10 items-center">
          <Image
            src="https://images.pexels.com/photos/6914343/pexels-photo-6914343.jpeg"
            alt="Our Team"
            width={500}
            height={500}
            className="rounded-xl shadow-lg w-full"
          />
          <div>
            <h2 className="text-3xl font-semibold text-[#db4b0d] mb-4">Who We Are</h2>
            <p className="text-lg leading-relaxed">
              Ustaz is a trusted service provider offering a wide range of home services including plumbing, electrical, handyman, and more. 
              We are committed to bringing reliability, affordability, and speed to every doorstep.
            </p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="bg-white py-12 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Our Mission",
                desc: "To simplify home repairs by connecting you with skilled, verified service professionals.",
              },
              {
                title: "Our Vision",
                desc: "To become Pakistan's most reliable digital home service platform.",
              },
              {
                title: "Our Values",
                desc: "Honesty, Punctuality, Skill, and Customer Satisfaction above all.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-orange-100 rounded-xl shadow-md p-6 hover:scale-105 transition"
              >
                <h3 className="text-xl font-bold text-[#db4b0d] mb-2">
                  {item.title}
                </h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center py-10 bg-[#db4b0d] text-white px-6">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-lg mb-6">Call or WhatsApp us anytime</p>
          <a
            href="https://wa.me/923051126649"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#db4b0d] px-6 py-3 rounded-full font-semibold shadow hover:bg-orange-100 transition"
          >
            <FaPhoneAlt />
            Chat on WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}

export default AboutUs;
