"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Users, Briefcase, Star, UserCheck } from "lucide-react";

function AnimatedCounter({
  target,
  suffix = "",
  decimals = 0,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const springValue = useSpring(0, {
    stiffness: 40,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(springValue, (latest) =>
    decimals > 0
      ? latest.toFixed(decimals)
      : Math.floor(latest).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      springValue.set(target);
    }
  }, [isInView, target, springValue]);

  return (
    <span ref={ref} className="inline-flex items-baseline gap-0.5">
      <motion.span>{display}</motion.span>
      {suffix && (
        <span className="text-[#db4b0d] text-3xl md:text-4xl">{suffix}</span>
      )}
    </span>
  );
}

interface StatsData {
  providers: number;
  jobs: number;
  rating: number;
  users: number;
}

const fallbackStats: StatsData = {
  providers: 0,
  jobs: 0,
  rating: 0,
  users: 0,
};

export default function TrustBar() {
  const [stats, setStats] = useState<StatsData>(fallbackStats);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: StatsData) => setStats(data))
      .catch(() => {});
  }, []);

  const items = [
    {
      icon: Users,
      value: stats.providers,
      suffix: "+",
      label: "Verified Providers",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Briefcase,
      value: stats.jobs,
      suffix: "+",
      label: "Jobs Completed",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Star,
      value: stats.rating,
      suffix: "",
      label: "Average Rating",
      decimals: 1,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: UserCheck,
      value: stats.users,
      suffix: "+",
      label: "Users",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0f1729 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="text-center group"
              >
                <div
                  className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl ${stat.iconBg} mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>

                <div
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1729] mb-2 leading-none"
                  style={{
                    fontFamily: "Anton, sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                  />
                  {stat.suffix === "" && stat.value % 1 !== 0 && (
                    <span className="text-[#db4b0d] text-3xl md:text-4xl">
                      ★
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm md:text-base font-medium tracking-wide">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
