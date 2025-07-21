import React from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="bg-gray-50">

      {/* Header Title */}
      <div className="text-center py-10 bg-[#db4b0d] text-white">
        <h1 className="text-4xl font-bold">Contact Ustaz</h1>
        <p className="mt-4 max-w-xl mx-auto text-white">
          We’re ready to assist you with your service needs—reach out anytime.
        </p>
      </div>

      {/* Banner Image with Your Overlay Color */}
      <div className="w-full h-[300px] md:h-[500px] relative mb-12">
        <img
          src="https://images.pexels.com/photos/4345107/pexels-photo-4345107.jpeg"
          alt="Contact Banner"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex justify-center items-center"
          style={{ backgroundColor: "rgba(150, 60, 13, 0.4)" }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center px-4">
            Get in Touch — Your Solution is Just a Message Away
          </h2>
        </div>
      </div>

      {/* Contact Details */}
      <div className="max-w-2xl mx-auto space-y-6 text-center px-4">
        <div className="flex flex-col gap-4 items-center">
          <div className="flex items-center gap-3 text-gray-800">
            <Phone size={20} /> +92 305 1126649
          </div>
          <div className="flex items-center gap-3 text-gray-800">
            <Mail size={20} /> marjanahmed.dev@gmail.com
          </div>
          <div className="flex items-center gap-3 text-gray-800">
            <MapPin size={20} /> Karachi, Pakistan
          </div>
          <div className="flex gap-4 pt-4">
            <a href="#" className="text-gray-500 hover:text-orange-600"><Facebook /></a>
            <a href="#" className="text-gray-500 hover:text-orange-600"><Twitter /></a>
            <a href="#" className="text-gray-500 hover:text-orange-600"><Instagram /></a>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-center">Send Us a Message</h2>
        <form className="space-y-6">
          <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-md" />
          <input type="email" placeholder="Email Address" className="w-full p-3 border rounded-md" />
          <select className="w-full p-3 border rounded-md">
            <option>Service Inquiry</option>
            <option>Provider Registration</option>
            <option>General Question</option>
          </select>
          <textarea rows={4} placeholder="Your Message" className="w-full p-3 border rounded-md"></textarea>
          <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 transition">
            Send Message
          </button>
        </form>
      </div>

      {/* Karachi Map */}
      <div className="max-w-4xl mx-auto mt-16 px-4 pb-16">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7238.532637124123!2d67.02463595!3d24.8607341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33e8e7d34b3b9%3A0x83e0c03e0a239f87!2sKarachi%2C%20Pakistan!5e0!3m2!1sen!2s!4v1717680206791!5m2!1sen!2s"
          width="100%"
          height="350"
          className="rounded-lg border-0"
          loading="lazy"
          title="Karachi Location Map"
        ></iframe>
      </div>

    </section>
  );
}
