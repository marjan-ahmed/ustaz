'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronUp,
  Menu,
  X,
  Link as LinkIcon,
  Check,
} from 'lucide-react';

export type LegalSection = readonly [id: string, label: string];

interface LegalPageShellProps {
  /** "Terms of Use" — printed in the hero */
  title: string;
  /** Tagline shown below the title */
  subtitle?: string;
  /** "Ustaz Legal" or similar small kicker above the title */
  kicker?: string;
  /** Date string — printed in the pill */
  lastUpdated: string;
  /** Lead paragraph shown above the highlight box */
  intro: React.ReactNode;
  /** Optional highlight box (e.g. "Important" / "Plain-English summary") */
  highlight?: React.ReactNode;
  /** Ordered table of contents — must match `<h2 id="...">` in children */
  sections: readonly LegalSection[];
  /** Article body (typically a stream of <h2 id="..."> + content) */
  children: React.ReactNode;
  /** Companion legal page (Terms ↔ Privacy) shown in footer CTA */
  companionLink: { href: string; label: string };
  /** Lead icon variant */
  icon?: 'terms' | 'privacy';
}

export default function LegalPageShell({
  title,
  subtitle,
  kicker = 'Ustaz Legal',
  lastUpdated,
  intro,
  highlight,
  sections,
  children,
  companionLink,
  icon = 'terms',
}: LegalPageShellProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.[0] ?? '');
  const [tocOpen, setTocOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Enable smooth scroll just for this page; restore on unmount.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // Reading progress + back-to-top visibility
  useEffect(() => {
    const onScroll = () => {
      const scroll = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (scroll / total) * 100) : 0);
      setShowTop(scroll > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active-section spy via IntersectionObserver
  useEffect(() => {
    const headings = sections
      .map(([id]) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const copyLink = useCallback(async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  }, []);

  // const Icon = icon === 'privacy' ? Shield : ScrollText;

  return (
    <main className="bg-white">
      {/* Reading progress bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed top-0 inset-x-0 z-50 h-[3px] bg-gray-100/80"
      >
        <div
          className="h-full bg-gradient-to-r from-[#db4b0d] via-orange-500 to-amber-400 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero — simple, content-first */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            {title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Last updated:{' '}
            <span className="font-medium text-gray-700">{lastUpdated}</span>
          </p>
          <div className="mt-6 max-w-3xl text-base text-gray-700 leading-relaxed">
            {intro}
          </div>
          {highlight && <div className="mt-6 max-w-3xl">{highlight}</div>}
        </div>
      </header>

      {/* Mobile ToC trigger bar (sticky) */}
      <div className="lg:hidden sticky top-[3px] z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {sections.find(([id]) => id === activeId)?.[1] ?? 'Overview'}
          </span>
          <button
            onClick={() => setTocOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#db4b0d] text-white text-sm font-medium rounded-full hover:bg-[#a93a0b] transition shrink-0"
          >
            <Menu className="w-4 h-4" />
            Contents
          </button>
        </div>
      </div>

      {/* Mobile ToC drawer */}
      {tocOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setTocOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Table of contents"
        >
          <div
            className="absolute inset-y-0 right-0 w-[88vw] max-w-sm bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">
                Table of contents
              </h2>
              <button
                onClick={() => setTocOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                aria-label="Close contents"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {sections.map(([id, label]) => {
                const active = activeId === id;
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={() => setTocOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition ${
                        active
                          ? 'bg-orange-50 text-[#db4b0d] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {active && (
                        <span className="w-1 h-4 bg-[#db4b0d] rounded-full shrink-0" />
                      )}
                      <span className={active ? '' : 'pl-3'}>{label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12 xl:grid-cols-[280px_1fr]">
        {/* Desktop sticky ToC */}
        <aside className="hidden lg:block">
          <div className="sticky top-12">
            <h2 className="text-[11px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-4 pl-4">
              On this page
            </h2>
            <ol className="relative border-l border-gray-200 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded">
              {sections.map(([id, label]) => {
                const active = activeId === id;
                return (
                  <li key={id} className="relative">
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -left-px top-0 bottom-0 w-[2px] bg-[#db4b0d] rounded-full"
                      />
                    )}
                    <a
                      href={`#${id}`}
                      className={`group block pl-4 pr-2 py-2 text-sm rounded-r-md transition leading-snug ${
                        active
                          ? 'text-[#db4b0d] font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/70'
                      }`}
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ol>

            {/* Companion */}
            <div className="mt-8 p-4 bg-gradient-to-br from-orange-50 to-amber-50/40 border border-orange-100 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Also see
              </p>
              <Link
                href={companionLink.href}
                className="text-sm font-semibold text-[#db4b0d] hover:underline inline-flex items-center gap-1"
              >
                {companionLink.label}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Article */}
        <div className="min-w-0">
          <article
            id="legal-article"
            onClick={(e) => {
              // Copy-link on anchor button click — captures clicks on
              // dynamically-rendered <button data-anchor="..."> elements.
              const target = e.target as HTMLElement;
              const btn = target.closest<HTMLButtonElement>(
                'button[data-anchor]',
              );
              if (btn) {
                e.preventDefault();
                copyLink(btn.dataset.anchor!);
              }
            }}
            className="
              max-w-3xl
              prose prose-slate prose-lg
              prose-headings:scroll-mt-32 prose-headings:tracking-tight
              prose-h2:text-3xl sm:prose-h2:text-[2rem]
              prose-h2:font-extrabold prose-h2:text-gray-900
              prose-h2:mt-24 prose-h2:mb-6
              prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-[#db4b0d]/30
              prose-h2:first:mt-0 prose-h2:relative
              prose-h3:text-xl prose-h3:font-bold prose-h3:mt-12 prose-h3:mb-3 prose-h3:text-gray-900
              prose-p:text-base prose-p:leading-[1.8] prose-p:text-gray-700 prose-p:my-5
              prose-li:text-base prose-li:leading-[1.75] prose-li:text-gray-700 prose-li:my-2
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-a:text-[#db4b0d] prose-a:font-medium prose-a:no-underline prose-a:underline-offset-2 hover:prose-a:underline
              prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-orange-50 prose-code:text-[#a93a0b] prose-code:rounded prose-code:text-[0.85em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
              prose-ul:my-6 prose-ol:my-6
              prose-hr:my-12
              [&>h2+*]:mt-6
              [&>h2~*:last-child]:mb-12
            "
          >
            {children}

            {/* Footer CTA */}
            <div className="not-prose mt-20 p-8 bg-gradient-to-br from-orange-50 via-amber-50/40 to-white border border-orange-100 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Questions or feedback?
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    Our team is happy to clarify any clause. Read the
                    companion policy or reach out directly.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link
                    href="/contact"
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 hover:border-[#db4b0d] hover:text-[#db4b0d] transition shadow-sm"
                  >
                    Contact us
                  </Link>
                  <Link
                    href={companionLink.href}
                    className="px-5 py-2.5 bg-[#db4b0d] hover:bg-[#a93a0b] text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
                  >
                    {companionLink.label}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Floating "Back to top" + "Copy link" status toast */}
      <button
        onClick={() =>
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#db4b0d] hover:bg-[#a93a0b] text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          showTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {copiedId && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <Check className="w-4 h-4 text-green-400" />
          Link to section copied
        </div>
      )}
    </main>
  );
}

/**
 * Reusable section heading with copy-link button on hover.
 * Use in legal page content like:
 *   <LegalH2 id="acceptance">1. Acceptance &amp; Modification</LegalH2>
 */
export function LegalH2({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className="group relative">
      <button
        type="button"
        data-anchor={id}
        aria-label="Copy link to this section"
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-7 h-7 hidden sm:flex items-center justify-center rounded-md text-gray-400 hover:text-[#db4b0d] hover:bg-orange-50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
      {children}
    </h2>
  );
}
