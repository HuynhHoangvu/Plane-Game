"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLeaderboard, type LeaderboardEntry } from "@/lib/storage";
import { SOURCE_LANGUAGES } from "@/lib/languages";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Reading localStorage must happen post-mount to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadLeaderboard());
  }, []);

  const flagFor = (lang: string) => SOURCE_LANGUAGES.find((l) => l.code === lang)?.flag ?? "";

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-[#020617] px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-white">Bảng xếp hạng</h1>
      <p className="max-w-sm text-white/50">
        10 điểm số cao nhất được lưu trên trình duyệt này.
      </p>

      <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {entries.length === 0 && (
          <p className="px-4 py-6 text-sm text-white/40">Chưa có điểm nào — vào chơi thử xem!</p>
        )}
        {entries.map((e, i) => (
          <div
            key={`${e.date}-${i}`}
            className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold text-cyan-300">#{i + 1}</span>
              <span>{flagFor(e.lang)}</span>
              <span className="text-xs text-white/50">{e.level}</span>
            </div>
            <span className="font-semibold text-white tabular-nums">{e.score}</span>
          </div>
        ))}
      </div>

      <Link href="/" className="text-sm text-white/40 underline underline-offset-4 hover:text-white/70">
        ← Về trang chủ
      </Link>
    </div>
  );
}
