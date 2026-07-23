import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReadingTime from "@/components/ReadingTime";

export const metadata: Metadata = {
  title: "Privacy Policy — Ustaz",
  description:
    "How Ustaz collects, uses, stores, and protects your personal data on our trust-professional platform.",
};

const LAST_UPDATED = "23 July 2026";

const sections = [
  ["scope", "1. Scope & Acceptance"],
  ["controller", "2. Data Controller"],
  ["data-collected", "3. Personal Data We Collect"],
  ["how-collected", "4. How We Collect Data"],
  ["lawful-basis", "5. Lawful Basis & Purposes"],
  ["location", "6. Location Data — Real-time Tracking"],
  ["cnic-kyc", "7. CNIC & KYC Verification"],
  ["payments", "8. Payment & Wallet Data"],
  ["chat-content", "9. Chat & Communication Content"],
  ["cookies", "10. Cookies & Local Storage"],
  ["push", "11. Push Notification Tokens (FCM)"],
  ["third-parties", "12. Third-Party Service Providers"],
  ["sharing", "13. How We Share Data"],
  ["retention", "14. Data Retention"],
  ["security", "15. Security Measures"],
  ["rights", "16. Your Rights"],
  ["minors", "17. Minors"],
  ["cross-border", "18. International Data Transfers"],
  ["breach", "19. Data Breach Notification"],
  ["changes", "20. Changes to this Policy"],
  ["contact", "21. Contact Our Privacy Team"],
] as const;

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
          <header className="border-b border-gray-200 pb-8 mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last updated: <span className="font-medium text-gray-700">{LAST_UPDATED}</span>
              <ReadingTime targetId="privacy-article" />
            </p>
            <p className="mt-6 text-base text-gray-700 leading-7">
              This Privacy Policy describes how Ustaz (&ldquo;<strong>we</strong>&rdquo;,
              &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;) collects,
              uses, discloses, and safeguards your personal data when you use our platform. It
              applies to Customers, Ustaz Providers, and visitors of our website and mobile
              applications. By using our Platform, you consent to the collection and use of your
              information as described here. For other terms, please see our{' '}
              <Link href="/terms" className="text-[#db4b0d] underline font-medium">
                Terms of Use
              </Link>.
            </p>
            <div className="mt-6 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900">
              <strong>Plain-English summary:</strong> We collect your phone number, location, and
              service history to connect you with Ustaz Providers. We never sell your data. Your
              live GPS is only shared with a matched Provider during an active service request and
              stops the moment the service is complete.
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
                    <a
                      href={`#${id}`}
                      className="flex items-center gap-3 text-gray-700 hover:text-[#db4b0d]"
                    >
                      <span className="flex-none w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </span>
                      <span className="truncate">{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article
            id="privacy-article"
            className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-li:leading-7"
          >
            <h2 className="text-2xl font-extrabold mt-6" id="scope">
              1. Scope & Acceptance
            </h2>
            <p>
              This Policy applies to all personal data collected via the Ustaz web application,
              mobile applications, APIs, and any related services. By using the Platform, you
              acknowledge that you have read and understood this Policy.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="controller">
              2. Data Controller
            </h2>
            <p>
              For the purposes of this Policy, the data controller is <strong>Ustaz (Pvt) Ltd</strong>,
              incorporated in Pakistan. Our registered contact for privacy matters is{' '}
              <a href="mailto:privacy@ustaz.app" className="text-[#db4b0d] underline">
                privacy@ustaz.app
              </a>.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="data-collected">
              3. Personal Data We Collect
            </h2>
            <h3>From all users</h3>
            <ul>
              <li><strong>Identity</strong>: full name, profile photo.</li>
              <li><strong>Contact</strong>: phone number, optional email.</li>
              <li><strong>Account</strong>: encrypted session tokens, login timestamps, device user-agent string.</li>
              <li><strong>Communications</strong>: in-app chat messages between Customer and Provider.</li>
              <li><strong>Device</strong>: IP address (during sign-in and rate-limiting), browser/OS, push notification tokens.</li>
            </ul>
            <h3>From Customers</h3>
            <ul>
              <li><strong>Service address</strong>: street address, postal code, geographic coordinates.</li>
              <li><strong>Service history</strong>: categories requested, status timeline, completion timestamps, ratings given — surfaced to you on your <Link href="/history" className="text-[#db4b0d] underline">My Jobs</Link> page.</li>
              <li><strong>Warranty claims</strong>: where you claim the 3-day warranty on a completed job, we store the claim, its status, and any description of the recurring issue you provide.</li>
              <li><strong>Approximate location</strong>: only during active Service Requests for matching purposes.</li>
            </ul>
            <h3>From Providers (Ustaz)</h3>
            <ul>
              <li><strong>CNIC number and photograph</strong>: for identity verification.</li>
              <li><strong>Service category</strong>, experience details, optional certifications.</li>
              <li><strong>Wallet & financial</strong>: JazzCash/EasyPaisa/IBAN identifiers, top-up receipts, transaction ledger (commissions, penalties, top-ups).</li>
              <li><strong>Real-time GPS coordinates</strong>: only during active accepted Service Requests.</li>
              <li><strong>Rating history</strong>, completed-jobs count, <strong>warranty strikes</strong>, online/offline status.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="how-collected">
              4. How We Collect Data
            </h2>
            <ul>
              <li><strong>Directly from you</strong> when you register, complete profile fields, request a service, top up a wallet, or send a chat message.</li>
              <li><strong>Automatically</strong> via your device when you grant location, notification, or camera permission (e.g. real-time GPS while serving a request; CNIC photo upload).</li>
              <li><strong>From third parties</strong> — SMS provider (Twilio Verify) to validate your phone, mapping APIs (Google Maps) to geocode addresses, and (where applicable) background-check vendors.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="lawful-basis">
              5. Lawful Basis & Purposes
            </h2>
            <p>We process personal data based on one or more of the following lawful bases:</p>
            <ul>
              <li><strong>Contractual necessity</strong>: to provide the Platform&apos;s core functionality (creating, matching, fulfilling, and rating Service Requests).</li>
              <li><strong>Consent</strong>: where you explicitly grant permission (e.g. location, push notifications, marketing communications).</li>
              <li><strong>Legitimate interest</strong>: to maintain Platform security, prevent fraud, audit transactions, and improve user experience.</li>
              <li><strong>Legal obligation</strong>: tax records, regulatory compliance, response to lawful court orders.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="location">
              6. Location Data &mdash; Real-time Tracking
            </h2>
            <p>
              Real-time location tracking is fundamental to how Ustaz works. Here is exactly how it
              behaves:
            </p>
            <ul>
              <li>
                <strong>Customer location</strong> is captured once when you create a Service Request
                (to find nearby Providers) and is visible only to the matched Provider after they
                accept your request.
              </li>
              <li>
                <strong>Provider GPS</strong> is broadcast in near real-time only while a Service
                Request is in an active state (<code>accepted</code>, <code>provider_enroute</code>,
                <code>arriving</code>, <code>arrived</code>, <code>in_progress</code>, or{' '}
                <code>work_in_progress</code>) and only to the matched Customer.
              </li>
              <li>
                <strong>Tracking automatically stops</strong> the moment the request is marked{' '}
                <code>completed</code>, <code>cancelled</code>, or otherwise terminated. The
                corresponding live-location records are removed from active storage.
              </li>
              <li>
                Historical location pings are retained in <strong>aggregated, de-identified form</strong>{' '}
                for safety analytics for up to <strong>90 days</strong>, then deleted.
              </li>
              <li>
                You can revoke location permission at any time via your browser or device settings.
                Without location permission, certain Platform features (such as proximity matching)
                will not function.
              </li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="cnic-kyc">
              7. CNIC & KYC Verification
            </h2>
            <p>
              Providers are required to submit their CNIC details for identity verification. CNIC
              data and submitted documents:
            </p>
            <ul>
              <li>Are encrypted at rest in our secure storage bucket;</li>
              <li>Are accessible only to authorised verification personnel and automated KYC vendors;</li>
              <li>Are <strong>not</strong> shared with Customers;</li>
              <li>Are retained for the duration of the Provider account and up to <strong>5 years</strong> after closure to comply with tax and regulatory requirements.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="payments">
              8. Payment & Wallet Data
            </h2>
            <p>
              Service fees flow <strong>directly between Customer and Provider in cash</strong>;
              Ustaz does not handle or process Customer payments. Provider wallet top-ups are
              reviewed against bank/mobile-wallet receipts. We store:
            </p>
            <ul>
              <li>The wallet balance, transaction ledger, and top-up references (e.g. JazzCash transaction IDs);</li>
              <li>Photographic copies of top-up receipts uploaded by Providers (retained for accounting and dispute purposes).</li>
            </ul>
            <p>
              We do not collect or store full credit/debit card numbers. Where a third-party payment
              gateway is added in the future, your card data will be tokenised and handled by the
              gateway directly under their PCI-DSS-compliant infrastructure.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="chat-content">
              9. Chat & Communication Content
            </h2>
            <p>
              In-app chat messages between Customer and Provider are stored on our servers and may
              be accessed by authorised Ustaz personnel solely for safety, dispute resolution, and
              fraud-prevention purposes. <strong>Do not share sensitive financial information</strong>{' '}
              (such as full bank credentials) through chat. Phone calls placed via the in-app
              dialer use your device&apos;s telephony stack and are <strong>not recorded</strong> by Ustaz.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="cookies">
              10. Cookies & Local Storage
            </h2>
            <p>
              We use HTTP-only, secure cookies to maintain your authenticated session via Supabase
              Auth (<code>@supabase/ssr</code>). We do <strong>not</strong> use third-party
              advertising cookies. The following categories are used:
            </p>
            <ul>
              <li><strong>Strictly necessary</strong>: authentication, session, security tokens.</li>
              <li><strong>Functional</strong>: language preference, recently selected service type.</li>
              <li><strong>Analytics (optional)</strong>: anonymised performance and error telemetry; you may opt out via your account settings.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="push">
              11. Push Notification Tokens (FCM)
            </h2>
            <p>
              When you grant notification permission, your browser issues a Firebase Cloud Messaging
              (FCM) registration token. We store this token against your account so we can notify
              you of new Service Requests, status changes, and chat messages — even when the
              Platform tab is closed. Tokens are automatically pruned when invalid or upon account
              deletion. You can revoke push permission at any time via your browser settings.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="third-parties">
              12. Third-Party Service Providers
            </h2>
            <p>The following third parties process limited data on our behalf:</p>
            <ul>
              <li><strong>Supabase</strong> — database, authentication, real-time, storage, and serverless functions infrastructure.</li>
              <li><strong>Twilio Verify</strong> — phone-number verification via SMS OTP.</li>
              <li><strong>Google Maps Platform</strong> — geocoding addresses, displaying maps.</li>
              <li><strong>Firebase Cloud Messaging</strong> — push notification delivery.</li>
              <li><strong>Vercel</strong> — web application hosting.</li>
              <li><strong>JazzCash / EasyPaisa / partner banks</strong> — for Provider wallet top-up settlement.</li>
            </ul>
            <p>
              Each processor is contractually obligated to handle your data in accordance with
              applicable law and only for the purposes we direct.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="sharing">
              13. How We Share Data
            </h2>
            <p>We <strong>do not sell</strong> your personal data. We share data only:</p>
            <ul>
              <li>With the matched Customer or Provider, as necessary to complete a Service Request (e.g. name, phone, live location, address);</li>
              <li>With the third-party processors listed in &sect; 12, under contract;</li>
              <li>To comply with a lawful court order, subpoena, or government request;</li>
              <li>To protect the rights, property, or safety of Ustaz, our users, or the public (e.g. fraud investigation, emergency disclosure);</li>
              <li>In connection with a merger, acquisition, or sale of all or part of Ustaz&apos;s business, with notice to affected users.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="retention">
              14. Data Retention
            </h2>
            <ul>
              <li><strong>Account profile</strong>: retained while the account is active; deleted within 90 days of account closure, except where required by law.</li>
              <li><strong>Service Requests</strong>: retained for <strong>3 years</strong> after completion (financial-record requirement).</li>
              <li><strong>Warranty claims</strong>: retained for the lifetime of the related Service Request record, as evidence of the workmanship guarantee and any associated penalty.</li>
              <li><strong>CNIC & KYC documents</strong>: up to <strong>5 years</strong> after Provider account closure.</li>
              <li><strong>Wallet ledger & topup receipts</strong>: up to <strong>7 years</strong> for tax and audit compliance.</li>
              <li><strong>Real-time location pings</strong>: deleted upon request completion; aggregated analytics retained up to <strong>90 days</strong>.</li>
              <li><strong>Chat messages</strong>: <strong>2 years</strong>, or longer if subject to an active dispute or legal hold.</li>
              <li><strong>OTP attempts log</strong>: <strong>24 hours</strong>, used solely for rate limiting.</li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="security">
              15. Security Measures
            </h2>
            <ul>
              <li>Encrypted-in-transit (TLS 1.2+) for all data exchanged between your device and our servers.</li>
              <li>Encrypted-at-rest for the database, file storage, and authentication tokens.</li>
              <li>PostgreSQL <strong>Row-Level Security</strong> on every sensitive table — users can only access rows they are authorised to read.</li>
              <li><strong>SECURITY DEFINER</strong> stored procedures for all privileged operations, validated against <code>auth.uid()</code>.</li>
              <li>Cookie-backed sessions with HTTP-only, Secure, SameSite flags.</li>
              <li>Phone-OTP rate limiting (per phone and per IP) to mitigate enumeration attacks.</li>
              <li>Automated dependency scanning and routine security advisories review.</li>
            </ul>
            <p>
              No system is perfectly secure. While we follow industry best practices, we cannot
              guarantee absolute security of data transmitted over the internet.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="rights">
              16. Your Rights
            </h2>
            <p>Subject to applicable law, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> a copy of the personal data we hold about you;</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data;</li>
              <li><strong>Delete</strong> your account and associated personal data, subject to legal retention obligations;</li>
              <li><strong>Object</strong> to or restrict certain processing (e.g. marketing);</li>
              <li><strong>Withdraw consent</strong> at any time where processing is based on consent;</li>
              <li><strong>Lodge a complaint</strong> with the National Commission for Personal Data Protection (once operational under the Personal Data Protection Act).</li>
            </ul>
            <p>
              To exercise any of these rights, email{' '}
              <a href="mailto:privacy@ustaz.app" className="text-[#db4b0d] underline">
                privacy@ustaz.app
              </a>{' '}
              with verification of your identity. We will respond within <strong>30 days</strong>.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="minors">
              17. Minors
            </h2>
            <p>
              The Platform is not directed to children under 18. We do not knowingly collect data
              from minors. If you believe a minor has provided us with personal data, please contact{' '}
              <a href="mailto:privacy@ustaz.app" className="text-[#db4b0d] underline">
                privacy@ustaz.app
              </a>{' '}
              and we will delete the data promptly.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="cross-border">
              18. International Data Transfers
            </h2>
            <p>
              Some of our infrastructure providers (e.g. Supabase, Vercel, Firebase) operate
              data centres outside Pakistan. By using the Platform, you consent to your personal
              data being transferred to and stored in those jurisdictions, subject to safeguards
              equivalent to those required under Pakistani law.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="breach">
              19. Data Breach Notification
            </h2>
            <p>
              In the unlikely event of a personal data breach that is likely to result in a
              significant risk to your rights and freedoms, we will notify you and the relevant
              supervisory authority within <strong>72 hours</strong> of becoming aware of the
              breach, in line with international good practice.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="changes">
              20. Changes to this Policy
            </h2>
            <p>
              We may update this Policy from time to time. Material changes will be announced
              in-app and by notification at least <strong>30 days</strong> before they take effect.
              The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent
              revision.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="contact">
              21. Contact Our Privacy Team
            </h2>
            <p>
              Questions, concerns, or requests regarding this Policy or your personal data may be
              directed to:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@ustaz.app" className="text-[#db4b0d] underline">privacy@ustaz.app</a></li>
              <li>Postal: Ustaz (Pvt) Ltd, Karachi, Sindh, Pakistan</li>
              <li>In-app: <Link href="/contact" className="text-[#db4b0d] underline">Contact page</Link></li>
            </ul>

            <hr className="my-12" />
            <p className="text-sm text-gray-500">
              See also our{' '}
              <Link href="/terms" className="text-[#db4b0d] underline">Terms of Use</Link>
              {' '}for the contractual terms governing your use of the Platform.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}