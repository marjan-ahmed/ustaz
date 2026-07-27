"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Sparkles,
  Zap,
  MapPin,
  MessageCircle,
  Bell,
  ShieldCheck,
  Navigation,
  Clock,
  Home,
  Search,
  Briefcase,
  User,
  Car,
  Star,
  Phone,
  ArrowLeft,
  Send,
  Droplets,
  Hammer,
} from "lucide-react";

const screens = [
  { key: "home", icon: <Sparkles className="w-5 h-5" /> },
  { key: "find", icon: <Zap className="w-5 h-5" /> },
  { key: "track", icon: <MapPin className="w-5 h-5" /> },
  { key: "chat", icon: <MessageCircle className="w-5 h-5" /> },
];

// One point of interest per side per screen — annotation callouts, not decoration.
const annotations = [
  { left: { icon: ShieldCheck, key: "trustSignals" }, right: { icon: Sparkles, key: "oneTap" } },
  { left: { icon: MapPin, key: "dropPin" }, right: { icon: Search, key: "instantMatch" } },
  { left: { icon: Navigation, key: "realtimeEta" }, right: { icon: ShieldCheck, key: "verifiedRated" } },
  { left: { icon: MessageCircle, key: "directMessaging" }, right: { icon: Send, key: "alwaysInSync" } },
];

function Callout({
  side,
  top,
  icon: Icon,
  text,
}: {
  side: "left" | "right";
  top: string;
  icon: typeof ShieldCheck;
  text: string;
}) {
  const isLeft = side === "left";
  return (
    <div
      className={`hidden lg:flex absolute items-center gap-2 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
      style={{ [isLeft ? "left" : "right"]: -186, top }}
    >
      <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 whitespace-nowrap">
        <Icon className="w-3 h-3 text-[#FF6B4A]" />
        <AnimatePresence mode="wait">
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-white/80 text-xs font-medium"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <svg width="70" height="40" viewBox="0 0 80 50" style={{ overflow: "visible", transform: isLeft ? undefined : "scaleX(-1)" }}>
        <path
          d="M4,25 C 28,4 52,46 76,25"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          strokeDasharray="2.5 5"
          strokeLinecap="round"
        />
        <circle cx="76" cy="25" r="2.5" fill="#FF6B4A" />
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 relative z-10">
      <span className="text-[10px] font-semibold text-[#0f1729]">9:41</span>
      <div className="w-3.5 h-2.5 border border-[#0f1729] rounded-[2px] relative">
        <div className="absolute inset-[1.5px] bg-[#0f1729] rounded-[1px]" style={{ width: "65%" }} />
      </div>
    </div>
  );
}

function PhoneScreen({ index }: { index: number }) {
  const screens = [
    <HomeScreen key="home" />,
    <FindScreen key="find" />,
    <TrackingScreen key="track" />,
    <ChatScreen key="chat" />,
  ];
  return screens[index];
}

function HomeScreen() {
  const quick = [
    { icon: Zap, label: "Electrician", bg: "#FFEDD5" },
    { icon: Droplets, label: "Plumbing", bg: "#DBEAFE" },
    { icon: Hammer, label: "Carpentry", bg: "#D9F99D" },
    { icon: MapPin, label: "AC Repair", bg: "#CFFAFE" },
  ];
  const all = [
    { icon: Zap, label: "Electrician", note: "Wiring, fans, panels", bg: "#FFEDD5" },
    { icon: Droplets, label: "Plumbing", note: "Leaks, tanks, fittings", bg: "#DBEAFE" },
    { icon: Hammer, label: "Carpentry", note: "Doors, shelves, repairs", bg: "#D9F99D" },
  ];
  const trust = [
    { icon: ShieldCheck, label: "Verified pros" },
    { icon: Navigation, label: "Live tracking" },
    { icon: Clock, label: "3-day guarantee" },
  ];

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#FFF7ED" }}>
      <StatusBar />

      <div className="px-4 pt-2 pb-2.5 flex items-center justify-between">
        <div>
          <div className="text-[8px] font-bold tracking-[2px] text-[#DB4B0D] uppercase">Ustaz</div>
          <div
            className="text-[15px] font-bold text-[#0f1729] leading-tight mt-0.5"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            Home Services
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-white border border-[#ECECEF] flex items-center justify-center">
          <Bell className="w-3 h-3 text-[#0f1729]" />
        </div>
      </div>

      {/* Hero bento — navy → orange duotone */}
      <div className="px-4 mb-2">
        <div
          className="relative rounded-2xl px-3 py-3 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f1729, #DB4B0D)" }}
        >
          <div className="text-[6px] font-bold text-white/60 uppercase tracking-[1.5px]">
            Pakistan&apos;s trusted
          </div>
          <div
            className="text-[13px] font-bold text-white leading-tight mt-0.5"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            Find a pro
            <br />
            near you
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-dashed border-white/25 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-4 mb-3">
        <div
          className="rounded-xl px-3 py-1.5 flex items-center gap-3 overflow-hidden"
          style={{ backgroundColor: "#0f1729" }}
        >
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-1">
              <t.icon className="w-2 h-2 text-[#FF6B4A]" />
              <span className="text-[6px] font-bold text-white/80 whitespace-nowrap">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick find */}
      <div className="px-4 mb-2">
        <div className="text-[8px] font-bold text-[#0f1729] mb-1.5">Quick find</div>
        <div className="grid grid-cols-2 gap-1.5">
          {quick.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2 h-12 flex flex-col justify-between relative overflow-hidden"
              style={{ backgroundColor: s.bg }}
            >
              <span className="text-[7px] font-bold text-[#0f1729] z-10">{s.label}</span>
              <s.icon className="absolute -bottom-1.5 -right-1.5 w-7 h-7 text-[#0f1729] opacity-[0.14]" />
            </div>
          ))}
        </div>
      </div>

      {/* All services */}
      <div className="px-4 flex-1">
        <div className="text-[8px] font-bold text-[#0f1729] mb-1.5">All services</div>
        <div className="space-y-1">
          {all.map((s) => (
            <div key={s.label} className="flex items-center rounded-xl bg-white border border-[#ECECEF] p-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: s.bg }}
              >
                <s.icon className="w-3 h-3 text-[#0f1729]" />
              </div>
              <div className="ml-2 flex-1">
                <div className="text-[7px] font-bold text-[#0f1729]">{s.label}</div>
                <div className="text-[6px] text-gray-400">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating pill tab bar — icon-only, navy indicator */}
      <div className="px-3 pb-2 pt-1">
        <div className="bg-white rounded-full border border-[#ECECEF] shadow-[0_4px_16px_rgba(15,23,41,0.1)] h-9 flex items-center px-1 relative">
          <div className="absolute w-7 h-7 rounded-full bg-[#0f1729] left-1" />
          {[Home, Search, Briefcase, MessageCircle, User].map((Icon, i) => (
            <div key={i} className="flex-1 flex items-center justify-center h-7 z-10">
              <Icon className="w-3 h-3" style={{ color: i === 0 ? "#fff" : "#9CA3AF" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FindScreen() {
  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#ECEAE4" }}>
        <div className="absolute inset-0 opacity-25">
          {[...Array(7)].map((_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-[#0f1729]/15" style={{ top: `${(i + 1) * 13}%` }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-[#0f1729]/15" style={{ left: `${(i + 1) * 18}%` }} />
          ))}
        </div>

        <div className="absolute top-11 left-3 bg-white/95 rounded-lg px-2 py-1 shadow-sm flex items-center gap-1">
          <MapPin className="w-2 h-2 text-[#DB4B0D]" />
          <span className="text-[7px] font-semibold text-[#0f1729]">Karachi, Pakistan</span>
        </div>

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-[#DB4B0D]/30 animate-ping" style={{ width: 16, height: 16 }} />
          <div className="w-4 h-4 bg-[#DB4B0D] rounded-full border-2 border-white shadow-lg relative" />
        </div>

        <StatusBar />
      </div>

      <div className="bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(15,23,41,0.08)] px-4 pt-2 pb-3">
        <div className="w-8 h-1 bg-[#ECECEF] rounded-full mx-auto mb-2" />

        <div className="mb-2">
          <div className="text-[6px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Service type</div>
          <div className="flex gap-1">
            {["Electrician", "Plumbing", "Carpentry"].map((s, i) => (
              <div
                key={s}
                className={`px-2 py-1 rounded-full text-[6.5px] font-bold whitespace-nowrap border ${
                  i === 0 ? "bg-[#DB4B0D] border-[#DB4B0D] text-white" : "bg-white border-[#ECECEF] text-[#6B7280]"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <div className="text-[6px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Location</div>
          <div className="border border-[#ECECEF] rounded-lg bg-[#FAF7F3] px-2 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-2.5 h-2.5 text-[#DB4B0D]" />
            <span className="text-[7px] text-gray-400">Search or enter address</span>
          </div>
        </div>

        <div className="bg-[#DB4B0D] rounded-lg py-2 flex items-center justify-center gap-1.5">
          <Search className="w-2.5 h-2.5 text-white" />
          <span className="text-[7.5px] font-bold text-white">Find Available Providers</span>
        </div>
      </div>
    </div>
  );
}

function TrackingScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="relative h-[38%] overflow-hidden" style={{ backgroundColor: "#ECEAE4" }}>
        <StatusBar />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path
            d="M60,150 Q90,110 80,80 Q70,50 110,30"
            fill="none"
            stroke="#DB4B0D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="5,4"
            opacity="0.7"
          />
        </svg>
        <div className="absolute bottom-[18%] left-[28%]">
          <div className="w-3 h-3 bg-[#DB4B0D] rounded-full border-2 border-white shadow-lg" />
        </div>
        <div className="absolute top-[16%] right-[24%]">
          <div className="w-3 h-3 bg-[#10B981] rounded-full border-2 border-white shadow-lg" />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Status header — matches ProviderTrackingCard */}
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: "#FAF7F3" }}>
          <Car className="w-2.5 h-2.5 text-[#DB4B0D]" />
          <span
            className="text-[6.5px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(219,75,13,0.1)", color: "#DB4B0D" }}
          >
            Provider is heading to you
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[6px] font-bold text-[#10B981]">Live</span>
          </div>
        </div>

        <div className="px-3 pt-2.5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(219,75,13,0.08)" }}>
              <span className="text-[10px] font-bold text-[#DB4B0D]">A</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-bold text-[#0f1729]">Ahmed Khan</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="text-[6px] font-bold px-1 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(219,75,13,0.1)", color: "#DB4B0D" }}
                >
                  Verified
                </span>
                <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                <span className="text-[7px] font-bold text-[#0f1729]">4.8</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mb-2.5">
            <div className="flex-1 rounded-lg p-1.5" style={{ backgroundColor: "#FAF7F3" }}>
              <div className="text-[6px] font-bold text-[#DB4B0D]">ETA</div>
              <div className="text-[11px] font-bold text-[#0f1729]">8 min</div>
            </div>
            <div className="flex-1 rounded-lg p-1.5" style={{ backgroundColor: "#FAF7F3" }}>
              <div className="text-[6px] font-bold text-gray-400">Distance</div>
              <div className="text-[11px] font-bold text-[#0f1729]">2.3 km</div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <div
              className="flex-1 rounded-lg py-1.5 flex items-center justify-center gap-1"
              style={{ backgroundColor: "rgba(219,75,13,0.08)" }}
            >
              <Phone className="w-2.5 h-2.5 text-[#DB4B0D]" />
              <span className="text-[7px] font-bold text-[#DB4B0D]">Call</span>
            </div>
            <div className="flex-1 rounded-lg py-1.5 flex items-center justify-center gap-1 bg-[#DB4B0D]">
              <MessageCircle className="w-2.5 h-2.5 text-white" />
              <span className="text-[7px] font-bold text-white">Chat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatScreen() {
  const messages = [
    { from: "provider", text: "I am on my way, should arrive in 8 minutes.", time: "2:34 PM" },
    { from: "customer", text: "Okay, I am near the blue gate.", time: "2:35 PM" },
    { from: "provider", text: "Got it, see you soon!", time: "2:35 PM" },
  ];
  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#FFF7ED" }}>
      <StatusBar />
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "#ECECEF" }}>
        <ArrowLeft className="w-3 h-3 text-[#0f1729]" />
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(219,75,13,0.08)" }}>
          <span className="text-[8px] font-bold text-[#DB4B0D]">A</span>
        </div>
        <div className="flex-1">
          <div className="text-[8px] font-bold text-[#0f1729]">Ahmed Khan</div>
        </div>
      </div>

      <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
        {messages.map((msg, i) => {
          const isCustomer = msg.from === "customer";
          return (
            <div key={i} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] px-2.5 py-1.5"
                style={{
                  backgroundColor: isCustomer ? "#DB4B0D" : "#FAF7F3",
                  color: isCustomer ? "#fff" : "#0f1729",
                  borderRadius: 14,
                  borderTopRightRadius: isCustomer ? 4 : 14,
                  borderTopLeftRadius: isCustomer ? 14 : 4,
                }}
              >
                <div className="text-[8px] leading-relaxed">{msg.text}</div>
                <div
                  className="text-[6px] mt-0.5"
                  style={{ color: isCustomer ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-2 pb-3 pt-1 border-t" style={{ borderColor: "#ECECEF" }}>
        <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 bg-white" style={{ borderColor: "#ECECEF" }}>
          <div className="flex-1 text-[7px] text-gray-400">Type a message...</div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#DB4B0D]">
            <Send className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppScreenshots() {
  const t = useTranslations("appScreens");
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (idx: number) => {
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % screens.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, scale: 0.95 }),
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1729] via-[#1a1f3d] to-[#0f1729]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(219,75,13,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(219,75,13,0.06) 0%, transparent 40%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#DB4B0D]" />
            <span className="text-white/80 text-sm font-medium">{t("badge")}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm md:text-base max-w-xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center"
          >
            <div className="relative" style={{ perspective: "1200px" }}>
              {/* Annotation callouts — point at what's on screen, not glow */}
              <Callout side="left" top="16%" icon={annotations[current].left.icon} text={t(`callouts.${annotations[current].left.key}`)} />
              <Callout side="right" top="62%" icon={annotations[current].right.icon} text={t(`callouts.${annotations[current].right.key}`)} />

              {/* Side buttons */}
              <div className="absolute -left-[2px] top-[88px] w-[3px] h-7 bg-[#0c0d11] rounded-l-sm" />
              <div className="absolute -left-[2px] top-[124px] w-[3px] h-12 bg-[#0c0d11] rounded-l-sm" />
              <div className="absolute -right-[2px] top-[110px] w-[3px] h-14 bg-[#0c0d11] rounded-r-sm" />

              {/* Titanium frame */}
              <div
                className="relative w-[240px] sm:w-[260px] md:w-[280px] h-[500px] sm:h-[540px] md:h-[580px] rounded-[2.6rem] md:rounded-[3rem] p-[9px] shadow-2xl"
                style={{
                  background: "linear-gradient(155deg, #52565f, #14161c 55%, #1e2027)",
                  transform: "rotateY(-5deg) rotateX(2deg)",
                }}
              >
                {/* Screen */}
                <div className="relative w-full h-full bg-white rounded-[2.1rem] md:rounded-[2.5rem] overflow-hidden">
                  {/* Dynamic-island notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#0f1729] rounded-full z-30 flex items-center justify-end pr-1.5">
                    <div className="w-1 h-1 rounded-full bg-white/15" />
                  </div>

                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={current}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute inset-0"
                    >
                      <PhoneScreen index={current} />
                    </motion.div>
                  </AnimatePresence>

                  {/* Glass shine sweep */}
                  <div className="absolute inset-0 pointer-events-none phone-shine z-20" />
                </div>
              </div>

              {/* Floating accent dot */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-12 h-12 bg-[#DB4B0D] rounded-2xl flex items-center justify-center shadow-lg shadow-[#DB4B0D]/30"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-3 -left-3 bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-[#0f1729]">{t("liveTracking")}</div>
                  <div className="text-[6px] text-gray-400">{t("realtimeUpdates")}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Feature List */}
          <div className="space-y-3">
            {screens.map((screen, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-500 group ${
                  current === index
                    ? "bg-white shadow-xl shadow-black/5"
                    : "bg-white/5 hover:bg-white/10 border border-white/5"
                }`}
                onClick={() => goTo(index)}
              >
                {/* Active indicator */}
                {current === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#DB4B0D] rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                      current === index ? "bg-[#DB4B0D]" : "bg-white/10"
                    }`}
                  >
                    <div className={current === index ? "text-white" : "text-white/60"}>
                      {screen.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-lg font-bold transition-colors duration-300 ${
                          current === index ? "text-[#0f1729]" : "text-white"
                        }`}
                        style={{ fontFamily: "Clash Grotesk, sans-serif" }}
                      >
                        {t(`screens.${screen.key}.title`)}
                      </h3>
                      {current === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-[#DB4B0D]"
                        />
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed transition-colors duration-300 ${
                        current === index ? "text-gray-500" : "text-white/40"
                      }`}
                    >
                      {t(`screens.${screen.key}.description`)}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 mt-1 transition-all duration-300 ${
                      current === index
                        ? "text-[#DB4B0D] translate-x-0 opacity-100"
                        : "text-white/20 -translate-x-2 opacity-0"
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                current === i ? "w-8 bg-[#DB4B0D]" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
