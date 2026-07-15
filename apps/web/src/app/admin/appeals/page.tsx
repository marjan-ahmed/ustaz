'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Appeal {
  id: string;
  incident_id: string | null;
  provider_id: string;
  appeal_type: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: string;
  admin_response: string | null;
  created_at: string;
  provider_name?: string;
}

export default function AdminAppealsPage() {
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'upheld' | 'overturned'>('pending');
  const [resolveModal, setResolveModal] = useState<{ open: boolean; appeal: Appeal | null }>({ open: false, appeal: null });
  const [resolveData, setResolveData] = useState({ status: 'upheld', response: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAppeals = useCallback(async () => {
    try {
      const supabase = (await import('../../../../client/supabaseClient')).supabase;
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (a) => {
          const { data: provider } = await supabase
            .from('ustaz_registrations')
            .select('firstName, lastName')
            .eq('userId', a.provider_id)
            .maybeSingle();
          return {
            ...a,
            provider_name: provider ? `${provider.firstName} ${provider.lastName}` : 'Unknown',
          };
        })
      );

      setAppeals(enriched);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleResolve = async () => {
    if (!resolveModal.appeal) return;
    try {
      const res = await fetch('/api/admin/resolve-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appeal_id: resolveModal.appeal.id,
          status: resolveData.status,
          admin_response: resolveData.response,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Appeal ${resolveData.status}`, 'success');
      setResolveModal({ open: false, appeal: null });
      setResolveData({ status: 'upheld', response: '' });
      fetchAppeals();
    } catch (err) {
      showToast('Failed to resolve appeal', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  const filtered = appeals.filter((a) => filter === 'all' || a.status === filter);

  const getStatusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      under_review: 'bg-blue-50 text-blue-700 border-blue-200',
      upheld: 'bg-gray-50 text-gray-600 border-gray-200',
      overturned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[s] || colors.pending}`}>{s}</span>;
  };

  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      incident_dispute: 'Incident Dispute',
      tier_demotion: 'Tier Demotion',
      verification_rejection: 'Verification Rejection',
      penalty_dispute: 'Penalty Dispute',
    };
    return labels[t] || t;
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Appeals</h1>
                <p className="text-xs text-gray-400">Review provider appeal submissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin/dashboard" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Top-Ups</a>
              <a href="/admin/providers" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Providers</a>
              <a href="/admin/incidents" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Incidents</a>
              <a href="/admin/observability" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Analytics</a>
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'pending', 'under_review', 'upheld', 'overturned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] text-white shadow-md'
                  : 'text-gray-500 bg-white border border-gray-200 hover:bg-[#FFF7ED]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-[#FF6B4A]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <p className="text-gray-500 text-lg font-medium">No appeals found</p>
            <p className="text-gray-400 text-sm mt-1">No appeals match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appeal) => (
              <div key={appeal.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">{getTypeLabel(appeal.appeal_type)}</span>
                      {getStatusBadge(appeal.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-400 text-xs">Provider</p>
                        <p className="text-gray-700 font-medium">{appeal.provider_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Submitted</p>
                        <p className="text-gray-700">{new Date(appeal.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Incident ID</p>
                        <p className="text-gray-700 font-mono text-xs">{appeal.incident_id || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-700">{appeal.reason}</p>
                    </div>
                    {appeal.admin_response && (
                      <div className="bg-emerald-50 rounded-xl px-4 py-3 mt-2">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Admin Response:</p>
                        <p className="text-sm text-emerald-800">{appeal.admin_response}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {['pending', 'under_review'].includes(appeal.status) && (
                      <button
                        onClick={() => setResolveModal({ open: true, appeal })}
                        className="px-3 py-1.5 text-xs font-medium bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] text-white rounded-full hover:from-[#FF4521] hover:to-red-600 shadow-sm transition-all"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Resolve Modal */}
      {resolveModal.open && resolveModal.appeal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Appeal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <select
                  value={resolveData.status}
                  onChange={(e) => setResolveData({ ...resolveData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30"
                >
                  <option value="upheld">Upheld (Original stands)</option>
                  <option value="overturned">Overturned (Reverse penalty/tier change)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response to Provider</label>
                <textarea
                  value={resolveData.response}
                  onChange={(e) => setResolveData({ ...resolveData, response: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 resize-none"
                  placeholder="Explain your decision..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setResolveModal({ open: false, appeal: null })}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveData.response.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] hover:from-[#FF4521] hover:to-red-600 text-white font-medium rounded-full shadow-md transition-all disabled:opacity-50"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
