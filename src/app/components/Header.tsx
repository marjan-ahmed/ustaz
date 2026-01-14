"use client";

import Image from "next/image";
import Link from "next/link";
import { RxHamburgerMenu } from "react-icons/rx";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { supabase } from "../../../client/supabaseClient";
import { User } from "@supabase/supabase-js";
import { AuthContainer } from "./AuthContainer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { usePathname } from "next/navigation";

export default function Header() {
  const t = useTranslations("header");
  const a = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [language, setLanguage] = useState("en");
  const pathname = usePathname();

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLanguage(savedLang);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
      // Delay to prevent layout shift flicker during hydration
      setTimeout(() => setAuthReady(true), 150);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          setAuthSheetOpen(false);
        }
        // Ensure authReady is set after auth state changes
        if (!authReady) {
          setTimeout(() => setAuthReady(true), 150);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [authReady]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getUserInitials = (user: User) => {
    const name = user.user_metadata?.name || user.email;
    return name?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: User) => {
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const navItems = [
    { label: t('findprovider'), href: "/process" },
    { label: t("becomeUstaz"), href: "/become-ustaz" },
    { label: t("about"), href: "/about" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    // <header className="w-full bg-white shadow">
    //   <nav className="max-w-7xl mx-auto flex items-center justify-between px-6">
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 h-[53px] flex items-center">
      <nav className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
        <div className="flex items-center h-20">
          <Link href="/">
           <Image
              src="/ustaz_logo.png"
              width={100} // Reduced from 118
              height={90}  // Fixed height to force navbar slimness
              alt="Ustaz Logo"
              className="w-auto h-20 object-contain" 
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
         {navItems.map((item) => (
  <Link
    key={item.href}
    href={item.href}
    className={`text-[18px] tracking-tight sm:tracking-wide sm:text-[16px] lg:text-[14px] transition-colors ${
      pathname === item.href
        ? "text-[#db4b0d]"
        : "text-gray-700 hover:text-[#db4b0d]"
    }`}
  >
    {item.label}
            </Link>
          ))}

          {/* Auth Profile with jugaar - skeleton loader prevents layout shift */}
          {!authReady || isLoading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-[#db4b0d] focus:ring-offset-1 rounded-full transition-all">
                  <Avatar className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 block">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || "/default-avatar.jpg"}  
                      alt={getUserDisplayName(user)} 
                      className="rounded-full w-8 h-8 object-cover block"
                    />
                    <AvatarFallback className="bg-[#db4b0d] text-white flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Sheet open={authSheetOpen} onOpenChange={setAuthSheetOpen}>
                <SheetTrigger asChild>
                  <button className="text-gray-700 cursor-pointer hover:text-[#db4b0d] transition-colors focus:outline-none">
                    {t("login")}
                  </button>
                </SheetTrigger>
                <SheetContent 
                  side="top" 
                  className="h-screen flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto"
                >
                  <SheetHeader className="pb-6 border-b border-gray-200">
                    <SheetTitle className="text-2xl font-bold text-gray-800">
                      {a('welcome')}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600">
                      {a('smallDesc')}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-full max-w-md">
                      <AuthContainer />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link
                href="/auth/register"
                className="ml-4 px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
              >
                {t("getStarted")}
              </Link>
            </>
          )}

          {/* ✅ Always visible LanguageSwitcher */}
          <LanguageSwitcher />
        </div>

        <div className="md:hidden flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="relative w-6 h-6 text-gray-700 focus:outline-none flex items-center justify-center" aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"> 
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5" className="transition-all duration-300 origin-center" style={{ transform: open ? 'rotate(45deg) translateY(7px) translateX(0px)' : 'rotate(0deg) translateY(0px)', }} /> 
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75h16.5" className="transition-all duration-300 origin-center" style={{ transform: open ? 'rotate(-45deg) translateY(-7px) translateX(0px)' : 'rotate(0deg) translateY(0px)', }} /> 
                </svg>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col justify-between p-0 w-full max-w-full h-full">
              {/* Main Menu Content */}
              <div className="flex-1 flex flex-col justify-center items-start px-12 py-8 gap-1">
                {/* Navigation Links with Stagger Animation */}
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-3xl sm:text-4xl font-bold transition-colors py-2 ${
                      pathname === item.href
                        ? "text-[#db4b0d]"
                        : "text-gray-800 hover:text-[#db4b0d]"
                    }`}
                    onClick={() => setOpen(false)}
                    style={{
                      animation: open ? `slideInSpring 0.5s ease-out ${index * 0.1}s both` : 'none',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Language Switcher */}
                <div
                  className="mt-6"
                  style={{
                    animation: open ? `slideInSpring 0.5s ease-out ${navItems.length * 0.1}s both` : 'none',
                  }}
                >
                  <LanguageSwitcher className="z-50" />
                </div>
              </div>

              {/* Footer Section with User Controls */}
              <div 
                className="border-t border-gray-200 px-12 py-8 bg-gray-50"
                style={{
                  animation: open ? `slideUp 0.4s ease-out ${(navItems.length + 1) * 0.1}s both` : 'none',
                }}
              >
                {/* User Controls */}
                {!authReady || isLoading ? (
                  <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
                ) : user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
                      <Avatar className="h-10 w-10 rounded-full ring-2 ring-[#db4b0d] overflow-hidden flex-shrink-0">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || "/default-avatar.jpg"}  
                          alt={getUserDisplayName(user)} 
                          className="rounded-full w-full h-full object-cover"
                        />
                        <AvatarFallback className="bg-[#db4b0d] text-white flex items-center justify-center w-10 h-10 rounded-full font-medium">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href="/dashboard"
                        className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        Profile
                      </Link>

                      <Link
                        href="/settings"
                        className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        Settings
                      </Link>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        handleSignOut();
                        setOpen(false);
                      }}
                      className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      className="w-full px-6 py-3 text-center rounded-lg border-2 border-[#db4b0d] text-[#db4b0d] font-semibold hover:bg-[#db4b0d] hover:text-white transition-all duration-300"
                      onClick={() => setOpen(false)}
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/auth/register"
                      className="w-full px-6 py-3 text-center rounded-lg bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {t("getStarted")}
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
