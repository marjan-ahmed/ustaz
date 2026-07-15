'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Metrics {
  totalProviders: number;
  onlineProviders: number;
  verifiedProviders: number;
  tierDistribution: Record<string, number>;
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  noUstazFound: number;
  dispatchSuccessRate: number;
  avgRating: number;
  totalIncidents: number;
  openIncidents: number;
  confirmedIncidents: number;
  totalAppeals: number;
  pendingAppeals: number;
  overturnedAppeals: number;
  totalWalletBalance: number;
}

export default function AdminObservabilityPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const supabase = (await import('../../../../client/supabaseClient')).supabase;

      const [providers, requests, incidents, appeals, wallets] = await Promise.all([
        supabase.from('ustaz_registrations').select('userId, online_status, verification_status'),
        supabase.from('service_requests').select('id, status'),
        supabase.from('incidents').select('id, status'),
        supabase.from('appeals').select('id, status'),
        supabase.from('provider_wallets').select('balance'),
      ]);

      const providerData = providers.data || [];
      const requestData = requests.data || [];
      const incidentData = incidents.data || [];
      const appealData = appeals.data || [];
      const walletData = wallets.data || [];

      // Tier distribution
      const standingRes = await supabase.from('provider_standing').select('tier');
      const standingData = standingRes.data || [];
      const tierDist: Record<string, number> = { probation: 0, standard: 0, trusted: 0, elite: 0 };
      standingData.forEach((s) => { tierDist[s.tier] = (tierDist[s.tier] || 0) + 1; });

      // Rating average
      const perfRes = await supabase.from('provider_performance').select('rating_avg, completed_jobs');
      const perfData = perfRes.data || [];
      const totalWeighted = perfData.reduce((sum, p) => sum + (p.rating_avg || 0) * (p.completed_jobs || 0), 0);
      const totalJobs = perfData.reduce((sum, p) => sum + (p.completed_jobs || 0), 0);

      const totalReqs = requestData.length;
      const completed = requestData.filter((r) => r.status === 'completed').length;
      const cancelled = requestData.filter((r) => r.status === 'cancelled').length;
      const noUstaz = requestData.filter((r) => r.status === 'no_ustaz_found').length;

      setMetrics({
        totalProviders: providerData.length,
        onlineProviders: providerData.filter((p) => p.online_status).length,
        verifiedProviders: providerData.filter((p) => p.verification_status === 'verified').length,
        tierDistribution: tierDist,
        totalRequests: totalReqs,
        completedRequests: completed,
        cancelledRequests: cancelled,
        noUstazFound: noUstaz,
        dispatchSuccessRate: totalReqs > 0 ? ((totalReqs - noUstaz) / totalReqs) * 100 : 0,
        avgRating: totalJobs > 0 ? totalWeighted / totalJobs : 0,
        totalIncidents: incidentData.length,
        openIncidents: incidentData.filter((i) => ['suspected', 'check_in_sent', 'under_review'].includes(i.status)).length,
        confirmedIncidents: incidentData.filter((i) => i.status === 'confirmed').length,
        totalAppeals: appealData.length,
        pendingAppeals: appealData.filter((a) => a.status === 'pending').length,
        overturnedAppeals: appealData.filter((a) => a.status === 'overturned').length,
        totalWalletBalance: walletData.reduce((sum, w) => sum + (w.balance || 0), 0),
      });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Observability</h1>
                <p className="text-xs text-gray-400">Marketplace health metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin/dashboard" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Top-Ups</a>
              <a href="/admin/providers" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Providers</a>
              <a href="/admin/incidents" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Incidents</a>
              <a href="/admin/appeals" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Appeals</a>
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-[#FF6B4A]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Provider Health */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Provider Health</h2>
              <div className="grid grid-cols-4 gap-4">
                <MetricCard label="Total Providers" value={metrics.totalProviders} icon="users" color="blue" />
                <MetricCard label="Online Now" value={metrics.onlineProviders} icon="wifi" color="emerald" />
                <MetricCard label="Verified" value={metrics.verifiedProviders} icon="check" color="green" />
                <MetricCard label="Avg Rating" value={metrics.avgRating.toFixed(2)} icon="star" color="amber" />
              </div>
            </section>

            {/* Tier Distribution */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tier Distribution</h2>
              <div className="grid grid-cols-4 gap-4">
                <TierCard tier="probation" count={metrics.tierDistribution.probation || 0} color="red" />
                <TierCard tier="standard" count={metrics.tierDistribution.standard || 0} color="gray" />
                <TierCard tier="trusted" count={metrics.tierDistribution.trusted || 0} color="blue" />
                <TierCard tier="elite" count={metrics.tierDistribution.elite || 0} color="amber" />
              </div>
            </section>

            {/* Request Funnel */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Request Funnel</h2>
              <div className="grid grid-cols-5 gap-4">
                <MetricCard label="Total Requests" value={metrics.totalRequests} icon="clipboard" color="blue" />
                <MetricCard label="Completed" value={metrics.completedRequests} icon="check-circle" color="emerald" />
                <MetricCard label="Cancelled" value={metrics.cancelledRequests} icon="x-circle" color="red" />
                <MetricCard label="No Ustaz Found" value={metrics.noUstazFound} icon="search" color="orange" />
                <MetricCard label="Dispatch Success" value={`${metrics.dispatchSuccessRate.toFixed(1)}%`} icon="target" color="green" />
              </div>
            </section>

            {/* Incidents & Appeals */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Incidents & Appeals</h2>
              <div className="grid grid-cols-6 gap-4">
                <MetricCard label="Total Incidents" value={metrics.totalIncidents} icon="alert" color="orange" />
                <MetricCard label="Open Incidents" value={metrics.openIncidents} icon="clock" color="amber" />
                <MetricCard label="Confirmed" value={metrics.confirmedIncidents} icon="check" color="red" />
                <MetricCard label="Total Appeals" value={metrics.totalAppeals} icon="scale" color="purple" />
                <MetricCard label="Pending Appeals" value={metrics.pendingAppeals} icon="hourglass" color="blue" />
                <MetricCard label="Overturned" value={metrics.overturnedAppeals} icon="rotate" color="emerald" />
              </div>
            </section>

            {/* Wallet */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Wallet Health</h2>
              <div className="grid grid-cols-1 gap-4">
                <MetricCard label="Total Wallet Balance" value={`${metrics.totalWalletBalance.toLocaleString()} PKR`} icon="wallet" color="green" />
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-500',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <span className="text-lg">
            {icon === 'users' && '👥'}
            {icon === 'wifi' && '🟢'}
            {icon === 'check' && '✅'}
            {icon === 'star' && '⭐'}
            {icon === 'clipboard' && '📋'}
            {icon === 'check-circle' && '✅'}
            {icon === 'x-circle' && '❌'}
            {icon === 'search' && '🔍'}
            {icon === 'target' && '🎯'}
            {icon === 'alert' && '⚠️'}
            {icon === 'clock' && '🕐'}
            {icon === 'scale' && '⚖️'}
            {icon === 'hourglass' && '⏳'}
            {icon === 'rotate' && '🔄'}
            {icon === 'wallet' && '💰'}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TierCard({ tier, count, color }: { tier: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'border-red-200 bg-red-50',
    gray: 'border-gray-200 bg-gray-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
  };

  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{tier}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
    </div>
  );
}
