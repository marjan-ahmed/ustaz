"use client";

import Image from "next/image";
import Link from "next/link";
import { HiBars3BottomRight } from "react-icons/hi2";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function Header() {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLanguage(savedLang);
  }, []);

  const navItems = [
    { label: t("home"), href: "/" },
    { label: t("becomeUstaz"), href: "/become-ustaz" },
    { label: t("about"), href: "/about" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    <header className="w-full bg-white shadow">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6">
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

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-700 hover:text-[#db4b0d] transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-gray-700 cursor-pointer hover:text-[#db4b0d] transition-colors focus:outline-none">
                    {t("login")}
                  </button>
                </SheetTrigger>
                <SheetContent side="top" className="h-screen flex flex-col p-4 sm:p-6 md:p-8">
                  <SheetHeader className="pb-4 border-b border-gray-200">
                    <SheetTitle className="text-2xl font-bold text-gray-800">{t("login")} to Your Account</SheetTitle>
                    <SheetDescription className="text-gray-600">
                      Enter your credentials to access the Ustaz dashboard.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto pt-4 flex items-center justify-center">
                    <SignIn />
                  </div>
                </SheetContent>
              </Sheet>
              <LanguageSwitcher />

              <Link
                href="/auth/register"
                className="ml-4 px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="text-3xl text-gray-700 focus:outline-none" aria-label="Open menu">
                <HiBars3BottomRight />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6 p-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <LanguageSwitcher />

              {isSignedIn ? (
                <UserButton />
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors w-full text-left"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
                  >
                    {t("getStarted")}
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
