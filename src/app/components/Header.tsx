'use client'
import Image from "next/image";
import React, { useState } from "react";
import { HiBars3BottomRight } from "react-icons/hi2";
import Link from "next/link";

const navItems = [
    { label: "Services", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Login", href: "/auth/login" },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="w-full bg-white shadow">
            <nav className="max-w-7xl mx-auto flex items-center justify-between px-6">
                {/* Left: Logo */}
                <div className="flex items-center h-20">
                    <Link href={'/'}>
                    <Image
                        src={'/ustaz_logo.png'}
                        width={120}
                        height={120}
                        alt="Ustaz Logo"
                        className="w-26 h-26 object-contain"
                    />
                    </Link>
                    {/* Mobile menu button */}
                    <button
                        className="ml-4 md:hidden text-3xl text-gray-700 focus:outline-none"
                        aria-label="Open menu"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <HiBars3BottomRight />
                    </button>
                </div>
                {/* Right: Nav Items */}
                <div className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className="text-gray-700 hover:text-[#db4b0d] transition-colors"
                        >
                            {item.label}
                        </a>
                    ))}
                    <Link
                        href={'/auth/register'}
                        className="ml-4 px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="absolute top-20 left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-4 md:hidden">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-gray-700 hover:text-[#db4b0d] transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                        <a
                            href="#"
                            className="px-5 py-2 rounded bg-[#db4b0d] text-white font-semibold hover:bg-[#b53c0a] transition-colors"
                        >
                            Get Started
                        </a>
                    </div>
                )}
            </nav>
        </header>
    );
}