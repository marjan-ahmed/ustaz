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

export default function Header() {
  const t = useTranslations("header");
  const a = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLanguage(savedLang);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          setAuthSheetOpen(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

          {isLoading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || "/default-avatar.jpg"}  
                      alt={getUserDisplayName(user)} 
                    />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                </Button>
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
              <button className="text-2xl text-gray-700 focus:outline-none" aria-label="Open menu">
                <RxHamburgerMenu />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6 p-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Already visible in mobile view */}
              <LanguageSwitcher className="z-50" />

              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              ) : user ? (
                <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar className=" border-2 border-gray-900 h-8 w-8">
                      <AvatarImage className="border-2 border-gray-900"
                        src={user.user_metadata?.avatar_url || "/default-avatar.jpg"}  
                        alt={getUserDisplayName(user)} 
                      />
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Settings
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => {
                      handleSignOut();
                      setOpen(false);
                    }}
                    className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-lg text-gray-700 hover:text-[#db4b0d] transition-colors w-full text-left"
                    onClick={() => setOpen(false)}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors text-center"
                    onClick={() => setOpen(false)}
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
