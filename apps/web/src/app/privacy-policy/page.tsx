import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReadingTime from '../components/ReadingTime';

export const metadata = {
  title: 'Privacy Policy — Ustaz',
  description:
    'How Ustaz collects, uses, stores, and protects your personal data on our trust-professional platform.',
};

const LAST_UPDATED = '1 August 2026';

// TODO(legal): placeholders — replace before public launch.
// Ustaz is not yet an incorporated company and these mailboxes are not live.
const OPERATOR = 'Ustaz';
const PRIVACY_EMAIL = 'privacy@ustaz.app';
const CONTACT_WHATSAPP = '+92 305 1126649';

const sections = [
  ['scope', '1. Scope & Acceptance'],
  ['controller', '2. Who Operates Ustaz'],
  ['data-collected', '3. Personal Data We Collect'],
  ['how-collected', '4. How We Collect Data'],
  ['lawful-basis', '5. Lawful Basis & Purposes'],
  ['location', '6. Location Data — Real-time Tracking'],
  ['cnic-kyc', '7. CNIC & KYC Verification'],
  ['payments', '8. Payment & Wallet Data'],
  ['chat-content', '9. Chat & Communication Content'],
  ['incidents-data', '10. Safety Incidents, Check-ins & Appeals'],
  ['automated', '11. Automated Decision-Making & Provider Scoring'],
  ['cookies', '12. Cookies & Local Storage'],
  ['push', '13. Push Notification Tokens (FCM)'],
  ['third-parties', '14. Third-Party Service Providers'],
  ['sharing', '15. How We Share Data'],
  ['retention', '16. Data Retention'],
  ['security', '17. Security Measures'],
  ['rights', '18. Your Rights'],
  ['minors', '19. Minors'],
  ['cross-border', '20. International Data Transfers'],
  ['breach', '21. Data Breach Notification'],
  ['changes', '22. Changes to this Policy'],
  ['contact', '23. Contact Our Privacy Team'],
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
              <Link href="/terms" className="text-[#db4b0d] underline font-medium">Terms of Use</Link>.
            </p>
            <div className="mt-6 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900">
              <strong>Plain-English summary:</strong> We collect your phone number, location, and
              service history to connect you with Ustaz Providers. We never sell your data, and we run
              no advertising or analytics trackers. Live GPS is shared only between you and the
              matched Provider during an active service request, and the record is deleted the moment
              the job is completed &mdash; the single exception being a safety check-in, which records
              your position at the moment you answer it. If you are a Provider, your{' '}
              <strong>CNIC image is sent to a third-party OCR service</strong> to verify your identity
              (&sect;&nbsp;7), and some decisions about your account are automated (&sect;&nbsp;11).
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

          <article id="privacy-article" className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-li:leading-7">

            <h2 className='text-2xl font-extrabold mt-6' id="scope">1. Scope &amp; Acceptance</h2>
            <p>
              This Policy applies to all personal data collected via the Ustaz web application, mobile
              applications, APIs, and any related services. By using the Platform, you acknowledge
              that you have read and understood this Policy.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="controller">2. Who Operates Ustaz</h2>
            <p>
              The Platform is operated by <strong>{OPERATOR}</strong>, based in Karachi, Sindh,
              Pakistan. Ustaz is currently run as a <strong>sole proprietorship</strong> and is{' '}
              <strong>not yet incorporated as a private limited company</strong>. The operator is the
              party responsible for deciding how and why your personal data is processed, and is the
              party you deal with when exercising the rights in &sect;&nbsp;18. If the business is
              later incorporated, this Policy will be updated and the change notified under
              &sect;&nbsp;22.
            </p>
            <p>
              Our contact for privacy matters is{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#db4b0d] underline">{PRIVACY_EMAIL}</a>.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="data-collected">3. Personal Data We Collect</h2>
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
              <li><strong>Service history</strong>: categories requested, status timeline, completion timestamps, ratings given &mdash; surfaced to you on your <Link href="/history" className="text-[#db4b0d] underline">My Jobs</Link> page.</li>
              <li><strong>Warranty claims</strong>: where you claim the 3-day warranty on a completed job, we store the claim, its status, and any description of the recurring issue you provide.</li>
              <li><strong>Approximate location</strong>: only during active Service Requests for matching purposes.</li>
              <li>
                <strong>Saved addresses</strong>: where you save an address for reuse, we store your
                label for it (e.g.&nbsp;&ldquo;Home&rdquo;), the full address, its coordinates, any
                landmark you add, whether it is your default, and &mdash; if you choose to upload one
                &mdash; a <strong>photograph of the building entrance</strong> to help Providers find
                you. Entrance photos are visible to a Provider matched to that address.
              </li>
              <li>
                <strong>Per-address service history</strong>: which services have been performed at a
                saved address, by which Provider, together with the issue description and whether the
                issue was flagged as <strong>recurring</strong>. This lets a returning Provider see
                what was done before.
              </li>
              <li><strong>Favourites</strong>: the Providers you mark as favourites.</li>
              <li><strong>Email address and verification state</strong>: where you add an email, we store it together with a time-limited verification token and the time it was confirmed.</li>
            </ul>
            <h3>From Providers (Ustaz)</h3>
            <ul>
              <li><strong>CNIC number and photograph</strong>: for identity verification.</li>
              <li><strong>CNIC verification documents</strong>: front photo, back photo, and selfie submitted via the identity verification flow. Stored in the <code>verification_submissions</code> table with a <code>status</code> (pending, approved, rejected) and admin review notes.</li>
              <li><strong>Service category</strong>, experience details, optional certifications.</li>
              <li><strong>Wallet &amp; financial</strong>: JazzCash/EasyPaisa/IBAN identifiers, top-up receipts, transaction ledger (commissions, penalties, top-ups).</li>
              <li><strong>Real-time GPS coordinates</strong>: only during active accepted Service Requests.</li>
              <li><strong>Rating history</strong>, completed-jobs count, <strong>warranty strikes</strong>, online/offline status, last-seen time.</li>
              <li>
                <strong>Performance and standing records</strong>: per service category we hold your
                completed jobs, rating totals and average, a <strong>recency-weighted rating average</strong>,
                your incident count, and counts of complaints assessed as justified or disputed. At
                account level we hold your <strong>tier</strong>, when and why it last changed, whether
                a suspension is active and until when, and any remaining probation jobs. See
                &sect;&nbsp;11.
              </li>
              <li>
                <strong>Incident records</strong>: safety or conduct incidents involving you &mdash;
                type, severity, status, any evidence submitted, your response and the other
                party&apos;s response, the resolution, and whether a penalty was applied and its
                amount. See &sect;&nbsp;10.
              </li>
              <li>
                <strong>Appeals</strong>: the type of decision appealed, your written reason, any
                evidence you attach, the outcome, and the response recorded by the reviewer.
              </li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="how-collected">4. How We Collect Data</h2>
            <ul>
              <li><strong>Directly from you</strong> when you register, complete profile fields, request a service, top up a wallet, or send a chat message.</li>
              <li><strong>Automatically</strong> via your device when you grant location, notification, or camera permission (e.g.&nbsp;real-time GPS while serving a request; CNIC photo upload).</li>
              <li><strong>From third parties</strong> &mdash; SMS provider (Twilio Verify) to validate your phone, mapping APIs (Google Maps) to geocode addresses, and an OCR provider to read your CNIC image (see &sect;&nbsp;7).</li>
              <li>
                <strong>From Google, if you choose to sign in with Google</strong> on the mobile app.
                Google returns your name, email address, and profile picture URL, which we store
                against your account. We do not receive your Google password. You can instead sign in
                with a phone number only.
              </li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="lawful-basis">5. Lawful Basis &amp; Purposes</h2>
            <p>We process personal data based on one or more of the following lawful bases:</p>
            <ul>
              <li><strong>Contractual necessity</strong>: to provide the Platform&apos;s core functionality (creating, matching, fulfilling, and rating Service Requests).</li>
              <li><strong>Consent</strong>: where you explicitly grant permission (e.g.&nbsp;location, push notifications, marketing communications).</li>
              <li><strong>Legitimate interest</strong>: to maintain Platform security, prevent fraud, audit transactions, and improve user experience.</li>
              <li><strong>Legal obligation</strong>: tax records, regulatory compliance, response to lawful court orders.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="location">6. Location Data &mdash; Real-time Tracking</h2>
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
                <strong>Safety check-ins are the one exception.</strong> Where a safety incident has
                been opened, we may send a check-in prompt, and <strong>your GPS position at the
                moment you respond</strong> is stored against that check-in. This can happen outside
                an active Service Request. It is a single point captured when you answer &mdash; not
                continuous tracking. See &sect;&nbsp;10.
              </li>
              <li>
                We do <strong>not</strong> currently derive aggregated or de-identified location
                analytics from your location history, and we do not sell or share location data for
                advertising.
              </li>
              <li>
                You can revoke location permission at any time via your browser or device settings.
                Without location permission, certain Platform features (such as proximity matching)
                will not function.
              </li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="cnic-kyc">7. CNIC &amp; KYC Verification</h2>
            <p>
              Providers must verify their identity before they can go online. There are two paths,
              and both are described here because both may apply to you.
            </p>
            <h3>Automated OCR check</h3>
            <p>
              You type your CNIC number and upload a photograph of your CNIC. <strong>The image is
              transmitted to OCR.space, a third-party optical character recognition service operated
              outside Pakistan</strong>, which extracts the text from it. We compare the extracted
              number against the number you typed and record the decision, the number the OCR service
              read, the raw OCR response, and the time of the check.
            </p>
            <p className="text-sm bg-amber-50 border border-amber-200 px-4 py-3 rounded">
              <strong>Please read this before uploading.</strong> Your CNIC image leaves our systems
              and is processed by OCR.space under their own terms and privacy policy. We send only the
              image needed for the check, and we do not send your name, phone number, or any other
              account data alongside it. If you are not willing to have your CNIC image processed by a
              third party, do not upload it &mdash; contact us at{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#db4b0d] underline">{PRIVACY_EMAIL}</a>{' '}
              to arrange manual verification instead.
            </p>
            <h3>Manual review</h3>
            <p>
              We may also ask you to submit CNIC front and back images and a selfie for review by
              authorised Ustaz personnel. These are stored with a status of <code>pending</code>,{' '}
              <code>approved</code>, or <code>rejected</code>, together with any reviewer notes and
              the identity of the reviewer.
            </p>
            <h3>In both cases</h3>
            <ul>
              <li>CNIC data and documents are stored encrypted at rest and are accessible only to authorised verification personnel;</li>
              <li>They are <strong>never shown to Customers</strong>;</li>
              <li>An adverse automated outcome can be challenged &mdash; see &sect;&nbsp;11 and the appeals route in our Terms.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="payments">8. Payment &amp; Wallet Data</h2>
            <p>
              Service fees flow <strong>directly between Customer and Provider in cash</strong>;
              Ustaz does not handle or process Customer payments. Provider wallet top-ups are
              reviewed against bank/mobile-wallet receipts. We store:
            </p>
            <ul>
              <li>The wallet balance, transaction ledger, and top-up references (e.g.&nbsp;JazzCash transaction IDs);</li>
              <li>Photographic copies of top-up receipts uploaded by Providers (retained for accounting and dispute purposes).</li>
            </ul>
            <p>
              We do not collect or store full credit/debit card numbers. Where a third-party payment
              gateway is added in the future, your card data will be tokenised and handled by the
              gateway directly under their PCI-DSS-compliant infrastructure.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="chat-content">9. Chat &amp; Communication Content</h2>
            <p>
              In-app chat messages between Customer and Provider are stored on our servers and may
              be accessed by authorised Ustaz personnel solely for safety, dispute resolution, and
              fraud-prevention purposes. <strong>Do not share sensitive financial information</strong>{' '}
              (such as full bank credentials) through chat. Phone calls placed via the in-app
              dialer use your device&apos;s telephony stack and are <strong>not recorded</strong> by Ustaz.
            </p>
            <ul>
              <li><strong>Message retention</strong>: Chat messages are retained for <strong>2 years</strong>, or longer if subject to an active dispute or legal hold.</li>
              <li><strong>Follow-up window</strong>: You can send messages to a Provider for up to <strong>7 days</strong> after a Service Request is marked completed. After this window, the chat becomes read-only.</li>
              <li><strong>Immutability</strong>: Once sent, chat messages cannot be edited or deleted by either party. This is an intentional design choice to preserve a reliable record for dispute resolution.</li>
              <li><strong>Access</strong>: Ustaz personnel may access chat content only for safety monitoring, dispute resolution, fraud investigation, or compliance with a lawful court order.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="incidents-data">10. Safety Incidents, Check-ins &amp; Appeals</h2>
            <p>
              Where a safety or conduct incident is reported by either party, we record data about it
              so it can be reviewed fairly.
            </p>
            <ul>
              <li>
                <strong>The incident record</strong>: the Service Request and the people involved, the
                incident type, its severity, its status, any evidence submitted, the response given by
                each party, the written resolution, and whether a penalty was applied and its amount.
              </li>
              <li>
                <strong>Check-ins</strong>: where we send a safety check-in prompt, we record when it
                was sent, when and how you responded, and <strong>your GPS position at the moment you
                responded</strong>. Responding is voluntary. This is the one circumstance in which we
                record your location outside an active Service Request (see &sect;&nbsp;6).
              </li>
              <li>
                <strong>Appeals</strong>: if you appeal a penalty or decision, we record the type of
                decision appealed, your written reason, any evidence you attach, the outcome, who
                reviewed it, and when.
              </li>
            </ul>
            <p>
              Incident and appeal records are accessible to the authorised Ustaz personnel who review
              them. The other party to an incident sees your response to it, but not the internal
              review notes. Because incident records exist to establish what happened, they are
              retained even where other data about a Service Request is removed.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="automated">11. Automated Decision-Making &amp; Provider Scoring</h2>
            <p>
              Some decisions affecting Providers are made, or substantially informed, by automated
              processing. We describe them here so you know they exist and how to challenge them.
            </p>
            <h3>Where automation is used</h3>
            <ul>
              <li><strong>Identity verification</strong> &mdash; an OCR comparison of your typed CNIC number against your uploaded CNIC image decides whether you may go online (&sect;&nbsp;7).</li>
              <li><strong>Matching</strong> &mdash; which Providers are notified of a Service Request is decided automatically from service category, online status, and distance.</li>
              <li><strong>Fee and commission calculation</strong> &mdash; the visiting fee is derived automatically from the distance at acceptance, and the commission is a fixed percentage of it.</li>
              <li><strong>Performance scoring and standing</strong> &mdash; ratings, completed jobs, a recency-weighted rating average, incident counts, and justified-versus-disputed complaint counts feed a tier and standing record, which can result in reduced matching visibility, probation, or suspension.</li>
            </ul>
            <h3>Your rights over these decisions</h3>
            <ul>
              <li>You may ask for the <strong>reason recorded</strong> for any tier change, suspension, or adverse verification outcome affecting you;</li>
              <li>You may request <strong>review by a person</strong> rather than the system, through the appeals process described in our Terms;</li>
              <li>You may <strong>dispute a complaint</strong>, and where your dispute succeeds the complaint is recorded as disputed rather than justified;</li>
              <li>You may ask us to correct the underlying data if you believe the record is factually wrong (&sect;&nbsp;18).</li>
            </ul>
            <p>
              We do not use automated processing to profile Customers, and we do not use it for
              advertising or credit-scoring purposes of any kind.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="cookies">12. Cookies &amp; Local Storage</h2>
            <p>
              We use HTTP-only, secure cookies to maintain your authenticated session via Supabase
              Auth (<code>@supabase/ssr</code>). We do <strong>not</strong> use third-party
              advertising cookies. The following categories are used:
            </p>
            <ul>
              <li><strong>Strictly necessary</strong>: authentication, session, security tokens.</li>
              <li><strong>Functional</strong>: language preference, recently selected service type.</li>
            </ul>
            <p>
              <strong>We do not currently run any analytics or telemetry.</strong> No Google
              Analytics, no product-analytics SDK, no error-tracking service, and no advertising or
              cross-site tracking pixel is loaded by the Platform. If we introduce analytics in
              future, we will update this Policy and give you a working way to opt out before
              switching it on.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="push">13. Push Notification Tokens (FCM)</h2>
            <p>
              When you grant notification permission, your browser or mobile device issues a Firebase
              Cloud Messaging (FCM) registration token. We store this token against your account so we
              can notify you of new Service Requests, status changes, chat messages, warranty claims,
              and safety check-ins &mdash; even when the app is closed or the browser tab is not open.
            </p>
            <p>
              A token identifies a <strong>device</strong>, not you personally, but we hold it linked
              to your account so we know where to send your notifications. Tokens are pruned
              automatically when the delivery service reports them as invalid or unregistered. You can
              revoke push permission at any time in your browser settings or your phone&apos;s app
              settings; doing so stops notifications but does not otherwise affect your account.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="third-parties">14. Third-Party Service Providers</h2>
            <p>The following third parties process limited data on our behalf:</p>
            <ul>
              <li><strong>Supabase</strong> &mdash; database, authentication, real-time, storage, and serverless functions infrastructure.</li>
              <li><strong>Twilio Verify</strong> &mdash; phone-number verification via SMS OTP.</li>
              <li><strong>OCR.space</strong> &mdash; optical character recognition performed on <strong>CNIC images uploaded by Providers</strong> for identity verification (see &sect;&nbsp;7). This is the most sensitive category of data we send to any third party.</li>
              <li><strong>Google Maps Platform</strong> &mdash; geocoding addresses, displaying maps, and address autocomplete.</li>
              <li><strong>Google Sign-In</strong> &mdash; optional authentication on the mobile app; returns your name, email, and profile picture.</li>
              <li><strong>Firebase Cloud Messaging</strong> &mdash; push notification delivery on web and mobile.</li>
              <li><strong>Expo / Expo Application Services</strong> &mdash; build and distribution of the mobile app.</li>
              <li><strong>Vercel</strong> &mdash; web application hosting.</li>
              <li><strong>JazzCash / Easypaisa</strong> &mdash; the mobile-wallet services Providers use to fund wallet top-ups. We receive the reference and receipt you submit; we do not connect to these services directly on your behalf.</li>
            </ul>
            <p>
              Each processor is contractually obligated to handle your data in accordance with
              applicable law and only for the purposes we direct.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="sharing">15. How We Share Data</h2>
            <p>We <strong>do not sell</strong> your personal data. We share data only:</p>
            <ul>
              <li>With the matched Customer or Provider, as necessary to complete a Service Request (e.g.&nbsp;name, phone, live location, address);</li>
              <li>With the third-party processors listed in &sect; 12, under contract;</li>
              <li>To comply with a lawful court order, subpoena, or government request;</li>
              <li>To protect the rights, property, or safety of Ustaz, our users, or the public (e.g.&nbsp;fraud investigation, emergency disclosure);</li>
              <li>In connection with a merger, acquisition, or sale of all or part of Ustaz&apos;s business, with notice to affected users.</li>
            </ul>

            <h2 className='text-2xl font-extrabold mt-6' id="retention">16. Data Retention</h2>
            <p className="text-sm bg-amber-50 border border-amber-200 px-4 py-3 rounded">
              <strong>We would rather tell you the truth than quote a schedule we do not yet keep.</strong>{' '}
              Ustaz is an early-stage platform. Apart from the one automatic deletion described below,
              we do <strong>not</strong> currently run scheduled jobs that erase data after a fixed
              period. In practice, data you give us is kept until you ask us to delete it, or until we
              no longer need it. The periods in the second table are our stated intentions, not
              claims about what is already automated.
            </p>
            <h3>What happens automatically today</h3>
            <ul>
              <li><strong>Live location records</strong> for a Service Request are <strong>deleted the moment the job is marked completed</strong>, and when a request is cancelled. This is enforced in code, not by policy.</li>
              <li>Invalid push notification tokens are pruned automatically when a delivery fails.</li>
              <li>Email verification tokens expire at a set time and become unusable.</li>
              <li>Nothing else is currently deleted on a schedule.</li>
            </ul>
            <h3>How long we intend to keep each category</h3>
            <ul>
              <li><strong>Account profile</strong>: while the account is active, and erased on request after closure except where we must keep it.</li>
              <li><strong>Service Requests</strong>: about <strong>3 years</strong> after completion, as a financial and dispute record.</li>
              <li><strong>Warranty claims, incidents, and appeals</strong>: for as long as the related Service Request record, since they evidence what happened and any penalty applied.</li>
              <li><strong>CNIC &amp; KYC documents</strong>: while the Provider account exists, and up to about <strong>5 years</strong> after closure for tax and regulatory reasons.</li>
              <li><strong>Wallet ledger &amp; top-up receipts</strong>: up to about <strong>7 years</strong> for tax and audit purposes.</li>
              <li><strong>Chat messages</strong>: about <strong>2 years</strong>, or longer where a dispute or legal hold is active. Chat is append-only and cannot be edited or deleted by either party (&sect;&nbsp;9).</li>
              <li><strong>OTP attempt logs</strong>: kept only for rate limiting; no long-term value and erased on request.</li>
            </ul>
            <p>
              You can ask us to delete your data at any time under &sect;&nbsp;18, and we will act on
              that request rather than wait for a retention period to elapse. We will build automated
              retention enforcement as the platform matures, and will update this section &mdash; with
              the &ldquo;last updated&rdquo; date changed &mdash; when we do.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="security">17. Security Measures</h2>
            <ul>
              <li>Encrypted-in-transit (TLS 1.2+) for all data exchanged between your device and our servers.</li>
              <li>Encrypted-at-rest for the database, file storage, and authentication tokens.</li>
              <li>PostgreSQL <strong>Row-Level Security</strong> on every sensitive table &mdash; users can only access rows they are authorised to read.</li>
              <li><strong>SECURITY DEFINER</strong> stored procedures for all privileged operations, validated against <code>auth.uid()</code>.</li>
              <li>Cookie-backed sessions with HTTP-only, Secure, SameSite flags.</li>
              <li>Phone-OTP rate limiting (per phone and per IP) to mitigate enumeration attacks.</li>
              <li>Automated dependency scanning and routine security advisories review.</li>
            </ul>
            <p>
              No system is perfectly secure. While we follow industry best practices, we cannot
              guarantee absolute security of data transmitted over the internet.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="rights">18. Your Rights</h2>
            <p>Subject to applicable law, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> a copy of the personal data we hold about you;</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data;</li>
              <li><strong>Delete</strong> your account and associated personal data, subject to legal retention obligations;</li>
              <li><strong>Object</strong> to or restrict certain processing (e.g.&nbsp;marketing);</li>
              <li><strong>Withdraw consent</strong> at any time where processing is based on consent;</li>
              <li><strong>Lodge a complaint</strong> with the National Commission for Personal Data Protection (once operational under the Personal Data Protection Act).</li>
            </ul>
            <p>
              To exercise any of these rights, email{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#db4b0d] underline">{PRIVACY_EMAIL}</a>{' '}
              with verification of your identity. We will respond within <strong>30 days</strong>.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="minors">19. Minors</h2>
            <p>
              The Platform is not directed to children under 18. We do not knowingly collect data
              from minors. If you believe a minor has provided us with personal data, please contact{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#db4b0d] underline">{PRIVACY_EMAIL}</a>{' '}
              and we will delete the data promptly.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="cross-border">20. International Data Transfers</h2>
            <p>
              Some of our infrastructure providers (e.g.&nbsp;Supabase, Vercel, Firebase) operate
              data centres outside Pakistan. By using the Platform, you consent to your personal
              data being transferred to and stored in those jurisdictions, subject to safeguards
              equivalent to those required under Pakistani law.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="breach">21. Data Breach Notification</h2>
            <p>
              In the unlikely event of a personal data breach that is likely to result in a
              significant risk to your rights and freedoms, we will notify you and the relevant
              supervisory authority within <strong>72 hours</strong> of becoming aware of the
              breach, in line with international good practice.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="changes">22. Changes to this Policy</h2>
            <p>
              We may update this Policy from time to time. Material changes will be announced
              in-app and by notification at least <strong>30 days</strong> before they take effect.
              The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent
              revision.
            </p>

            <h2 className='text-2xl font-extrabold mt-6' id="contact">23. Contact Our Privacy Team</h2>
            <p>
              Questions, concerns, or requests regarding this Policy or your personal data may be
              directed to:
            </p>
            <ul>
              <li>Email: <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#db4b0d] underline">{PRIVACY_EMAIL}</a></li>
              <li>WhatsApp: <a href={`https://wa.me/${CONTACT_WHATSAPP.replace(/[^0-9]/g, "")}`} className="text-[#db4b0d] underline">{CONTACT_WHATSAPP}</a></li>
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
