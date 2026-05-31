"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../client/supabaseClient";
import {
  Wallet,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  Banknote,
  Copy,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface WalletData {
  wallet_id: string;
  balance: number;
  total_earned: number;
  total_commission_paid: number;
  recent_transactions: Transaction[];
  pending_topups: TopupRequest[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  request_id: string | null;
  description: string | null;
  created_at: string;
}

interface TopupRequest {
  id: string;
  amount_sent: number;
  transaction_id: string;
  receipt_url: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const BANK_DETAILS = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Alfalah Islamic Bank",
  accountTitle: process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE || "USTAZ",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "0123456789012345",
  raastId: process.env.NEXT_PUBLIC_RAAST_ID || "03051126649",
};

interface WalletPanelProps {
  providerId: string;
}

export default function WalletPanel({ providerId }: WalletPanelProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [amountSent, setAmountSent] = useState(12000);
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!providerId) return;
    try {
      const { data, error } = await supabase.rpc("get_wallet", {
        p_provider_id: providerId,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (result) {
        setWalletData({
          wallet_id: result.wallet_id,
          balance: result.balance,
          total_earned: result.total_earned,
          total_commission_paid: result.total_commission_paid,
          recent_transactions: result.recent_transactions || [],
          pending_topups: result.pending_topups || [],
        });
      }
    } catch (err: any) {
      console.error("Error fetching wallet:", err);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSubmitTopup = async () => {
    if (!receiptFile || !transactionId.trim() || amountSent <= 0) {
      toast.error("Please fill all fields: amount, transaction ID, and receipt image");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Upload receipt to Supabase Storage
      const uploadFormData = new FormData();
      uploadFormData.append("receipt", receiptFile);

      const uploadRes = await fetch("/api/topup/upload-receipt", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to upload receipt");
      }

      // Step 2: Create top-up request
      const createRes = await fetch("/api/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_sent: amountSent,
          transaction_id: transactionId.trim(),
          receipt_url: uploadData.url,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create top-up request");
      }

      toast.success("Top-up request submitted! Awaiting admin approval.");
      setShowTopupForm(false);
      setTransactionId("");
      setReceiptFile(null);
      setAmountSent(12000);

      // Refresh wallet data
      fetchWallet();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit top-up request");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-PK") + " PKR";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#db4b0d]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance Card */}
      <Card className="shadow-sm border-gray-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Wallet className="mr-3 h-6 w-6 text-[#db4b0d]" />
              Wallet
            </CardTitle>
            <CardDescription className="text-gray-600">
              Prepaid wallet for platform commission fees
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowTopupForm(!showTopupForm)}
            variant={showTopupForm ? "outline" : "default"}
            className={showTopupForm ? "" : "bg-[#db4b0d] hover:bg-[#c4420c]"}
          >
            <Plus className="mr-2 h-4 w-4" />
            {showTopupForm ? "Cancel" : "Top Up"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-gray-900">
                {walletData ? formatCurrency(walletData.balance) : "0 PKR"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Commission Paid</p>
              <p className="text-lg font-semibold text-gray-700">
                {walletData ? formatCurrency(walletData.total_commission_paid) : "0 PKR"}
              </p>
            </div>
          </div>

          {/* Floor warning */}
          {walletData && walletData.balance < 200 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 flex items-center">
                <XCircle className="h-4 w-4 mr-2 shrink-0" />
                Low balance! You need at least <strong className="mx-1">200 PKR</strong> to go online and receive requests.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-Up Form */}
      {showTopupForm && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Upload className="mr-2 h-5 w-5 text-[#db4b0d]" />
              Submit Top-Up Request
            </CardTitle>
            <CardDescription>
              Transfer the amount to the bank account below, then upload your payment receipt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-blue-800 flex items-center">
                <Banknote className="h-4 w-4 mr-2" />
                Bank Account Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Bank", value: BANK_DETAILS.bankName, field: "bankName" },
                  { label: "Account Title", value: BANK_DETAILS.accountTitle, field: "accountTitle" },
                  { label: "Account Number", value: BANK_DETAILS.accountNumber, field: "accountNumber" },
                  { label: "Raast ID", value: BANK_DETAILS.raastId, field: "raastId" },
                ].map(({ label, value, field }) => (
                  <div key={field}>
                    <span className="text-blue-600 font-medium">{label}:</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-gray-800 font-mono text-xs break-all">{value}</span>
                      <button
                        onClick={() => handleCopy(value, field)}
                        className="p-1 hover:bg-blue-100 rounded transition-colors shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy
                          className={`h-3.5 w-3.5 ${copiedField === field ? "text-green-600" : "text-blue-500"}`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="amountSent" className="text-sm font-medium text-gray-700">
                  Amount Sent (PKR)
                </Label>
                <Input
                  id="amountSent"
                  type="number"
                  value={amountSent}
                  onChange={(e) => setAmountSent(Number(e.target.value))}
                  min={1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                  Transaction ID / TRX ID
                </Label>
                <Input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter the transaction ID from your bank receipt"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="receiptImage" className="text-sm font-medium text-gray-700">
                  Receipt Screenshot (PNG/JPEG)
                </Label>
                <Input
                  id="receiptImage"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {receiptFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmitTopup}
              disabled={submitting}
              className="w-full bg-[#db4b0d] hover:bg-[#c4420c]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Top-Up Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Top-Up Requests */}
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
              {walletData.pending_topups.map((topup) => (
                <div key={topup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{topup.amount_sent.toLocaleString()} PKR</p>
                    <p className="text-xs text-gray-500">
                      TX: {topup.transaction_id} &middot; {new Date(topup.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(topup.status)}
                    {topup.status === "rejected" && topup.admin_note && (
                      <span className="text-xs text-gray-500 max-w-[120px] truncate" title={topup.admin_note}>
                        {topup.admin_note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
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
              {walletData.recent_transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === "topup" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <ArrowUpDown
                        className={`h-4 w-4 ${tx.type === "topup" ? "text-green-600" : "text-red-600"}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm capitalize">
                        {tx.type === "topup" ? "Top-Up" : tx.type === "commission" ? "Commission" : tx.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.description || ""} &middot; {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.type === "topup" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "topup" ? "+" : ""}
                      {tx.amount.toLocaleString()} PKR
                    </p>
                    <p className="text-xs text-gray-400">
                      Balance: {tx.balance_after.toLocaleString()} PKR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state — no transactions and no pending topups */}
      {walletData &&
        walletData.recent_transactions.length === 0 &&
        walletData.pending_topups.length === 0 && (
          <Card className="shadow-sm border-gray-200">
            <CardContent className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-4">
                Deposit funds to start earning. Send payment to the bank account above and submit a top-up request.
              </p>
              <Button
                onClick={() => setShowTopupForm(true)}
                className="bg-[#db4b0d] hover:bg-[#c4420c]"
              >
                <Banknote className="mr-2 h-4 w-4" />
                Top Up Now
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
