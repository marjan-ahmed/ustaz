import React from 'react';import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReadingTime from '../components/ReadingTime';

export const metadata = {
  title: 'Terms of Use — Ustaz',
  description:
    'Terms of Use for the Ustaz platform connecting customers with trust-professionals in Pakistan.',
};

const LAST_UPDATED = '1 August 2026';

// TODO(legal): placeholders — replace before public launch.
// Ustaz is not yet an incorporated company and these mailboxes are not live.
const OPERATOR = 'Ustaz';
const CONTACT_EMAIL = 'support@ustaz.app';
const LEGAL_EMAIL = 'legal@ustaz.app';
const CONTACT_WHATSAPP = '+92 305 1126649';

const sections = [
  ['acceptance', '1. Acceptance & Modification'],
  ['definitions', '2. Definitions'],
  ['marketplace', '3. The Ustaz Marketplace'],
  ['eligibility', '4. Eligibility'],
  ['customer-account', '5. Customer Account'],
  ['provider-onboarding', '6. Ustaz Provider Onboarding & Representations'],
  ['verification-disclaimer', '7. Verification & Trust Badges Disclaimer'],
  ['state-machine', '8. Service Requests & Status Workflow'],
  ['pricing-fees', '9. Pricing, Fees & Commission'],
  ['wallet-settlement', '10. Provider Wallet, Top-ups & Settlement'],
  ['ratings', '11. Ratings & Reviews'],
  ['warranty', '12. Service Warranty — 3-Day Free Re-fix'],
  ['tracking', '13. Real-time Location Tracking'],
  ['communications', '14. Communications (Chat, Calls, Push)'],
  ['prohibited', '15. Prohibited Conduct'],
  ['suspension', '16. Suspension, Strikes & Termination'],
  ['standing', '17. Provider Standing, Tiers & Automated Decisions'],
  ['incidents', '18. Safety Incidents & Check-ins'],
  ['appeals', '19. Appeals'],
  ['warranties', '20. Disclaimer of Warranties'],
  ['liability', '21. Limitation of Liability'],
  ['indemnity', '22. Indemnification'],
  ['dispute', '23. Dispute Resolution'],
  ['law', '24. Governing Law'],
  ['sharia', '25. Sharia Compliance'],
  ['misc', '26. Miscellaneous'],
  ['contact', '27. Contact'],
] as const;

export default function TermsOfUse() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
          <header className="border-b border-gray-200 pb-8 mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Terms of Use
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last updated: <span className="font-medium text-gray-700">{LAST_UPDATED}</span>
              <ReadingTime targetId="terms-article" />
            </p>
            <p className="mt-6 text-base text-gray-700 leading-6 sm:leading-7">
              These Terms of Use (the &ldquo;<strong>Terms</strong>&rdquo;) govern your access to
              and use of the Ustaz platform (the &ldquo;<strong>Platform</strong>&rdquo;), operated
              in the Islamic Republic of Pakistan. Please read these Terms carefully. By creating an
              account, requesting a service, or registering as an Ustaz Provider, you agree to be
              bound by these Terms and our{' '}
              <Link href="/privacy-policy" className="text-[#db4b0d] underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              <strong>Important:</strong> Ustaz is a marketplace that connects you with independent
              trust-professionals. Ustaz does <strong>not</strong> itself provide plumbing,
              electrical, or any other physical services, and is <strong>not</strong> an employer of
              the Providers listed on the Platform.
            </div>
          </header>

          <nav aria-label="Table of contents" className="mb-12">
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Table of contents</h2>
                <span className="text-sm text-gray-500">{sections.length}</span>
              </div>
              <ol className="text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map(([id, label], idx) => (
                  <li key={id} className="">
                    <a href={`#${id}`} className="flex items-center gap-3 text-gray-700 hover:text-[#db4b0d]">
                      <span className="flex-none w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                      <span className="truncate">{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article id="terms-article" className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-li:leading-7">

            <h2 className='text-2xl font-extrabold mt-6'  id="acceptance">1. Acceptance &amp; Modification</h2>
            <p>
              By accessing or using the Platform, you agree to these Terms and any policies referenced
              herein, including our Privacy Policy. If you do not agree, you must not use the
              Platform.
            </p>
            <p>
              We may update these Terms from time to time. Material changes will be announced in-app
              and by notification at least <strong>30 days</strong> before they take effect. Your
              continued use of the Platform after the effective date constitutes acceptance of the
              updated Terms.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="definitions">2. Definitions</h2>
            <ul>
              <li><strong>&ldquo;Customer&rdquo;</strong> &mdash; a user who creates a Service Request through the Platform.</li>
              <li><strong>&ldquo;Ustaz&rdquo;</strong> or <strong>&ldquo;Provider&rdquo;</strong> &mdash; an independent trust-professional verified by phone OTP who offers services through the Platform.</li>
              <li><strong>&ldquo;Service Request&rdquo;</strong> &mdash; an order placed by a Customer for a category of home service (plumbing, electrical, carpentry, AC maintenance, solar, etc.).</li>
              <li><strong>&ldquo;Platform&rdquo;</strong> &mdash; the Ustaz web application, mobile applications, APIs, and supporting infrastructure.</li>
              <li><strong>&ldquo;Wallet&rdquo;</strong> &mdash; a Provider&apos;s prepaid balance held by Ustaz to settle platform fees.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="marketplace">3. The Ustaz Marketplace</h2>
            <p>
              Ustaz operates a <strong>technology platform</strong> that connects Customers with
              independent Providers in their geographic vicinity. Ustaz does not perform any
              physical service, does not employ the Providers, and does not control how a Provider
              performs work, sets prices for materials, or conducts the day-to-day operation of
              their service.
            </p>
            <p>
              Providers operate as <strong>independent contractors</strong>. The agreement to
              perform the service is formed directly between the Customer and the Provider upon
              acceptance of a Service Request.
            </p>
            <p>
              Ustaz operates an <strong>admin portal</strong> for internal operations, including
              provider verification review, wallet top-up approval, and platform monitoring. The
              admin portal uses a separate, isolated session and is accessible only to authorised
              Ustaz personnel.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="eligibility">4. Eligibility</h2>
            <ul>
              <li>You must be at least <strong>18 years old</strong> to use the Platform.</li>
              <li>You must be a resident of, or physically present in, the Islamic Republic of Pakistan (initial launch).</li>
              <li>You must possess the legal capacity to enter into a binding contract.</li>
              <li>You may not use the Platform if you have previously been suspended or removed for cause.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="customer-account">5. Customer Account</h2>
            <p>
              Customer accounts are verified by phone OTP via SMS. One verified phone number = one
              account. You are responsible for maintaining the confidentiality of your account and
              for all activity on your account. You must promptly notify us of any unauthorized use
              by contacting{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#db4b0d] underline">{CONTACT_EMAIL}</a>.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="provider-onboarding">6. Ustaz Provider Onboarding &amp; Representations</h2>
            <p>By registering as a Provider, you represent and warrant that:</p>
            <ol>
              <li>You are at least <strong>18 years old</strong>;</li>
              <li>You possess any <strong>government license, certification, permit, or qualification</strong> required to perform the service category you offer in the city/province where you operate;</li>
              <li>You will perform every Service Request with <strong>reasonable skill and care</strong> consistent with professional trade standards;</li>
              <li>You carry <strong>personal liability</strong> for any property damage, injury, or loss caused by your conduct during a service;</li>
              <li>You consent to <strong>identity verification, CNIC validation, and (where lawful) background checks</strong> performed by Ustaz or its vendors;</li>
              <li>You acknowledge that you are an <strong>independent contractor</strong>, not an employee, agent, or partner of Ustaz;</li>
              <li>You will not solicit Customers off-platform to avoid platform commission.</li>
            </ol>
            <p>
              <strong>CNIC verification is mandatory.</strong> During registration you must enter your
              CNIC number and upload a photograph of your CNIC. The typed number is checked against the
              uploaded image by an <strong>automated optical character recognition (OCR) service</strong>,
              and the outcome is recorded against your account. Ustaz may additionally require you to
              submit CNIC front and back images and a selfie for <strong>manual review</strong> by
              authorised personnel.
            </p>
            <p>
              Until your identity is marked <strong>verified</strong>, you cannot switch yourself online
              and will not receive Service Requests. An automated verification outcome you believe to be
              wrong can be challenged under &sect;&nbsp;19.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="verification-disclaimer">7. Verification &amp; Trust Badges Disclaimer</h2>
            <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 my-4">
              <p className="mb-0">
                Any badges or labels such as &ldquo;<strong>Verified Ustaz</strong>&rdquo;,
                &ldquo;<strong>KYC Approved</strong>&rdquo;, &ldquo;<strong>Top Rated</strong>&rdquo;,
                or similar indicate <strong>only</strong> that the Provider has completed Ustaz&apos;s
                onboarding workflow at the time of verification. Such labels do{' '}
                <strong>not</strong> constitute Ustaz&apos;s endorsement, vouching, or guarantee of
                the Provider&apos;s character, present qualifications, skill, integrity, or fitness
                for any particular job. Ustaz makes no representation or warranty regarding any
                Provider beyond the fact that the listed verification steps were completed.
              </p>
            </div>

            <h2 className='text-2xl font-extrabold mt-6' id="state-machine">8. Service Requests &amp; Status Workflow</h2>
            <p>A Service Request progresses through the following states:</p>
            <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 overflow-x-auto">
              notified_multiple → accepted → provider_enroute → arriving → arrived → in_progress → work_in_progress → completed
            </p>
            <p>Terminal (non-progressing) states: <code>cancelled</code>, <code>rejected</code>, <code>no_ustaz_found</code>.</p>
            <p>
              When you create a Service Request we search for available Providers in{' '}
              <strong>expanding rings — 5 km, then 10 km, then 15 km</strong> — stopping at the first
              ring that contains at least one matching Provider. If no Provider is found in any ring,
              the request ends in <code>no_ustaz_found</code> and you are not charged anything.
            </p>
            <h3>Cancellation</h3>
            <ul>
              <li><strong>Before acceptance</strong>: free.</li>
              <li><strong>After acceptance, before the Provider arrives</strong>: free for the Customer.</li>
              <li><strong>After the Provider has arrived (status <code>arrived</code> or later)</strong>: the Customer is responsible for the <strong>visiting fee</strong> for the applicable distance tier set out in &sect;&nbsp;9.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="pricing-fees">9. Pricing, Fees &amp; Commission</h2>
            <p>
              <strong>Cash flows between Customer and Provider directly.</strong> The Customer pays
              the Provider the agreed service fee plus the actual cost of any parts/materials
              purchased on the Customer&apos;s behalf (with receipt). Ustaz is <strong>not</strong>{' '}
              the merchant of record for any materials.
            </p>
            <h3>Visiting fee (paid by the Customer to the Provider)</h3>
            <p>
              Every accepted Service Request carries a <strong>visiting fee</strong>, calculated
              automatically from the road distance between the Provider and your service address at
              the moment of acceptance:
            </p>
            <table className="w-full text-sm my-4 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Distance</th>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Visiting fee</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-2 border-b border-gray-100">Up to 5 km</td><td className="px-3 py-2 border-b border-gray-100"><strong>PKR 500</strong></td></tr>
                <tr><td className="px-3 py-2 border-b border-gray-100">Over 5 km and up to 10 km</td><td className="px-3 py-2 border-b border-gray-100"><strong>PKR 1,000</strong></td></tr>
                <tr><td className="px-3 py-2">Over 10 km</td><td className="px-3 py-2"><strong>PKR 1,500</strong></td></tr>
              </tbody>
            </table>
            <p>
              The visiting fee covers the Provider&apos;s call-out and diagnosis. It is paid in cash
              by the Customer directly to the Provider and is <strong>separate from</strong> the cost
              of the repair work itself and of any parts or materials, which you and the Provider
              agree between yourselves. Where the distance cannot be determined, the highest tier
              (PKR 1,500) applies.
            </p>
            <h3>Platform commission (paid by the Provider to Ustaz)</h3>
            <p>
              Ustaz charges the Provider a commission of <strong>12% of the visiting fee</strong> —
              that is, PKR 60, 120, or 180 depending on the tier above. This amount is deducted from
              the Provider&apos;s Wallet <strong>at the moment the Provider marks the job{' '}
              <code>arrived</code></strong>, not on completion. If the Provider&apos;s Wallet holds
              less than the commission due, only the available balance is taken and the shortfall is
              not carried forward. Completion itself carries no further charge.
            </p>
            <p>
              Customers pay Ustaz nothing. The commission is charged solely to the Provider and is
              the only money Ustaz takes from any job. This structure may change with prior notice
              under &sect;&nbsp;1.
            </p>
            <p>
              <strong>Taxes.</strong> Providers are responsible for the declaration and payment of
              their own income tax, sales tax, and other taxes arising from services rendered.
              Ustaz may, where required by Pakistani law, withhold tax at source and issue a
              statement.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="wallet-settlement">10. Provider Wallet, Top-ups &amp; Settlement</h2>
            <ul>
              <li>
                <strong>Minimum balance to go online.</strong> A Provider must hold at least{' '}
                <strong>PKR 60</strong> in their Wallet to switch themselves online and start
                receiving Service Requests. Attempting to go online below this threshold is refused
                with an on-screen message stating the current balance. Identity verification must
                also be complete (see &sect;&nbsp;6).
              </li>
              <li>
                Going online is blocked <em>at the moment you try to switch on</em>. A Provider who
                is already online and whose balance later falls below PKR 60 — or to zero — is{' '}
                <strong>not</strong> forced offline mid-session, but will be unable to go back online
                after switching off until the Wallet is topped up.
              </li>
              <li>Top-ups may be made via <strong>JazzCash</strong> or <strong>Easypaisa</strong>, by submitting the transaction amount, the payment reference, and a photograph of the payment receipt.</li>
              <li>Top-ups are reviewed manually by Ustaz operations and credited to the Wallet typically within <strong>24 hours</strong> of receipt verification. A top-up may be rejected where the receipt is unreadable, the reference cannot be matched, or the amount does not correspond.</li>
              <li>Wallet balances are non-refundable except where a Provider closes their account in good standing with no outstanding fees, in which case the remaining balance is paid out via the Provider&apos;s registered method within 30 days.</li>
              <li>
                <strong>Deductions.</strong> The Wallet may be debited for (a) the{' '}
                <strong>12% platform commission, charged when the Provider marks a job{' '}
                <code>arrived</code></strong> (see &sect;&nbsp;9); (b) a{' '}
                <strong>warranty-refusal penalty of PKR 200</strong> where a Provider declines a valid
                warranty claim (see &sect;&nbsp;12); and (c) any <strong>incident penalty</strong>{' '}
                applied following a substantiated safety or conduct incident (see &sect;&nbsp;18).
                Every deduction is recorded in the Provider&apos;s in-app transaction ledger with the
                balance before and after.
              </li>
              <li>Deductions are floored at the available balance — a Wallet is never driven negative, and an unpaid shortfall is not carried forward as a debt.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="ratings">11. Ratings &amp; Reviews</h2>
            <p>
              After every completed Service Request, both Customer and Provider may rate the other
              from 1 to 5 stars with an optional comment. One rating per party per request. Ratings
              are subject to our Content Policy &mdash; Ustaz reserves the right to remove reviews
              that contain defamatory content, personal attacks, profanity, or violate applicable
              law.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="warranty">12. Service Warranty &mdash; 3-Day Free Re-fix</h2>
            <p>
              To protect Customers, every completed Service Request carries a{' '}
              <strong>3-day workmanship warranty</strong>. If the same issue that was serviced
              recurs within <strong>three (3) calendar days</strong> of the job being marked{' '}
              <code>completed</code>, the Customer may submit a <strong>warranty claim</strong>{' '}
              from their <Link href="/history" className="text-[#db4b0d] underline">My Jobs</Link>{' '}
              history page.
            </p>
            <h3>How a claim works</h3>
            <ul>
              <li>The Customer files the claim within the 3-day window, optionally describing the recurring problem. One claim may be filed per completed Service Request.</li>
              <li>The matched Provider is notified immediately and must <strong>Accept</strong> (agree to return and re-fix the issue at no additional labour charge) or <strong>Refuse</strong> the claim.</li>
              <li>The re-fix covers the <strong>original workmanship only</strong>. New problems, unrelated faults, damage caused by misuse, third-party tampering, or the cost of genuinely new parts/materials are <strong>not</strong> covered and may be charged separately by agreement.</li>
            </ul>
            <h3>Provider obligations &amp; penalties</h3>
            <ul>
              <li>A Provider who <strong>accepts</strong> a valid claim must return within a reasonable time and remedy the recurring issue free of labour charge.</li>
              <li>A Provider who <strong>refuses</strong> a valid claim incurs a <strong>PKR 200 penalty</strong>, deducted from their Wallet (floored at zero), and a <strong>warranty strike</strong> recorded against their account. Accumulated strikes may lead to reduced visibility, suspension, or removal under &sect; 16.</li>
              <li>Ustaz is a facilitator of the warranty process, not the performer of the re-fix. The warranty is an obligation <strong>between the Customer and the Provider</strong>; Ustaz does not itself guarantee the quality or outcome of any re-fix work (see &sect; 20).</li>
            </ul>
            <p className="text-sm bg-amber-50 border border-amber-200 px-4 py-3 rounded">
              <strong>Note:</strong> the warranty window is fixed at 3 days from completion and cannot be
              extended retroactively. Filing a claim after the window has elapsed is not possible.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="tracking">13. Real-time Location Tracking</h2>
            <p>
              <strong>Customer.</strong> When you create a Service Request, you consent to the
              Provider seeing your service address. After a Provider accepts, you consent to seeing
              the Provider&apos;s real-time GPS location until the service is completed.
            </p>
            <p>
              <strong>Provider.</strong> Your real-time GPS location is broadcast{' '}
              <strong>only</strong> while you have an active accepted Service Request and{' '}
              <strong>only</strong> to the matched Customer. Continuous tracking stops the moment the
              request reaches <code>completed</code> or <code>cancelled</code>, and the live-location
              record for that request is deleted.
            </p>
            <p>
              <strong>One exception.</strong> If a safety incident has been opened, Ustaz may send you
              a <strong>check-in prompt</strong>, and your GPS position at the moment you respond is
              recorded against that check-in (see &sect;&nbsp;18). This can occur outside an active
              Service Request. It is a single position captured when you answer the prompt — not
              continuous tracking — and it exists so that a Provider or Customer in difficulty can be
              located.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="communications">14. Communications (Chat, Calls, Push)</h2>
            <ul>
              <li>
                <strong>In-app chat</strong> messages between Customer and Provider are visible to
                Ustaz operations for safety and dispute-resolution purposes. Do not share sensitive
                financial information through chat.
              </li>
              <li>
                <strong>Follow-up window</strong>: You can send messages to the other party for up to{' '}
                <strong>7 days</strong> after a Service Request is marked completed. After this
                window, the chat becomes read-only.
              </li>
              <li>
                <strong>Immutability</strong>: Once sent, chat messages cannot be edited or deleted
                by either party. This preserves a reliable record for dispute resolution.
              </li>
              <li>
                <strong>Phone calls</strong> are routed through the dialer of your device; Ustaz
                does not record voice calls.
              </li>
              <li>
                <strong>Push notifications</strong> are delivered via Firebase Cloud Messaging.
                Transactional pushes (request alerts, status updates) are required for the Platform
                to function and cannot be disabled without losing core features. Marketing pushes
                require separate opt-in.
              </li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="prohibited">15. Prohibited Conduct</h2>
            <p>You may not:</p>
            <ul>
              <li>Misrepresent your identity, qualifications, or service category;</li>
              <li>Solicit Customers off-platform to avoid commission;</li>
              <li>Share, sell, or transfer your account credentials;</li>
              <li>Use the Platform for fraudulent, illegal, or deceptive purposes;</li>
              <li>Harass, threaten, or discriminate against any user on the basis of religion, sect, gender, ethnicity, disability, or any protected characteristic;</li>
              <li>Carry weapons, illegal substances, or any contraband while performing a service;</li>
              <li>Scrape, reverse-engineer, or otherwise misuse the Platform&apos;s infrastructure.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="suspension">16. Suspension, Strikes &amp; Termination</h2>
            <p>
              Ustaz may, at its sole discretion, suspend or permanently terminate your account for
              violating these Terms, sustained low ratings (below 3.0 over a meaningful sample),
              <strong>repeated warranty strikes</strong> (see &sect; 12), fraudulent top-ups, false
              KYC information, non-payment of platform fees, or any activity that endangers other
              users. You may close your account at any time via the account settings.
            </p>
            <p>
              <strong>Warranty strikes.</strong> Each refusal of a valid warranty claim adds a strike
              to a Provider&apos;s record. A pattern of strikes signals unreliable workmanship and may
              result in reduced search visibility, temporary suspension, or permanent removal,
              independent of any monetary penalty already applied.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="standing">17. Provider Standing, Tiers &amp; Automated Decisions</h2>
            <p>
              Ustaz maintains a <strong>standing record</strong> for every Provider, and a{' '}
              <strong>performance record</strong> for each service category a Provider works in.
              These records drive how often you are matched with Customers and whether restrictions
              apply to your account.
            </p>
            <h3>What is measured</h3>
            <ul>
              <li><strong>Standing</strong>: your current tier, the date and stated reason for the most recent tier change, whether a suspension is active (and until when), your total completed jobs, your overall average rating, and any remaining <strong>probation jobs</strong>.</li>
              <li><strong>Performance, per category</strong>: completed jobs, average rating, a <strong>recency-weighted average</strong> that gives more weight to recent jobs than to older ones, your incident count, and the number of complaints against you that were assessed as <strong>justified</strong> versus <strong>disputed</strong>.</li>
            </ul>
            <h3>Automated processing</h3>
            <p>
              Some consequences follow automatically from these records — including changes to your
              tier, placement on probation, reduced matching visibility, and in some cases an
              automatic suspension. You have the right to:
            </p>
            <ul>
              <li>Be told the <strong>reason</strong> recorded for any tier change or suspension;</li>
              <li>Request <strong>human review</strong> of an automated outcome through the appeals process in &sect;&nbsp;19;</li>
              <li>Have a complaint you successfully dispute recorded as <strong>disputed</strong> rather than justified, so it does not count against you in the same way.</li>
            </ul>
            <p>
              Ratings and complaints from a Customer who is found to have acted abusively or in bad
              faith may be disregarded at Ustaz&apos;s discretion.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="incidents">18. Safety Incidents &amp; Check-ins</h2>
            <p>
              Either party may report a <strong>safety or conduct incident</strong> arising from a
              Service Request. Incidents are recorded with a type, a severity, and any evidence
              submitted, and are reviewed by authorised Ustaz personnel.
            </p>
            <h3>How an incident is handled</h3>
            <ul>
              <li>The report is logged against the Service Request and the parties involved.</li>
              <li><strong>Both sides are given the opportunity to respond.</strong> The Provider&apos;s response and the Customer&apos;s response are recorded separately, and a written resolution is entered when the review concludes.</li>
              <li>Where an incident is substantiated, Ustaz may apply an <strong>incident penalty</strong> debited from the Provider&apos;s Wallet, record the incident against the Provider&apos;s performance, adjust standing under &sect;&nbsp;17, or suspend the account under &sect;&nbsp;16.</li>
              <li>The outcome of an incident may be appealed under &sect;&nbsp;19.</li>
            </ul>
            <h3>Safety check-ins</h3>
            <p>
              Where an incident is open, Ustaz may send a <strong>check-in prompt</strong> asking you
              to confirm you are safe. Your response — and your <strong>GPS position at the moment you
              respond</strong> — is recorded against that check-in. Check-ins may be sent outside an
              active Service Request. Responding is voluntary, but a check-in that goes unanswered may
              itself be escalated as a safety concern.
            </p>
            <p className="text-sm bg-red-50 border border-red-200 px-4 py-3 rounded">
              <strong>Emergencies:</strong> Ustaz is not an emergency service and does not monitor
              incidents around the clock. If you are in immediate danger, contact the police (
              <strong>15</strong>) or Rescue (<strong>1122</strong>) first, then report the incident
              through the Platform.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="appeals">19. Appeals</h2>
            <p>
              If you believe a penalty, strike, tier change, suspension, or incident outcome was
              applied in error, you may <strong>submit an appeal</strong> from your account. This is
              your route to human review of any automated decision described in &sect;&nbsp;17.
            </p>
            <ul>
              <li>An appeal records the <strong>type</strong> of decision being appealed, your written <strong>reason</strong>, the related incident where applicable, and any <strong>evidence</strong> you attach.</li>
              <li>Appeals are reviewed by authorised Ustaz personnel — not by the automated system that produced the original outcome.</li>
              <li>You receive a written <strong>response</strong> recording the decision and who reviewed it.</li>
              <li>A successful appeal reverses the associated penalty or restriction. Where a monetary penalty was debited from your Wallet, it is credited back and recorded in your transaction ledger.</li>
              <li>Submitting an appeal does not pause a suspension while it is under review, unless Ustaz decides otherwise.</li>
            </ul>
            <p>
              Appeals are separate from the general dispute process in &sect;&nbsp;23, which governs
              disputes between you and Ustaz that the appeal process does not resolve.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="warranties">20. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm bg-gray-50 border border-gray-200 px-4 py-3 rounded">
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, either express or implied. Ustaz expressly disclaims all
              warranties of merchantability, fitness for a particular purpose, non-infringement,
              and any warranty arising out of course of dealing or usage of trade. Ustaz does{' '}
              <strong>not</strong> warrant the quality, safety, legality, accuracy, or reliability
              of any Provider&apos;s services.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="liability">21. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Pakistani law, Ustaz&apos;s total aggregate
              liability to any user shall not exceed the higher of (a){' '}
              <strong>PKR 25,000</strong>, or (b) the total platform fees you paid to Ustaz in the{' '}
              <strong>12 months preceding</strong> the event giving rise to the claim. Ustaz shall
              not be liable for indirect, incidental, special, consequential, or punitive damages,
              including lost profits, loss of data, property damage caused by a Provider, or
              personal injury sustained during a service.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="indemnity">22. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Ustaz, its directors, employees,
              and contractors from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising out of or in any way connected
              with (a) your access to or use of the Platform, (b) your violation of these Terms, or
              (c) your violation of any third-party right, including any intellectual property or
              privacy right.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="dispute">23. Dispute Resolution</h2>
            <p>
              <strong>Step 1 — Internal resolution.</strong> Any dispute shall first be raised in
              writing to Ustaz support at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#db4b0d] underline">{CONTACT_EMAIL}</a>{' '}
              with all relevant details. Ustaz will respond within <strong>14 business days</strong>{' '}
              and attempt good-faith resolution.
            </p>
            <p>
              <strong>Step 2 — Mediation.</strong> If unresolved within 30 days, the parties agree
              to attempt mediation through a mutually agreed mediator before commencing litigation.
            </p>
            <p>
              <strong>Step 3 — Courts.</strong> If still unresolved, the matter shall be subject to
              the exclusive jurisdiction of the courts of Karachi, Sindh, Pakistan.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="law">24. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Islamic
              Republic of Pakistan, without regard to conflict-of-law principles.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="sharia">25. Sharia Compliance</h2>
            <p>
              Ustaz fees and transactions are structured to align with Islamic commercial
              principles. Service fees paid by Customers to Providers represent bay&apos;i (direct
              trade). The platform commission paid by Providers represents an ujrah (service fee
              for the facilitation provided by Ustaz). Ustaz does not engage in riba (interest),
              gharar (excessive uncertainty), or financing of haram goods or services.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="misc">26. Miscellaneous</h2>
            <ul>
              <li><strong>Entire agreement.</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Ustaz.</li>
              <li><strong>Severability.</strong> If any provision is held unenforceable, the remaining provisions shall remain in full force.</li>
              <li><strong>No waiver.</strong> No failure or delay by Ustaz in exercising any right shall operate as a waiver of that right.</li>
              <li><strong>Assignment.</strong> You may not assign your rights or obligations under these Terms. Ustaz may assign these Terms in connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>Force majeure.</strong> Ustaz is not liable for any failure or delay caused by events beyond its reasonable control.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="contact">27. Contact</h2>
            <p>
              The Platform is operated by <strong>{OPERATOR}</strong>, based in Karachi, Sindh,
              Pakistan. Ustaz is currently operated as a sole proprietorship and is{' '}
              <strong>not yet incorporated as a private limited company</strong>. Where these Terms
              refer to &ldquo;Ustaz&rdquo;, they refer to that operator. If and when the business is
              incorporated, these Terms will be updated and the change notified under &sect;&nbsp;1.
            </p>
            <p>For questions regarding these Terms:</p>
            <ul>
              <li>Email: <a href={`mailto:${LEGAL_EMAIL}`} className="text-[#db4b0d] underline">{LEGAL_EMAIL}</a></li>
              <li>Support: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#db4b0d] underline">{CONTACT_EMAIL}</a></li>
              <li>WhatsApp: <a href={`https://wa.me/${CONTACT_WHATSAPP.replace(/[^0-9]/g, '')}`} className="text-[#db4b0d] underline">{CONTACT_WHATSAPP}</a></li>
              <li>In-app: <Link href="/contact" className="text-[#db4b0d] underline">Contact page</Link></li>
            </ul>

            <hr className="my-12" />
            <p className="text-sm text-gray-500">
              See also our{' '}
              <Link href="/privacy-policy" className="text-[#db4b0d] underline">Privacy Policy</Link>
              {' '}for details on how we collect and use personal data.
            </p>

          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}