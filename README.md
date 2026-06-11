<div align="center">

# USTAZ — استاذ

### Trusted home-service professionals, on demand.

**Pakistan's verified marketplace for electricians, plumbers, carpenters, AC, solar & cleaning — with phone-verified pros, live GPS tracking, and a 3-day work guarantee.**

[![Live MVP](https://img.shields.io/badge/Live%20MVP-ustaz--bice.vercel.app-db4b0d?style=for-the-badge)](https://ustaz-bice.vercel.app)
[![Stack](https://img.shields.io/badge/Next.js%2015-%20Supabase%20%2B%20PostGIS-111828?style=for-the-badge)](#-tech-stack)
[![Stage](https://img.shields.io/badge/Stage-Pre--revenue%20pilot%20(Karachi)-f59e0b?style=for-the-badge)](#-traction)

📊 **Full pitch deck:** [`USTAZ-Pitch-Deck.pdf`](./USTAZ-Pitch-Deck.pdf)  ·  🌐 **Try it:** [ustaz-bice.vercel.app](https://ustaz-bice.vercel.app)

</div>

---

## 🎯 One-liner

> **USTAZ is an on-demand marketplace that connects Pakistani households with verified local tradesmen — tracked live to your door and guaranteed for 3 days.**

---

## 🪔 Vision

- Making trusted home services as easy to book as a ride — across Pakistan.
- Because today, a family lets an unknown stranger into their home and hopes for the best.
- We are transforming an informal, trust-deficient market into a **verified, real-time, accountable** platform —
- and bringing **dignity, steady digital income, and a portable reputation** to Pakistan's millions of unrecognized tradesmen.

---

## 🔴 The Problem

Finding a trustworthy tradesman in Pakistan is a gamble. A Karachi mother's AC dies in the June heat — she must let an unknown man into her home, with no idea who he is, what he'll charge, when he'll arrive, or whether it'll break again tomorrow.

| Pain | NIC category | Why it hurts |
|---|---|---|
| **No verification** | Support | An unknown stranger in your home — no identity check, no accountability |
| **Opaque pricing** | Financial | Overcharging is routine — no standard rates, no upfront quote, no receipt |
| **No recourse / guarantee** | Process | If the work fails a day later, the worker vanishes |
| **No visibility / ETA** | Productivity | "He's on the way" = waiting blind for hours, like a ride with no map |
| **Supply side ignored** | Financial + Process | Skilled workers have no steady demand, no digital reach, no portable reputation |

---

## ✅ The Solution

A 3-step user journey, built and live in the MVP:

1. **Pick a service & location** — electrician, plumber, carpenter, AC, solar or cleaning; drop your spot on the map.
2. **Get matched & tracked live** — PostGIS finds nearby phone-verified providers who accept in real time; watch them arrive on a live map with ETA + distance.
3. **Pay on completion** — covered by a **3-day free re-fix warranty**, two-way ratings, in-app chat & push.

**Trust built in:** phone-verified providers · live GPS · in-app chat & push · 3-day warranty · two-way ratings · prepaid escrow wallet.

---

## ⭐ Unique Value Proposition

> ### "Trust a stranger in your home — for the first time."

USTAZ **verifies every pro, shows you exactly where they are, and guarantees the work for 3 days — or we fix it free.**
**Halal by design** — no interest, no hidden charges, just a transparent service fee (*ujrah*).

No other platform in Pakistan offers **verification + live tracking + warranty** — all three together.

---

## 🛡️ Why it's defensible (anti-disintermediation)

The killer of home-service marketplaces is users & providers going cash-direct. USTAZ's moat keeps bookings on-platform:

- 3-day **warranty & dispute cover apply only to in-app jobs**
- a provider's **ratings, job history & search visibility — their future demand — live only here**
- **customer loyalty credits + wallet incentives**

> *"A provider's digital reputation, search ranking, and pipeline of future jobs live exclusively inside our PostGIS matching architecture. Going cash-direct destroys their long-term digital real estate."*

---

## 💸 Business Model — prepaid wallet, Sharia-aligned *ujrah*

1. **Free Rs. 500 welcome credit** — every new provider claims it on their dashboard (a **non-cash virtual token** — it delays commission, costs nothing upfront).
2. **12% commission per completed job** — deducted from the provider's wallet (e.g. a Rs. 500 job → Rs. 60).
3. **Top up when credit runs low** via 3 packages:

| Package | Amount | For |
|---|---|---|
| Starter | **Rs. 500** | Just testing |
| Standard | **Rs. 1,000** | Regular work (popular) |
| Pro | **Rs. 2,000** | Full-time |

Pay via **Easypaisa · JazzCash · Bank** → upload receipt → admin credits wallet. Cash flows customer → provider directly; only the 12% service fee is digitized. Fee is charged **only on completed, customer-confirmed jobs**; unused credit is **fully refundable**.

> *Status: the 12% monetization engine is fully built & live in-product. Pre-revenue today — pilot providers run on the free credit, so revenue begins as they exhaust it and top up.*

---

## 📊 Market

| | Figure | Basis |
|---|---|---|
| **TAM** | ~$3–5B | Pakistan home services (informal + formal) · SMEDA/ILO 2024 |
| **SAM** | ~$600M | Smartphone-enabled urban households — Karachi, Lahore, Islamabad, Faisalabad · PTA/PBS 2025 |
| **SOM (Yr 1, Karachi)** | ~PKR 1.4M | 5,000 households × 4 jobs/yr × PKR 72 commission |

*Illustrative — to be validated during the NIC pilot.*

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, Turbopack), React, Tailwind, PWA, Capacitor (Android) |
| **Backend** | Supabase Postgres + **PostGIS**, Edge Functions (Deno), Realtime (broadcast + postgres_changes) |
| **Services** | Twilio Verify (OTP), Firebase Cloud Messaging (push), Google Maps, Resend (email) |
| **Security** | **Row-Level Security on every table**, `SECURITY DEFINER` RPCs validated against `auth.uid()`, cookie-backed sessions, phone-OTP rate limiting |

**Building now (pilot):** automated JazzCash/EasyPaisa webhook reconciliation, native iOS/Android apps.

---

## 🚀 Traction

- **Built product** — live MVP + installable PWA at [ustaz-bice.vercel.app](https://ustaz-bice.vercel.app) (not a prototype).
- **8+ core systems live** — phone-OTP auth, PostGIS matching, live GPS tracking, chat + push, prepaid wallet & commission, 3-day warranty, ratings, admin portal.
- **Security-hardened** — RLS on every table + `SECURITY DEFINER` RPCs, senior-reviewed auth.
- **Self-funded, built solo** — **Rs. 0 external capital** to reach a production-grade platform.
- **Pilot** — live in Karachi, onboarding the first providers (applying to NIC Karachi).

---

## 👥 Team

| | Role | |
|---|---|---|
| **Marjan Ahmed** | Founder & CEO *(Hacker/CTO)* | Full-stack engineer — built all of USTAZ solo at 17. GIAIC Senior · Agentic-AI engineer, Filion Capital · AI-finance hackathon winner |
| **Masood Alam** | Product Director & Financial Consultant *(Hustler)* | Product direction + the commission/wallet financial model & unit economics |
| **Muhammad Sufyan Ahmed** | CMO & Designer | Brand, growth marketing & the product design system / UX |

*Staying lean:* we batch-verify through trade associations & guild leaders (20–30 tradesmen at a time) as proxy aggregators.

---

## 🏆 Competitors

| | Verified | Live GPS | Warranty | Escrow | Reputation | Price clarity |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **USTAZ** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mahir | ~ | ❌ | ❌ | ❌ | ~ | ~ |
| RepairGuru | ~ | ❌ | ❌ | ❌ | ~ | ~ |
| OLX / classifieds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Facebook groups | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Word-of-mouth | ❌ | ❌ | ❌ | ❌ | ~ | ❌ |

The real competitor is **informality** — ~90–95% of the market is still cash, unverified, untracked.

---

## ⚙️ Getting Started (developers)

```bash
npm install
npm run dev          # Turbopack dev server on http://localhost:3000
npm run build        # production build
npm run start        # serve the build
npm run lint         # eslint
```

> Architecture, invariants, and contribution notes live in [`CLAUDE.md`](./CLAUDE.md).
> Legal: [Terms](./src/app/terms) · [Privacy](./src/app/privacy-policy) · [Cookies](./src/app/cookie-policy).

---

<div align="center">

**USTAZ** · Karachi, Pakistan · [ustaz-bice.vercel.app](https://ustaz-bice.vercel.app)
Built with Multiple AI Agents
</div>
