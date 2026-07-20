"use client";

import { useState } from "react";
import { X } from "lucide-react";

const REASONS = [
  { id: "found-better", label: "Found a better option", icon: "🔍" },
  { id: "changed-mind", label: "Changed my mind", icon: "🔄" },
  { id: "wrong-address", label: "Wrong address / location", icon: "📍" },
  { id: "too-expensive", label: "Too expensive", icon: "💰" },
  { id: "no-response", label: "Provider too slow", icon: "⏳" },
  { id: "duplicate", label: "Duplicate request", icon: "📋" },
];

interface CancelReasonModalProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onSkip: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function CancelReasonModal({
  open,
  onConfirm,
  onSkip,
  onClose,
  loading = false,
}: CancelReasonModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-8 animate-slide-up z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Title */}
        <h3
          className="text-2xl font-bold text-[#0f1729] mb-1"
          style={{ fontFamily: "Clash Grotesk, sans-serif" }}
        >
          Why are you cancelling?
        </h3>
        <p
          className="text-sm text-gray-400 mb-5"
          style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
        >
          This helps us improve. Optional.
        </p>

        {/* Reasons */}
        <div className="space-y-2 mb-5">
          {REASONS.map((reason) => {
            const isSelected = selected === reason.id;
            return (
              <button
                key={reason.id}
                onClick={() => setSelected(isSelected ? null : reason.id)}
                disabled={loading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-[#db4b0d] bg-[#FFF7ED]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <span className="text-lg">{reason.icon}</span>
                <span
                  className={`flex-1 text-sm font-semibold ${
                    isSelected ? "text-[#0f1729]" : "text-gray-600"
                  }`}
                  style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
                >
                  {reason.label}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#db4b0d] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
              selected
                ? "bg-[#db4b0d] text-white hover:bg-[#c24309]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
          >
            {loading ? "Cancelling..." : "Cancel Request"}
          </button>

          <button
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
          >
            Skip — just cancel
          </button>
        </div>
      </div>
    </div>
  );
}
