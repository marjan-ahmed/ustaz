import React from 'react';
import Head from 'next/head';
import { FaTools, FaBolt, FaWater, FaPhoneAlt, FaMapMarkerAlt, FaStar, FaShieldAlt, FaUsers, FaClock, FaHandshake, FaLightbulb, FaHeart, FaQuoteLeft } from 'react-icons/fa';
import Image from 'next/image';

function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us | Ustaz</title>
        <meta name="description" content="Learn more about Ustaz, your trusted partner for home repairs in Pakistan. We offer reliable plumbing, electrical, handyman, and AC mechanic services." />
      </Head>

      <div className="min-h-screen bg-orange-50 text-gray-800">

        {/* Hero/Header */}
        <div className="bg-[#db4b0d] py-16 px-6 text-white text-center shadow-md">
          <h1 className="text-4xl font-extrabold leading-tight">About Ustaz: Your Home Service Experts</h1>
          <p className="mt-4 text-3x1">Bringing reliability, affordability, and speed to every doorstep in Pakistan.</p>
        </div>

        {/* Who We Are */}
        <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-12 items-center">
          <img
            src="/about-team.avif"
            alt="Ustaz Team Working"
            className="rounded-2xl shadow-xl w-full h-auto object-cover"
          />
          <div>
            <h2 className="text-4xl font-bold text-[#db4b0d] mb-6">Who We Are</h2>
            <p className="text-lg leading-relaxed mb-4">
              Ustaz simplifies home repairs by connecting you with **skilled, verified, and trustworthy professionals**. We're dedicated to bringing quality service right to your doorstep, making home maintenance hassle-free.
            </p>
            <p className="text-lg leading-relaxed">
              Founded to transform home services in Pakistan, we aim to set new standards for excellence, transparency, and customer satisfaction. We empower local communities by creating fair opportunities for skilled workers and offering unparalleled convenience for homeowners.
            </p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="bg-white py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaHandshake size={30} />,
                title: "Our Mission",
                desc: "To simplify home repairs, connecting you with verified professionals efficiently and affordably."
              },
              {
                icon: <FaLightbulb size={30} />,
                title: "Our Vision",
                desc: "To be Pakistan's leading digital home service platform, known for quality, speed, and customer satisfaction."
              },
              {
                icon: <FaHeart size={30} />,
                title: "Our Core Values",
                desc: "Honesty, Punctuality, Skill, and unwavering Customer Satisfaction are at the heart of everything we do."
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-orange-100 rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col items-center text-center border-b-4 border-[#db4b0d]"
              >
                <div className="text-[#db4b0d] mb-4 text-5xl">{item.icon}</div>
                <h3 className="text-2xl font-bold text-[#db4b0d] mb-4">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#db4b0d] mb-10">Why Choose Ustaz?</h2>
            <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-8">
              {[
                { icon: <FaShieldAlt size={40} />, title: "Verified Professionals", desc: "Every service provider is thoroughly vetted for your peace of mind." },
                { icon: <FaClock size={40} />, title: "Fast & Reliable Service", desc: "We pride ourselves on quick response times and efficient, high-quality work." },
                { icon: <FaStar size={40} />, title: "Transparent Pricing", desc: "No hidden fees. You'll know the cost upfront." },
                { icon: <FaUsers size={40} />, title: "Customer Satisfaction", desc: "Your happiness is our priority. We go the extra mile." },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white shadow-lg p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#db4b0d] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="text-[#db4b0d] mb-4 text-5xl transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="bg-white py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#db4b0d] mb-10">Meet Our Team</h2>
            <p className="text-lg mb-8">Behind Ustaz is a dedicated team committed to excellence and your satisfaction.</p>
            <div className="flex flex-col items-center gap-8">
              {/* Founder - Highlighted */}
              <div className="bg-[#db4b0d] text-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300 max-w-lg w-full relative overflow-hidden ring-4 ring-[#db4b0d] ring-offset-4 ring-offset-orange-50">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent to-black opacity-10 rounded-3xl"></div>
                <img src="/masood-member.jpeg" alt="Jane Doe - CEO & Founder" className="w-40 h-40 rounded-full object-cover mb-6 border-6 border-white shadow-lg ring ring-white ring-offset-2 ring-offset-[#db4b0d]" />
                <h3 className="text-3xl font-bold mb-2">Masood Alam</h3>
                <p className="text-xl opacity-90 mb-4">Founder & Leader</p>
                <p className="text-base leading-relaxed">Our visionary leader who founded Ustaz with a passion for transforming home services and empowering communities.</p>
              </div>

              {/* Other Team Members */}
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Example Team Member 2 */}
                <div className="bg-orange-100 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transform hover:translate-y-[-10px] transition-transform duration-300 border-b-4 border-[#db4b0d]">
                  <img src="/marjan-member.jpeg" alt="Team Member 2" className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-[#db4b0d]" />
                  <h3 className="text-xl font-semibold text-gray-800">Marjan Ahmed</h3>
                  <p className="text-[#db4b0d] mb-2">CEO</p>
                  <p className="text-sm text-gray-600">Ensuring seamless service delivery and operational efficiency for all our clients.</p>
                </div>
                {/* Example Team Member 3 */}
                <div className="bg-orange-100 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transform hover:translate-y-[-10px] transition-transform duration-300 border-b-4 border-[#db4b0d]">
                  <img src="/sufyan-member.jpg" alt="Team Member 3" className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-[#db4b0d]" />
                  <h3 className="text-xl font-semibold text-gray-800">Sufyan Ahmed</h3>
                  <p className="text-[#db4b0d] mb-2">Head of Operations & Social Media Handler</p>
                  <p className="text-sm text-gray-600">Dedicated to ensuring every customer has a positive and satisfying experience.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-6 bg-orange-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#db4b0d] mb-10">What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white shadow-lg p-8 rounded-2xl text-left flex flex-col justify-between border-t-8 border-[#db4b0d] relative group">
                <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 bg-[#db4b0d] p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaQuoteLeft size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex justify-center md:justify-start mb-4">
                    <FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block" />
                  </div>
                  <p className="mt-4 text-lg italic text-gray-700">"Ustaz saved the day! My plumbing issue was resolved quickly and professionally. Highly recommend their service!"</p>
                </div>
                <p className="mt-6 font-semibold text-gray-800">- Ahmed K., Karachi</p>
              </div>
              {/* Testimonial 2 */}
              <div className="bg-white shadow-lg p-8 rounded-2xl text-left flex flex-col justify-between border-t-8 border-[#db4b0d] relative group">
                <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 bg-[#db4b0d] p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaQuoteLeft size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex justify-center md:justify-start mb-4">
                    <FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block mr-1" /><FaStar className="text-yellow-500 inline-block" />
                  </div>
                  <p className="mt-4 text-lg italic text-gray-700">"The electrician was on time and fixed the wiring problem efficiently. Great communication and fair pricing."</p>
                </div>
                <p className="mt-6 font-semibold text-gray-800">- Fatima R., Lahore</p>
              </div>
              {/* Add more testimonials as needed */}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-16 bg-[#db4b0d] text-white px-6">
          <h2 className="text-4xl font-bold mb-6">Need a More Details?</h2>
          <p className="text-xl mb-8">Get expert home services details with just a tap. Contact us today!</p>
          <a
            href="https://wa.me/923051126649"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-[#db4b0d] px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-orange-100 transform hover:scale-105 transition-transform duration-300"
          >
            <FaPhoneAlt />
            Chat with Us on WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}

export default AboutUs;