<div align="center">

# USTAZ — استاذ

### Trusted home services, with proof.

**Pakistan's digital home-service marketplace for verified professionals, live arrival tracking, transparent job approval, and post-service protection.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/marjan-ahmed/ustaz)
[![Live MVP](https://img.shields.io/badge/Live%20MVP-ustaz--bice.vercel.app-db4b0d?style=for-the-badge)](https://ustaz-bice.vercel.app)
[![Stack](https://img.shields.io/badge/Next.js%2015-%20Supabase%20%2B%20PostGIS-111828?style=for-the-badge)](#-technology)
[![Stage](https://img.shields.io/badge/Stage-Pre--revenue%20pilot%20\(Karachi\)-f59e0b?style=for-the-badge)](#-traction)

📊 **[Pitch Deck](./USTAZ-Pitch-Deck.pdf)** · 🌐 **[Live MVP](https://ustaz-bice.vercel.app)**

</div>

---

## What is USTAZ?

USTAZ is building the **transaction infrastructure for Pakistan's fragmented home-service economy**.

Most home-service transactions stop at:

> "I found a guy. He'll come."

USTAZ is designed to carry the transaction much further:

```text
Find
  ↓
Verify
  ↓
Track
  ↓
Diagnose
  ↓
Quote
  ↓
Approve
  ↓
Work
  ↓
Verify completion
  ↓
Protect
  ↓
Build reputation
```

The goal is simple:

> **Every home-service job should have an identity, a price, an approval, a record, and a path to recourse.**

---

## 🎯 One-liner

> **USTAZ connects households with verified local professionals, tracks their arrival in real time, and is building a complete digital record around every service job — from diagnosis and approval to completion and warranty.**

---

## 🪔 Vision

Make trusted home services as easy to book as a ride — without importing the uncertainty of informal service markets into a digital app.

A customer should know:

* **Who** is coming
* **Where** they are
* **What** they found
* **What** it will cost
* **What** was approved
* **What** was repaired
* **What** happens if the repair fails

At the same time, skilled professionals should gain something the informal market rarely gives them:

> **A portable digital reputation that compounds with every successful job.**

USTAZ is building this first in Karachi, then across Pakistan.

---

# 🔴 The Problem

Pakistan's home-service market is fragmented, informal and difficult to verify.

Finding a technician is often easy.

Knowing whether the transaction itself is trustworthy is the hard part.

| Marketplace weakness         | What goes wrong                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| **Identity uncertainty**     | A customer may not know enough about the person entering their home                         |
| **Arrival uncertainty**      | Customers receive an ETA but can still be left waiting without live visibility              |
| **Price uncertainty**        | The real labor price can emerge only after diagnosis and during an on-site negotiation      |
| **Approval gap**             | Customers may agree to work without a structured record of exactly what they approved       |
| **Evidence gap**             | There may be no record of the original fault, replacement part or completed work            |
| **Communication leakage**    | Moving the conversation outside the platform removes important context from the transaction |
| **Weak recourse**            | When a repair fails, customers may have no structured dispute or evidence trail             |
| **Reputation fragmentation** | Good professionals repeatedly start from zero because their history isn't portable          |
| **Provider instability**     | Skilled workers lack predictable demand and a digital reputation that follows their work    |

The opportunity isn't simply to digitize phone numbers.

It's to **digitize trust around the entire transaction.**

---

# 🧠 The USTAZ Transaction Model

USTAZ is designed around a continuous service lifecycle.

```text
┌──────────────────────────────────┐
│            DISCOVERY             │
│      Find the right service      │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│           VERIFICATION           │
│       Know who is coming         │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│             TRACKING             │
│       Know where they are        │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│            DIAGNOSIS             │
│      Understand the problem      │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│         QUOTE + APPROVAL         │
│       Know the price first       │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│          PROOF OF WORK           │
│     Record what was repaired     │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│            COMPLETION             │
│      Customer confirms job       │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│       WARRANTY / DISPUTE         │
│      Protection after service    │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│           REPUTATION             │
│      Every job builds trust      │
└──────────────────────────────────┘
```

This is the product thesis behind USTAZ.

---

# ✅ What USTAZ Does Today

### 📍 Live provider matching

Customers select a service and location.

**PostGIS** matches available nearby professionals using geographic proximity.

### 🛡️ Phone-verified professionals

Providers authenticate through phone OTP before participating in the marketplace.

### 🗺️ Live GPS tracking

Once a provider accepts a job, the customer can see their movement, distance and ETA.

### 💬 In-app communication

Customers and providers can communicate through the platform with push notifications supporting job events.

### ⭐ Two-way reputation

Customers and providers can rate each other after completed jobs, creating a reputation layer around the marketplace.

### 🛡️ 3-day re-fix warranty

Completed jobs are covered by a **3-day free re-fix guarantee** as part of the USTAZ service proposition.

### 💳 Provider wallet + commission

USTAZ operates a provider-side prepaid wallet with a 12% commission on completed, customer-confirmed jobs.

---

# 🚀 The Next Layer: Transaction Integrity

The MVP establishes the marketplace foundation.

The next stage is making the **job itself verifiable**.

## 💰 Quote Before Work

A provider should never begin significant work without a customer-approved quote.

```text
Diagnosis
    ↓
Labor estimate
    +
Material estimate
    ↓
Customer receives quote
    ↓
Approve
    ↓
Work begins
```

The approved quote becomes part of the job record.

> **No approval. No work.**

This removes the ambiguity between "what the technician said" and "what the customer actually agreed to."

---

## 📸 Proof of Work

USTAZ is designed to capture evidence throughout the job.

### Before

**Diagnosis photo**

What was wrong?

### Quote

**Itemized estimate**

What was approved?

### After

**Replacement / completion evidence**

What was actually done?

### Completion

**Customer confirmation**

Was the job completed?

The result is a structured service record rather than a simple booking.

```text
Fault
 ↓
Evidence
 ↓
Diagnosis
 ↓
Quote
 ↓
Customer approval
 ↓
Repair
 ↓
Completion evidence
 ↓
Customer confirmation
```

---

# 🧾 USTAZ Job Passport

Every completed job is designed to become a **Job Passport** — a structured digital record of the service.

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        USTAZ JOB PASSPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job ID
UZ-18492

Service
Plumbing

Professional
Ali Ahmed
✓ Phone Verified

Arrival
14:32

Diagnosis
Flush mechanism replacement

Approved Quote
Labor       Rs. 500
Material    Rs. 900
Total       Rs. 1,400

Evidence
✓ Diagnosis documented
✓ Replacement documented

Completion
✓ Customer confirmed

Warranty
3 days

Rating
★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Over time, these records can become the foundation for:

* smarter provider matching
* service-quality scoring
* better price estimation
* fraud detection
* warranty decisions
* demand forecasting
* provider reputation

The long-term advantage is the **structured history of real service transactions**.

---

# 🛡️ Protection by Design

Trust doesn't end when the technician leaves.

USTAZ's protection model connects the job's history to what happens afterward.

```text
Completed Job
      ↓
Customer Confirmation
      ↓
Warranty Window
      ↓
Issue reported?
      ↓
Review original job record
      ↓
Quote + evidence + completion history
      ↓
Resolution
```

### Escrow-linked protection

The provider wallet and payment architecture are being extended toward a dispute-aware flow:

```text
Job completed
      ↓
Customer confirmation
      ↓
Protection window
      │
      ├── No dispute → release
      │
      └── Dispute → hold → review → resolution
```

The objective:

> **Money should follow the verified state of the job.**

---

# 💬 Keep the Transaction on USTAZ

The platform should be more than the place where a customer discovers a technician.

It should remain useful throughout the job.

```text
Booking
  ↓
Chat
  ↓
Diagnosis
  ↓
Quote
  ↓
Approval
  ↓
Job updates
  ↓
Completion
  ↓
Warranty
  ↓
Reputation
```

The customer and professional can build a long-term relationship.

But the **transaction record remains with USTAZ**.

That creates value for both sides.

---

# ⭐ Reputation That Compounds

A professional shouldn't have to start from zero every time they meet a new customer.

Every successful USTAZ job can strengthen their marketplace reputation.

```text
Completed Jobs
      +
Customer Ratings
      +
On-Time Performance
      +
Completion Rate
      +
Warranty History
      +
Dispute History
      ↓
Professional Reputation
```

A strong provider earns greater visibility and future demand.

Customers can also save trusted professionals for repeat bookings.

```text
First booking
      ↓
Successful service
      ↓
Customer trusts provider
      ↓
Favorite provider
      ↓
Repeat booking
      ↓
More provider income
      ↓
Provider stays on USTAZ
```

The marketplace becomes stronger with every completed transaction.

---

# 💡 Why This Model Matters

USTAZ isn't trying to win by becoming a giant directory of service categories.

The core product is **transaction trust**.

Traditional flow:

```text
Find a worker
     ↓
Call
     ↓
Wait
     ↓
Negotiate
     ↓
Pay
     ↓
Hope the repair holds
```

USTAZ's target flow:

```text
Find
 ↓
Verify
 ↓
Track
 ↓
Diagnose
 ↓
Quote
 ↓
Approve
 ↓
Repair
 ↓
Verify completion
 ↓
Protect
 ↓
Build reputation
```

The difference is accountability.

---

# 💸 Business Model

USTAZ uses a provider-side service fee designed around *ujrah* rather than hidden customer charges.

### Provider onboarding credit

Every new provider receives:

**Rs. 500 welcome credit**

This is a non-cash virtual token used against future platform fees.

### 12% completed-job commission

USTAZ charges:

**12% of the completed, customer-confirmed job**

Example:

```text
Job value       Rs. 500
USTAZ fee        Rs. 60
Provider earns  Rs. 440
```

### Provider wallet

| Package  |        Amount | Intended use        |
| -------- | ------------: | ------------------- |
| Starter  |   **Rs. 500** | Trial               |
| Standard | **Rs. 1,000** | Regular work        |
| Pro      | **Rs. 2,000** | Full-time providers |

Top-ups are currently supported through **Easypaisa, JazzCash and bank transfer** with receipt-based admin crediting.

> **Status:** the 12% monetization engine is live in-product. USTAZ is currently pre-revenue during the pilot while providers operate using initial promotional credit.

---

# 📊 Market

|                  | Figure    | Basis                                              |
| ---------------- | --------- | -------------------------------------------------- |
| **TAM**          | ~$3–5B    | Pakistan home services · illustrative              |
| **SAM**          | ~$600M    | Smartphone-enabled urban households · illustrative |
| **SOM — Year 1** | ~PKR 1.4M | 5,000 households × 4 jobs/year × PKR 72 commission |

*Market figures are directional estimates and will be validated during the Karachi pilot.*

---

# 🏗️ Technology

| Layer              | Technology                                             |
| ------------------ | ------------------------------------------------------ |
| **Frontend**       | Next.js 15, App Router, Turbopack, React, Tailwind CSS |
| **Mobile**         | PWA + Capacitor                                        |
| **Database**       | Supabase Postgres                                      |
| **Geospatial**     | PostGIS                                                |
| **Realtime**       | Supabase Realtime                                      |
| **Backend**        | Supabase Edge Functions / Deno                         |
| **Authentication** | Phone OTP / Twilio Verify                              |
| **Push**           | Firebase Cloud Messaging                               |
| **Maps**           | Google Maps                                            |
| **Email**          | Resend                                                 |
| **Security**       | Row-Level Security + `SECURITY DEFINER` RPCs           |
| **Sessions**       | Cookie-backed authenticated sessions                   |

### Engineering principles

* RLS enforced across application data
* Privileged database operations isolated behind validated RPCs
* `auth.uid()` checked inside security-sensitive operations
* Geographic matching handled through PostGIS
* Realtime state changes propagated through Supabase Realtime
* Provider location handled through live GPS updates

---

# 🚀 Traction

* **Production MVP:** live web application and installable PWA.
* **8+ core systems:** phone OTP authentication, PostGIS matching, live GPS, chat, push notifications, provider wallet, commission engine, warranty, ratings and admin tooling.
* **Security architecture:** RLS across application tables with security-sensitive operations handled through validated database functions.
* **Self-funded:** built with **Rs. 0 external capital**.
* **Karachi pilot:** focused on validating supply, demand, trust and repeat usage before geographic expansion.

USTAZ's early provider acquisition has included direct outreach, WhatsApp communities, Facebook groups, printed A5 material and face-to-face conversations with local businesses in Malir. This produced **15–16 provider registrations before the app existed**.

The original discovery work also surfaced recurring marketplace problems around late arrivals, price mismatches, off-platform provider contact and the difficulty of pricing different repair jobs.

---

# 🧭 Roadmap

### Now

* Karachi supply acquisition
* Customer acquisition
* Quote-before-work architecture
* Provider reputation
* Transaction reliability

### Next

* Binding quote approval
* Diagnosis and replacement-part evidence
* In-app-first communication signals
* Dispute-aware escrow
* Favorite providers
* Repeat booking

### Later

* Deeper provider verification
* Automated payment reconciliation
* Native iOS / Android applications
* Smarter price estimation
* AI-assisted diagnosis
* Predictive matching
* Provider quality intelligence
* B2B maintenance services

The roadmap is intentionally focused on **transaction quality before geographic expansion**.

---

# 👥 Team

|                           | Role                                    |                                                                    |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| **Marjan Ahmed**          | Founder & CEO · Hacker/CTO              | Full-stack engineer building the USTAZ platform and infrastructure |
| **Masood Alam**           | Product Director & Financial Consultant | Product strategy, financial model and marketplace economics        |
| **Muhammad Sufyan Ahmed** | CMO & Designer                          | Brand, growth and product design                                   |

USTAZ is intentionally lean during the pilot. Provider acquisition and verification are being approached through local relationships, direct outreach and batch onboarding.

---

# 🧑‍💻 Getting Started

```bash
npm install

npm run dev          # Start Turbopack development server
npm run build        # Create production build
npm run start        # Serve production build
npm run lint         # Run ESLint
```

Architecture, invariants and contribution notes:

[`CLAUDE.md`](./CLAUDE.md)

Legal:

[Terms](./src/app/terms) · [Privacy](./src/app/privacy-policy) · [Cookies](./src/app/cookie-policy)

---

# 📌 Product Thesis

> **Home services shouldn't depend on trust alone. The platform should create the evidence.**

USTAZ is building that evidence layer:

**Identity → Location → Diagnosis → Price → Approval → Work → Proof → Completion → Protection → Reputation**

Every completed job makes the next transaction more trustworthy.

---

<div align="center">

# USTAZ

### استاذ

**Trusted home services, with proof.**

Karachi, Pakistan · [ustaz-bice.vercel.app](https://ustaz-bice.vercel.app)

Built with Multiple AI Agents

</div>
