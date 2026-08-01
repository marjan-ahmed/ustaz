"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Loader2,
  User,
  Check,
  CalendarClock,
  BadgeCheck,
  Wallet,
  Sparkles,
} from "lucide-react";
import ResidencyInput from "./ResidencyInput";

const WHATSAPP_URL = process.env.NEXT_PUBLIC_PROVIDER_WHATSAPP_GROUP_URL;

// Must match the service_type values the real app writes to ustaz_registrations.
const SERVICES = [
  { name: "Electrician", bg: "#FFEDD5", image: "/images/electrician-illus-Photoroom.png" },
  { name: "Plumbing", bg: "#DBEAFE", image: "/images/plumber-illus-Photoroom.png" },
  { name: "Carpentry", bg: "#D9F99D", image: "/images/carpenter-illus-Photoroom.png" },
  { name: "AC Maintenance", bg: "#CFFAFE", image: "/images/ac-technician-illus-Photoroom.png" },
  { name: "Solar Technician", bg: "#FEF3C7", image: "/images/solar-illus-Photoroom.png" },
  { name: "CCTV Technician", bg: "#F3E8FF", image: "/images/cctv-illus-Photoroom.png" },
  { name: "Room Cooler", bg: "#E0F2FE", image: "/images/cooler-illus-Photoroom.png" },
  { name: "Refrigerator Technician", bg: "#F0FDF4", image: "/images/fridge-illus-Photoroom.png" },
  { name: "Home Appliances", bg: "#FFF1F2", image: "/images/appliance-illus-Photoroom.png" },
  { name: "Automatic Washing Machine Repair", bg: "#EFF6FF", image: "/images/washingmachine-illus-Photoroom.png" },
];

const BENEFIT_KEYS = [
  { icon: CalendarClock, key: "schedule" },
  { icon: BadgeCheck, key: "verified" },
  { icon: Wallet, key: "paid" },
] as const;

const CLASH = { fontFamily: "Clash Grotesk, sans-serif" };
const digitsOnly = (v: string) => v.replace(/\D/g, "");

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function formatCnicHint(cnic: string) {
  if (!cnic) return "";
  const p1 = cnic.slice(0, 5);
  const p2 = cnic.slice(5, 12);
  const p3 = cnic.slice(12, 13);
  return [p1, p2, p3].filter(Boolean).join("-");
}

export default function ProviderPrelaunchForm() {
  const t = useTranslations("providerForm");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [residency, setResidency] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleService(name: string) {
    setServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
    setErrors((e) => ({ ...e, services: "" }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = t("errorName");
    if (!/^\d{7,}$/.test(digitsOnly(phone).replace(/^0+/, "")))
      next.phone = t("errorPhone");
    if (!/^\d{13}$/.test(digitsOnly(cnic))) next.cnic = t("errorCnic");
    if (!residency.trim()) next.residency = "Please enter or select your area";
    if (services.length === 0) next.services = t("errorServices");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (!validate()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/provider-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phone,
          cnic,
          residency: residency.trim(),
          serviceTypes: services,
          source: "website-provider-form",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg(t("errorNetwork"));
      setStatus("error");
    }
  }

  const inputBase =
    "w-full min-h-[48px] rounded-xl border bg-white px-4 text-[15px] text-[#0f1729] outline-none transition-colors placeholder:text-gray-400 focus:border-[#db4b0d] focus:ring-2 focus:ring-[#db4b0d]/15";

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          {/* ---------- Form (first on mobile) ---------- */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-black/[0.04] sm:p-7">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="py-6 text-center"
                  >
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#db4b0d]/10">
                      <Check className="h-7 w-7 text-[#db4b0d]" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-[#0f1729]" style={CLASH}>
                      {t("successTitle")}
                    </h3>
                    <p className="mx-auto mb-7 max-w-sm text-sm leading-relaxed text-gray-600">
                      {t("successBody")}
                    </p>

                    {WHATSAPP_URL ? (
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto flex min-h-[52px] max-w-sm items-center justify-center gap-2 rounded-full bg-[#db4b0d] font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#c24309] hover:shadow-lg"
                      >
                        <WhatsAppIcon />
                        {t("step1Cta")}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t("contactFallback")} {`+92${digitsOnly(phone).replace(/^0+/, "")}`}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-[#0f1729] sm:text-2xl" style={CLASH}>
                        {t("formTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("formSubtitle")}
                      </p>
                    </div>

                    {/* Full name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {t("fullNameLabel")}
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onBlur={validate}
                          placeholder={t("fullNamePlaceholder")}
                          aria-invalid={!!errors.fullName}
                          aria-describedby={errors.fullName ? "fullName-error" : undefined}
                          className={`${inputBase} pl-11 ${
                            errors.fullName ? "border-red-300" : "border-gray-200"
                          }`}
                        />
                      </div>
                      {errors.fullName && (
                        <p id="fullName-error" className="mt-1.5 text-xs text-red-500">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {t("phoneLabel")}
                      </label>
                      <div
                        className={`flex min-h-[48px] items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-[#db4b0d] focus-within:ring-2 focus-within:ring-[#db4b0d]/15 ${
                          errors.phone ? "border-red-300" : "border-gray-200"
                        }`}
                      >
                        <span className="flex h-full shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3.5 text-[15px] font-medium text-gray-600">
                          +92
                        </span>
                        <input
                          id="phone"
                          inputMode="numeric"
                          value={phone}
                          onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 11))}
                          onBlur={validate}
                          placeholder={t("phonePlaceholder")}
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? "phone-error" : undefined}
                          className="w-full bg-transparent px-4 text-[15px] text-[#0f1729] outline-none placeholder:text-gray-400"
                        />
                      </div>
                      {errors.phone ? (
                        <p id="phone-error" className="mt-1.5 text-xs text-red-500">
                          {errors.phone}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-gray-400">
                          {t("phoneHint")}
                        </p>
                      )}
                    </div>

                    {/* CNIC */}
                    <div>
                      <label
                        htmlFor="cnic"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {t("cnicLabel")}
                      </label>
                      <input
                        id="cnic"
                        inputMode="numeric"
                        value={cnic}
                        onChange={(e) => setCnic(digitsOnly(e.target.value).slice(0, 13))}
                        onBlur={validate}
                        placeholder={t("cnicPlaceholder")}
                        aria-invalid={!!errors.cnic}
                        aria-describedby={errors.cnic ? "cnic-error" : "cnic-hint"}
                        className={`${inputBase} ${
                          errors.cnic ? "border-red-300" : "border-gray-200"
                        }`}
                      />
                      {errors.cnic ? (
                        <p id="cnic-error" className="mt-1.5 text-xs text-red-500">
                          {errors.cnic}
                        </p>
                      ) : (
                        <p id="cnic-hint" className="mt-1.5 text-xs text-gray-400">
                          {cnic ? (
                            <span className="font-medium tracking-wide text-gray-500">
                              {formatCnicHint(cnic)}
                            </span>
                          ) : (
                            t("cnicHint")
                          )}
                        </p>
                      )}
                    </div>

                    {/* Residency */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Where do you live? *
                      </label>
                      <ResidencyInput
                        value={residency}
                        onChange={setResidency}
                        error={!!errors.residency}
                      />
                      {errors.residency && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.residency}</p>
                      )}
                    </div>

                    {/* Services */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t("servicesLabel")}
                      </label>
                      <p className="mb-2.5 text-xs text-gray-400">{t("servicesHint")}</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {SERVICES.map((s) => {
                          const active = services.includes(s.name);
                          return (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => toggleService(s.name)}
                              aria-pressed={active}
                              className={`group relative flex min-h-[76px] items-center gap-2.5 overflow-hidden rounded-2xl p-2.5 text-left transition-all duration-200 ${
                                active
                                  ? "ring-2 ring-[#db4b0d] ring-offset-1"
                                  : "ring-1 ring-gray-200 hover:ring-gray-300"
                              }`}
                              style={{ backgroundColor: s.bg }}
                            >
                              <span className="relative h-11 w-11 shrink-0">
                                <Image
                                  src={s.image}
                                  alt=""
                                  fill
                                  className="object-contain"
                                />
                              </span>
                              <span className="text-[13px] font-bold leading-tight text-[#0f1729]">
                                {s.name}
                              </span>
                              {active && (
                                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#db4b0d]">
                                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.services && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.services}</p>
                      )}
                    </div>

                    {status === "error" && errorMsg && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#db4b0d] font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#c24309] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "loading" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {t("submit")}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs leading-relaxed text-gray-400">
                      {t("termsNotice")}{" "}
                      <a href="/terms" className="text-[#db4b0d] hover:underline">
                        Terms
                      </a>{" "}
                      {t("termsAnd")}{" "}
                      <a href="/privacy-policy" className="text-[#db4b0d] hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ---------- Pitch ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1 lg:sticky lg:top-24"
          >
            <div className="rounded-3xl bg-[#FFF7ED] p-6 sm:p-9">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#db4b0d]/15 bg-white px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#db4b0d]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#db4b0d]">
                  {t("eyebrow")}
                </span>
              </div>

              <h1
                className="text-3xl font-bold leading-[1.05] text-[#0f1729] sm:text-4xl lg:text-5xl"
                style={CLASH}
              >
                {t("titleLine1")}
                <br />
                {t("titleLine2")}
              </h1>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
                {t("intro")}
              </p>

              <div className="mt-8 space-y-4">
                {BENEFIT_KEYS.map((b, i) => (
                  <motion.div
                    key={b.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                    className="flex gap-3.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#db4b0d]/10">
                      <b.icon className="h-[18px] w-[18px] text-[#db4b0d]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0f1729]">{t(`benefits.${b.key}.title`)}</h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{t(`benefits.${b.key}.body`)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="relative mt-8 h-44 sm:h-52">
                <Image
                  src="/images/image-final-illustration.png"
                  alt="Ustaz professionals at work"
                  fill
                  className="object-contain object-bottom"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
