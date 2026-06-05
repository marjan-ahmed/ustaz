'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Loader2, MapPin, Clock, ShieldCheck, Star, CheckCircle,
  XCircle, Hourglass, Briefcase, History as HistoryIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryRow {
  request_id: string;
  service_type: string;
  status: string;
  address: string | null;
  created_at: string;
  completed_at: string | null;
  provider_id: string | null;
  provider_name: string | null;
  warranty_status: string | null;       // null | pending | accepted | refused | resolved
  warranty_claimed_at: string | null;
  has_rated: boolean;
}

const WARRANTY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function warrantyDeadline(completedAt: string) {
  return new Date(new Date(completedAt).getTime() + WARRANTY_WINDOW_MS);
}

function timeLeft(deadline: Date) {
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m left`;
}

export default function HistoryPage() {
  const { user, isLoaded, isSignedIn } = useSupabaseUser();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showClaimFor, setShowClaimFor] = useState<string | null>(null);
  const [claimDesc, setClaimDesc] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_customer_history');
    if (error) { toast.error('Failed to load history'); setLoading(false); return; }
    setRows((data ?? []) as HistoryRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
    else if (isLoaded && !isSignedIn) setLoading(false);
  }, [isLoaded, isSignedIn, load]);

  const submitClaim = async (requestId: string) => {
    setClaiming(requestId);
    try {
      const res = await fetch('/api/warranty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, description: claimDesc }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Failed to file claim'); return; }
      toast.success('Warranty claim filed! Your provider has been notified.');
      setShowClaimFor(null);
      setClaimDesc('');
      load();
    } catch {
      toast.error('Failed to file claim');
    } finally {
      setClaiming(null);
    }
  };

  /* ── auth gate ── */
  if (!isLoaded || loading) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#db4b0d]" />
        </div>
        <Footer />
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your history</h2>
          <Button asChild className="bg-[#db4b0d] hover:bg-[#a93a0b] mt-2">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Heading */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#db4b0d]/10 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-[#db4b0d]" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Your Job History</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6 ml-13">
            Track past services and claim a free warranty within 3 days of completion.
          </p>

          {rows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No jobs yet</h3>
              <p className="text-sm text-gray-500 mb-4">Your completed and active service requests will appear here.</p>
              <Button asChild className="bg-[#db4b0d] hover:bg-[#a93a0b]">
                <Link href="/process">Request a Service</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const isCompleted = row.status === 'completed';
                const deadline = row.completed_at ? warrantyDeadline(row.completed_at) : null;
                const remaining = deadline ? timeLeft(deadline) : null;
                const withinWindow = isCompleted && !!remaining;
                const canClaim = withinWindow && !row.warranty_status;

                return (
                  <div key={row.request_id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* card head */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5 text-[#db4b0d]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{row.service_type}</h3>
                            {row.provider_name && (
                              <p className="text-xs text-gray-500">by {row.provider_name}</p>
                            )}
                            {row.address && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" /> {row.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>

                      {/* completion time */}
                      {isCompleted && row.completed_at && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Completed {fmtDateTime(row.completed_at)}
                        </div>
                      )}
                    </div>

                    {/* warranty / rating footer */}
                    {isCompleted && (
                      <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                        {/* existing claim status */}
                        {row.warranty_status ? (
                          <WarrantyStatusRow status={row.warranty_status} claimedAt={row.warranty_claimed_at} />
                        ) : showClaimFor === row.request_id ? (
                          <div className="space-y-2">
                            <textarea
                              value={claimDesc}
                              onChange={(e) => setClaimDesc(e.target.value)}
                              placeholder="What went wrong? (optional)"
                              rows={2}
                              className="w-full text-sm border border-gray-200 rounded-xl p-2.5 resize-none focus:outline-none focus:border-[#db4b0d]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setShowClaimFor(null); setClaimDesc(''); }}
                                className="flex-1 h-9 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={claiming === row.request_id}
                                onClick={() => submitClaim(row.request_id)}
                                className="flex-1 h-9 rounded-xl bg-[#db4b0d] hover:bg-[#a93a0b] text-white text-sm font-bold disabled:opacity-50"
                              >
                                {claiming === row.request_id ? 'Filing…' : 'Submit Claim'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            {withinWindow ? (
                              <span className="text-xs text-green-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                Warranty active · <span className="font-semibold">{remaining}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" /> Warranty expired
                              </span>
                            )}
                            {canClaim && (
                              <button
                                onClick={() => { setShowClaimFor(row.request_id); setClaimDesc(''); }}
                                className="shrink-0 h-9 px-4 rounded-xl bg-[#db4b0d] hover:bg-[#a93a0b] text-white text-xs font-bold transition active:scale-95"
                              >
                                🛡️ Claim Warranty
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ── helpers ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed:         { label: 'Completed',  cls: 'bg-green-100 text-green-700' },
    cancelled:         { label: 'Cancelled',  cls: 'bg-red-100 text-red-600' },
    no_ustaz_found:    { label: 'No Provider', cls: 'bg-gray-100 text-gray-500' },
    notified_multiple: { label: 'Finding…',   cls: 'bg-amber-100 text-amber-700' },
    accepted:          { label: 'Accepted',   cls: 'bg-blue-100 text-blue-700' },
    in_progress:       { label: 'In Progress', cls: 'bg-purple-100 text-purple-700' },
    work_in_progress:  { label: 'In Progress', cls: 'bg-purple-100 text-purple-700' },
  };
  const m = map[status] ?? { label: status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' };
  return <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.cls}`}>{m.label}</span>;
}

function WarrantyStatusRow({ status, claimedAt }: { status: string; claimedAt: string | null }) {
  const map: Record<string, { icon: React.ReactNode; text: string; cls: string }> = {
    pending:  { icon: <Hourglass className="w-4 h-4" />,   text: 'Warranty claim — waiting for provider', cls: 'text-amber-600' },
    accepted: { icon: <CheckCircle className="w-4 h-4" />, text: 'Warranty accepted — provider will return', cls: 'text-green-600' },
    refused:  { icon: <XCircle className="w-4 h-4" />,     text: 'Warranty refused — provider penalized', cls: 'text-red-600' },
    resolved: { icon: <CheckCircle className="w-4 h-4" />, text: 'Warranty resolved', cls: 'text-green-600' },
  };
  const m = map[status] ?? map.pending;
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${m.cls}`}>
      {m.icon}
      <span>{m.text}</span>
      {claimedAt && <span className="text-gray-400 ml-auto">{fmtDateTime(claimedAt)}</span>}
    </div>
  );
}
