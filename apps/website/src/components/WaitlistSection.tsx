"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, ArrowRight, Loader2, User, Mail } from "lucide-react";

const SOURCE_KEYS = ["whatsapp","instagram","x","reddit","tiktok","google","friend"] as const;

function FloatingInput({
  label,
  icon: Icon,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  icon: React.ElementType;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 transition-all duration-200 ${
          focused
            ? "border-[#db4b0d] bg-white/[0.06]"
            : "border-white/10 bg-white/[0.03] hover:border-white/15"
        }`}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 transition-colors ${
            focused ? "text-[#db4b0d]" : "text-white/25"
          }`}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={label}
          className="w-full bg-transparent text-white text-[13px] outline-none placeholder:text-white/30"
        />
      </div>
    </div>
  );
}

export default function WaitlistSection() {
  const t = useTranslations("waitlist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValid = name.trim().length > 1 && email.includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          source: source || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || t("errorGeneric"));
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg(t("errorNetwork"));
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="relative py-14">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1729] via-[#111d35] to-[#0f1729]" />

      <div className="relative max-w-xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#db4b0d]/10 border border-[#db4b0d]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-6 h-6 text-[#db4b0d]" />
              </div>
              <h3
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                {t("successTitle")}
              </h3>
              <p className="text-white/40 text-sm">
                {t("successBody")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Label */}
              <p className="text-[#db4b0d] text-xs font-semibold tracking-widest uppercase mb-4 text-center">
                {t("eyebrow")}
              </p>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-[#db4b0d]/10 border border-[#db4b0d]/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#db4b0d]" />
                </div>
              </div>

              {/* Headline */}
              <h2
                className="text-3xl sm:text-4xl font-bold text-white text-center mb-3 leading-tight"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                {t("title")}
              </h2>

              <p className="text-white/40 text-center text-sm mb-7 max-w-sm mx-auto">
                {t("subtitle")}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <FloatingInput
                  label={t("namePlaceholder")}
                  icon={User}
                  type="text"
                  value={name}
                  onChange={setName}
                  required
                />

                <FloatingInput
                  label={t("emailPlaceholder")}
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                />

                {/* Source chips */}
                <div className="pt-1">
                  <p className="text-white/30 text-xs mb-2">{t("sourceLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_KEYS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSource(source === s ? "" : s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          source === s
                            ? "bg-[#db4b0d] text-white shadow-lg shadow-[#db4b0d]/20"
                            : "bg-white/[0.04] text-white/35 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/50"
                        }`}
                      >
                        {t(`sources.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {status === "error" && errorMsg && (
                  <p className="text-red-400 text-xs">{errorMsg}</p>
                )}

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={!isValid || status === "loading"}
                    className="w-full bg-white text-[#0f1729] font-semibold py-3 rounded-xl hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm group"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t("submit")}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Social proof */}
              <p className="text-white/20 text-xs text-center mt-6">
                {t("noSpam")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
