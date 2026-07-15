'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Provider {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  service_type: string;
  city: string;
  online_status: boolean;
  provider_status: string;
  rating_avg: number;
  rating_count: number;
  verification_status: string;
  warranty_strikes: number;
  tier: string;
  total_completed_jobs: number;
  wallet_balance: number;
}

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'online'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProviders = useCallback(async () => {
    try {
      const supabase = (await import('../../../../client/supabaseClient')).supabase;
      const { data, error } = await supabase
        .from('ustaz_registrations')
        .select(`
          userId, firstName, lastName, phoneNumber, service_type, city,
          online_status, provider_status, rating_avg, rating_count,
          verification_status, warranty_strikes
        `)
        .order('registrationDate', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        return;
      }

      // Enrich with standing and wallet data
      const enriched = await Promise.all(
        (data || []).map(async (p) => {
          const [standingRes, walletRes] = await Promise.all([
            supabase.from('provider_standing').select('tier, total_completed_jobs').eq('provider_id', p.userId).maybeSingle(),
            supabase.from('provider_wallets').select('balance').eq('provider_id', p.userId).maybeSingle(),
          ]);
          return {
            ...p,
            tier: standingRes.data?.tier || 'standard',
            total_completed_jobs: standingRes.data?.total_completed_jobs || 0,
            wallet_balance: walletRes.data?.balance || 0,
          };
        })
      );

      setProviders(enriched);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleApproveVerification = async (providerId: string) => {
    try {
      const res = await fetch('/api/admin/verify-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', provider_id: providerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Provider verified successfully', 'success');
      fetchProviders();
    } catch (err) {
      showToast('Failed to verify provider', 'error');
    }
  };

  const handleRejectVerification = async (providerId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      const res = await fetch('/api/admin/verify-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', provider_id: providerId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Provider verification rejected', 'success');
      fetchProviders();
    } catch (err) {
      showToast('Failed to reject verification', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  const filteredProviders = providers.filter((p) => {
    if (filter === 'verified') return p.verification_status === 'verified';
    if (filter === 'unverified') return p.verification_status !== 'verified';
    if (filter === 'online') return p.online_status;
    return true;
  });

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      probation: 'bg-red-50 text-red-700 border-red-200',
      standard: 'bg-gray-50 text-gray-600 border-gray-200',
      trusted: 'bg-blue-50 text-blue-700 border-blue-200',
      elite: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[tier] || colors.standard}`}>
        {tier}
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      expired: 'bg-orange-50 text-orange-700 border-orange-200',
      unverified: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.unverified}`}>
        {status.replace('_', ' ')}
      </span>
    );
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
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] shadow-lg shadow-[#db4b0d]/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Provider Management</h1>
                <p className="text-xs text-gray-400">View and manage all registered providers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin/dashboard" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Top-Ups</a>
              <a href="/admin/incidents" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Incidents</a>
              <a href="/admin/appeals" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Appeals</a>
              <a href="/admin/observability" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Analytics</a>
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'verified', 'unverified', 'online'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] text-white shadow-md shadow-[#db4b0d]/25'
                  : 'text-gray-500 bg-white border border-gray-200 hover:bg-[#FFF7ED] hover:text-[#db4b0d]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({providers.filter((p) => {
                if (f === 'verified') return p.verification_status === 'verified';
                if (f === 'unverified') return p.verification_status !== 'verified';
                if (f === 'online') return p.online_status;
                return true;
              }).length})
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
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gradient-to-r from-[#FFF7ED] to-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Provider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jobs</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Wallet</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Verification</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProviders.map((p) => (
                    <tr key={p.userId} className="hover:bg-[#FFF7ED]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-400">{p.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{p.service_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.city || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          p.online_status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {p.online_status ? p.provider_status : 'offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getTierBadge(p.tier)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{p.rating_avg?.toFixed(1) || '0.0'}</span>
                        <span className="text-xs text-gray-400 ml-1">({p.rating_count})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.total_completed_jobs}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.wallet_balance} PKR</td>
                      <td className="px-4 py-3">{getVerificationBadge(p.verification_status)}</td>
                      <td className="px-4 py-3 text-right">
                        {p.verification_status === 'pending_review' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleApproveVerification(p.userId)}
                              className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectVerification(p.userId)}
                              className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
