"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Zap, MapPin, MessageCircle } from "lucide-react";

const screens = [
  {
    label: "Home",
    title: "Quick Find",
    description:
      "Browse all services from one clean dashboard. Quick-find cards let you jump straight to booking.",
    icon: <Sparkles className="w-5 h-5" />,
    color: "#DB4B0D",
  },
  {
    label: "Book",
    title: "Instant Booking",
    description:
      "Select your service, confirm your address on the map, and hit Find — providers nearby are notified in seconds.",
    icon: <Zap className="w-5 h-5" />,
    color: "#2563EB",
  },
  {
    label: "Track",
    title: "Live Tracking",
    description:
      "Watch your provider approach in real-time with live location, ETA, and distance updates.",
    icon: <MapPin className="w-5 h-5" />,
    color: "#10B981",
  },
  {
    label: "Chat",
    title: "In-App Chat",
    description:
      "Message your provider directly for directions, details, or quick questions before they arrive.",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "#8B5CF6",
  },
];

function PhoneScreen({ index }: { index: number }) {
  const screens = [
    <HomeScreen key="home" />,
    <BookingScreen key="book" />,
    <TrackingScreen key="track" />,
    <ChatScreen key="chat" />,
  ];
  return screens[index];
}

function HomeScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <span className="text-[10px] font-semibold text-[#0f1729]">9:41</span>
        <div className="w-3.5 h-2.5 border border-[#0f1729] rounded-[2px] relative">
          <div className="absolute inset-[1.5px] bg-[#0f1729] rounded-[1px]" style={{ width: "65%" }}></div>
        </div>
      </div>
      <div className="px-4 pt-2 pb-3">
        <div className="text-[8px] font-bold tracking-[2px] text-[#DB4B0D] uppercase">USTAZ</div>
        <div className="text-[16px] font-normal text-[#0f1729] leading-tight mt-0.5" style={{ fontFamily: "Anton, sans-serif" }}>Home Services</div>
      </div>
      <div className="px-4 mb-2">
        <div className="text-[9px] font-bold text-[#0f1729] mb-1.5">Quick find</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: "⚡", label: "Electrician", bg: "#FFF7ED" },
            { icon: "💧", label: "Plumber", bg: "#EFF6FF" },
            { icon: "❄️", label: "AC Repair", bg: "#ECFEFF" },
            { icon: "🪚", label: "Carpenter", bg: "#F7FEE7" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] p-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px]" style={{ backgroundColor: s.bg }}>{s.icon}</div>
              <span className="text-[8px] font-bold text-[#0f1729]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 flex-1">
        <div className="text-[9px] font-bold text-[#0f1729] mb-1.5">All services</div>
        <div className="space-y-1">
          {[
            { icon: "⚡", label: "Electrician", note: "Wiring, fans, panels", bg: "#FFF7ED" },
            { icon: "💧", label: "Plumbing", note: "Leaks, tanks, fittings", bg: "#EFF6FF" },
            { icon: "🪚", label: "Carpentry", note: "Doors, shelves, repairs", bg: "#F7FEE7" },
          ].map((s) => (
            <div key={s.label} className="flex items-center rounded-xl bg-white border border-[#F3F4F6] p-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px]" style={{ backgroundColor: s.bg }}>{s.icon}</div>
              <div className="ml-2 flex-1">
                <div className="text-[8px] font-bold text-[#0f1729]">{s.label}</div>
                <div className="text-[7px] text-gray-400">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-2 pb-3 pt-1">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] h-14 flex items-center justify-around px-2">
          {["Home", "Find", "Jobs", "Chat", "Profile"].map((tab, i) => (
            <div key={tab} className="flex flex-col items-center gap-0.5 w-10">
              <div className={`w-4 h-4 rounded ${i === 0 ? "bg-[#DB4B0D]" : ""}`}></div>
              <span className={`text-[7px] font-semibold ${i === 0 ? "text-[#0f1729]" : "text-gray-400"}`}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col relative">
      <div className="flex-1 bg-[#E8E4DF] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-gray-400" style={{ top: `${(i + 1) * 12}%` }}></div>
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-gray-400" style={{ left: `${(i + 1) * 18}%` }}></div>
          ))}
        </div>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#DB4B0D] rounded-full"></div>
            <span className="text-[7px] font-semibold text-gray-700">Karachi, Pakistan</span>
          </div>
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-[#DB4B0D] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3 pb-1 z-10">
          <span className="text-[10px] font-semibold text-[#0f1729]">9:41</span>
          <div className="w-3.5 h-2.5 border border-[#0f1729] rounded-[2px] relative">
            <div className="absolute inset-[1.5px] bg-[#0f1729] rounded-[1px]" style={{ width: "65%" }}></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-t-2xl shadow-[0_-2px_16px_rgba(0,0,0,0.08)] px-4 pt-2 pb-3">
        <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-2"></div>
        <div className="mb-2">
          <div className="text-[7px] font-bold text-gray-400 tracking-wider mb-1 uppercase">SERVICE TYPE</div>
          <div className="flex gap-1 overflow-hidden">
            {["Electrician", "Plumbing", "Carpentry"].map((s, i) => (
              <div key={s} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-bold whitespace-nowrap border ${i === 0 ? "bg-[#DB4B0D] border-[#DB4B0D] text-white" : "bg-[#F3F4F6] border-[#E5E7EB] text-gray-600"}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-2">
          <div className="text-[7px] font-bold text-gray-400 tracking-wider mb-1 uppercase">LOCATION</div>
          <div className="border border-[#DB4B0D55] rounded-lg bg-[#F9FAFB] px-2 py-1.5 flex items-center gap-1.5">
            <div className="w-2 h-2 text-[#DB4B0D]">📍</div>
            <span className="text-[7px] text-gray-500">Search or enter address</span>
          </div>
        </div>
        <div className="bg-[#DB4B0D] rounded-lg py-2 flex items-center justify-center gap-1">
          <span className="text-[8px] font-bold text-white">Find Available Providers</span>
        </div>
      </div>
    </div>
  );
}

function TrackingScreen() {
  return (
    <div className="w-full h-full bg-white flex flex-col relative">
      <div className="flex-1 bg-[#E8E4DF] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-gray-400" style={{ top: `${(i + 1) * 12}%` }}></div>
          ))}
        </div>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 350" preserveAspectRatio="none">
          <path d="M100,80 Q120,130 90,180 Q60,230 100,280" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <path d="M100,80 Q120,130 90,180 Q60,230 100,280" fill="none" stroke="#DB4B0D" strokeWidth="3" strokeLinecap="round" strokeDasharray="6,4" />
        </svg>
        <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2">
          <div className="w-3 h-3 bg-[#DB4B0D] rounded-full border-2 border-white shadow-lg"></div>
        </div>
        <div className="absolute top-[22%] left-[55%]">
          <div className="w-3 h-3 bg-[#10B981] rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-[5px] font-bold px-1 py-0.5 rounded whitespace-nowrap">Provider</div>
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-3 pb-1 z-10">
          <span className="text-[10px] font-semibold text-[#0f1729]">9:41</span>
          <div className="w-3.5 h-2.5 border border-[#0f1729] rounded-[2px] relative">
            <div className="absolute inset-[1.5px] bg-[#0f1729] rounded-[1px]" style={{ width: "65%" }}></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-t-2xl shadow-[0_-2px_16px_rgba(0,0,0,0.08)] px-4 pt-2 pb-3">
        <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-2"></div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>
          <span className="text-[7px] font-bold text-gray-500 uppercase tracking-wider">Provider En Route</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center border border-[#DB4B0D33]">
            <span className="text-xs">👨‍🔧</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-[#0f1729]">Ahmed Khan</div>
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="text-[8px] text-yellow-500">★</span>
              <span className="text-[8px] font-bold text-gray-700">4.8</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 mb-2">
          <div className="flex-1 bg-[#F9FAFB] rounded-lg p-2 text-center">
            <div className="text-[12px] font-bold text-[#0f1729]">8 min</div>
            <div className="text-[6px] text-gray-400">ETA</div>
          </div>
          <div className="flex-1 bg-[#F9FAFB] rounded-lg p-2 text-center">
            <div className="text-[12px] font-bold text-[#0f1729]">2.3 km</div>
            <div className="text-[6px] text-gray-400">Distance</div>
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
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-white">
        <span className="text-[10px] font-semibold text-[#0f1729]">9:41</span>
        <div className="w-3.5 h-2.5 border border-[#0f1729] rounded-[2px] relative">
          <div className="absolute inset-[1.5px] bg-[#0f1729] rounded-[1px]" style={{ width: "65%" }}></div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-[#FFF7ED] flex items-center justify-center border border-[#DB4B0D33]">
          <span className="text-[10px]">👨‍🔧</span>
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-bold text-[#0f1729]">Ahmed Khan</div>
          <div className="text-[7px] text-[#10B981] font-semibold">Online</div>
        </div>
      </div>
      <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-2.5 py-1.5 ${msg.from === "customer" ? "bg-[#DB4B0D] text-white rounded-br-md" : "bg-[#F3F4F6] text-[#0f1729] rounded-bl-md"}`}>
              <div className="text-[8px] leading-relaxed">{msg.text}</div>
              <div className={`text-[6px] mt-0.5 ${msg.from === "customer" ? "text-white/60" : "text-gray-400"}`}>{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-2 pb-3 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5 bg-[#F9FAFB] rounded-full border border-[#F3F4F6] px-2.5 py-1.5">
          <div className="flex-1 text-[7px] text-gray-400">Type a message...</div>
          <div className="w-6 h-6 rounded-full bg-[#DB4B0D] flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppScreenshots() {
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
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(219,75,13,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(219,75,13,0.06) 0%, transparent 40%)" }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

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
            <span className="text-white/80 text-sm font-medium">Coming Soon on Google Play</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "Clash Grotesk, sans-serif" }}
          >
            Experience the App
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm md:text-base max-w-xl mx-auto"
          >
            Home services at your fingertips. Book, track, and chat — all in one place.
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
              {/* Glow */}
              <div className="absolute -inset-10 bg-[#DB4B0D]/10 blur-3xl rounded-full" />

              {/* Phone Frame */}
              <div
                className="relative w-[280px] h-[580px] rounded-[3rem] p-[3px] shadow-2xl"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                  transform: "rotateY(-5deg) rotateX(2deg)",
                }}
              >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#0f1729] rounded-b-xl z-20" />

                {/* Screen */}
                <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
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
                  <div className="text-[8px] font-bold text-[#0f1729]">Live Tracking</div>
                  <div className="text-[6px] text-gray-400">Real-time updates</div>
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
                        {screen.title}
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
                      {screen.description}
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
