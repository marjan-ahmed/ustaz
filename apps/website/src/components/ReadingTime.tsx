"use client";

import { useEffect, useState } from "react";

export default function ReadingTime({
  targetId,
  wordsPerMinute = 225,
}: {
  targetId: string;
  wordsPerMinute?: number;
}) {
  const [readingTime, setReadingTime] = useState<string>("");

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const text = target.textContent || "";
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    setReadingTime(`${minutes} min read`);
  }, [targetId, wordsPerMinute]);

  if (!readingTime) return null;

  return (
    <span className="ml-2 text-sm text-gray-500 font-normal">
      · {readingTime}
    </span>
  );
}