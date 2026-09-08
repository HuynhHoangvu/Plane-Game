"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SourceLang, CEFRLevel } from "@/lib/types";
import { loadProgress } from "@/lib/storage";

interface LanguageButtonProps {
  code: SourceLang;
  flag: string;
  label: string;
  href: string;
  cefrLevel: CEFRLevel;
}

export default function LanguageButton({ code, flag, label, href, cefrLevel }: LanguageButtonProps) {
  const [progress, setProgress] = useState<{ highScore: number; maxLevel: number } | null>(null);

  useEffect(() => {
    // Đọc localStorage sau mount — tránh SSR mismatch (xem CLAUDE.md quy ước localStorage)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc external storage, không phải derived state
    setProgress(loadProgress(code, cefrLevel));
  }, [code, cefrLevel]);

  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-white transition hover:bg-white/10"
    >
      <div className="text-2xl">{flag}</div>
      <div className="mt-1 text-sm">{label}</div>
      {progress && progress.highScore > 0 ? (
        <div className="mt-1 text-[10px] text-cyan-300/80">
          Lv.{progress.maxLevel} · {progress.highScore}đ
        </div>
      ) : (
        <div className="mt-1 text-[10px] text-white/30">Chưa chơi</div>
      )}
    </Link>
  );
}
