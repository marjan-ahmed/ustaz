"use client";

import Image from "next/image";
import Link from "next/link";
import { HiBars3BottomRight } from "react-icons/hi2";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Become Ustaz", href: "/become-ustaz" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { isSignedIn } = useUser();
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setLanguage(selected);
    localStorage.setItem("language", selected);
    // optional: reload or update text direction
    // window.location.reload(); 
  };

  return (
    <header className="w-full bg-white shadow">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6">
        {/* Left: Logo */}
        <div className="flex items-center h-20">
          <Link href="/">
            <Image
              src="/ustaz_logo.png"
              width={118}
              height={118}
              alt="Ustaz Logo"
              className="w-25 h-25 object-contain"
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-gray-700 hover:text-[#db4b0d] transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Language Selector */}
       {/* <LanguageSwitcher /> */}

          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-[#db4b0d] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="ml-4 px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav Button */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="text-3xl text-gray-700 focus:outline-none"
                aria-label="Open menu"
              >
                <HiBars3BottomRight />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6 p-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Language Selector Mobile */}
             <LanguageSwitcher />

              {isSignedIn ? (
                <UserButton />
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
