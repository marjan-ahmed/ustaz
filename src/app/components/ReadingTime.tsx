"use client"
import React, { useEffect, useState } from 'react';

type Props = {
  targetId: string;
  wpm?: number;
};

export default function ReadingTime({ targetId, wpm = 200 }: Props) {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const text = (el.innerText || el.textContent || '').trim();
    if (!text) {
      setMinutes(0);
      return;
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / wpm));
    setMinutes(mins);
  }, [targetId, wpm]);

  if (minutes === null) return <span className="ml-3 text-sm text-gray-500">…</span>;
  if (minutes === 0) return null;
  return <span className="ml-3 text-sm text-gray-500">· {minutes} min read</span>;
}
