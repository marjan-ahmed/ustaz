import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Logo & Tagline */}
        <div>
           <Link href="/">
            <Image
              src="/ustaz_logo_dark.png"
              width={118}
              height={118}
              alt="Ustaz Logo"
              className="w-24 h-24 object-contain"
            />
          </Link>
          <p className="mt-4 text-sm">
            Your trusted digital platform for electricians, plumbers, AC repair, and solar services—all in one place.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-orange-500">Home</Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-orange-500">Services</Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-orange-500">How It Works</Link>
            </li>
            <li>
              <Link href="/become-ustaz" className="hover:text-orange-500">Become a Provider</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold text-white mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone size={16} /> +92 305 1126649</li>
            <li className="flex items-center gap-2"><Mail size={16} /> marjanahmed.dev@gmail.com</li>
            <li className="flex items-center gap-2"><MapPin size={16} /> Karachi, Pakistan</li>
          </ul>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/profile.php?id=61574423382909" className="text-gray-400 hover:text-white"><Facebook size={20} /></Link>
            <Link href="https://x.com/@m_marjanahmed" className="text-gray-400 hover:text-white"><Twitter size={20} /></Link>
            <Link href="https://instagram.com/m.marjan.ahmed" className="text-gray-400 hover:text-white"><Instagram size={20} /></Link>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Ustaz. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
