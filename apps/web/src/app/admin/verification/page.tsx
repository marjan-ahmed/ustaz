'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationSubmission {
  id: string;
  provider_id: string;
  cnic_number: string;
  cnic_front_url: string;
  cnic_back_url: string;
  selfie_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  provider: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    service_type: string;
    city: string;
    cnic: string | null;
    cnic_ocr_result: 'match' | 'mismatch' | 'unreadable' | null;
    cnic_ocr_number: string | null;
    cnic_ocr_details: {
      number_match: boolean | null;
      name_match: boolean | null;
      front_back_match: boolean | null;
      is_cnic: boolean | null;
      cnic_expired: boolean | null;
      age_ok: boolean | null;
      duplicate: boolean | null;
      extracted_cnic: string | null;
      expiry: string | null;
      dob: string | null;
    } | null;
  } | null;
}

// A green/red/grey chip for one auto-check. `good` true=pass, false=fail, null=unknown.
function CheckChip({ label, good }: { label: string; good: boolean | null }) {
  const cls = good === true
    ? 'bg-green-50 text-green-700 border-green-200'
    : good === false
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-50 text-gray-500 border-gray-200';
  const icon = good === true ? '✓' : good === false ? '✗' : '?';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span>{icon}</span>{label}
    </span>
  );
}

export default function AdminVerificationPage() {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  /** stored document URL → short-lived signed URL (private bucket) */
  const [signedDocs, setSignedDocs] = useState<Record<string, string>>({});

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verification');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);

        // `provider-docs` is a private bucket, so the stored URLs will not load
        // in an <img>. Exchange each for a short-lived signed URL.
        const urls = (data.data as VerificationSubmission[])
          .flatMap((s) => [s.cnic_front_url, s.cnic_back_url, s.selfie_url])
          .filter(Boolean);
        const pairs = await Promise.all(
          urls.map(async (u) => {
            try {
              const r = await fetch('/api/admin/signed-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: u }),
              });
              if (!r.ok) return null;
              const { url } = await r.json();
              return [u, url] as const;
            } catch {
              return null;
            }
          }),
        );
        setSignedDocs((prev) => {
          const next = { ...prev };
          for (const p of pairs) if (p) next[p[0]] = p[1];
          return next;
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const filtered = submissions.filter(s => filter === 'all' || s.status === filter);

  async function handleAction(submissionId: string, action: 'approve' | 'reject') {
    setActingId(submissionId);
    try {
      const res = await fetch('/api/admin/verification/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, action, notes: actionNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setExpandedId(null);
      setActionNotes('');
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process');
    }
    setActingId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-8 w-8 text-[#db4b0d]" />
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filter === s
                  ? 'bg-white border-[#FF6B4A]/30 shadow-md'
                  : 'bg-white/50 border-gray-200 hover:bg-white'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">
                {s === 'all' ? submissions.length : submissions.filter(sub => sub.status === s).length}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{s}</p>
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#db4b0d] mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {filter === 'all' ? '' : filter} submissions</p>
            </div>
          ) : (
            filtered.map((sub) => (
              <Card key={sub.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {sub.provider?.firstName} {sub.provider?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        CNIC: {sub.cnic_number} | {sub.provider?.service_type} | {sub.provider?.city}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        sub.status === 'approved' ? 'default' :
                        sub.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {sub.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedId === sub.id ? 'Close' : 'Review'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Review Panel */}
                  {expandedId === sub.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Automated CNIC cross-check */}
                      <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600">Automated CNIC check</p>
                          {sub.provider?.cnic_ocr_result ? (
                            <span className="text-xs text-gray-500">
                              typed <span className="font-mono">{sub.provider?.cnic ?? sub.cnic_number}</span>
                              {' · '}read <span className="font-mono">{sub.provider?.cnic_ocr_number ?? '—'}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">not run yet</span>
                          )}
                        </div>
                        {sub.provider?.cnic_ocr_details ? (
                          <div className="flex flex-wrap gap-1.5">
                            <CheckChip label="Number" good={sub.provider.cnic_ocr_details.number_match} />
                            <CheckChip label="Name" good={sub.provider.cnic_ocr_details.name_match} />
                            <CheckChip label="Front↔Back" good={sub.provider.cnic_ocr_details.front_back_match} />
                            <CheckChip label="Not expired" good={sub.provider.cnic_ocr_details.cnic_expired === null ? null : !sub.provider.cnic_ocr_details.cnic_expired} />
                            <CheckChip label="Age 18+" good={sub.provider.cnic_ocr_details.age_ok} />
                            <CheckChip label="Unique" good={sub.provider.cnic_ocr_details.duplicate === null ? null : !sub.provider.cnic_ocr_details.duplicate} />
                            <CheckChip label="Is a CNIC" good={sub.provider.cnic_ocr_details.is_cnic} />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">No automated result on file — review the photos manually.</p>
                        )}
                      </div>

                      {/* Photos */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">CNIC Front</p>
                          <img src={signedDocs[sub.cnic_front_url] ?? sub.cnic_front_url} alt="CNIC Front"
                            className="w-full rounded-lg border border-gray-200 object-cover h-48" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">CNIC Back</p>
                          <img src={signedDocs[sub.cnic_back_url] ?? sub.cnic_back_url} alt="CNIC Back"
                            className="w-full rounded-lg border border-gray-200 object-cover h-48" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Selfie</p>
                          <img src={signedDocs[sub.selfie_url] ?? sub.selfie_url} alt="Selfie"
                            className="w-full rounded-lg border border-gray-200 object-cover h-48" />
                        </div>
                      </div>

                      {/* Notes */}
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Admin notes (optional)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
                        rows={2}
                      />

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleAction(sub.id, 'reject')}
                          disabled={actingId === sub.id || sub.status !== 'pending'}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {actingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(sub.id, 'approve')}
                          disabled={actingId === sub.id || sub.status !== 'pending'}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
