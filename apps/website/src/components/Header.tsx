"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import StaggeredMenu from "@/components/StaggeredMenu";

export default function Header() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#footer" },
  ];

  const staggeredMenuItems = navItems.map((item) => ({
    label: item.label,
    ariaLabel: `Go to ${item.label}`,
    link: item.href,
  }));

  const socialItems = [
    { label: "Facebook", link: "https://www.facebook.com/profile.php?id=61574423382909" },
    { label: "Instagram", link: "https://instagram.com/mmarjanahmed" },
    { label: "Twitter", link: "https://x.com/@marjan_ahmed32" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header
        className={`hidden md:flex sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 h-[53px] items-center transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
          <div className="flex items-center h-20 flex-shrink-0">
            <Link href="/">
              <Image
                src="/ustaz_logo.png"
                width={100}
                height={90}
                alt="Ustaz Logo"
                className="w-auto h-20 object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-wave-link text-[18px] tracking-tight sm:tracking-wide sm:text-[16px] lg:text-[14px] transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "text-[#db4b0d] active"
                    : "text-gray-700 hover:text-[#db4b0d]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="px-5 py-2 rounded-full bg-[#db4b0d] text-white font-semibold hover:bg-[#c24309] transition-all duration-300 shadow-md hover:shadow-lg text-sm"
            >
              Coming Soon
            </a>
          </div>
        </nav>
      </header>

      {/* Mobile Header - StaggeredMenu with isFixed handles its own full-viewport wrapper */}
      <div className="md:hidden">
        <StaggeredMenu
          position="right"
          items={staggeredMenuItems}
          socialItems={socialItems}
          displaySocials={true}
          displayItemNumbering={true}
          menuButtonColor="#0f1729"
          openMenuButtonColor="#0f1729"
          changeMenuColorOnOpen={false}
          colors={["#db4b0d", "#0f1729"]}
          logoUrl="/ustaz_logo.png"
          accentColor="#db4b0d"
          closeOnClickAway={true}
          isFixed={true}
        />
      </div>
    </>
  );
}
