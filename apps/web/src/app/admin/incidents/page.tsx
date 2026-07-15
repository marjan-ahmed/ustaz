'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Incident {
  id: string;
  request_id: string;
  provider_id: string;
  customer_id: string;
  incident_type: string;
  status: string;
  severity: string;
  evidence: Record<string, unknown>;
  provider_response: string | null;
  customer_response: string | null;
  resolution: string | null;
  penalty_applied: boolean;
  penalty_amount: number;
  created_at: string;
  provider_name?: string;
  service_type?: string;
}

export default function AdminIncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suspected' | 'check_in_sent' | 'under_review' | 'confirmed' | 'dismissed'>('suspected');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolveModal, setResolveModal] = useState<{ open: boolean; incident: Incident | null }>({ open: false, incident: null });
  const [resolveData, setResolveData] = useState({ resolution: 'no_fault', penalty_amount: 0, notes: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchIncidents = useCallback(async () => {
    try {
      const supabase = (await import('../../../../client/supabaseClient')).supabase;
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (inc) => {
          const [providerRes, requestRes] = await Promise.all([
            supabase.from('ustaz_registrations').select('firstName, lastName').eq('userId', inc.provider_id).maybeSingle(),
            supabase.from('service_requests').select('service_type').eq('id', inc.request_id).maybeSingle(),
          ]);
          return {
            ...inc,
            provider_name: providerRes.data ? `${providerRes.data.firstName} ${providerRes.data.lastName}` : 'Unknown',
            service_type: requestRes.data?.service_type || 'Unknown',
          };
        })
      );

      setIncidents(enriched);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleResolve = async () => {
    if (!resolveModal.incident) return;
    try {
      const res = await fetch('/api/admin/resolve-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: resolveModal.incident.id,
          resolution: resolveData.resolution,
          penalty_amount: resolveData.penalty_amount,
          notes: resolveData.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Incident resolved', 'success');
      setResolveModal({ open: false, incident: null });
      setResolveData({ resolution: 'no_fault', penalty_amount: 0, notes: '' });
      fetchIncidents();
    } catch (err) {
      showToast('Failed to resolve incident', 'error');
    }
  };

  const handleSendCheckIn = async (incidentId: string) => {
    try {
      const res = await fetch('/api/admin/send-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Check-in prompt sent', 'success');
      fetchIncidents();
    } catch (err) {
      showToast('Failed to send check-in', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  const filtered = incidents.filter((i) => filter === 'all' || i.status === filter);

  const getSeverityBadge = (s: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-50 text-gray-600 border-gray-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[s] || colors.low}`}>{s}</span>;
  };

  const getStatusBadge = (s: string) => {
    const colors: Record<string, string> = {
      suspected: 'bg-amber-50 text-amber-700 border-amber-200',
      check_in_sent: 'bg-blue-50 text-blue-700 border-blue-200',
      provider_responded: 'bg-purple-50 text-purple-700 border-purple-200',
      under_review: 'bg-orange-50 text-orange-700 border-orange-200',
      confirmed: 'bg-red-50 text-red-700 border-red-200',
      dismissed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[s] || colors.low}`}>{s.replace(/_/g, ' ')}</span>;
  };

  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      no_show_provider: 'Provider No-Show',
      no_show_customer: 'Customer No-Show',
      gps_anomaly: 'GPS Anomaly',
      early_completion: 'Early Completion',
      customer_unavailable: 'Customer Unavailable',
      complaint: 'Complaint',
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
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Incident Review</h1>
                <p className="text-xs text-gray-400">Review and resolve provider incidents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin/dashboard" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Top-Ups</a>
              <a href="/admin/providers" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Providers</a>
              <a href="/admin/appeals" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Appeals</a>
              <a href="/admin/observability" className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Analytics</a>
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(['suspected', 'check_in_sent', 'under_review', 'confirmed', 'dismissed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s === 'check_in_sent' ? 'suspected' : s)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filter === s || (filter === 'suspected' && s === 'suspected')
                  ? 'bg-white border-[#FF6B4A]/30 shadow-md'
                  : 'bg-white/50 border-gray-100 hover:bg-white'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{incidents.filter((i) => i.status === s).length}</p>
              <p className="text-xs text-gray-400 mt-1">{s.replace(/_/g, ' ')}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['all', 'suspected', 'under_review', 'confirmed'] as const).map((f) => (
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
            <p className="text-gray-500 text-lg font-medium">No incidents found</p>
            <p className="text-gray-400 text-sm mt-1">All clear for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inc) => (
              <div key={inc.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">{getTypeLabel(inc.incident_type)}</span>
                      {getSeverityBadge(inc.severity)}
                      {getStatusBadge(inc.status)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Provider</p>
                        <p className="text-gray-700 font-medium">{inc.provider_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Service</p>
                        <p className="text-gray-700">{inc.service_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Created</p>
                        <p className="text-gray-700">{new Date(inc.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Penalty</p>
                        <p className="text-gray-700">{inc.penalty_applied ? `${inc.penalty_amount} PKR` : '—'}</p>
                      </div>
                    </div>
                    {inc.provider_response && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg">
                        Provider response: {inc.provider_response}
                      </p>
                    )}
                    {inc.resolution && (
                      <p className="text-xs text-gray-500 mt-2 bg-emerald-50 px-3 py-2 rounded-lg">
                        Resolution: {inc.resolution}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {inc.status === 'suspected' && (
                      <button
                        onClick={() => handleSendCheckIn(inc.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-full hover:bg-blue-100 transition-all"
                      >
                        Send Check-in
                      </button>
                    )}
                    {['suspected', 'check_in_sent', 'under_review'].includes(inc.status) && (
                      <button
                        onClick={() => setResolveModal({ open: true, incident: inc })}
                        className="px-3 py-1.5 text-xs font-medium bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] text-white rounded-full hover:from-[#FF4521] hover:to-red-600 shadow-sm transition-all"
                      >
                        Resolve
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
      {resolveModal.open && resolveModal.incident && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Incident</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <select
                  value={resolveData.resolution}
                  onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30"
                >
                  <option value="no_fault">No Fault</option>
                  <option value="provider_fault">Provider Fault</option>
                  <option value="customer_fault">Customer Fault</option>
                  <option value="mutual">Mutual</option>
                </select>
              </div>
              {resolveData.resolution === 'provider_fault' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount (PKR)</label>
                  <input
                    type="number"
                    value={resolveData.penalty_amount}
                    onChange={(e) => setResolveData({ ...resolveData, penalty_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={resolveData.notes}
                  onChange={(e) => setResolveData({ ...resolveData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setResolveModal({ open: false, incident: null })}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-2.5 px-4 bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] hover:from-[#FF4521] hover:to-red-600 text-white font-medium rounded-full shadow-md transition-all"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
