"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../client/supabaseClient";
import {
  Wallet, ArrowUpDown, Clock, CheckCircle, XCircle,
  Upload, Loader2, Banknote, Copy, ImageIcon, Zap,
  Star, Briefcase, ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface WalletData {
  wallet_id: string;
  balance: number;
  total_earned: number;
  total_commission_paid: number;
  recent_transactions: Transaction[];
  pending_topups: TopupRequest[];
}
interface Transaction {
  id: string; type: string; amount: number;
  balance_before: number; balance_after: number;
  request_id: string | null; description: string | null; created_at: string;
}
interface TopupRequest {
  id: string; amount_sent: number; transaction_id: string;
  receipt_url: string; status: string; admin_note: string | null;
  created_at: string; updated_at: string;
}
interface WalletPanelProps { providerId: string; }

/* ─── Constants ─────────────────────────────────────────────────────────── */
const MIN_BALANCE = 200;   // Rs. — must maintain to stay online

const PACKAGES = [
  { id: "starter",  label: "Starter",  amount: 500,  tag: "Just testing",  Icon: Zap,       color: "#f59e0b" },
  { id: "standard", label: "Standard", amount: 1000, tag: "Regular work",   Icon: Briefcase, color: "#db4b0d", popular: true },
  { id: "pro",      label: "Pro",      amount: 2000, tag: "Full-time",      Icon: Star,      color: "#8b5cf6" },
];

const BANK = {
  easypaisa: { label: "Easypaisa",  number: "0305-1126649", name: "Ustaz Platform" },
  jazzcash:  { label: "JazzCash",   number: "0305-1126649", name: "Ustaz Platform" },
  bank:      { label: "Bank",       number: "0012-3456-7890", name: "USTAZ", bankName: "Alfalah Islamic Bank" },
};

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function WalletPanel({ providerId }: WalletPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  /* wallet data */
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading]       = useState(true);

  /* top-up form (only shown when balance insufficient) */
  const [selectedPkg, setSelectedPkg]       = useState<string | null>(null);
  const [activeMethod, setActiveMethod]     = useState<"easypaisa" | "jazzcash" | "bank">("easypaisa");
  const [transactionId, setTransactionId]   = useState("");
  const [receiptFile, setReceiptFile]       = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const [copiedField, setCopiedField]       = useState<string | null>(null);

  /* ── fetch wallet ────────────────────────────────────────────────────── */
  const fetchWallet = useCallback(async () => {
    if (!providerId) return;
    try {
      const { data, error } = await supabase.rpc("get_wallet", { p_provider_id: providerId });
      if (error) throw error;
      const r = Array.isArray(data) ? data[0] : data;
      if (r) setWalletData({
        wallet_id: r.wallet_id, balance: r.balance,
        total_earned: r.total_earned, total_commission_paid: r.total_commission_paid,
        recent_transactions: r.recent_transactions || [],
        pending_topups: r.pending_topups || [],
      });
    } catch (err: any) {
      toast.error("Failed to load wallet data");
    } finally { setLoading(false); }
  }, [providerId]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const copyText = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedField(field);
    toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setReceiptFile(f);
    const r = new FileReader();
    r.onload = () => setReceiptPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const handleSubmitTopup = async () => {
    if (!selectedPkg || !receiptFile || !transactionId.trim()) {
      toast.error("Select a package, enter transaction ID, and upload your receipt.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("receipt", receiptFile);
      const upRes = await fetch("/api/topup/upload-receipt", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Upload failed");

      const pkg = PACKAGES.find(p => p.id === selectedPkg)!;
      const crRes = await fetch("/api/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_sent: pkg.amount,
          transaction_id: transactionId.trim(),
          receipt_url: upData.url,
        }),
      });
      const crData = await crRes.json();
      if (!crRes.ok) throw new Error(crData.error || "Request failed");

      toast.success("Top-up request submitted! Admin will verify and credit your wallet.");
      setSelectedPkg(null); setTransactionId("");
      setReceiptFile(null); setReceiptPreview(null);
      fetchWallet();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally { setSubmitting(false); }
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const isInsufficient = !loading && walletData !== null && walletData.balance < MIN_BALANCE;
  const activeBank = BANK[activeMethod];

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#db4b0d]" />
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Balance Card ── */}
        <Card className="shadow-sm border-0 overflow-hidden" style={{ background: "#111828" }}>
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#db4b0d]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#f59e0b]/10 blur-3xl pointer-events-none" />

          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <Wallet className="mr-3 h-6 w-6 text-white/70" />
                Wallet
              </CardTitle>
              <CardDescription className="text-white/50">
                Prepaid · 15% commission per completed job
              </CardDescription>
            </div>

            {/* status pill */}
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
              isInsufficient
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isInsufficient ? "bg-red-400" : "bg-green-400"}`} />
              {isInsufficient ? "Blocked" : "Active"}
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Available Balance</p>
                <p className="text-5xl font-extrabold text-white tracking-tight">
                  {walletData ? fmt(walletData.balance) : "Rs. 0"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs mb-1">Commission Paid</p>
                <p className="text-lg font-semibold text-white/80">
                  {walletData ? fmt(walletData.total_commission_paid) : "Rs. 0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════
            BLOCKED STATE — show only when balance insufficient
        ════════════════════════════════════════════════════════════════ */}
        {isInsufficient && (
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 overflow-hidden">

            {/* warning banner */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldOff className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Job Requests Blocked</p>
                <p className="text-white/80 text-xs">
                  Your balance is below Rs. {MIN_BALANCE}. Top up to resume receiving jobs.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-6">

              {/* ── Package Selection ── */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#db4b0d]" />
                  Choose a Top-Up Package
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PACKAGES.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg.id)}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
                        selectedPkg === pkg.id
                          ? "border-[#db4b0d] bg-white shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#db4b0d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          POPULAR
                        </span>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: `${pkg.color}18` }}>
                        <pkg.Icon className="w-4 h-4" style={{ color: pkg.color }} />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{pkg.label}</p>
                      <p className="text-[11px] text-gray-500 mb-2">{pkg.tag}</p>
                      <p className="text-xl font-extrabold" style={{ color: pkg.color }}>
                        {fmt(pkg.amount)}
                      </p>
                      {selectedPkg === pkg.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#db4b0d] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPkg && (
                <>
                  <Separator />

                  {/* ── Bank Details ── */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#db4b0d]" />
                      Send {fmt(PACKAGES.find(p => p.id === selectedPkg)!.amount)} to:
                    </p>

                    {/* method tabs */}
                    <div className="flex gap-2 mb-4">
                      {(["easypaisa", "jazzcash", "bank"] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setActiveMethod(m)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                            activeMethod === m
                              ? "bg-[#111828] text-white border-[#111828]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {m === "easypaisa" ? "Easypaisa" : m === "jazzcash" ? "JazzCash" : "Bank"}
                        </button>
                      ))}
                    </div>

                    {/* account detail rows */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                      {activeMethod !== "bank" ? (
                        <>
                          <BankRow label={`${activeBank.label} Number`} value={activeBank.number} field="number" copied={copiedField} onCopy={copyText} />
                          <BankRow label="Account Name" value={activeBank.name} field="name" copied={copiedField} onCopy={copyText} />
                        </>
                      ) : (
                        <>
                          <BankRow label="Bank Name" value={BANK.bank.bankName} field="bankName" copied={copiedField} onCopy={copyText} />
                          <BankRow label="Account Title" value={BANK.bank.name} field="title" copied={copiedField} onCopy={copyText} />
                          <BankRow label="Account Number" value={BANK.bank.number} field="accNum" copied={copiedField} onCopy={copyText} />
                        </>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Amount to Send</span>
                        <span className="text-sm font-extrabold text-[#db4b0d]">
                          {fmt(PACKAGES.find(p => p.id === selectedPkg)!.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ── Transaction ID + Receipt Upload ── */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="txId" className="text-sm font-medium text-gray-700">
                        Transaction ID / TRX Ref
                      </Label>
                      <Input
                        id="txId"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        placeholder="e.g. TRX-1234567890"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Payment Screenshot
                      </Label>
                      <p className="text-xs text-gray-400 mb-2">
                        Upload your Easypaisa / JazzCash confirmation screenshot
                      </p>

                      <input
                        ref={fileRef} type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden" onChange={onFileChange}
                      />

                      {receiptPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-[#db4b0d]/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={receiptPreview} alt="Receipt" className="w-full max-h-44 object-cover" />
                          <button
                            onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4 text-white" />
                          </button>
                          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            <p className="text-xs text-gray-600 truncate">{receiptFile?.name}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#db4b0d]/50 bg-white hover:bg-orange-50/30 p-5 flex flex-col items-center gap-2 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                            <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#db4b0d]" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Tap to attach screenshot</p>
                          <p className="text-xs text-gray-400">PNG / JPG · max 5 MB</p>
                          <div className="flex items-center gap-1.5 bg-[#db4b0d]/10 text-[#db4b0d] text-xs font-semibold px-3 py-1.5 rounded-full mt-1">
                            <Upload className="w-3 h-3" /> Choose File
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitTopup}
                    disabled={!transactionId.trim() || !receiptFile || submitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#db4b0d] to-[#f59e0b] hover:opacity-90 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                      </span>
                    ) : "Submit Top-Up Request →"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Pending Top-Up Requests ── */}
        {walletData && walletData.pending_topups.length > 0 && (
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-[#db4b0d]" />
                Top-Up History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {walletData.pending_topups.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{fmt(t.amount_sent)}</p>
                      <p className="text-xs text-gray-500">TX: {t.transaction_id} · {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(t.status)}
                      {t.status === "rejected" && t.admin_note && (
                        <span className="text-xs text-gray-500 max-w-[120px] truncate" title={t.admin_note}>{t.admin_note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent Transactions ── */}
        {walletData && walletData.recent_transactions.length > 0 && (
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <ArrowUpDown className="mr-2 h-5 w-5 text-[#db4b0d]" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {walletData.recent_transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "topup" ? "bg-green-100" : "bg-red-100"}`}>
                        <ArrowUpDown className={`h-4 w-4 ${tx.type === "topup" ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm capitalize">
                          {tx.type === "topup" ? "Top-Up" : tx.type === "commission" ? "Commission" : tx.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.description || ""}{tx.description ? " · " : ""}{new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${tx.type === "topup" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "topup" ? "+" : ""}{fmt(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">Balance: {fmt(tx.balance_after)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Empty state ── */}
        {walletData &&
          walletData.recent_transactions.length === 0 &&
          walletData.pending_topups.length === 0 &&
          !isInsufficient && (
            <Card className="shadow-sm border-gray-200">
              <CardContent className="text-center py-12">
                <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-500 text-sm">
                  Complete your first job — a 15% commission will be auto-deducted and appear here.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
  );
}

/* ─── BankRow helper ─────────────────────────────────────────────────────── */
function BankRow({
  label, value, field, copied, onCopy,
}: {
  label: string; value: string; field: string;
  copied: string | null; onCopy: (v: string, f: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-semibold text-gray-800 truncate">{value}</span>
        <button
          onClick={() => onCopy(value, field)}
          className="text-gray-400 hover:text-[#db4b0d] transition-colors shrink-0"
          title="Copy"
        >
          <Copy className={`w-3.5 h-3.5 ${copied === field ? "text-green-500" : ""}`} />
        </button>
      </div>
    </div>
  );
}
