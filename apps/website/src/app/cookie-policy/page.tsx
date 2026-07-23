import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReadingTime from "@/components/ReadingTime";

export const metadata: Metadata = {
  title: "Cookie Policy — Ustaz",
  description:
    "How Ustaz uses cookies and similar storage technologies on its platform, and how you can control them.",
};

const LAST_UPDATED = "23 July 2026";

const sections = [
  ["what-are-cookies", "1. What Are Cookies"],
  ["why-we-use", "2. Why We Use Cookies"],
  ["categories", "3. Categories of Cookies We Use"],
  ["our-cookies", "4. Cookies Set by Ustaz"],
  ["third-party", "5. Third-Party Cookies"],
  ["other-storage", "6. Other Browser Storage We Use"],
  ["no-ads", "7. No Advertising or Cross-Site Tracking"],
  ["managing", "8. Managing & Disabling Cookies"],
  ["dnt", "9. Do Not Track Signals"],
  ["children", "10. Children"],
  ["retention", "11. Retention of Cookie Data"],
  ["changes", "12. Changes to this Policy"],
  ["contact", "13. Contact"],
] as const;

export default function CookiePolicy() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
          <header className="border-b border-gray-200 pb-8 mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Cookie Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last updated: <span className="font-medium text-gray-700">{LAST_UPDATED}</span>
              <ReadingTime targetId="cookie-article" />
            </p>
            <p className="mt-6 text-base text-gray-700 leading-6 sm:leading-7">
              This Cookie Policy explains how Ustaz (&ldquo;<strong>we</strong>&rdquo;,
              &ldquo;<strong>us</strong>&rdquo;, &ldquo;<strong>our</strong>&rdquo;) uses cookies
              and similar storage technologies on the Ustaz web application, mobile applications,
              and supporting services (collectively, the &ldquo;<strong>Platform</strong>&rdquo;).
              It is a companion to our{' '}
              <Link href="/privacy-policy" className="text-[#db4b0d] underline font-medium">
                Privacy Policy
              </Link>
              {' '}and our{' '}
              <Link href="/terms" className="text-[#db4b0d] underline font-medium">
                Terms of Use
              </Link>
              . By continuing to use the Platform, you consent to the cookies described below.
            </p>
            <div className="mt-6 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900">
              <strong>Plain-English summary:</strong> We use cookies and a service worker to
              keep you signed in, deliver push notifications, and remember your language. We
              <strong> do not sell your data</strong>, we do not use advertising trackers, and
              we do not load third-party social-media or analytics pixels that follow you across
              the web.
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
                  <li key={id}>
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
            id="cookie-article"
            className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-li:leading-7"
          >
            <h2 className="text-2xl font-extrabold mt-6" id="what-are-cookies">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files that a website asks your browser to store on your
              device when you visit it. They are read back on future visits so the site can
              recognise your browser, keep you logged in, remember your preferences, and operate
              securely.
            </p>
            <p>
              In addition to traditional cookies, modern web platforms (including ours) rely on
              other browser storage mechanisms such as <code>localStorage</code>,{' '}
              <code>IndexedDB</code>, and <strong>service workers</strong>. For the purposes of
              this Policy, &ldquo;<strong>cookies</strong>&rdquo; refers to all of these
              client-side storage technologies, except where otherwise specified in &sect; 6.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="why-we-use">
              2. Why We Use Cookies
            </h2>
            <p>We use cookies for a limited set of strictly purposeful reasons:</p>
            <ul>
              <li>
                <strong>To keep you signed in</strong> via a secure, HTTP-only session cookie
                managed by Supabase Authentication.
              </li>
              <li>
                <strong>To protect the Platform</strong> against fraud, automated abuse, and
                rate-limit overload on our authentication and OTP endpoints.
              </li>
              <li>
                <strong>To remember your preferences</strong>, such as your selected language
                (English / Urdu / Arabic) and recently-selected service category.
              </li>
              <li>
                <strong>To deliver push notifications</strong> through a Firebase Cloud
                Messaging service worker so you can receive new-request and chat alerts even
                when the Platform tab is closed.
              </li>
              <li>
                <strong>To measure aggregate Platform health</strong> (page-load timings, error
                rates) so we can improve performance. These measurements are anonymised and
                cannot identify you individually.
              </li>
            </ul>
            <p>
              We do <strong>not</strong> use cookies to build advertising profiles of you, share
              your browsing across the web with third-party ad networks, or track you between
              sessions for any commercial purpose unrelated to the Platform&apos;s function.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="categories">
              3. Categories of Cookies We Use
            </h2>
            <p>
              We classify the cookies we set into three categories. The fourth category
              (Advertising / Targeting) is <strong>intentionally absent</strong> because we do
              not use it.
            </p>
            <h3>3.1 Strictly Necessary</h3>
            <p>
              Required for the Platform to function. Without these, you cannot sign in, create a
              service request, or use core features. These cannot be disabled in our app, and
              they do not require your consent under most data-protection laws because they are
              essential to the service you have requested.
            </p>
            <h3>3.2 Functional</h3>
            <p>
              Remember choices you make (language, theme, recently-selected service category)
              so the Platform feels personal across visits. Disabling these will not break the
              Platform but may reset preferences on every visit.
            </p>
            <h3>3.3 Performance</h3>
            <p>
              Anonymised diagnostic signals (error rates, navigation timings) that help us spot
              regressions. They contain no personal identifiers. You may opt out of these via
              the cookie-control toggle in your account settings.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="our-cookies">
              4. Cookies Set by Ustaz
            </h2>
            <p>The following first-party cookies and tokens are set by the Platform directly:</p>
            <ul>
              <li>
                <strong><code>sb-<project-ref>-auth-token</code></strong> &mdash;
                <em> Strictly Necessary.</em> HTTP-only, Secure, SameSite=Lax session cookie
                managed by Supabase Auth. Encodes your signed JSON Web Token and refresh token
                so server routes can authenticate you. <strong>Lifetime:</strong> until you sign
                out or the JWT expires (default 1 hour, auto-refreshed).
              </li>
              <li>
                <strong><code>sb-<project-ref>-auth-token-code-verifier</code></strong>{' '}
                &mdash; <em>Strictly Necessary.</em> Short-lived PKCE verifier used during sign-in
                flows. Deleted automatically once authentication completes.
              </li>
              <li>
                <strong><code>NEXT_LOCALE</code></strong> &mdash; <em>Functional.</em> Your
                selected language (en / ur / ar) used by{' '}
                <code>next-intl</code>. <strong>Lifetime:</strong> 1 year, refreshed on each
                visit.
              </li>
              <li>
                <strong><code>ustaz.last_service_type</code></strong> (localStorage) &mdash;
                <em> Functional.</em> Pre-fills the service category on the request form.
              </li>
              <li>
                <strong>Service worker registration</strong> &mdash; <em>Strictly Necessary
                for push.</em> <code>public/firebase-messaging-sw.js</code> is registered with
                your browser so push notifications can be delivered even when the Platform tab
                is closed.
              </li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="third-party">
              5. Third-Party Cookies
            </h2>
            <p>
              The Platform integrates a small number of third-party services that are essential
              to its function. Where any of them sets a cookie or stores data in your browser,
              they do so under their own privacy policies, which we summarise below.
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> (database, auth, real-time, storage). Sets the
                authentication cookie listed in &sect; 4. Privacy Policy:{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  supabase.com/privacy
                </a>
                .
              </li>
              <li>
                <strong>Firebase Cloud Messaging</strong> (push notifications). Stores an FCM
                registration token in IndexedDB used to deliver notifications to your device.
                Privacy Policy:{' '}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
                  firebase.google.com/support/privacy
                </a>
                .
              </li>
              <li>
                <strong>Google Maps Platform</strong> (maps + geocoding). Loads scripts and may
                set cookies for fraud-prevention and to remember map preferences while you use
                the embedded maps. Privacy Policy:{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
                .
              </li>
              <li>
                <strong>Twilio Verify</strong> (SMS OTP). Used server-side via Edge Functions to
                send verification codes. Twilio does not set cookies on the Platform itself, but
                metadata about your verification is processed by Twilio under{' '}
                <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                  twilio.com/legal/privacy
                </a>
                .
              </li>
              <li>
                <strong>Vercel</strong> (web hosting). May set anti-bot and load-balancing
                cookies at the edge. Privacy Policy:{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  vercel.com/legal/privacy-policy
                </a>
                .
              </li>
              <li>
                <strong>JazzCash / EasyPaisa / partner banks</strong> (Provider wallet
                top-ups). Only loaded when a Provider initiates a top-up redirect. Subject to
                the provider&apos;s own privacy notice presented at that step.
              </li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="other-storage">
              6. Other Browser Storage We Use
            </h2>
            <p>
              Beyond traditional cookies, the Platform stores small amounts of data in your
              browser to make it work:
            </p>
            <ul>
              <li>
                <strong><code>localStorage</code></strong>: language preference (mirror of{' '}
                <code>NEXT_LOCALE</code>), the most recently selected service category, and
                short-lived flags such as &ldquo;notification permission asked&rdquo;.
              </li>
              <li>
                <strong><code>IndexedDB</code></strong>: used by the Firebase Messaging SDK to
                store the encryption keys and FCM registration token for your device.
              </li>
              <li>
                <strong>Service Worker</strong>: a small JavaScript file (
                <code>firebase-messaging-sw.js</code>) registered to your origin so that
                background push notifications can fire when the Platform tab is closed. The
                service worker does not cache personal data; it only handles incoming push
                messages and any future PWA offline behaviour.
              </li>
            </ul>
            <p>
              Clearing site data in your browser removes all of the above. Doing so will sign
              you out and disable push notifications until you re-grant permission.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="no-ads">
              7. No Advertising or Cross-Site Tracking
            </h2>
            <p>
              We do <strong>not</strong> use third-party advertising cookies, retargeting
              pixels, conversion trackers, or social-media plugins that would identify you
              across other websites. This is a deliberate decision rooted in our{' '}
              <Link href="/privacy-policy">Privacy Policy</Link> and is part of our trust
              positioning as a Pakistani service marketplace. If this ever changes &mdash; for
              example because we add an opt-in marketing channel &mdash; we will update this
              Policy and require your explicit consent before any such tracker loads.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="managing">
              8. Managing & Disabling Cookies
            </h2>
            <p>
              You can control or delete cookies at any time through your browser&apos;s
              settings:
            </p>
            <ul>
              <li>
                <strong>Chrome</strong>: <code>chrome://settings/cookies</code>
              </li>
              <li>
                <strong>Edge</strong>: {' '}
                <code>edge://settings/content/cookies</code>
              </li>
              <li>
                <strong>Firefox</strong>: Preferences → Privacy & Security → Cookies and
                Site Data.
              </li>
              <li>
                <strong>Safari (macOS)</strong>: Safari → Settings → Privacy → Manage Website
                Data.
              </li>
              <li>
                <strong>Safari (iOS)</strong>: Settings → Safari → Advanced → Website Data.
              </li>
              <li>
                <strong>Android Chrome</strong>: ⋮ menu → Settings → Site settings → Cookies.
              </li>
            </ul>
            <p>
              Disabling <strong>Strictly Necessary</strong> cookies will sign you out and
              prevent core features (creating a request, sending a message, going online as a
              Provider) from working. Disabling <strong>Functional</strong> cookies will reset
              your language and last-used service on every visit. Disabling{' '}
              <strong>Performance</strong> cookies has no user-facing impact.
            </p>
            <p>
              You can also revoke <strong>notification permission</strong> separately via your
              browser&apos;s site-settings page or via your operating system&apos;s
              notification settings. Revoking permission stops all push notifications but does
              not log you out.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="dnt">
              9. Do Not Track Signals
            </h2>
            <p>
              Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT) signal. Because there is no
              industry consensus on how DNT must be honoured, our Platform does not respond to
              it. However, since we do not use cross-site tracking in the first place, the
              practical effect on your privacy is the same regardless of your DNT setting.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="children">
              10. Children
            </h2>
            <p>
              The Platform is not directed at children under 18 and we do not knowingly set
              cookies on devices used by children. If you believe a child has used the Platform
              and we hold data about them, contact us at{' '}
              <a href="mailto:privacy@ustaz.app">privacy@ustaz.app</a> and we will delete the
              data promptly.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="retention">
              11. Retention of Cookie Data
            </h2>
            <ul>
              <li>
                <strong>Session cookies</strong> are deleted when you close the browser or sign
                out.
              </li>
              <li>
                <strong>Persistent cookies</strong> (such as <code>NEXT_LOCALE</code>) expire on
                their stated lifetime — usually 1 year — and are refreshed each
                visit.
              </li>
              <li>
                <strong>FCM tokens</strong> are kept until you sign out, revoke notification
                permission, or your browser invalidates the token. Invalidated tokens are
                automatically pruned by our <code>send-fcm</code> Edge Function within seconds
                of the first failed delivery.
              </li>
              <li>
                <strong>Performance / diagnostic data</strong> is aggregated and retained for
                no more than 30 days.
              </li>
            </ul>

            <h2 className="text-2xl font-extrabold mt-6" id="changes">
              12. Changes to this Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in
              technology, law, or our practices. The &ldquo;Last updated&rdquo; date at the top
              of this page reflects the most recent revision. Material changes will be
              announced in-app and by notification at least <strong>30 days</strong> before
              they take effect.
            </p>

            <h2 className="text-2xl font-extrabold mt-6" id="contact">
              13. Contact
            </h2>
            <p>
              Questions or concerns about this Cookie Policy can be sent to:
            </p>
            <ul>
              <li>
                Email: <a href="mailto:privacy@ustaz.app">privacy@ustaz.app</a>
              </li>
              <li>Postal: Ustaz (Pvt) Ltd, Karachi, Sindh, Pakistan</li>
              <li>
                In-app: <Link href="/contact">Contact page</Link>
              </li>
            </ul>

            <hr className="my-12" />
            <p className="text-sm text-gray-500">
              See also our{' '}
              <Link href="/privacy-policy" className="text-[#db4b0d] underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-[#db4b0d] underline">
                Terms of Use
              </Link>
              .
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}