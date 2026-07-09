'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TopupRequest {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_phone: string;
  amount_sent: number;
  transaction_id: string;
  receipt_url: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

function SparkleBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#db4b0d]/5 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-100px] w-[350px] h-[350px] rounded-full bg-[#FF6B4A]/5 blur-3xl" />
    </div>
  );
}

function ToastBar({ toast, onDismiss }: { toast: { message: string; type: 'success' | 'error' } | null; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg shadow-black/10 text-sm font-medium transition-all duration-300 animate-slide-up ${
      toast.type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-red-50 text-red-600 border border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        {toast.type === 'success' ? (
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {toast.message}
        <button onClick={onDismiss} className="ml-2 hover:opacity-70 transition-opacity">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [rejectReason, setRejectReason] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    try {
      const supabase = (await import('../../../../client/supabaseClient')).supabase;
      const { data, error } = await supabase.rpc('get_pending_topup_requests');

      if (error) {
        console.error('Fetch error:', error);
        return;
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10_000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/admin/topup-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to approve', 'error');
        return;
      }

      showToast('Top-up approved successfully! Provider has been notified.', 'success');
      fetchRequests();
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    const requestId = rejectModal.id;
    setActionLoading(requestId);
    setRejectModal({ id: '', open: false });

    try {
      const res = await fetch('/api/admin/topup-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject', reason: rejectReason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to reject', 'error');
        return;
      }

      showToast('Request rejected. Provider has been notified.', 'success');
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  const filteredRequests = requests.filter((r) => filter === 'all' || r.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      <SparkleBg />

      {/* Toast notification */}
      <ToastBar toast={toast} onDismiss={() => setToast(null)} />

      {/* Receipt Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxUrl}
              alt="Receipt"
              className="w-full rounded-2xl shadow-xl border border-gray-200"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Reject Top-Up</h3>
                <p className="text-sm text-gray-500">The provider will be notified with this reason.</p>
              </div>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid TxID, Amount Mismatch, Receipt unclear..."
              rows={4}
              autoFocus
              className="w-full mt-4 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none transition-all"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal({ id: '', open: false }); setRejectReason(''); }}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-full shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] shadow-lg shadow-[#db4b0d]/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Clash Grotesk, sans-serif' }}>Admin Portal</h1>
                <p className="text-xs text-gray-400">Wallet &amp; Top-Up Management</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A]/10 to-[#FF4521]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF4521]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{requests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-bold text-red-500 mt-0.5">{rejectedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF4521] text-white shadow-md shadow-[#db4b0d]/25'
                  : 'text-gray-500 bg-white border border-gray-200 hover:bg-[#FFF7ED] hover:text-[#db4b0d] hover:border-[#FF6B4A]/30'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-[#FF6B4A]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400 text-sm">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <svg className="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              {filter === 'pending' ? 'All caught up!' : 'No requests found'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'pending' ? 'No pending top-up requests to review.' : 'Try a different filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gradient-to-r from-[#FFF7ED] to-white">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">TxID</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FFF7ED]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{req.provider_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{req.provider_phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{req.amount_sent.toLocaleString()} PKR</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-50 px-2 py-1 rounded-lg text-gray-600 font-mono border border-gray-100">
                          {req.transaction_id}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {req.receipt_url ? (
                          <button
                            onClick={() => setLightboxUrl(req.receipt_url)}
                            className="group relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 hover:border-[#FF6B4A]/50 transition-all"
                          >
                            <img
                              src={req.receipt_url}
                              alt="Receipt"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B4A]/60 to-[#FF4521]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">No receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4">
                        {req.admin_note && req.status !== 'pending' ? (
                          <span className="text-xs text-gray-500 italic">{req.admin_note}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === req.id ? (
                                <svg className="animate-spin h-3 w-3 mx-auto" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: req.id, open: true })}
                              disabled={actionLoading === req.id}
                              className="px-4 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B4A] animate-pulse" />
          Auto-refreshing every 10s
        </div>
      </main>
    </div>
  );
}
