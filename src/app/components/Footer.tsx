"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative bg-[#0f1729] text-gray-300 py-16 overflow-hidden">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#db4b0d 1px, transparent 1px), linear-gradient(90deg, #db4b0d 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
          
          {/* Platform */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/process" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/become-ustaz" className="hover:text-white transition-colors">Become Provider</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/services/electrical" className="hover:text-white transition-colors">Electrical</Link></li>
              <li><Link href="/services/plumbing" className="hover:text-white transition-colors">Plumbing</Link></li>
              <li><Link href="/services/carpentry" className="hover:text-white transition-colors">Carpentry</Link></li>
              <li><Link href="/services/ac-repair" className="hover:text-white transition-colors">AC Repair</Link></li>
              <li><Link href="/services/all" className="hover:text-white transition-colors">View All</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="https://www.facebook.com/profile.php?id=61574423382909" target="_blank" className="hover:text-white transition-colors">Facebook</Link></li>
              <li><Link href="https://instagram.com/m.marjan.ahmed" target="_blank" className="hover:text-white transition-colors">Instagram</Link></li>
              <li><Link href="https://x.com/@m_marjanahmed" target="_blank" className="hover:text-white transition-colors">Twitter</Link></li>
              <li><Link href="https://linkedin.com" target="_blank" className="hover:text-white transition-colors">LinkedIn</Link></li>
            </ul>
          </div>
        </div>

        {/* Large Logo Section */}
        <div className="relative mt-16 mb-8 overflow-hidden">
          {/* Grid Overlay for Logo */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(#db4b0d 1px, transparent 1px), linear-gradient(90deg, #db4b0d 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          
          {/* Large Text Logo */}
          <div className="relative px-4">
            <h2 className="text-[95px] sm:text-[120px] md:text-[160px] lg:text-[200px] xl:text-[280px] font-bold text-gray-200 leading-none text-center select-none break-words"
                style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
              USTAZ
            </h2>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Ustaz. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;